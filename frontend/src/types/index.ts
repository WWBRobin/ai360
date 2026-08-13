// Skill 卡片数据类型（对应 skill_cards_view 视图输出）
export interface SkillCard {
  id: number
  name: string
  slug: string
  tagline: string | null
  icon_url: string | null
  category: 'infrastructure' | 'scene' | 'efficiency'
  platform_name: string
  platform_slug: string
  api_supported: boolean
  overall_score: number | null
  difficulty_score: number | null
  stability_score: number | null
  evaluated_at: string | null
  free_quota: string | null
  trial_enabled: boolean
  install_url: string
  scenario_slugs: string[]
}

// Skill 详情（比卡片多字段，从 skills + evaluations + guides join 获取）
export interface SkillDetail {
  id: number
  name: string
  slug: string
  tagline: string | null
  description: string | null
  category: 'infrastructure' | 'scene' | 'efficiency'
  install_url: string
  icon_url: string | null
  developer_name: string | null
  version: string | null
  trial_enabled: boolean
  trial_config: any
  platform_name: string
  platform_slug: string
  platform_base_url: string | null
  platform_api_supported: boolean
  // 评测
  overall_score: number | null
  difficulty_score: number | null
  difficulty_notes: string | null
  stability_score: number | null
  stability_notes: string | null
  free_quota: string | null
  free_quota_score: number | null
  token_cost: string | null
  token_efficiency_score: number | null
  scenario_summary: string | null
  evaluation_method: string | null
  test_cases: string | null
  version_at_eval: string | null
  evaluated_at: string | null
  // 指南
  guide_content: string | null
  guide_difficulty: string | null
  // 替代
  alternatives?: AlternativeSkill[]
}

export interface AlternativeSkill {
  skill_id: number
  name: string
  slug: string
  tagline: string | null
  overall_score: number | null
  platform_name: string
}

// 同类对比表行（当前 skill + 替代品，统一字段，从 skill_cards_view 取全字段）
export interface CompareRow {
  slug: string
  name: string
  platform_name: string
  overall_score: number | null
  difficulty_score: number | null
  stability_score: number | null
  free_quota: string | null
  icon_url: string | null
  category: string
  tagline: string | null
  is_current?: boolean
}

// 平台
export interface Platform {
  id: number
  name: string
  slug: string
  description: string | null
  base_url: string | null
  api_supported: boolean
  skill_count: number
  logo_url: string | null
}

// 场景
export interface Scenario {
  id: number
  name: string
  slug: string
  icon: string | null
  parent_id: number | null
  skill_count?: number
}

// 试用请求
export interface TrialRequest {
  skill_id: number
  input_text: string
}

// 试用响应
export interface TrialResponse {
  success: boolean
  output?: string
  error?: string
  remaining_quota: number
  tokens_used?: number
}
