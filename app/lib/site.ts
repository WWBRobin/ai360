import { supabase } from './supabase';

// ── 类型（与 database/init.sql 对齐） ──

export interface SkillCard {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  icon_url: string | null;
  category: 'infrastructure' | 'scene' | 'efficiency';
  platform_name: string;
  platform_slug: string;
  api_supported: boolean;
  overall_score: number | null;
  difficulty_score: number | null;
  stability_score: number | null;
  evaluated_at: string | null;
  free_quota: string | null;
  trial_enabled: boolean;
  install_url: string;
  scenario_slugs: string[];
}

export interface SkillDetail extends SkillCard {
  description: string | null;
  developer_name: string | null;
  version: string | null;
}

export interface Evaluation {
  scenario_summary: string | null;
  difficulty_score: number | null;
  difficulty_notes: string | null;
  stability_score: number | null;
  stability_notes: string | null;
  free_quota: string | null;
  token_cost: string | null;
  overall_score: number | null;
  evaluated_by: string | null;
  evaluated_at: string | null;
  test_cases: string | null;
}

export interface Guide {
  content: string;
  difficulty_level: string | null;
}

// ── 查询 ──

/** 首页卡片列表：单查询 skill_cards_view，按评分降序 */
export async function fetchSkillCards(): Promise<SkillCard[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('skill_cards_view')
    .select('*')
    .order('overall_score', { ascending: false, nullsFirst: false });
  if (error) {
    console.error('[site] fetchSkillCards 失败:', error.message);
    return [];
  }
  return (data || []) as SkillCard[];
}

/** Skill 详情页：Skill + 最新评测 + 使用指南 */
export async function fetchSkillDetail(slug: string): Promise<{
  skill: SkillDetail | null;
  evaluation: Evaluation | null;
  guide: Guide | null;
}> {
  if (!supabase) return { skill: null, evaluation: null, guide: null };

  const { data: skillRows } = await supabase
    .from('skill_cards_view')
    .select('*')
    .eq('slug', slug)
    .limit(1);
  if (!skillRows || skillRows.length === 0) return { skill: null, evaluation: null, guide: null };

  const skill = skillRows[0] as SkillDetail;
  const { data: description } = await supabase
    .from('skills')
    .select('description, developer_name, version')
    .eq('slug', slug)
    .single();
  if (description) {
    skill.description = description.description;
    skill.developer_name = description.developer_name;
    skill.version = description.version;
  }

  const { data: evaluation } = await supabase
    .from('evaluations')
    .select('*')
    .eq('skill_id', skill.id)
    .order('evaluated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: guide } = await supabase
    .from('guides')
    .select('content, difficulty_level')
    .eq('skill_id', skill.id)
    .limit(1)
    .maybeSingle();

  return {
    skill,
    evaluation: (evaluation as Evaluation | null) ?? null,
    guide: (guide as Guide | null) ?? null,
  };
}
