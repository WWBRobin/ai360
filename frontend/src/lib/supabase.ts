import { createClient } from '@supabase/supabase-js'
import type { SkillCard, SkillDetail, Platform, Scenario, TrialResponse } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 环境变量未配置，请检查 .env.local')
}

// 网络请求超时上限（毫秒）。ECS→Supabase 跨境网络不稳，构建/ISR 预渲染时若拉取挂起，
// 超过该阈值即中断并走降级空态，避免「60s 挂起 × 重试」拖垮 next build。
// 常规查询（rpc/select）均为毫秒级，15s 上限足够宽裕。
const FETCH_TIMEOUT_MS = 15000

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  global: { fetch: fetchWithTimeout },
})

// ===== 查询函数 =====
// 说明：所有服务端读查询都不允许 throw（尤其 build 预渲染阶段），
// 网络失败/超时/`.single()` 的 rethrow 一律降级为空数组 / null / 0，
// 由页面渲染空态；运行时 ISR 会按 revalidate 重试拉取。

// 首页：获取精选 Skill 卡片（最新评测的）
export async function getFeaturedSkills(limit = 6): Promise<SkillCard[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_skill_cards', { p_limit: limit, p_offset: 0 })
    if (error) {
      console.error('getFeaturedSkills error:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.warn('[build-degrade] getFeaturedSkills 拉取失败，降级空数组', err)
    return []
  }
}

// 按场景获取 Skill 列表
export async function getSkillsByScenario(scenarioSlug: string): Promise<SkillCard[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_skill_cards_by_scenario', { p_scenario_slug: scenarioSlug })
    if (error) {
      console.error('getSkillsByScenario error:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.warn('[build-degrade] getSkillsByScenario 拉取失败，降级空数组', err)
    return []
  }
}

// 按平台获取 Skill 列表（Bug2: 支持分页，limit=0 返回全部）
export async function getSkillsByPlatform(platformSlug: string, limit: number = 0, offset: number = 0): Promise<SkillCard[]> {
  try {
    const params: Record<string, unknown> = { p_platform_slug: platformSlug }
    if (limit > 0) {
      params.p_limit = limit
      params.p_offset = offset
    }
    const { data, error } = await supabase
      .rpc('get_skill_cards_by_platform', params)
    if (error) {
      console.error('getSkillsByPlatform error:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.warn('[build-degrade] getSkillsByPlatform 拉取失败，降级空数组', err)
    return []
  }
}

// 按平台获取 Skill 总数（分页用，通过视图计数）
export async function getSkillsCountByPlatform(platformSlug: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('skill_cards_view')
      .select('id', { count: 'exact', head: true })
      .eq('platform_slug', platformSlug)
    if (error) {
      console.error('getSkillsCountByPlatform error:', error)
      return 0
    }
    return count ?? 0
  } catch (err) {
    console.warn('[build-degrade] getSkillsCountByPlatform 拉取失败，降级 0', err)
    return 0
  }
}

// 按分类获取（装机必备/场景应用/效率工具）
export async function getSkillsByCategory(category: string): Promise<SkillCard[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_skill_cards_by_category', { p_category: category })
    if (error) {
      console.error('getSkillsByCategory error:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.warn('[build-degrade] getSkillsByCategory 拉取失败，降级空数组', err)
    return []
  }
}

// 搜索 Skill
export async function searchSkills(query: string): Promise<SkillCard[]> {
  try {
    const { data, error } = await supabase
      .rpc('search_skill_cards', { p_query: query })
    if (error) {
      console.error('searchSkills error:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.warn('[build-degrade] searchSkills 拉取失败，降级空数组', err)
    return []
  }
}

// 按 slug 批量获取 Skill 卡片（对比表 / 替代品需要 difficulty/stability/free_quota 等全字段）
export async function getSkillCardsBySlugs(slugs: string[]): Promise<SkillCard[]> {
  if (!slugs.length) return []
  const unique = Array.from(new Set(slugs.filter(Boolean)))
  try {
    const { data, error } = await supabase
      .from('skill_cards_view')
      .select('*')
      .in('slug', unique)
    if (error) {
      console.error('getSkillCardsBySlugs error:', error)
      return []
    }
    return (data || []) as unknown as SkillCard[]
  } catch (err) {
    console.warn('[build-degrade] getSkillCardsBySlugs 拉取失败，降级空数组', err)
    return []
  }
}

// 获取 Skill 详情
export async function getSkillDetail(slug: string): Promise<SkillDetail | null> {
  try {
    const { data: skill, error } = await supabase
      .from('skills')
      .select(`
        *,
        platforms (name, slug, base_url, api_supported),
        evaluations (
          scenario_summary, difficulty_score, difficulty_notes,
          stability_score, stability_notes, free_quota, free_quota_score,
          token_cost, token_efficiency_score,
          overall_score, evaluation_method, test_cases, version_at_eval, evaluated_at
        ),
        guides (content, difficulty_level)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .order('evaluated_at', { foreignTable: 'evaluations', ascending: false })
      .limit(1, { foreignTable: 'evaluations' })
      .single()

    if (error || !skill) {
      console.error('getSkillDetail error:', error)
      return null
    }

    // 获取同类替代
    const { data: alternatives } = await supabase
      .rpc('get_skill_alternatives', { p_skill_slug: slug })

    // 获取该 Skill 关联的场景 slug（用于相关文章匹配等）
    let scenarioSlugs: string[] = []
    try {
      const { data: sc } = await supabase
        .from('skill_scenarios')
        .select('scenarios(slug)')
        .eq('skill_id', skill.id)
      scenarioSlugs = (sc || [])
        .map((r: any) => r.scenarios?.slug)
        .filter(Boolean)
    } catch {
      /* 静默降级：没有场景也能渲染 */
    }

    return {
      ...flattenSkill(skill),
      scenario_slugs: scenarioSlugs,
      alternatives: alternatives || [],
    } as SkillDetail
  } catch (err) {
    // `.single()` 在无行/多行或网络失败时会 throw，必须兜住，否则 build 预渲染会炸
    console.warn('[build-degrade] getSkillDetail 拉取失败，降级 null', err)
    return null
  }
}

// 批量获取多个 Skill 详情（对比页用，避免 N 次单查）
export async function getSkillDetailsBySlugs(slugs: string[]): Promise<SkillDetail[]> {
  if (slugs.length === 0) return []
  // 去重 + 最多 3 个（对比页上限）
  const unique = Array.from(new Set(slugs.filter(Boolean))).slice(0, 3)

  try {
    const { data, error } = await supabase
      .from('skills')
      .select(`
        *,
        platforms (name, slug, base_url, api_supported),
        evaluations (
          scenario_summary, difficulty_score, difficulty_notes,
          stability_score, stability_notes, free_quota, free_quota_score,
          token_cost, token_efficiency_score,
          overall_score, evaluation_method, test_cases, version_at_eval, evaluated_at
        ),
        guides (content, difficulty_level)
      `)
      .in('slug', unique)
      .eq('status', 'published')
      .order('evaluated_at', { foreignTable: 'evaluations', ascending: false })
      .limit(1, { foreignTable: 'evaluations' })

    if (error || !data) {
      console.error('getSkillDetailsBySlugs error:', error)
      return []
    }

    return data.map((s) => flattenSkill(s)) as SkillDetail[]
  } catch (err) {
    console.warn('[build-degrade] getSkillDetailsBySlugs 拉取失败，降级空数组', err)
    return []
  }
}

// 获取所有平台
export async function getPlatforms(): Promise<Platform[]> {
  try {
    const { data, error } = await supabase
      .from('platforms')
      .select('*')
      .order('sort_order')
    if (error) return []
    return data || []
  } catch (err) {
    console.warn('[build-degrade] getPlatforms 拉取失败，降级空数组', err)
    return []
  }
}

// 获取场景树
export async function getScenarios(parentSlug?: string): Promise<Scenario[]> {
  try {
    let query = supabase.from('scenarios').select('*').order('sort_order')
    if (parentSlug) {
      const { data: parent } = await supabase
        .from('scenarios')
        .select('id')
        .eq('slug', parentSlug)
        .single()
      if (parent) query = query.eq('parent_id', parent.id)
    } else {
      query = query.is('parent_id', null)
    }
    const { data, error } = await query
    if (error) return []
    return data || []
  } catch (err) {
    console.warn('[build-degrade] getScenarios 拉取失败，降级空数组', err)
    return []
  }
}

// 查全部场景（含子场景），用于场景详情页的中文名映射
export async function getAllScenarios(): Promise<Scenario[]> {
  try {
    const { data, error } = await supabase.from('scenarios').select('*').order('sort_order')
    if (error) return []
    return data || []
  } catch (err) {
    console.warn('[build-degrade] getAllScenarios 拉取失败，降级空数组', err)
    return []
  }
}

// 试用 API
export async function trialSkill(skillId: number, inputText: string): Promise<TrialResponse> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_TRIAL_API_URL || ''
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill_id: skillId, input_text: inputText }),
    })
    return await res.json()
  } catch (err) {
    return { success: false, error: '试用服务暂时不可用', remaining_quota: 0 }
  }
}

// ===== 工具函数 =====

// 评分转星星
export function scoreToStars(score: number | null): string {
  if (!score) return '暂无'
  return '⭐'.repeat(Math.round(score)) + '☆'.repeat(5 - Math.round(score))
}

// 分类标签
export const CATEGORY_LABELS: Record<string, string> = {
  infrastructure: '装机必备',
  scene: '场景应用',
  efficiency: '效率工具',
}

// 分类图标
export const CATEGORY_ICONS: Record<string, string> = {
  infrastructure: '🔧',
  scene: '🎯',
  efficiency: '⚡',
}

// 场景图标映射
export const SCENARIO_ICONS: Record<string, string> = {
  'memory': '🧠',
  'search': '🔍',
  'file': '📁',
  'code': '💻',
  'connect': '🔗',
  'document': '📄',
  'ecommerce-copy': '🛍️',
  'content-creation': '📝',
  'data-analysis': '📊',
  'office': '💼',
  'design': '🎨',
  'video': '📹',
  'hr': '👤',
  'legal': '⚖️',
  'research': '🔬',
  'model-router': '🔀',
  'automation': '🤖',
  'ui-design': '🎨',
  'token-saving': '💰',
  'security': '🛡️',
}

// ===== 订阅相关 =====

// 提交邮箱订阅（简单收集，不做双重确认）
// 返回 { success: boolean, error?: string }
export async function subscribeEmail(email: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('subscribers')
    .upsert({ email: email.trim(), source: 'website' }, { onConflict: 'email' })
  if (error) {
    return { success: false, error: '订阅暂时不可用，请稍后再试' }
  }
  return { success: true }
}

// 安全数值化：null/undefined/空串 -> null
function numOr(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

// flatten helper
function flattenSkill(raw: any): any {
  const platform = raw.platforms || {}
  const eval0 = (raw.evaluations || [])[0] || {}
  const guide0 = (raw.guides || [])[0] || {}
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    tagline: raw.tagline,
    description: raw.description,
    category: raw.category,
    category_label: CATEGORY_LABELS[raw.category] || raw.category,
    install_url: raw.install_url,
    icon_url: raw.icon_url,
    developer_name: raw.developer_name,
    version: raw.version,
    trial_enabled: raw.trial_enabled,
    platform_name: platform.name || '',
    platform_slug: platform.slug || '',
    overall_score: eval0.overall_score || null,
    difficulty_score: eval0.difficulty_score || null,
    difficulty_notes: eval0.difficulty_notes || null,
    stability_score: eval0.stability_score || null,
    stability_notes: eval0.stability_notes || null,
    free_quota: eval0.free_quota || null,
    free_quota_score: numOr(eval0.free_quota_score),
    token_cost: eval0.token_cost || null,
    token_efficiency_score: numOr(eval0.token_efficiency_score),
    scenario_summary: eval0.scenario_summary || null,
    evaluation_method: eval0.evaluation_method || null,
    test_cases: eval0.test_cases || null,
    version_at_eval: eval0.version_at_eval || null,
    evaluated_at: eval0.evaluated_at || null,
    guide_content: guide0.content || null,
    guide_difficulty: guide0.difficulty_level || null,
  }
}
