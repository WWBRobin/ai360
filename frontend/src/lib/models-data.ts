import { supabase } from '@/lib/supabase'

/**
 * models 数据层 —— 首页 B · 顶部模型榜
 *
 * 数据源：Supabase models 表
 *   select id, name, one_liner, price_input, capability_tier
 *   order by capability_tier desc limit n
 *
 * 容错纪律（照抄 supabase.ts / lamp-data.ts）：
 *   所有查询 try-catch + build-degrade 降级，失败返回 [] 不 rethrow，
 *   由页面渲染空态；build 预渲染阶段绝不炸。
 */

export interface TopModel {
  id: string
  name: string
  one_liner: string | null
  price_input: number | null
  capability_tier: number | null
}

/**
 * 取能力等级最高的前 n 个模型（首页 B 顶部模型榜用）。
 * 失败/超时一律降级空数组。
 */
export async function getTopModels(n = 5): Promise<TopModel[]> {
  try {
    const { data, error } = await supabase
      .from('models')
      .select('id, name, one_liner, price_input, capability_tier')
      .order('capability_tier', { ascending: false })
      .limit(n)

    if (error || !data) {
      console.error('getTopModels error:', error)
      return []
    }
    return data as TopModel[]
  } catch (err) {
    console.warn('[build-degrade] getTopModels 拉取失败，降级空数组', err)
    return []
  }
}
