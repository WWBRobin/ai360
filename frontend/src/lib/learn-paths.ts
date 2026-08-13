/**
 * 学习路径数据 — 按工具学 + 按场景学
 *
 * 数据结构：
 * - LearningStep：单个步骤（有序，闯关式）
 * - ToolLearningPath：按平台工具的路径
 * - SceneLearningPath：按场景的路径
 *
 * 难度三级：🌱小白 / 🌿新手 / 🌳进阶
 */

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface LearningStep {
  id: string
  title: string
  description: string
  estimatedTime: string
  difficulty: Difficulty
  skillHref?: string
}

export interface ToolLearningPath {
  platform: string
  platformName: string
  platformIcon: string
  description: string
  steps: LearningStep[]
}

export interface SceneLearningPath {
  slug: string
  name: string
  icon: string
  description: string
  steps: LearningStep[]
}

export const DIFFICULTY_META: Record<Difficulty, { label: string; icon: string }> = {
  beginner: { label: '小白', icon: '🌱' },
  intermediate: { label: '新手', icon: '🌿' },
  advanced: { label: '进阶', icon: '🌳' },
}

// ============================================================
// 按工具学 — 平台学习路径
// ============================================================

export const TOOL_PATHS: ToolLearningPath[] = [
  {
    platform: 'hermes',
    platformName: 'Hermes',
    platformIcon: '⚡',
    description: '从零掌握 Hermes Agent — 配置、Skills、Hooks、自动化',
    steps: [
      {
        id: 'hermes-1',
        title: '安装 Hermes Agent',
        description: '在 macOS 上安装 Hermes，完成首次配置',
        estimatedTime: '10 分钟',
        difficulty: 'beginner',
        skillHref: '/skill/hermes-agent',
      },
      {
        id: 'hermes-2',
        title: '配置第一个模型和 Provider',
        description: '接入 GLM/GPT，理解 profile 和 provider 概念',
        estimatedTime: '15 分钟',
        difficulty: 'beginner',
        skillHref: '/skill/hermes-model-management',
      },
      {
        id: 'hermes-3',
        title: '使用内置 Skills 提升效率',
        description: '加载 coding-standards、planning 等 Skill',
        estimatedTime: '20 分钟',
        difficulty: 'intermediate',
        skillHref: '/skill/ai-tool-evaluation',
      },
      {
        id: 'hermes-4',
        title: '部署防幻觉 Hooks',
        description: '21 个 Hook + 40 条规则，质量门控',
        estimatedTime: '30 分钟',
        difficulty: 'intermediate',
        skillHref: '/skill/hermes-hooks',
      },
      {
        id: 'hermes-5',
        title: '搭建自动化 Cron 任务',
        description: '定时执行任务，实现全自动工作流',
        estimatedTime: '25 分钟',
        difficulty: 'advanced',
      },
    ],
  },
  {
    platform: 'coze',
    platformName: '扣子 Coze',
    platformIcon: '🟢',
    description: '从零搭建你的第一个 Coze Agent 应用',
    steps: [
      {
        id: 'coze-1',
        title: '注册扣子并创建第一个 Bot',
        description: '了解扣子平台界面，创建对话机器人',
        estimatedTime: '15 分钟',
        difficulty: 'beginner',
      },
      {
        id: 'coze-2',
        title: '配置 Prompt 和人设',
        description: '编写高质量 System Prompt，定义 Bot 角色',
        estimatedTime: '20 分钟',
        difficulty: 'beginner',
      },
      {
        id: 'coze-3',
        title: '接入知识库',
        description: '上传文档建立 RAG 知识库，让 Bot 专业回答',
        estimatedTime: '25 分钟',
        difficulty: 'intermediate',
      },
      {
        id: 'coze-4',
        title: '添加插件和工作流',
        description: '联网搜索、代码执行、API 调用',
        estimatedTime: '30 分钟',
        difficulty: 'intermediate',
      },
      {
        id: 'coze-5',
        title: '发布到多平台',
        description: '微信、飞书、Web 渠道一键发布',
        estimatedTime: '20 分钟',
        difficulty: 'advanced',
      },
    ],
  },
  {
    platform: 'claude',
    platformName: 'Claude Skills',
    platformIcon: '🤖',
    description: '掌握 Claude Skills — 从创建到部署的完整流程',
    steps: [
      {
        id: 'claude-1',
        title: '理解 Claude Skills 体系',
        description: '了解 Skill 结构：frontmatter + body',
        estimatedTime: '10 分钟',
        difficulty: 'beginner',
        skillHref: '/skill/claude-design',
      },
      {
        id: 'claude-2',
        title: '编写第一个 SKILL.md',
        description: '创建可复用的 Skill 文件',
        estimatedTime: '20 分钟',
        difficulty: 'intermediate',
      },
      {
        id: 'claude-3',
        title: '使用 Claude Code CLI',
        description: '命令行操作，PR 生命周期管理',
        estimatedTime: '30 分钟',
        difficulty: 'advanced',
        skillHref: '/skill/claude-code',
      },
    ],
  },
  {
    platform: 'gpts',
    platformName: 'GPTs',
    platformIcon: '🧠',
    description: '搭建 GPTs — OpenAI 官方定制 GPT',
    steps: [
      {
        id: 'gpts-1',
        title: '创建自定义 GPT',
        description: '在 ChatGPT 中配置你的 GPT',
        estimatedTime: '15 分钟',
        difficulty: 'beginner',
      },
      {
        id: 'gpts-2',
        title: '配置 Actions 和 API',
        description: '让 GPT 调用外部 API',
        estimatedTime: '25 分钟',
        difficulty: 'intermediate',
      },
      {
        id: 'gpts-3',
        title: '发布到 GPT Store',
        description: '审核、上架、获取用户',
        estimatedTime: '20 分钟',
        difficulty: 'advanced',
      },
    ],
  },
]

// ============================================================
// 按场景学 — 场景学习路径
// ============================================================

export const SCENE_PATHS: SceneLearningPath[] = [
  {
    slug: 'write-article',
    name: '用 AI 写文章',
    icon: '✍️',
    description: '从选题到成稿，用 AI 辅助完成高质量内容创作',
    steps: [
      {
        id: 'write-1',
        title: '用 AI 生成选题和标题',
        description: '找到高搜索量长尾关键词',
        estimatedTime: '15 分钟',
        difficulty: 'beginner',
        skillHref: '/skill/seo-long-tail-writing',
      },
      {
        id: 'write-2',
        title: '搭建文章大纲',
        description: '让 AI 帮你规划结构清晰的框架',
        estimatedTime: '20 分钟',
        difficulty: 'beginner',
      },
      {
        id: 'write-3',
        title: 'AI 辅助写作正文',
        description: '分段生成，保持文风一致',
        estimatedTime: '30 分钟',
        difficulty: 'intermediate',
      },
      {
        id: 'write-4',
        title: 'AI 润色和去 AI 味',
        description: '让文章读起来像人写的',
        estimatedTime: '20 分钟',
        difficulty: 'intermediate',
        skillHref: '/skill/humanizer',
      },
    ],
  },
  {
    slug: 'build-agent',
    name: '搭建 AI Agent',
    icon: '🤖',
    description: '从零搭建一个能自主完成任务的 AI Agent',
    steps: [
      {
        id: 'agent-1',
        title: '理解 Agent 架构',
        description: '规划、工具调用、记忆、执行循环',
        estimatedTime: '20 分钟',
        difficulty: 'beginner',
      },
      {
        id: 'agent-2',
        title: '配置 Agent 工具集',
        description: '搜索、代码执行、文件读写',
        estimatedTime: '30 分钟',
        difficulty: 'intermediate',
      },
      {
        id: 'agent-3',
        title: '实现多步推理',
        description: 'ReAct 模式，让 Agent 自主决策',
        estimatedTime: '40 分钟',
        difficulty: 'advanced',
      },
      {
        id: 'agent-4',
        title: '部署和监控',
        description: '上线运行，日志和错误追踪',
        estimatedTime: '30 分钟',
        difficulty: 'advanced',
      },
    ],
  },
  {
    slug: 'automate-work',
    name: '自动化日常工作',
    icon: '⚙️',
    description: '让 AI 帮你自动完成重复性任务',
    steps: [
      {
        id: 'auto-1',
        title: '梳理可自动化的任务',
        description: '找出日常重复劳动',
        estimatedTime: '15 分钟',
        difficulty: 'beginner',
      },
      {
        id: 'auto-2',
        title: '用 n8n 搭建工作流',
        description: '可视化拖拽搭建自动化流程',
        estimatedTime: '30 分钟',
        difficulty: 'intermediate',
      },
      {
        id: 'auto-3',
        title: '配置定时 Cron 任务',
        description: '让任务每天自动运行',
        estimatedTime: '20 分钟',
        difficulty: 'advanced',
      },
    ],
  },
  {
    slug: 'analyze-data',
    name: '用 AI 分析数据',
    icon: '📊',
    description: '从数据清洗到可视化，AI 全流程辅助',
    steps: [
      {
        id: 'data-1',
        title: 'AI 辅助数据清洗',
        description: '处理脏数据、缺失值、格式问题',
        estimatedTime: '20 分钟',
        difficulty: 'beginner',
      },
      {
        id: 'data-2',
        title: '用自然语言查询数据',
        description: 'Text-to-SQL，问问题直接出结果',
        estimatedTime: '25 分钟',
        difficulty: 'intermediate',
      },
      {
        id: 'data-3',
        title: '自动生成数据报告',
        description: 'AI 写分析结论和可视化',
        estimatedTime: '30 分钟',
        difficulty: 'advanced',
      },
    ],
  },
]

// ============================================================
// 查找辅助
// ============================================================

export function getToolPath(platform: string): ToolLearningPath | undefined {
  return TOOL_PATHS.find((p) => p.platform === platform)
}

export function getScenePath(slug: string): SceneLearningPath | undefined {
  return SCENE_PATHS.find((s) => s.slug === slug)
}
