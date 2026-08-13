import HomePortal from '@/sections/HomePortal'
import { supabase } from '@/lib/supabase'
import type { SkillCard } from '@/types'

export const revalidate = 300

export default async function HomePage() {
  let totalCount = 0
  let platformCount = 0
  let sceneCounts: Record<string, number> = {}
  let skills: SkillCard[] = []

  try {
    // 取全部工具（用于首页筛选）
    const { data: skillData } = await supabase
      .from('skill_cards_view')
      .select('*')
      .order('overall_score', { ascending: false, nullsFirst: false })
      

    if (skillData) skills = skillData as unknown as SkillCard[]

    const { count } = await supabase
      .from('skill_cards_view')
      .select('id', { count: 'exact', head: true })
    if (count) totalCount = count

    const { count: pCount } = await supabase
      .from('platforms')
      .select('id', { count: 'exact', head: true })
    if (pCount) platformCount = pCount

    // 按场景统计
    const { data: sceneRows } = await supabase
      .from('skill_cards_view')
      .select('scenario_slugs')

    if (sceneRows) {
      for (const row of sceneRows) {
        for (const slug of (row.scenario_slugs || [])) {
          const key = String(slug)
          sceneCounts[key] = (sceneCounts[key] || 0) + 1
        }
      }
    }
  } catch {}

  return <HomePortal totalCount={totalCount} platformCount={platformCount} sceneCounts={sceneCounts} skills={skills} />
}
