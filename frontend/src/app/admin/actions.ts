'use server'

/**
 * 管理后台 Server Actions。
 *
 * 全部用 supabaseAdmin（service_role，绕过 RLS）写入。
 * service_role key 仅在服务端可见，浏览器永远拿不到。
 *
 * 注意：MVP 阶段不做认证，靠路由隐藏。任何人拿到 /admin 都能操作，
 * 上线前必须加 auth（见文末 TODO）。
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ===== 类型 =====

export interface SkillFormInput {
  name: string
  slug: string
  tagline?: string
  description?: string
  category: 'infrastructure' | 'scene' | 'efficiency'
  platform_id: number | ''
  install_url: string
  icon_url?: string
  developer_name?: string
  version?: string
  status: 'published' | 'draft' | 'archived'
  trial_enabled: boolean
  trial_config?: string // JSON 字符串
  scenario_ids: number[]
}

export interface EvaluationFormInput {
  skill_id: number
  scenario_summary?: string // Q1 解决什么场景
  difficulty_score: number | '' // Q2 上手难度 1-5
  difficulty_notes?: string
  stability_score: number | '' // Q3 稳定性 1-5
  stability_notes?: string
  free_quota?: string // Q4 免费额度
  free_quota_score?: number | '' // Q4 数值化 1-5
  token_cost?: string // Q5 Token 成本
  token_efficiency_score?: number | '' // Q5 数值化 1-5
  overall_score?: number | ''
  evaluated_by?: string
  evaluation_method?: 'ai_first' | 'manual'
  test_cases?: string // JSON 字符串
  version_at_eval?: string
}

// ===== 工具：计算综合评分 =====
// 规则（init.sql 注释）：0.2*difficulty + 0.4*stability + 0.2*free_quota + 0.2*token_eff
function computeOverall(input: EvaluationFormInput): number | undefined {
  const d = numOrNull(input.difficulty_score)
  const s = numOrNull(input.stability_score)
  const f = numOrNull(input.free_quota_score)
  const t = numOrNull(input.token_efficiency_score)
  if (d == null || s == null || f == null || t == null) return undefined
  return Math.round((0.2 * d + 0.4 * s + 0.2 * f + 0.2 * t) * 10) / 10
}

function numOrNull(v: number | '' | undefined | null): number | null {
  if (v === '' || v === undefined || v === null) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

// ===== Skill 写操作 =====

export async function createSkill(input: SkillFormInput) {
  const trialConfig = input.trial_config
    ? safeJsonParse(input.trial_config)
    : null

  const { data, error } = await supabaseAdmin
    .from('skills')
    .insert({
      name: input.name,
      slug: input.slug,
      tagline: input.tagline || null,
      description: input.description || null,
      category: input.category,
      platform_id: input.platform_id === '' ? null : Number(input.platform_id),
      install_url: input.install_url,
      icon_url: input.icon_url || null,
      developer_name: input.developer_name || null,
      version: input.version || null,
      status: input.status,
      trial_enabled: input.trial_enabled,
      trial_config: trialConfig,
      last_updated: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }

  // 关联场景
  if (input.scenario_ids.length > 0) {
    const rows = input.scenario_ids.map((sid) => ({
      skill_id: data.id,
      scenario_id: sid,
    }))
    const { error: linkErr } = await supabaseAdmin
      .from('skill_scenarios')
      .insert(rows)
    if (linkErr) {
      return {
        ok: false,
        error: `Skill 已创建，但场景关联失败：${linkErr.message}`,
      }
    }
  }

  revalidatePath('/admin')
  redirect('/admin')
}

export async function updateSkill(id: number, input: SkillFormInput) {
  const trialConfig = input.trial_config
    ? safeJsonParse(input.trial_config)
    : null

  const { error } = await supabaseAdmin
    .from('skills')
    .update({
      name: input.name,
      slug: input.slug,
      tagline: input.tagline || null,
      description: input.description || null,
      category: input.category,
      platform_id: input.platform_id === '' ? null : Number(input.platform_id),
      install_url: input.install_url,
      icon_url: input.icon_url || null,
      developer_name: input.developer_name || null,
      version: input.version || null,
      status: input.status,
      trial_enabled: input.trial_enabled,
      trial_config: trialConfig,
      last_updated: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  // 场景关联：先删后插
  await supabaseAdmin.from('skill_scenarios').delete().eq('skill_id', id)
  if (input.scenario_ids.length > 0) {
    const rows = input.scenario_ids.map((sid) => ({
      skill_id: id,
      scenario_id: sid,
    }))
    const { error: linkErr } = await supabaseAdmin
      .from('skill_scenarios')
      .insert(rows)
    if (linkErr) {
      return {
        ok: false,
        error: `Skill 已更新，但场景关联失败：${linkErr.message}`,
      }
    }
  }

  revalidatePath('/admin')
  redirect('/admin')
}

export async function deleteSkill(formData: FormData) {
  const id = Number(formData.get('id'))
  if (!id) return { ok: false, error: '缺少 id' }

  const { error } = await supabaseAdmin.from('skills').delete().eq('id', id)
  if (error) {
    return { ok: false, error: error.message }
  }
  revalidatePath('/admin')
  redirect('/admin')
}

// ===== 评测写操作（upsert：每个 skill 取一条评测行，简化管理）=====

export async function upsertEvaluation(input: EvaluationFormInput) {
  const overall = numOrNull(input.overall_score) ?? computeOverall(input)

  const payload = {
    skill_id: input.skill_id,
    scenario_summary: input.scenario_summary || null,
    difficulty_score: numOrNull(input.difficulty_score),
    difficulty_notes: input.difficulty_notes || null,
    stability_score: numOrNull(input.stability_score),
    stability_notes: input.stability_notes || null,
    free_quota: input.free_quota || null,
    free_quota_score: numOrNull(input.free_quota_score),
    token_cost: input.token_cost || null,
    token_efficiency_score: numOrNull(input.token_efficiency_score),
    overall_score: overall,
    evaluated_by: input.evaluated_by || '管理员',
    evaluation_method: input.evaluation_method || 'ai_first',
    test_cases: input.test_cases || null,
    version_at_eval: input.version_at_eval || null,
    evaluated_at: new Date().toISOString(),
  }

  // 查是否已有评测
  const { data: existing } = await supabaseAdmin
    .from('evaluations')
    .select('id')
    .eq('skill_id', input.skill_id)
    .order('evaluated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let error
  if (existing?.id) {
    ;({ error } = await supabaseAdmin
      .from('evaluations')
      .update(payload)
      .eq('id', existing.id))
  } else {
    ;({ error } = await supabaseAdmin.from('evaluations').insert(payload))
  }

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin')
  redirect('/admin')
}

// ===== 工具 =====

function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s)
  } catch {
    return s
  }
}
