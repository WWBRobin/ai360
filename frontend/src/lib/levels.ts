/**
 * L1-L5 等级统一映射层（展示 + 智能筛选共用）
 *
 * 等级体系（与 /assessment 的 Level 一致）：
 * - L1 一看就会 / L2 简单配置 / L3 需要理解工作流 / L4 需要技术基础 / L5 需要开发能力
 *
 * 同时承担老 3 级难度（beginner/intermediate/advanced）→ L 档的展示映射，
 * 老 difficulty_score 1-5 数值语义不变，只换展示层。
 */

import type { Level } from './assessment'
import type { Difficulty } from './learn-paths'

/** 全部等级（有序） */
export const LEVELS: Level[] = ['L1', 'L2', 'L3', 'L4', 'L5']

/** 5 档难度标签（展示层统一文案） */
export const LEVEL_DIFFICULTY_META: Record<Level, { label: string; icon: string; short: string }> = {
  L1: { label: '一看就会', icon: '🌱', short: '零基础' },
  L2: { label: '简单配置', icon: '🌿', short: '填参数即可' },
  L3: { label: '需要理解工作流', icon: '🍃', short: '要有概念' },
  L4: { label: '需要技术基础', icon: '⚙️', short: '懂 API 更佳' },
  L5: { label: '需要开发能力', icon: '🛠️', short: '面向开发者' },
}

/** 'L1'~'L5' → 1~5；非法值返回 null */
export function levelToNumber(level: string | null | undefined): number | null {
  if (typeof level !== 'string') return null
  const m = /^L([1-5])$/.exec(level.trim().toUpperCase())
  return m ? Number(m[1]) : null
}

/** 数值 1~5 → Level；越界取边界 */
export function numberToLevel(n: number): Level {
  if (n <= 1) return 'L1'
  if (n >= 5) return 'L5'
  return `L${Math.round(n)}` as Level
}

/** 老 difficulty_score（1-5，分值越高越易用）→ L 档（展示用） */
export function difficultyScoreToLevel(score: number | null | undefined): Level | null {
  if (score == null) return null
  // 1=最难（L5 侧）5=最易（L1 侧）
  return numberToLevel(6 - score)
}

/** 老 3 级难度 → L 档区间（展示用，路径数据不改） */
export const DIFFICULTY_LEVEL_RANGE: Record<Difficulty, { range: string; label: string }> = {
  beginner: { range: 'L1-L2', label: '一看就会 · 简单配置' },
  intermediate: { range: 'L3', label: '需要理解工作流' },
  advanced: { range: 'L4-L5', label: '需要技术基础 · 开发能力' },
}

// ============================================================
// 智能筛选（v3.0 §5.2/5.3 精简版）— 纯函数
// ============================================================

export type FitKind = 'fit' | 'challenge' | 'later'

export interface FitResult {
  kind: FitKind
  /** 适配分：区间内 100 / 差一级 70 / 差两级 30 / 差>两级 10 / 低于区间 50 */
  adaptScore: number
}

/**
 * 计算用户等级与工具标注区间的适配关系。
 * - 未标注（level_min 为空或非法）→ null：不标记、不参与排序调整
 * - level_min ≤ userLevel ≤ level_optimal → 'fit'（✅ 适合你）
 * - userLevel + 1 = level_min → 'challenge'（⬆️ 进阶挑战）
 * - userLevel + 2 ≤ level_min → 'later'（🔒 建议稍后）
 * - userLevel > level_optimal（用户高于区间）→ 无标记，适配分 50
 */
export function fitSkill(
  userLevel: Level,
  skill: { level_min?: string | null; level_optimal?: string | null }
): FitResult | null {
  const u = levelToNumber(userLevel)
  const min = levelToNumber(skill.level_min)
  if (u == null || min == null) return null
  const opt = levelToNumber(skill.level_optimal) ?? min

  if (u >= min && u <= opt) return { kind: 'fit', adaptScore: 100 }
  if (u > opt) return { kind: 'fit', adaptScore: 50 } // 低于用户区间：可用但不加分，无标记
  const gap = min - u
  if (gap === 1) return { kind: 'challenge', adaptScore: 70 }
  return { kind: 'later', adaptScore: gap === 2 ? 30 : 10 }
}

/**
 * 智能排序：最终分 = 适配分×0.5 + 热度分×0.3（热度 = overall_score×20，归一化 0-100）。
 * 未标注卡片不参与适配调整：排序键只取热度分（等价于保持 overall_score 原序，不被惩罚），
 * 已标注卡片在其基础上叠加适配分。返回排序后的新数组。
 */
export function sortBySmartFit<T extends { level_min?: string | null; level_optimal?: string | null; overall_score: number | null }>(
  skills: T[],
  userLevel: Level
): T[] {
  const scored = skills.map((s) => {
    const fit = fitSkill(userLevel, s)
    const heat = Math.max(0, Math.min(100, (s.overall_score ?? 0) * 20))
    const key = fit ? fit.adaptScore * 0.5 + heat * 0.3 : heat * 0.3
    return { s, key }
  })
  return scored
    .sort((a, b) => b.key - a.key)
    .map((x) => x.s)
}

/** localStorage key（沿用 arcdock-* 前缀约定） */
export const LEVEL_FILTER_STORAGE_KEY = 'arcdock-level-filter'
