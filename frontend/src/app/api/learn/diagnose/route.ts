import { NextResponse } from 'next/server'

/**
 * POST /api/learn/diagnose — 满意度分叉「结果不理想」诊断教练（v3）
 *
 * body: { lamp_slug, tool_name, user_input?, image_url? }
 * 流程：
 *   1. 诊断树第 0 步：先看用户这步选的工具在矩阵里的水平（tool_expectation 早退）
 *   2. 文本 → DeepSeek；带图 → 千问 VL（DASHSCOPE compatible-mode, qwen-vl-plus）
 *   3. 返回 { diagnosis_type, message, suggestion }，前端展示
 * 速率限制：每用户/匿名 IP 每灯 5 次/天（内存计数，重启即清，够用）
 */

export const maxDuration = 60

type DiagType = 'tool_expectation' | 'operation' | 'flow' | 'expectation'

interface MatrixRow {
  lamp: string
  tool: string
  level: string
  note: string
}

/** 矩阵数据快照（与灯盏正文表格一致，2026-08 横评）——供第 0 步比对 */
const MATRIX: MatrixRow[] = [
  { lamp: 'xhs-lamp-0', tool: '手动拆解', level: '二流（慢但人人能做）', note: '所有人第一步，理解规律' },
  { lamp: 'xhs-lamp-0', tool: 'AI 辅助拆解', level: '一流（三层穿透提示词）', note: '拆得深拆得快，约0.01元/次' },
  { lamp: 'xhs-lamp-0', tool: 'Coze 采集工作流', level: '一流（批量）', note: 'L2+ 建对标库用，上手门槛高' },
  { lamp: 'xhs-lamp-1', tool: '扣子空间', level: '三流（图省事）', note: '快速出一篇，质量上限低' },
  { lamp: 'xhs-lamp-1', tool: '豆包', level: '二流', note: '免费、质量可控，要会提示词' },
  { lamp: 'xhs-lamp-1', tool: '通义', level: '二流', note: '同上' },
  { lamp: 'xhs-lamp-1', tool: 'DeepSeek', level: '一流', note: '完整提示词工程，成本极低' },
  { lamp: 'xhs-lamp-2', tool: '通义万相', level: '二流偏上', note: '每日50次免费，中文理解好，L1首选' },
  { lamp: 'xhs-lamp-2', tool: '即梦', level: '一流', note: '效果/速度最优，中文文字渲染最强' },
  { lamp: 'xhs-lamp-2', tool: '扣子空间', level: '二流', note: '文+图一站式，质量上限较低' },
  { lamp: 'xhs-lamp-3', tool: '歸藏生成器', level: '一流', note: '版式统一最优解，2主题/28版式' },
  { lamp: 'xhs-lamp-3', tool: '简单设计', level: '二流', note: '模板兜底，5分钟出图，撞款风险' },
  { lamp: 'xhs-lamp-3', tool: '提示词变量对照法', level: '一流', note: '风格锚+变量，重点练' },
]

const LAMP_FLOW: Record<string, string> = {
  'xhs-lamp-0': '灯0 找对标：搜赛道Top3账号→每号挑3篇爆款→三层穿透拆解（内容细节/对标策略/底层系统）→产出对标卡（标题公式/首图类型/情绪钩子/可复用点）+5个候选标题。',
  'xhs-lamp-1': '灯1 写文案：RTF-X四要素（角色人设/任务/格式/禁忌）→标题硬规则（emoji开头≤20字无逗号）→去AI味三段转换（专家口吻→闺蜜语气→加真实经历，改动>30%）。',
  'xhs-lamp-2': '灯2 生图：五要素提示词公式（主体+风格+构图+光照+颜色）→比例3:4→一次4张挑1-2→封面大字标题用即梦。常见坑：图不对题=主体位没放文案核心词。',
  'xhs-lamp-3': '灯3 三图统一：风格锚+变量对照法——固定部分（风格/光照/色调）一个字不动，只改变量部分（主体内容）；同会话连续生成；拼图检验色调连贯。',
  'xhs-lamp-4': '灯4 数据复盘：每篇记录标题公式/结构/发布时段/48h数据四项→10篇一周期→看标题打开率/结构收藏率/时段规律→每篇写一句"下篇要改什么"。',
}

/* ---------- 速率限制：每灯每天 5 次 ---------- */
const rateMap = new Map<string, { day: string; n: number }>()
function rateLimited(key: string): boolean {
  const today = new Date().toISOString().slice(0, 10)
  const cur = rateMap.get(key)
  if (!cur || cur.day !== today) {
    rateMap.set(key, { day: today, n: 1 })
    return false
  }
  cur.n += 1
  return cur.n > 5
}

/* ---------- 模型调用 ---------- */
interface DiagResult {
  diagnosis_type: DiagType
  message: string
  suggestion: string
}

function buildPrompt(lampSlug: string, toolName: string, matrixRow: MatrixRow | undefined, userInput: string, hasImage: boolean): string {
  const flow = LAMP_FLOW[lampSlug] || ''
  return [
    '你是 ArcDock 学习中心的诊断教练。用户在小红书 AI 笔记学习流程中某一步结果不理想，请按诊断树分析并给具体下一步。',
    '',
    `【本步流程】${flow}`,
    `【用户这步选的工具】${toolName || '（未记录，按操作问题处理）'}`,
    matrixRow ? `【该工具在横评矩阵中的水平】${matrixRow.level}（${matrixRow.note}）` : '',
    hasImage ? '【用户材料】见图片（生成结果截图）' : '',
    userInput ? `【用户贴回的结果/描述】\n${userInput.slice(0, 2000)}` : '【用户贴回的结果/描述】（空，请按常见问题给排查路径）',
    '',
    '诊断树（按顺序判断，输出最可能的第一个）：',
    '① tool_expectation 工具/模型问题：所用工具在这类任务上确实弱（对照矩阵水平），换指定工具即可，提示词不用动；',
    '② operation 操作/提示词问题：工具选对了，但提示词缺要素（如光照/风格锚/角色人设/禁忌项）或步骤跳了——指出缺什么，给改进版提示词片段；',
    '③ flow 流程/前提问题：问题出在上一步（对标没找对/选题偏了/风格锚没固定），指明回到哪一盏灯的哪一步；',
    '④ expectation 期望管理：该工具天花板如此，要达到用户想要的效果需要更贵模型或人工后期，说明白代价。',
    '',
    '严格输出 JSON（不要 markdown 代码块，不要多余文字）：',
    '{"diagnosis_type":"tool_expectation|operation|flow|expectation","message":"诊断结论，2-3句，直接说原因","suggestion":"具体下一步，含工具名/提示词片段/回跳灯号，可执行"}',
  ].filter(Boolean).join('\n')
}

function parseDiagJson(text: string): DiagResult | null {
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) return null
  try {
    const j = JSON.parse(m[0]) as { diagnosis_type?: string; message?: string; suggestion?: string }
    const types = ['tool_expectation', 'operation', 'flow', 'expectation']
    if (!j.diagnosis_type || !types.includes(j.diagnosis_type) || !j.message || !j.suggestion) return null
    return {
      diagnosis_type: j.diagnosis_type as DiagType,
      message: j.message,
      suggestion: j.suggestion,
    }
  } catch {
    return null
  }
}

async function callDeepSeek(prompt: string): Promise<DiagResult> {
  const key = process.env.DEEPSEEK_API_KEY
  if (!key) throw new Error('DEEPSEEK_API_KEY 未配置')
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是严谨的诊断教练，只输出规定的 JSON。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 700,
    }),
  })
  if (!res.ok) throw new Error(`deepseek ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content || ''
  const parsed = parseDiagJson(content)
  if (!parsed) throw new Error('模型输出无法解析为 JSON')
  return parsed
}

async function callQwenVL(imageUrl: string, prompt: string): Promise<DiagResult> {
  const key = process.env.DASHSCOPE_API_KEY
  if (!key) throw new Error('DASHSCOPE_API_KEY 未配置')
  const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'qwen-vl-plus',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            { type: 'text', text: prompt + '\n（图片是用户的生成结果，结合图片内容诊断）' },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 700,
    }),
  })
  if (!res.ok) throw new Error(`qwen-vl ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content || ''
  const parsed = parseDiagJson(content)
  if (!parsed) throw new Error('VL 输出无法解析为 JSON')
  return parsed
}

export async function POST(req: Request) {
  let body: { lamp_slug?: string; tool_name?: string; user_input?: string; image_url?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const { lamp_slug, tool_name = '', user_input = '', image_url } = body
  if (!lamp_slug || !LAMP_FLOW[lamp_slug]) {
    return NextResponse.json({ error: 'unknown lamp_slug' }, { status: 400 })
  }
  if (!user_input.trim() && !image_url) {
    return NextResponse.json({ error: 'user_input 或 image_url 至少一项' }, { status: 400 })
  }

  // 速率限制（匿名用 IP；够用级精度）
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon'
  if (rateLimited(`${ip}:${lamp_slug}`)) {
    return NextResponse.json({ error: '这盏灯今天的诊断次数已用完（5 次/天），明天再来或换盏灯。' }, { status: 429 })
  }

  const matrixRow = MATRIX.find(
    (m) => m.lamp === lamp_slug && tool_name && (tool_name.includes(m.tool) || m.tool.includes(tool_name.slice(0, 4)))
  )

  const prompt = buildPrompt(lamp_slug, tool_name, matrixRow, user_input, Boolean(image_url))

  try {
    const result = image_url ? await callQwenVL(image_url, prompt) : await callDeepSeek(prompt)
    return NextResponse.json({ ...result, model: image_url ? 'qwen-vl-plus' : 'deepseek-chat' })
  } catch (e) {
    console.error('diagnose error:', e)
    // 降级：不走模型也要给用户路——回溯到矩阵第 0 步的静态建议
    const fallback: DiagResult = matrixRow
      ? {
          diagnosis_type: 'tool_expectation',
          message: `诊断服务暂时不可用。先对照矩阵自查：你用的「${tool_name}」横评定级是${matrixRow.level}。`,
          suggestion: `结果不理想可能符合该工具预期水平。要更好效果：换矩阵中同步骤的一流工具重试（提示词不用动）；或稍后再点诊断。`,
        }
      : {
          diagnosis_type: 'operation',
          message: '诊断服务暂时不可用，先按操作链自查。',
          suggestion: `本步要点：${LAMP_FLOW[lamp_slug]}。检查提示词是否含全部要素后重试；稍后再点诊断看 AI 分析。`,
        }
    return NextResponse.json({ ...fallback, degraded: true }, { status: 200 })
  }
}
