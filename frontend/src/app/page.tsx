import HomePortal from '@/sections/HomePortal'
import { supabase } from '@/lib/supabase'

export const revalidate = 300

export default async function HomePage() {
  // 从数据库取真实计数
  let totalCount = 593
  let sceneCounts: Record<string, number> = {}
  let platformCount = 19

  try {
    const { count } = await supabase
      .from('skill_cards_view')
      .select('id', { count: 'exact', head: true })
    if (count) totalCount = count

    const { count: pCount } = await supabase
      .from('platforms')
      .select('id', { count: 'exact', head: true })
    if (pCount) platformCount = pCount

    // 按场景统计
    const { data: sceneData } = await supabase
      .from('skill_cards_view')
      .select('scenario_slugs')
    
    if (sceneData) {
      const slugCount: Record<string, number> = {}
      const seen = new Set<string>()
      for (const row of sceneData) {
        for (const slug of (row.scenario_slugs || [])) {
          const key = String(slug)
          // 去重：同一个skill只算一次
          if (!seen.has(key + '_' + row.scenario_slugs.length)) {
            slugCount[key] = (slugCount[key] || 0) + 1
          }
        }
      }
      sceneCounts = slugCount
    }
  } catch {}

  return <HomePortal totalCount={totalCount} platformCount={platformCount} sceneCounts={sceneCounts} />
}
