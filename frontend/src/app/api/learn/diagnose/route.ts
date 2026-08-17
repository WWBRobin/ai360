import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/learn/diagnose — 诊断引擎（knowledge_pack 参数化 v4）
 *
 * body: { pack?: 'learning' | 'install', ... }
 *   learning（默认，向后兼容，行为与 v3 完全一致）:
 *     { lamp_slug, tool_name?, user_input?, image_url? }
 *   install（新增，装机陪跑五分类诊断）:
 *     { tool_name, step_title, user_input? }
 *
 * 流程：
 *   1. learning：诊断树第 0 步（矩阵水平比对）→ 文本走 DeepSeek / 带图走千问 VL
 *   2. install：装机语境五分类（网络/账号/配置/顺序/预期）→ DeepSeek
 *   3. 返回 { diagnosis_type, message, suggestion }；install 额外写 learning_diagnoses（pack 区分，best-effort）
 * 速率限制：每用户/匿名 IP 每灯（learning）或每工具（install）5 次/天（内存计数，重启即清）
 */

export const maxDuration = 60

type Pack = 'learning' | 'install'

const LEARNING_TYPES = ['tool_expectation', 'operation', 'flow', 'expectation'] as const
const INSTALL_TYPES = ['network', 'account', 'config', 'order', 'expectation'] as const

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

/* ---------- 速率限制：每灯/每工具每天 5 次 ---------- */
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
  diagnosis_type: string
  message: string
  suggestion: string
}

function buildLearningPrompt(
  lampSlug: string,
  toolName: string,
  matrixRow: MatrixRow | undefined,
  userInput: string,
  hasImage: boolean
): string {
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

function buildInstallPrompt(toolName: string, stepTitle: string, userInput: string): string {
  return [
    '你是 ArcDock 装机陪跑的诊断教练。用户正在安装一个 AI 工具，卡在某一步，请判断卡点类型并给出具体、可执行的下一步。',
    '',
    `【当前工具】${toolName}`,
    `【卡住的步骤】${stepTitle}`,
    userInput
      ? `【用户症状描述】\n${userInput.slice(0, 2000)}`
      : '【用户症状描述】（空，请结合步骤本身推断该步最常见的卡点）',
    '',
    '诊断分类（按顺序判断，输出最可能的第一个）：',
    '① network 网络问题：页面打不开/加载慢/超时/连不上/502/503，跟梯子、DNS、地区有关；',
    '② account 账号问题：注册/登录/验证码/手机号/扫码/权限有关；',
    '③ config 配置问题：API Key 填错、参数/base_url/路径配置错、401/404 报错有关；',
    '④ order 操作顺序问题：步骤跳了或顺序不对、前置步骤没做完；',
    '⑤ expectation 预期理解偏差：用户对这一步该做什么、做完能得到什么理解错了。',
    '',
    '严格输出 JSON（不要 markdown 代码块，不要多余文字）：',
    '{"diagnosis_type":"network|account|config|order|expectation","message":"诊断结论，2-3句，直接说原因","suggestion":"具体下一步，含可操作动作（开梯子/重登/重填 Key/回到哪一步），可执行"}',
  ].join('\n')
}

function parseDiagJson(text: string, allowed: readonly string[]): DiagResult | null {
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) return null
  try {
    const j = JSON.parse(m[0]) as { diagnosis_type?: string; message?: string; suggestion?: string }
    if (!j.diagnosis_type || !allowed.includes(j.diagnosis_type) || !j.message || !j.suggestion) return null
    return {
      diagnosis_type: j.diagnosis_type,
      message: j.message,
      suggestion: j.suggestion,
    }
  } catch {
    return null
  }
}

async function callDeepSeek(prompt: string, allowed: readonly string[]): Promise<DiagResult> {
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
  const parsed = parseDiagJson(content, allowed)
  if (!parsed) throw new Error('模型输出无法解析为 JSON')
  return parsed
}

async function callQwenVL(imageUrl: string, prompt: string, allowed: readonly string[]): Promise<DiagResult> {
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
  const parsed = parseDiagJson(content, allowed)
  if (!parsed) throw new Error('VL 输出无法解析为 JSON')
  return parsed
}

/* ---------- 诊断落库（best-effort，静默降级，不影响响应） ---------- */
async function persistInstallDiagnosis(row: Record<string, unknown>): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return
  try {
    const admin = createClient(url, key, { auth: { persistSession: false } })
    const { error } = await admin.from('learning_diagnoses').insert(row)
    if (error) console.error('learning_diagnoses(install) insert skipped:', error.message)
  } catch (e) {
    console.error('learning_diagnoses(install) persist error:', e)
  }
}

/* ---------- 装机降级兜底（无模型/无 key 时，按症状关键词给五分类中文建议） ---------- */
function installFallback(toolName: string, stepTitle: string, userInput: string): DiagResult {
  const text = `${stepTitle} ${userInput}`.toLowerCase()
  const has = (kws: string[]) => kws.some((k) => text.includes(k))

  if (has(['梯子', '翻墙', '打不开', '超时', '网络', '连接', 'dns', '加载', '连不上', '很慢', '502', '503', 'timeout', 'proxy', '代理'])) {
    return {
      diagnosis_type: 'network',
      message: `「${stepTitle}」这一步页面无法正常打开或响应，多半是网络链路问题，跟工具本身无关。`,
      suggestion: `先确认网络：开梯子后刷新重试；换无痕窗口；DNS 换成 223.5.5.5 或 8.8.8.8；还不行就等几分钟再试（${toolName} 侧偶尔抖动）。`,
    }
  }
  if (has(['登录', '注册', '账号', '验证码', '手机号', '密码', '扫码', '验证', '邮箱', '权限', '登录不上'])) {
    return {
      diagnosis_type: 'account',
      message: `「${stepTitle}」卡在账号环节，注册或登录没走通。`,
      suggestion: '核对登录方式是否与平台要求一致（手机号/微信/邮箱）；验证码收不到就等 60 秒重发、检查短信拦截；或点「忘记密码」重置；换扫码登录通常最省事。',
    }
  }
  if (has(['key', '密钥', 'token', '401', '404', '参数', 'base_url', '配置', 'api', '报错', '错误码', 'sk-', '鉴权', '凭证', 'endpoint'])) {
    return {
      diagnosis_type: 'config',
      message: `「${stepTitle}」报错或没反应，通常是 Key/参数配置不对。`,
      suggestion: '重新完整复制 API Key（点「复制」按钮别手选，去首尾空格）；核对 base_url 用示例里的完整地址；401=Key 错或带空格，404=端点路径错。',
    }
  }
  if (has(['顺序', '先', '后', '前置', '跳过', '没做', '再', '然后', '第一步', '第二步'])) {
    return {
      diagnosis_type: 'order',
      message: `「${stepTitle}」可能是操作顺序问题，前置步骤还没完成。`,
      suggestion: '回到上一步检查是否真的做完并勾选；按步骤卡里的 guide 从第 1 步依次走到当前步，别跳步。',
    }
  }
  return {
    diagnosis_type: 'expectation',
    message: `「${stepTitle}」这一步可能对「做完能拿到什么」理解有偏差，导致以为没成功。`,
    suggestion: '重看这一步的「预期」栏：确认当前结果是否已经达标；如果已经看到预期结果，直接点「我做到了」点亮，无需额外动作。',
  }
}

/* ---------- learning 包（v3 逻辑，向后兼容，不动） ---------- */
async function handleLearning(body: Record<string, unknown>, req: Request): Promise<NextResponse> {
  const { lamp_slug, tool_name = '', user_input = '', image_url } = body as {
    lamp_slug?: string
    tool_name?: string
    user_input?: string
    image_url?: string
  }
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

  const prompt = buildLearningPrompt(lamp_slug, tool_name, matrixRow, user_input, Boolean(image_url))

  try {
    const result = image_url
      ? await callQwenVL(image_url, prompt, LEARNING_TYPES)
      : await callDeepSeek(prompt, LEARNING_TYPES)
    return NextResponse.json({ ...result, model: image_url ? 'qwen-vl-plus' : 'deepseek-chat' })
  } catch (e) {
    console.error('diagnose(learning) error:', e)
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

/* ---------- install 包（新增：装机陪跑五分类诊断） ---------- */
async function handleInstall(body: Record<string, unknown>, req: Request): Promise<NextResponse> {
  const { tool_name = '', step_title = '', user_input = '', anon_id } = body as {
    tool_name?: string
    step_title?: string
    user_input?: string
    anon_id?: string | null
  }
  if (!tool_name.trim()) {
    return NextResponse.json({ error: 'tool_name required' }, { status: 400 })
  }
  if (!step_title.trim()) {
    return NextResponse.json({ error: 'step_title required' }, { status: 400 })
  }

  // 速率限制同款：每工具每天 5 次
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon'
  if (rateLimited(`${ip}:install:${tool_name}`)) {
    return NextResponse.json(
      { error: '这个工具的装机诊断次数已用完（5 次/天），明天再来或换一个工具。' },
      { status: 429 }
    )
  }

  const prompt = buildInstallPrompt(tool_name, step_title, user_input)

  try {
    const result = await callDeepSeek(prompt, INSTALL_TYPES)
    // 落库（best-effort，表/列未就绪时静默跳过，不影响响应）
    await persistInstallDiagnosis({
      pack: 'install',
      lamp_slug: null,
      anon_id: anon_id ?? null,
      tool_name,
      step_title,
      diagnosis_type: result.diagnosis_type,
      user_input: user_input || null,
      image_url: null,
      message: result.message,
      suggestion: result.suggestion,
      model: 'deepseek-chat',
      meta: { pack: 'install', tool_name, step_title },
    })
    return NextResponse.json({ ...result, model: 'deepseek-chat' })
  } catch (e) {
    console.error('diagnose(install) error:', e)
    const fallback = installFallback(tool_name, step_title, user_input)
    return NextResponse.json({ ...fallback, degraded: true }, { status: 200 })
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const pack: Pack = body.pack === 'install' ? 'install' : 'learning'
  return pack === 'install' ? handleInstall(body, req) : handleLearning(body, req)
}
