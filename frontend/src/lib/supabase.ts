import { createClient } from '@supabase/supabase-js'
import type { SkillCard, SkillDetail, Platform, Scenario, TrialResponse } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 环境变量未配置，请检查 .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
})

// ===== 查询函数 =====

// 首页：获取精选 Skill 卡片（最新评测的）
export async function getFeaturedSkills(limit = 6): Promise<SkillCard[]> {
  const { data, error } = await supabase
    .rpc('get_skill_cards', { p_limit: limit, p_offset: 0 })
  if (error) {
    console.error('getFeaturedSkills error:', error)
    return []
  }
  return data || []
}

// 按场景获取 Skill 列表
export async function getSkillsByScenario(scenarioSlug: string): Promise<SkillCard[]> {
  const { data, error } = await supabase
    .rpc('get_skill_cards_by_scenario', { p_scenario_slug: scenarioSlug })
  if (error) {
    console.error('getSkillsByScenario error:', error)
    return []
  }
  return data || []
}

// 按平台获取 Skill 列表
export async function getSkillsByPlatform(platformSlug: string): Promise<SkillCard[]> {
  const { data, error } = await supabase
    .rpc('get_skill_cards_by_platform', { p_platform_slug: platformSlug })
  if (error) {
    console.error('getSkillsByPlatform error:', error)
    return []
  }
  return data || []
}

// 按分类获取（装机必备/场景应用/效率工具）
export async function getSkillsByCategory(category: string): Promise<SkillCard[]> {
  const { data, error } = await supabase
    .rpc('get_skill_cards_by_category', { p_category: category })
  if (error) {
    console.error('getSkillsByCategory error:', error)
    return []
  }
  return data || []
}

// 搜索 Skill
export async function searchSkills(query: string): Promise<SkillCard[]> {
  const { data, error } = await supabase
    .rpc('search_skill_cards', { p_query: query })
  if (error) {
    console.error('searchSkills error:', error)
    return []
  }
  return data || []
}

// 获取 Skill 详情
export async function getSkillDetail(slug: string): Promise<SkillDetail | null> {
  const { data: skill, error } = await supabase
    .from('skills')
    .select(`
      *,
      platforms (name, slug, base_url, api_supported),
      evaluations (
        scenario_summary, difficulty_score, difficulty_notes,
        stability_score, stability_notes, free_quota, token_cost,
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

  return {
    ...flattenSkill(skill),
    alternatives: alternatives || [],
  } as SkillDetail
}

// 批量获取多个 Skill 详情（对比页用，避免 N 次单查）
export async function getSkillDetailsBySlugs(slugs: string[]): Promise<SkillDetail[]> {
  if (slugs.length === 0) return []
  // 去重 + 最多 3 个（对比页上限）
  const unique = Array.from(new Set(slugs.filter(Boolean))).slice(0, 3)

  const { data, error } = await supabase
    .from('skills')
    .select(`
      *,
      platforms (name, slug, base_url, api_supported),
      evaluations (
        scenario_summary, difficulty_score, difficulty_notes,
        stability_score, stability_notes, free_quota, token_cost,
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
}

// 获取所有平台
export async function getPlatforms(): Promise<Platform[]> {
  const { data, error } = await supabase
    .from('platforms')
    .select('*')
    .order('sort_order')
  if (error) return []
  return data || []
}

// 获取场景树
export async function getScenarios(parentSlug?: string): Promise<Scenario[]> {
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
  infra: '装机必备',
  scene: '场景应用',
  efficiency: '效率工具',
}

// 分类图标
export const CATEGORY_ICONS: Record<string, string> = {
  infra: '🔧',
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
    token_cost: eval0.token_cost || null,
    scenario_summary: eval0.scenario_summary || null,
    evaluation_method: eval0.evaluation_method || null,
    test_cases: eval0.test_cases || null,
    version_at_eval: eval0.version_at_eval || null,
    evaluated_at: eval0.evaluated_at || null,
    guide_content: guide0.content || null,
    guide_difficulty: guide0.difficulty_level || null,
  }
}
