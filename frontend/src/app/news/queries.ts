import { supabase } from '@/lib/supabase'

/**
 * 新闻板块数据层（content pipeline: content_items + content_versions）
 *
 * RLS：anon 只能读 status='published' 的 content_items 及其 content_versions，
 * 因此前端直接用 anon 客户端查询即可，无需 service_role。
 */

// ===== 类型 =====

export interface NewsItem {
  id: number
  title: string
  slug: string
  category: string | null
  tags: string[] | null
  source_url: string | null
  published_at: string | null
  related_skill_ids: string[] | number[] | null
}

export type VersionType = 'beginner' | 'intermediate' | 'advanced'

export interface NewsVersion {
  id: number
  content_id: number
  version_type: VersionType
  title: string | null
  content: string | null
  meta_title: string | null
  meta_description: string | null
  keywords: string[] | null
}

// ===== 常量 =====

export const PAGE_SIZE = 12

/** 版本类型 → 中文标签（用户可见） */
export const VERSION_LABELS: Record<VersionType, string> = {
  beginner: '入门解读',
  intermediate: '进阶视角',
  advanced: '专业分析',
}

export const VERSION_ORDER: VersionType[] = ['beginner', 'intermediate', 'advanced']

export function normalizeLevel(value: string | undefined): VersionType {
  return value === 'beginner' || value === 'advanced' ? value : 'intermediate'
}

// ===== 查询 =====

/**
 * 分页拉取已发布新闻（published_at 倒序）。
 * 返回 { items, total }；数据库不可用时返回空列表，页面渲染空态。
 */
export async function getPublishedNews(page = 1, pageSize = PAGE_SIZE) {
  const from = Math.max(0, (page - 1) * pageSize)
  try {
    const { data, error, count } = await supabase
      .from('content_items')
      .select('id,title,slug,category,tags,source_url,published_at,related_skill_ids', {
        count: 'exact',
      })
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .range(from, from + pageSize - 1)

    if (error) {
      console.error('getPublishedNews error:', error.message)
      return { items: [] as NewsItem[], total: 0 }
    }
    return { items: (data || []) as unknown as NewsItem[], total: count || 0 }
  } catch (err) {
    console.warn('[build-degrade] getPublishedNews 拉取失败，降级空列表', err)
    return { items: [] as NewsItem[], total: 0 }
  }
}

/** 按 slug 取单条已发布新闻（详情页入口） */
export async function getNewsBySlug(slug: string): Promise<NewsItem | null> {
  try {
    const { data, error } = await supabase
      .from('content_items')
      .select('id,title,slug,category,tags,source_url,published_at,related_skill_ids')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()

    if (error) {
      console.error('getNewsBySlug error:', error.message)
      return null
    }
    return (data as unknown as NewsItem) || null
  } catch (err) {
    console.warn('[build-degrade] getNewsBySlug 拉取失败，降级 null', err)
    return null
  }
}

/** 取一条新闻的全部版本；返回 availableLevels + 指定（或回退）版本 */
export async function getNewsVersions(
  contentId: number,
  preferred: VersionType
): Promise<{ versions: NewsVersion[]; active: NewsVersion | null }> {
  try {
    const { data, error } = await supabase
      .from('content_versions')
      .select(
        'id,content_id,version_type,title,content,meta_title,meta_description,keywords'
      )
      .eq('content_id', contentId)

    if (error) {
      console.error('getNewsVersions error:', error.message)
      return { versions: [], active: null }
    }
    const versions = (data || []) as unknown as NewsVersion[]

    // 回退顺序：指定版本 → intermediate → 任意存在的版本
    const active =
      versions.find((v) => v.version_type === preferred) ||
      versions.find((v) => v.version_type === 'intermediate') ||
      versions[0] ||
      null

    return { versions, active }
  } catch (err) {
    console.warn('[build-degrade] getNewsVersions 拉取失败，降级空版本', err)
    return { versions: [], active: null }
  }
}

/** sitemap / generateStaticParams 用：所有已发布新闻的 slug + published_at */
export async function getPublishedNewsSlugs(): Promise<{ slug: string; published_at: string | null }[]> {
  try {
    const { data, error } = await supabase
      .from('content_items')
      .select('slug,published_at')
      .eq('status', 'published')
      .not('slug', 'is', null)
      .order('published_at', { ascending: false })
      .limit(2000)

    if (error) return []
    return (data || []) as { slug: string; published_at: string | null }[]
  } catch (err) {
    console.warn('[build-degrade] getPublishedNewsSlugs 拉取失败，降级空数组', err)
    return []
  }
}

// ===== 工具函数 =====

/** "2026-08-14T08:00:00Z" → "2026-08-14"（日期显示统一走这里，异常输入返回空串） */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 从 source_url 提取可读域名（如 "openai.com"），提取失败返回空串 */
export function sourceDomain(url: string | null | undefined): string {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
