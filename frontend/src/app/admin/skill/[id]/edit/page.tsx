import Link from 'next/link'
import { notFound } from 'next/navigation'
import SkillForm from '@/components/admin/SkillForm'
import { supabase } from '@/lib/supabase'

export const metadata = {
  title: '编辑 Skill',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function EditSkillPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const skillId = Number(id)
  if (!skillId) notFound()

  const { data: skill } = await supabase
    .from('skills')
    .select('*')
    .eq('id', skillId)
    .maybeSingle()

  if (!skill) notFound()

  const { data: platforms } = await supabase
    .from('platforms')
    .select('id, name, slug, description, base_url, api_supported, skill_count, logo_url, sort_order')
    .order('sort_order')

  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('id, name, slug, icon, parent_id, sort_order')
    .order('sort_order')

  // 已关联的场景 id
  const { data: linked } = await supabase
    .from('skill_scenarios')
    .select('scenario_id')
    .eq('skill_id', skillId)
  const scenarioIds = (linked || []).map((r) => r.scenario_id)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800">
          ← 返回列表
        </Link>
        <h1 className="text-2xl font-bold mt-2">
          编辑 Skill：<span className="text-gray-600">{skill.name}</span>
        </h1>
      </div>
      <SkillForm
        platforms={platforms || []}
        scenarios={scenarios || []}
        initialScenarioIds={scenarioIds}
        initial={{
          id: skill.id,
          name: skill.name,
          slug: skill.slug,
          tagline: skill.tagline ?? '',
          description: skill.description ?? '',
          category: skill.category,
          platform_id: skill.platform_id ?? '',
          install_url: skill.install_url ?? '',
          icon_url: skill.icon_url ?? '',
          developer_name: skill.developer_name ?? '',
          version: skill.version ?? '',
          status: skill.status,
          trial_enabled: skill.trial_enabled,
          trial_config: skill.trial_config
            ? JSON.stringify(skill.trial_config, null, 2)
            : '',
          scenario_ids: scenarioIds,
        }}
      />
    </div>
  )
}
