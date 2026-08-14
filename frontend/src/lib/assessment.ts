/**
 * 能力评测 — 纯逻辑层（无 UI、无副作用）
 *
 * 题目与算法严格按《ArcDock 学习板块产品设计方案》§2（等级定义）§3（评测系统）：
 * - 5 道题：工具经验(多选) / 使用频率(单选) / 任务复杂度(单选) / 认知水平(单选) / 学习目标(多选≤3)
 * - 基础分 = 题一 × 0.4 + 题三 × 0.35 + 题四 × 0.25
 * - 最终分 = 基础分 × 频率修正(0.8 / 1.0 / 1.2)
 * - 分值区间映射 L1-L5，边界取高
 */

// ============================================================
// 类型
// ============================================================

export type Level = 'L1' | 'L2' | 'L3' | 'L4' | 'L5'

export type SceneKey =
  | 'content'
  | 'design'
  | 'data'
  | 'coding'
  | 'growth'
  | 'research'
  | 'office'

/** answers 的键 = 每道题的 id */
export interface AssessmentAnswers {
  /** 题一：工具经验（多选，选项 id 数组） */
  q1_tools: string[]
  /** 题二：使用频率（单选，选项 id） */
  q2_freq: string | null
  /** 题三：任务复杂度（单选，选项 id） */
  q3_complexity: string | null
  /** 题四：认知水平（单选，选项 id） */
  q4_cognition: string | null
  /** 题五：学习目标（多选≤3，选项 id 数组） */
  q5_goals: string[]
}

interface OptionBase {
  id: string
  label: string
}

/** 带等级信号的选项（题一/三/四） */
interface LevelOption extends OptionBase {
  /** 该选项代表的等级分值：L1=1 ... L5=5 */
  levelScore: 1 | 2 | 3 | 4 | 5
}

/** 题二选项：频率修正系数 */
interface FreqOption extends OptionBase {
  modifier: 0.8 | 1.0 | 1.2
}

/** 题五选项：场景映射 */
interface SceneOption extends OptionBase {
  scene: SceneKey
}

// ============================================================
// 等级元数据（文档 §2.2 表格）
// ============================================================

export const LEVEL_META: Record<Level, { name: string; desc: string }> = {
  L1: { name: '初识 AI', desc: '听过 AI 很火，想用但不知道还能干嘛' },
  L2: { name: 'AI 入门', desc: '日常偶尔用 AI 帮忙，但还没形成习惯' },
  L3: { name: 'AI 实践', desc: '已把 AI 融入日常工作，用它持续提效' },
  L4: { name: 'AI 进阶', desc: '理解 API 与系统级概念，能设计多工具协作方案' },
  L5: { name: 'AI 高手', desc: '能开发 AI 应用，深度理解模型能力边界' },
}

export const SCENE_META: Record<SceneKey, string> = {
  content: '内容创作',
  design: '视觉设计',
  data: '数据分析',
  coding: '编程开发',
  growth: '营销增长',
  research: '学习研究',
  office: '办公效率',
}

// ============================================================
// 题目数据（文档 §3.3）
// ============================================================

export const Q1_OPTIONS: LevelOption[] = [
  { id: 'chat', label: '只用过 AI 聊天（豆包、ChatGPT 等）', levelScore: 1 },
  { id: 'media', label: '用过 AI 生成图片 / 视频', levelScore: 2 },
  { id: 'office', label: '用过 AI 做 PPT / 文档 / 数据分析', levelScore: 2 },
  { id: 'bot', label: '用过 Coze / Dify / 扣子等平台搭过 Bot 或工作流', levelScore: 3 },
  { id: 'api', label: '调用过 AI 的 API 做过自动化或开发', levelScore: 4 },
  { id: 'app', label: '自己开发过完整的 AI 应用', levelScore: 5 },
]

export const Q2_OPTIONS: FreqOption[] = [
  { id: 'rare', label: '偶尔想起来才用一次', modifier: 0.8 },
  { id: 'weekly', label: '每周用几次', modifier: 1.0 },
  { id: 'daily', label: '每天都在用，已经离不开', modifier: 1.2 },
]

export const Q3_OPTIONS: LevelOption[] = [
  { id: 'qa', label: '让 AI 帮我回答问题、查资料', levelScore: 1 },
  { id: 'gen', label: '让 AI 帮我生成内容（文案 / 图片 / PPT）', levelScore: 2 },
  { id: 'flow', label: '搭建了一个自动化流程（比如定时发内容、自动回复）', levelScore: 3 },
  { id: 'combo', label: '设计了多个 AI 工具配合使用的方案', levelScore: 4 },
  { id: 'product', label: '开发了一个 AI 产品 / 应用', levelScore: 5 },
]

export const Q4_OPTIONS: LevelOption[] = [
  { id: 'toy', label: 'AI 就是聊天机器人，有时候挺有用的', levelScore: 1 },
  { id: 'exploring', label: 'AI 能帮我做不少事，但我还在摸索怎么用好', levelScore: 2 },
  { id: 'selector', label: '我知道不同 AI 工具各擅长什么，会根据任务选择合适的', levelScore: 3 },
  { id: 'architect', label: '我能设计一套 AI 工作流，让多个工具协同完成复杂任务', levelScore: 4 },
  { id: 'evaluator', label: '我能评估不同 AI 模型的优劣，并根据场景做最优的技术选择', levelScore: 5 },
]

export const Q5_OPTIONS: SceneOption[] = [
  { id: 'write', label: '写文案、做内容', scene: 'content' },
  { id: 'visual', label: '做图、设计、视觉相关', scene: 'design' },
  { id: 'data', label: '处理数据、做分析', scene: 'data' },
  { id: 'code', label: '写代码、做开发', scene: 'coding' },
  { id: 'marketing', label: '做营销、涨粉、获客', scene: 'growth' },
  { id: 'study', label: '学习、研究、整理知识', scene: 'research' },
  { id: 'efficiency', label: '提高办公效率', scene: 'office' },
]

/** 向导 UI 用的题目元数据 */
export const QUESTIONS = [
  {
    id: 'q1_tools' as const,
    title: '你目前使用过以下哪些类型的 AI 工具？',
    hint: '多选 · 选了就得分',
    multiple: true,
    options: Q1_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
  },
  {
    id: 'q2_freq' as const,
    title: '你每周使用 AI 工具的频率是？',
    hint: '单选',
    multiple: false,
    options: Q2_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
  },
  {
    id: 'q3_complexity' as const,
    title: '你用 AI 完成过的最复杂的事情是什么？',
    hint: '单选 · 选最高的那个',
    multiple: false,
    options: Q3_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
  },
  {
    id: 'q4_cognition' as const,
    title: '以下哪个描述最符合你现在的状态？',
    hint: '单选',
    multiple: false,
    options: Q4_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
  },
  {
    id: 'q5_goals' as const,
    title: '你最想用 AI 来做什么？',
    hint: '多选 · 最多 3 个',
    multiple: true,
    maxSelect: 3,
    options: Q5_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
  },
]

export const MAX_SCENE_SELECT = 3

export const EMPTY_ANSWERS: AssessmentAnswers = {
  q1_tools: [],
  q2_freq: null,
  q3_complexity: null,
  q4_cognition: null,
  q5_goals: [],
}

// ============================================================
// 评分算法（文档 §3.4）
// ============================================================

/** 题一多选：所有选中选项的等级分值取平均（覆盖完整能力面，不被多选刷分） */
function q1Score(selected: string[]): number {
  if (selected.length === 0) return 0
  const scores: number[] = []
  for (const id of selected) {
    const opt = Q1_OPTIONS.find((o) => o.id === id)
    if (opt) scores.push(opt.levelScore)
  }
  if (scores.length === 0) return 0
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

/**
 * 计算等级与最终得分。
 *
 * 基础分 = 题一 × 0.4 + 题三 × 0.35 + 题四 × 0.25
 * 最终分 = 基础分 × 题二频率修正（0.8 / 1.0 / 1.2）
 * 区间映射：1.0~1.8→L1 1.9~2.6→L2 2.7~3.5→L3 3.6~4.3→L4 4.4~5.0→L5
 * 边界取高：落在两级边界之间（如 2.65~2.7 之间的空隙）时取较高等级。
 */
export function computeLevel(answers: AssessmentAnswers): { level: Level; score: number } {
  const s1 = q1Score(answers.q1_tools)
  const s3 = Q3_OPTIONS.find((o) => o.id === answers.q3_complexity)?.levelScore ?? 0
  const s4 = Q4_OPTIONS.find((o) => o.id === answers.q4_cognition)?.levelScore ?? 0
  const modifier = Q2_OPTIONS.find((o) => o.id === answers.q2_freq)?.modifier ?? 1.0

  const base = s1 * 0.4 + s3 * 0.35 + s4 * 0.25
  const score = base * modifier

  // 区间映射（文档 §3.4）。区间之间留有 0.1 的空隙（如 1.8~1.9），
  // 文档规定边界情况取较高等级，所以空隙内向上取。
  let level: Level
  if (score < 1.85) level = 'L1'
  else if (score < 2.65) level = 'L2'
  else if (score < 3.55) level = 'L3'
  else if (score < 4.35) level = 'L4'
  else level = 'L5'

  return { level, score: Math.round(score * 100) / 100 }
}

/**
 * 题五多选 → 场景列表（保持选择顺序），第一个为主场景。
 * 未选择 = 空数组（看所有场景的通用推荐）。
 */
export function computeScenes(answers: AssessmentAnswers): {
  scenes: SceneKey[]
  primaryScene: SceneKey | null
} {
  const scenes = answers.q5_goals
    .map((id) => Q5_OPTIONS.find((o) => o.id === id)?.scene)
    .filter((s): s is SceneKey => typeof s === 'string')
    .slice(0, MAX_SCENE_SELECT)
  return { scenes, primaryScene: scenes[0] ?? null }
}

/** 题五多选超限时：替换最早选中的（保持最多 3 个） */
export function toggleGoalSelection(current: string[], id: string): string[] {
  if (current.includes(id)) return current.filter((x) => x !== id)
  if (current.length >= MAX_SCENE_SELECT) return [...current.slice(1), id]
  return [...current, id]
}
