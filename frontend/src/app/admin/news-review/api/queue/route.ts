import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * 新闻审核队列 API。
 *
 * 与现有 admin 模式一致：service_role（supabaseAdmin）绕过 RLS，
 * MVP 阶段无认证，靠路由隐藏（见 src/app/admin/actions.ts 注释）。
 *
 * GET  /api…?status=human_reviewing&ids=1,2
 *   - 无参数：返回 4 个队列 Tab 的列表（human_reviewing / needs_human_intervention / published / shelved）
 *   - ?ids=：返回指定 id 的条目 + content_versions + review_records（详情用）
 */

export const dynamic = 'force-dynamic'

export type QueueItem = {
  id: number
  title: string
  slug: string | null
  category: string | null
  source_url: string | null
  status: string
  revision_count: number | null
  ai_confidence_score: number | null
  discovered_at: string | null
  published_at: string | null
}

const QUEUE_STATUSES = [
  'human_reviewing',
  'needs_human_intervention',
  'published',
  'shelved',
] as const

async function fetchQueue(status: string, limit = 100): Promise<QueueItem[]> {
  const { data, error } = await supabaseAdmin
    .from('content_items')
    .select(
      'id, title, slug, category, source_url, status, revision_count, ai_confidence_score, discovered_at, published_at',
    )
    .eq('status', status)
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data || []) as QueueItem[]
}

export async function GET(request: Request) {
  const url = new URL(request.url)

  try {
    // 详情模式：?ids=1,2 → 条目 + 3 个 L 版本 + 审核记录
    const idsParam = url.searchParams.get('ids')
    if (idsParam) {
      const ids = idsParam
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0)
        .slice(0, 20)
      if (ids.length === 0) {
        return NextResponse.json({ ok: false, error: 'ids 参数无效' }, { status: 400 })
      }

      const { data: items, error: itemErr } = await supabaseAdmin
        .from('content_items')
        .select('*')
        .in('id', ids)
      if (itemErr) throw new Error(itemErr.message)

      const { data: versions, error: verErr } = await supabaseAdmin
        .from('content_versions')
        .select('*')
        .in('content_id', ids)
        .order('version_number', { ascending: false })
      if (verErr) throw new Error(verErr.message)

      const { data: reviews, error: revErr } = await supabaseAdmin
        .from('review_records')
        .select('*')
        .in('content_id', ids)
        .order('created_at', { ascending: false })
      if (revErr) throw new Error(revErr.message)

      return NextResponse.json({
        ok: true,
        items: items || [],
        versions: versions || [],
        reviews: reviews || [],
      })
    }

    // 队列模式：单状态 或 全部 4 个 Tab
    const statusParam = url.searchParams.get('status')
    if (statusParam) {
      const queue = await fetchQueue(statusParam)
      return NextResponse.json({ ok: true, queues: { [statusParam]: queue } })
    }

    const entries = await Promise.all(
      QUEUE_STATUSES.map(async (s) => [s, await fetchQueue(s)] as const),
    )
    return NextResponse.json({ ok: true, queues: Object.fromEntries(entries) })
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
