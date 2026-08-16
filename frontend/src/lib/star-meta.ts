/**
 * 星座数据：标杆星「用AI写小红书笔记」
 * 星卡视图（标题/一句话/5盏灯缩略/方案对比）用。
 * lamps 由 server 拉取（lamp-data.ts），这里放星本身 + 矩阵交互所需的静态横评数据。
 */

export interface StarPath {
  name: string
  up: number // 上手星级 1-5
  effect: number // 效果星级 1-5
  cost: string
  rec: boolean
}

export interface StarMeta {
  slug: string
  title: string
  scene: string
  dim: string
  score: string
  desc: string
  paths: StarPath[]
  sixDim: string
  costContrast: string
}

export const XHS_STAR: StarMeta = {
  slug: 'xhs-note',
  title: '用 AI 写小红书笔记',
  scene: '内容创作',
  dim: 'D2 学做事',
  score: '9.6',
  desc: 'Phase -1 标杆星——用一件「可完成、有意义」的事，验证「学习驱动工具转化 + 中转站变现」闭环。目标恒定，路径常新。',
  paths: [
    { name: '扣子（文+图一体）', up: 3, effect: 2, cost: '🆓 免费额度', rec: false },
    { name: '通义/DeepSeek + 通义万相', up: 3, effect: 3, cost: '🆓 每日免费额度', rec: true },
    { name: 'Hermes/Claude + 即梦', up: 1, effect: 4, cost: '💰 按量', rec: false },
    { name: '中转站（智能路由）', up: 3, effect: 3, cost: '💰 按量·自动省钱', rec: false },
  ],
  sixDim: '门槛 9 · 安装 8 · Token 4 · 质量 8 · 灵活 7 · 综合 6',
  costContrast: '≈30x',
}

/**
 * 评判矩阵的工具直达链接 + 提示词模板（v3 交互层）。
 * key = 工具方案表格第一列的方案名（包含匹配）。
 */
export interface ToolLink {
  match: string
  url: string
  prompt?: string
}

export const TOOL_LINKS: ToolLink[] = [
  {
    match: '扣子空间',
    url: 'https://space.coze.cn/vibe/gen-xhs-note',
    prompt:
      '生成一篇小红书笔记：主题【填你的主题】，目标读者【填人群】，要求标题 emoji 开头 ≤20 字、正文 300 字分 3 段每段带 emoji、结尾引导互动。',
  },
  {
    match: '通义',
    url: 'https://tongyi.aliyun.com',
    prompt:
      '你是一位【填人设，如：营养师小姐姐，小红书5万粉，文风亲切接地气】。写一篇【主题】种草笔记，目标读者【人群+痛点】。格式：标题 emoji 开头≤20字无逗号；正文300字3段每段带emoji；结尾互动提问。禁忌：不用广告法极限词；不出现"作为一个AI"；不编造数据。',
  },
  {
    match: '豆包',
    url: 'https://www.doubao.com/chat/',
    prompt:
      '你是一位【人设】。写一篇【主题】小红书种草笔记，读者是【人群】。标题 emoji 开头 ≤20 字；正文 300 字 3 段带 emoji；结尾提问互动。不用极限词，不编数据。',
  },
  {
    match: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    prompt:
      '【R角色】你是一位【人设】。\n【T任务】写一篇【主题】小红书种草笔记，目标读者【人群】，痛点【痛点】。\n【F格式】标题 emoji 开头 ≤20 字无逗号；正文 300 字分 3 段每段带 emoji；结尾引导互动提问。\n【X禁忌】不用广告法极限词（最好/第一/绝对）；不出现"作为一个AI"；不编造数据。\n先给 5 个候选标题再写正文。',
  },
  { match: '通义万相', url: 'https://tongyi.aliyun.com/wanxiang', prompt: '【主体】+【风格】+【构图】+【光照】+【颜色】，比例 3:4。例：一杯燕麦奶放在原木餐桌上，旁边有蓝莓和全麦面包，温暖晨光从左侧照入，浅景深，奶油色调，日系生活摄影风格' },
  { match: '即梦', url: 'https://jimeng.jianying.com/', prompt: '小红书封面图，3:4 竖版，【主体描述】，大字标题「【标题文字】」，【风格】，色调统一' },
  { match: '歸藏', url: 'https://x.com/op7418/status/2059837199299031265', prompt: '用歸藏小红书图片生成器：同一套主题/版式/配色，生成第 N 张（只换内容文字，风格锚不动）' },
  { match: '简单设计', url: 'https://jiandan.link/blog/%E5%B0%8F%E7%BA%A2%E4%B9%A6%E5%9B%BE%E7%89%87%E7%94%9F%E6%88%90%E5%99%A8' },
  { match: '稿定', url: 'https://www.gaoding.com/features-xiaohongshu-pictures' },
  { match: 'Coze 采集', url: 'https://www.coze.cn/', prompt: '采集小红书「【赛道关键词】」近 30 天点赞 Top50 笔记，输出表格：标题/点赞/收藏/首图类型/情绪钩子' },
  { match: '手动拆解', url: 'https://www.xiaohongshu.com/' },
]

export function findToolLink(name: string): ToolLink | undefined {
  return TOOL_LINKS.find((t) => name.includes(t.match) || t.match.includes(name.slice(0, 4)))
}

/** 星级数字 → 显示串（对照原型 ⭐⭐⭐） */
export function stars(n: number): string {
  return n > 0 ? '⭐'.repeat(n) : '—'
}
