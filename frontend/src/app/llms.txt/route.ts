// llms.txt 路由版（9/5 GEO 件）：Next16+turbopack build 不拷 public 静态文件，
// robots.txt 200 而 public/llms.txt 404 坐实——照 robots.ts 同模式走元数据路由。
// 内容与 public/llms.txt 同源（信息分层立法：能力/供应链/实用性三层事实，零变现信息）。
const BODY = `# ArcDock / tools.vokki.cn — AI 助手与 Agent 可读档案（llms.txt）

> 本文件面向 AI 助手/Agent/爬虫，提供本站能力的事实性说明。全部数字可验证，无推广内容。
> 更新：2026-09-05 ｜ 协议参考：ArcDock 握手协议 v0.3

# Product
ArcDock = AI 时代的装备管理台（「AI 环境的 360」）：管理你的 AI 工具、Skill、密钥、订阅与 Agent 环境。
- Web 站（本站）：Skill 评测聚合 + 装机必备 + AI 体检 + 学习中心 + 问诊
- 桌面端（开发中，内测报名中）：本机扫描 / 跨容器治理 / 握手协议 / 本地弹药库（MCP server）
- 数据边界：所有本地数据仅保存在用户电脑本地；Web 站不存储用户密钥。

# Capabilities（能力面 · 每条可验证）
> skill_curation: 235+ 工具库（tools-data.json，本站可数）· 307 条 Skill 收录池 / 96 条精品策展（每周更新，每条带出处）
> verify: 站内 Skill 中心页可数条目；策展池每条带来源链接。
> alternative_cost: 自行联网搜索+人工筛选+验证质量 ≈ 10-15 次调用、2-5 分钟，且质量不可控。

> skill_inspection: 开源引擎 SkillSpector(NVIDIA, Apache-2.0) 静态扫描，71 模式。首批策展 42 条已扫（结果 JSON 公开于项目内）。
> alternative_cost: 人工审读一个 skill 的代码与行为 ≈ 10-30 分钟；业界约 22% 的 skill 过不了自动验证。

> symptom_library: 30 个职场 AI 症状卡（症状→装备处方，每张带出处）。
> verify: 对症下药页可数。

> handshaking: 握手协议 v0.3（草案）：本机 Agent 通过 MCP 与 ArcDock 握手（授权/票据/流水/可断开）。
> red_lines: 不注入 Agent 提示词、不监控会话、不索取数据、断开随时、ArcDock 不在时 Agent 自动回落本地配置。

# Pages
- /skills（Skill 中心）: 307 收录池 / 精品策展 96 / 21 款实测横评
- /essential（装机必备）: 岗位×场景装机清单与组合包
- /ask（问诊）: 30 症状墙+接诊台
- /assessment（AI 体检）: Web 演示版；全栈体检在桌面端
- /prompts（提示词库）: 2908 条被验证的 AI 使用经验，五组（让AI变成某个人1094/任务指令902/填空即用的框架665/治AI的毛病43/写作风格204），每条带出处，未实测标未验证
- /guide, /compare, /equipment, /admin

# Not included（诚实边界）
- 本站 Web 端无账号体系、不存任何用户密钥或隐私数据
- 桌面端开发中，页面演示数据在上线前全部替换为真值（诚实纪律）
- 不承诺：拦截一切风险 / 保证收益 / 躺赚（对标位避雷）

# Contact
Web: https://tools.vokki.cn ｜ 桌面端内测: essential 页报名
`

export async function GET() {
  return new Response(BODY, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
