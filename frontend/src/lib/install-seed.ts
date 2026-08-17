/**
 * 装机陪跑 P0 · 手搓 seed 数据（5 工具，场景=内容创作）
 *
 * 数据模型严格对齐 StepCard 组件规范（OB 10-设计/StepCard组件规范.md §二）
 * + 05-equipment.sql 的 install_steps 注释口径。
 *
 * P0 阶段：数据只存在于前端 seed 文件，不直接进 DB（skills.install_steps 列由主线
 * 后续执行 SQL 时批量灌入）。slug 为稳定标识，DB skills.id 映射待主线补全。
 */

export type StepType =
  | 'register' // 跳转注册
  | 'copy_file' // 复制文件
  | 'edit_config' // 改配置
  | 'fill_key' // 填 API_KEY
  | 'web_enable' // 网页启用
  | 'download' // 下载安装
  | 'verify_call' // 验证调用

export type VerifyMode = 'manual' | 'visual' | 'auto'

/** 卡点预埋项（"卡住了？"折叠区的内容） */
export interface StepPitfall {
  symptom: string
  cause: string
  fix: string
}

/** 一个标准化安装步骤 */
export interface InstallStep {
  type?: StepType
  title: string
  guide: string
  expect: string
  pitfalls?: StepPitfall[]
  verify: VerifyMode
  minutes: number
}

/** 一个装机项（对应一个工具） */
export interface InstallItem {
  slug: string
  name: string
  why: string // 推荐理由（一句话）
  score: number // 综合评分（评测系统已有口径）
  level: string // 适配等级（L1-L5）
  minutes: number // 总预计时长
  firstOutput: string // 首次产出说明（完成页"首次产出展示位"）
  steps: InstallStep[]
}

/** 装机单 */
export interface InstallPlan {
  scenario: string
  scenarioLabel: string
  items: InstallItem[]
}

/** P0 只有"内容创作"一个场景（设计 v1 §八 MVP 切片） */
export const INSTALL_SCENARIOS: { slug: string; label: string; desc: string }[] = [
  {
    slug: 'content-creation',
    label: '内容创作',
    desc: '写文案 · 生图 · 做小红书笔记，从 0 到第一条 AI 产出',
  },
]

export function getInstallPlan(scenario: string): InstallPlan {
  const sc = INSTALL_SCENARIOS.find((s) => s.slug === scenario) ?? INSTALL_SCENARIOS[0]
  return { scenario: sc.slug, scenarioLabel: sc.label, items: INSTALL_ITEMS }
}

export const INSTALL_ITEMS: InstallItem[] = [
  {
    slug: 'arcdock-relay',
    name: 'ArcDock 中转站',
    why: '零配置、免海外信用卡、按量付费，3 分钟拿到能用的模型 API——永远排第一的方案',
    score: 4.8,
    level: 'L1',
    minutes: 3,
    firstOutput: '第一次真实调用模型，拿到一段 AI 回复',
    steps: [
      {
        type: 'register',
        title: '打开中转站并登录',
        guide: '访问中转站入口，用手机号或微信登录',
        expect: '进入控制台，左侧能看到「API Key / 密钥」菜单',
        pitfalls: [
          { symptom: '页面打不开', cause: '网络波动或域名暂不可达', fix: '稍后重试，或开梯子' },
          { symptom: '找不到登录入口', cause: '登录按钮在右上角', fix: '看右上角的登录/头像按钮' },
        ],
        verify: 'manual',
        minutes: 1,
      },
      {
        type: 'fill_key',
        title: '复制 API Key',
        guide: '控制台 → API Key 页 → 点「创建 Key」→ 点「复制」',
        expect: '剪贴板里有一串以 sk- 开头的 Key',
        pitfalls: [
          { symptom: '不知道 Key 在哪复制', cause: '藏在「API Key / 密钥」子菜单', fix: '左侧栏找「API Key / 密钥」入口' },
          { symptom: 'Key 复制少了字符', cause: '手动选中不全', fix: '点 Key 旁的「复制」按钮，别手选' },
        ],
        verify: 'manual',
        minutes: 1,
      },
      {
        type: 'verify_call',
        title: '第一次调用',
        guide: '用 Key + base_url 发一次对话请求（页面有示例代码，可直接复制改 Key）',
        expect: '返回一段正常的模型回复',
        pitfalls: [
          { symptom: '401 未授权', cause: 'Key 复制错或带空格', fix: '重新复制，去掉首尾空格' },
          { symptom: '404 端点错', cause: 'base_url 路径不对', fix: '用示例代码里的完整 base_url，别只填域名' },
        ],
        verify: 'auto',
        minutes: 1,
      },
    ],
  },
  {
    slug: 'coze',
    name: '扣子 Coze',
    why: '不用写代码就能搭 AI 助手，模板市场一键复制，免费额度充足',
    score: 4.6,
    level: 'L1',
    minutes: 8,
    firstOutput: '你的第一个能对话的 Bot',
    steps: [
      {
        type: 'register',
        title: '注册扣子账号',
        guide: '访问 coze.cn，用手机号或微信扫码登录',
        expect: '进入扣子工作台首页',
        pitfalls: [
          { symptom: '提示要手机号', cause: '国内平台注册都绑手机', fix: '用微信扫码登录可跳过手机号' },
        ],
        verify: 'manual',
        minutes: 1,
      },
      {
        type: 'web_enable',
        title: '建第一个 Bot',
        guide: '点「创建 Bot / 创建智能体」→ 起个名字 → 选一个模板或空白',
        expect: '进入 Bot 编排页（左侧提示词 / 中间编排 / 右侧预览）',
        pitfalls: [
          { symptom: '创建按钮找不到', cause: '入口在首页顶部或「我的空间」', fix: '首页找「+ 创建」按钮' },
          { symptom: '模板太多不会选', cause: '模板市场按场景分类', fix: '选「空白 Bot」最稳，先跑通再学模板' },
        ],
        verify: 'manual',
        minutes: 3,
      },
      {
        type: 'web_enable',
        title: '发布 Bot',
        guide: '右上角「发布」→ 选发布渠道 → 确认',
        expect: '看到「发布成功」提示，Bot 可被访问',
        pitfalls: [
          { symptom: '发布按钮灰色', cause: 'Bot 缺名字或描述', fix: '补全名称 + 一句介绍再发' },
          { symptom: '不知道选哪个渠道', cause: '渠道决定在哪能用', fix: '先选「Coze 商店」或「API」都行，可改' },
        ],
        verify: 'manual',
        minutes: 3,
      },
    ],
  },
  {
    slug: 'doubao',
    name: '豆包',
    why: '字节出品，免费额度大，中文对话质量稳，日常问答和文案都够用',
    score: 4.5,
    level: 'L1',
    minutes: 5,
    firstOutput: '一段 AI 帮你写的文案或回答',
    steps: [
      {
        type: 'register',
        title: '注册豆包',
        guide: '访问 doubao.com 或下载 App，手机号登录',
        expect: '进入对话首页',
        pitfalls: [
          { symptom: '只能手机号登录', cause: '豆包仅支持手机号', fix: '用本人手机号收验证码即可' },
        ],
        verify: 'manual',
        minutes: 1,
      },
      {
        type: 'verify_call',
        title: '基础对话',
        guide: '在输入框发一句「用一句话介绍你自己」',
        expect: '豆包回复一段文字',
        pitfalls: [
          { symptom: '回复很慢', cause: '高峰期排队', fix: '稍等几秒或刷新重试' },
        ],
        verify: 'manual',
        minutes: 1,
      },
      {
        type: 'web_enable',
        title: '建一个智能体',
        guide: '找「智能体」入口 → 创建 → 填角色设定 → 保存',
        expect: '智能体列表出现你建的那个，点进去能用',
        pitfalls: [
          { symptom: '找不到智能体入口', cause: '入口位置随版本变', fix: '用网页顶部或 App 的「智能体」tab 找' },
          { symptom: '角色设定不知道填啥', cause: '相当于给 AI 定人设', fix: '填一句「你是一位擅长写小红书笔记的编辑」即可' },
        ],
        verify: 'manual',
        minutes: 3,
      },
    ],
  },
  {
    slug: 'kimi',
    name: 'Kimi',
    why: '长文档阅读最强，一口气吃下几十万字 PDF，总结和问答都准',
    score: 4.7,
    level: 'L1',
    minutes: 4,
    firstOutput: '一份长文档的 AI 总结',
    steps: [
      {
        type: 'register',
        title: '注册 Kimi',
        guide: '访问 kimi.moonshot.cn，手机号登录',
        expect: '进入对话首页',
        pitfalls: [
          { symptom: '需要手机号', cause: '国内平台注册绑手机', fix: '手机号收码登录' },
        ],
        verify: 'manual',
        minutes: 1,
      },
      {
        type: 'verify_call',
        title: '上传一篇长文档',
        guide: '点输入框旁的「上传文件」→ 选一篇 PDF/Word → 问「总结这份文档的三个要点」',
        expect: 'Kimi 读出文档内容并给出总结',
        pitfalls: [
          { symptom: '上传失败', cause: '文件超 100MB 或格式不支持', fix: '压到 100MB 内，用 PDF/Word/TXT' },
          { symptom: '说读不到内容', cause: '扫描版 PDF 没有文字层', fix: '换有文字层的 PDF，或先 OCR 转文字' },
        ],
        verify: 'manual',
        minutes: 3,
      },
    ],
  },
  {
    slug: 'tongyi-wanxiang',
    name: '通义万相生图',
    why: '每日 50 张免费额度，中文理解好，小红书配图够用',
    score: 4.3,
    level: 'L1',
    minutes: 6,
    firstOutput: '你生成的第一张图',
    steps: [
      {
        type: 'register',
        title: '开通通义万相',
        guide: '访问 tongyi.aliyun.com/wanxiang，用阿里云/支付宝账号登录',
        expect: '进入万相生图页面',
        pitfalls: [
          { symptom: '要求阿里云账号', cause: '阿里系产品统一账号', fix: '支付宝/淘宝账号可直接登录' },
        ],
        verify: 'manual',
        minutes: 1,
      },
      {
        type: 'web_enable',
        title: '领取 50 张免费额度',
        guide: '首次进入通常自动发放，或看页面顶部「免费额度」提示领取',
        expect: '页面显示剩余免费次数（如 50 次）',
        pitfalls: [
          { symptom: '没看到免费额度', cause: '入口在「权益/额度」页', fix: '找「我的额度 / 免费权益」入口领取' },
          { symptom: '额度显示 0', cause: '账号已领过或不是首次', fix: '换账号，或走按量付费（约 0.2 元/张）' },
        ],
        verify: 'manual',
        minutes: 1,
      },
      {
        type: 'verify_call',
        title: '第一次生图',
        guide: '输入提示词（主体 + 风格 + 构图 + 光照 + 颜色），点生成，等 10-15 秒',
        expect: '出来 4 张图，能下载',
        pitfalls: [
          { symptom: '图不对题', cause: '提示词缺主体', fix: '把核心词放最前面，如「一杯燕麦奶…」' },
          { symptom: '图里文字乱码', cause: '生图模型不擅长画字', fix: '复杂文字用即梦，或生成后再加字' },
        ],
        verify: 'visual',
        minutes: 4,
      },
    ],
  },
]
