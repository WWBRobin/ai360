import Link from 'next/link'
import { notFound } from 'next/navigation'
import EvaluationForm from '@/components/admin/EvaluationForm'
import { supabase } from '@/lib/supabase'

export const metadata = {
  title: '编辑评测',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function EditEvaluationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const skillId = Number(id)
  if (!skillId) notFound()

  const { data: skill } = await supabase
    .from('skills')
    .select('id, name, version')
    .eq('id', skillId)
    .maybeSingle()

  if (!skill) notFound()

  // 取最新一条评测作为初始值
  const { data: eval0 } = await supabase
    .from('evaluations')
    .select('*')
    .eq('skill_id', skillId)
    .order('evaluated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800">
          ← 返回列表
        </Link>
        <h1 className="text-2xl font-bold mt-2">评测数据编辑</h1>
      </div>
      <EvaluationForm
        skillId={skill.id}
        skillName={skill.name}
        initial={
          eval0
            ? {
                scenario_summary: eval0.scenario_summary ?? '',
                difficulty_score: eval0.difficulty_score ?? '',
                difficulty_notes: eval0.difficulty_notes ?? '',
                stability_score: eval0.stability_score ?? '',
                stability_notes: eval0.stability_notes ?? '',
                free_quota: eval0.free_quota ?? '',
                free_quota_score: eval0.free_quota_score ?? '',
                token_cost: eval0.token_cost ?? '',
                token_efficiency_score: eval0.token_efficiency_score ?? '',
                overall_score: eval0.overall_score ?? '',
                evaluated_by: eval0.evaluated_by ?? '',
                evaluation_method: eval0.evaluation_method,
                test_cases: eval0.test_cases ?? '',
                version_at_eval: eval0.version_at_eval ?? skill.version ?? '',
              }
            : { version_at_eval: skill.version ?? '' }
        }
      />
    </div>
  )
}
