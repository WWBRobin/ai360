/**
 * 装备数据层 —— 管家最小版（/equipment「我的装备」资产台）
 *
 * 数据来源现实（任务书 A.3）：
 *   陪跑 P0 写 localStorage `arcdock-install-plan`，DB equipment_items 表当前为空。
 *   管家 v1 数据 = localStorage 装机记录解析 + DB 查询合并（DB 空则纯 localStorage 渲染）。
 *   登录用户未来写库后，getMyEquipment 直接命中。
 *
 * 容错纪律（照抄 supabase.ts）：所有查询 try-catch + build-degrade 降级，不 throw。
 */

import { supabase } from './supabase'
import { INSTALL_ITEMS } from './install-seed'
import softwareCards from './software-cards.json'

/* ================= 类型 ================= */

/** 产品分组（任务书 B 四组：软件/助手/Skill/订阅）。v1 先支持 software+assistant。 */
export type EquipmentGroup = 'software' | 'assistant' | 'skill' | 'subscription'

export interface EquipmentItem {
  slug: string
  name: string
  group: EquipmentGroup
  /** installed=已装 | needs_repair=待修（v1 localStorage 只有已装，待修来自 DB health_score 或未来体检） */
  status: 'installed' | 'needs_repair'
  /** 是否已点亮（装机完成=点亮能力；v1 done 装备均 lit） */
  lit: boolean
  score?: number
  level?: string
  why?: string
  firstOutput?: string
  /** 「去使用」地址（外链工具官方入口） */
  useUrl?: string
  /** 体检健康分 0-100，null=未体检（数据少时总览条隐藏健康分） */
  healthScore?: number | null
}

/** 组标签（中文显示） */
export const GROUP_LABELS: Record<EquipmentGroup, string> = {
  software: '软件',
  assistant: '助手',
  skill: 'Skill',
  subscription: '订阅',
}

/** 组渲染顺序 */
export const GROUP_ORDER: EquipmentGroup[] = ['software', 'assistant', 'skill', 'subscription']

/* ================= slug → 元数据映射 ================= */

// localStorage 装机记录（INSTALL_ITEMS）的 slug → 产品分组。
// INSTALL_ITEMS 无 type 字段，此处按产品四组口径手工归类（仅覆盖 P0 5 工具）。
const SLUG_GROUP: Record<string, EquipmentGroup> = {
  'arcdock-relay': 'software', // 中转站 = 软件服务
  coze: 'software', // 工作台
  doubao: 'assistant', // AI 助手
  kimi: 'assistant', // AI 助手
  'tongyi-wanxiang': 'software', // 生图工具
}

// slug → 「去使用」地址。地址来自 install-seed 的 guide 文案 + 19平台数据，非臆造。
const SLUG_USE_URL: Record<string, string> = {
  'arcdock-relay': 'https://api.vokki.cn',
  coze: 'https://www.coze.cn/',
  doubao: 'https://www.doubao.com/',
  kimi: 'https://kimi.moonshot.cn/',
  'tongyi-wanxiang': 'https://tongyi.aliyun.com/wanxiang',
}

/* ================= 19平台软件卡（该换没换数据源） ================= */

interface SoftwareCard {
  id: string
  name: string
  layer: 'workbench' | 'assistant'
  one_liner: string
  rating: number
  free_tier: string
  price: string
  region: string
  proxy_needed: boolean
  install_minutes: number
  entry_level: string
  category: string
  install_url: string
  why_recommended: string
  evidence: string
  estimated: boolean
  updated_at: string
}

const SOFTWARE_CARDS = (softwareCards as { software_cards: SoftwareCard[] }).software_cards

/* ================= DB 查询（服务端，build 预渲染安全） ================= */

// DB equipment_items.type 枚举 → 产品分组。DB 无 assistant 枚举，助手类仅来自 localStorage 映射。
const DB_TYPE_TO_GROUP: Record<string, EquipmentGroup> = {
  software: 'software',
  skill: 'skill',
  mcp: 'software',
  model_key: 'software',
  memory: 'software',
  subscription: 'subscription',
}

function mapDbRowToEquipment(row: Record<string, unknown>): EquipmentItem {
  const meta = (row.meta as Record<string, unknown>) || {}
  const status = row.status === 'needs_repair' ? 'needs_repair' : 'installed'
  const healthScore = typeof row.health_score === 'number' ? row.health_score : null
  return {
    slug: (meta.skill_slug as string) || (meta.slug as string) || `db-${row.id}`,
    name: row.name as string,
    group: DB_TYPE_TO_GROUP[row.type as string] || 'software',
    status,
    lit: status === 'installed',
    healthScore,
    useUrl: (meta.install_url as string) || (meta.use_url as string) || undefined,
    score: typeof meta.score === 'number' ? meta.score : undefined,
  }
}

/**
 * 查询我的装备（DB equipment_items）。
 * v1：DB 表为空，数据在 localStorage；此查询为「登录用户写库」预留，build 预渲染无 session，
 * anon client 只能查匿名行（user_id is null，RLS 允许）→ 必然空。登录态未来经 server client 接入。
 */
export async function getMyEquipment(): Promise<EquipmentItem[]> {
  try {
    const { data, error } = await supabase.from('equipment_items').select('*').is('user_id', null)
    if (error) {
      console.error('getMyEquipment error:', error)
      return []
    }
    return (data || []).map(mapDbRowToEquipment)
  } catch (err) {
    console.warn('[build-degrade] getMyEquipment 拉取失败，降级空数组', err)
    return []
  }
}

/* ================= localStorage 装机记录解析（纯函数，可测试） ================= */

/** arcdock-install-plan 的 PlanState 结构（与 install/InstallClient.tsx 对齐） */
export interface InstallPlanState {
  scenario: string
  items: Record<string, { status: string; currentStep: number }>
  order: string[]
  removed: string[]
}

/**
 * 由装机单状态解析已装装备（只取 status === 'done' 的项）。
 * 纯函数，不碰 window，服务端/客户端/测试均可调用。
 */
export function buildEquipmentFromInstallPlan(plan: InstallPlanState | null): EquipmentItem[] {
  if (!plan || !Array.isArray(plan.order) || plan.order.length === 0) return []
  const result: EquipmentItem[] = []
  for (const slug of plan.order) {
    const prog = plan.items?.[slug]
    if (!prog || prog.status !== 'done') continue
    const meta = INSTALL_ITEMS.find((i) => i.slug === slug)
    if (!meta) continue
    result.push({
      slug,
      name: meta.name,
      group: SLUG_GROUP[slug] ?? 'software',
      status: 'installed',
      lit: true,
      score: meta.score,
      level: meta.level,
      why: meta.why,
      firstOutput: meta.firstOutput,
      useUrl: SLUG_USE_URL[slug],
      healthScore: null,
    })
  }
  return result
}

/* ================= 该换没换（装备优化 · 变现通道 §9.3） ================= */

export interface SwapRecommendation {
  lowName: string
  lowRating: number
  betterName: string
  betterRating: number
  betterUrl: string
}

/**
 * 读 19平台软件卡数据里 rating<4.0 的平台；若用户已装其中某个，推荐同层（layer）评分更高的替代。
 * v1 数据不足（INSTALL_ITEMS 无 rating<4.0 平台）→ 恒返回空，由 UI 整块隐藏，不留空壳。
 */
export function getSwapRecommendations(installedSlugs: string[]): SwapRecommendation[] {
  const slugSet = new Set(installedSlugs)
  const lowRated = SOFTWARE_CARDS.filter((c) => c.rating < 4.0)
  const result: SwapRecommendation[] = []
  for (const low of lowRated) {
    if (!slugSet.has(low.id)) continue
    const better = SOFTWARE_CARDS.filter((c) => c.layer === low.layer && c.id !== low.id)
      .sort((a, b) => b.rating - a.rating)[0]
    if (!better || better.rating <= low.rating) continue
    result.push({
      lowName: low.name,
      lowRating: low.rating,
      betterName: better.name,
      betterRating: better.rating,
      betterUrl: better.install_url,
    })
  }
  return result
}
