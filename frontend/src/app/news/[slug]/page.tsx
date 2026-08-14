import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getSkillCardsBySlugs } from '@/lib/supabase'
import type { SkillCard } from '@/types'

import {
  getNewsBySlug,
  getNewsVersions,
  getPublishedNewsSlugs,
  normalizeLevel,
  formatDate,
  sourceDomain,
  VERSION_LABELS,
  type VersionType,
} from '../queries'
import LevelSwitcher from '../LevelSwitcher'
import NewsContent from '../NewsContent'

/**
 * /news/[slug] — 新闻详情页（server component）
 * ISR：5 分钟；?level= 切换 beginner/intermediate/advanced 版本
 */
export const revalidate = 300

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.vokki.cn'

// ===== 元数据（canonical 不带 level 参数，三个版本共用一个权威 URL）=====

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const item = await getNewsBySlug(slug)
  if (!item) return { title: '未找到该资讯' }

  const { active } = await getNewsVersions(item.id, 'intermediate')
  const title = active?.meta_title || active?.title || item.title
  const description = active?.meta_description || `${item.title} — ArcDock AI 资讯，提供入门解读 / 进阶视角 / 专业分析三种深度。`

  return {
    title,
    description,
    keywords: active?.keywords?.length ? active.keywords : item.tags || undefined,
    alternates: { canonical: `/news/${item.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/news/${item.slug}`,
      type: 'article',
      publishedTime: item.published_at || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

// ===== 构建时预渲染已发布新闻（管线内容持续增加，运行时按需兜底）=====

export async function generateStaticParams() {
  try {
    const rows = await getPublishedNewsSlugs()
    return rows.map((r) => ({ slug: r.slug }))
  } catch {
    return []
  }
}

// ===== 页面主体 =====

export default async function NewsDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ level?: string }>
}) {
  const { slug } = await params
  const { level: levelParam } = await searchParams
  const level = normalizeLevel(levelParam)

  const item = await getNewsBySlug(slug)
  if (!item) notFound()

  const { versions, active } = await getNewsVersions(item.id, level)
  const availableLevels = Array.from(
    new Set(versions.map((v) => v.version_type))
  ) as VersionType[]

  // 相关工具：related_skill_ids（slug 数组）→ skills 迷你卡片；查不到则隐藏该区块
  const relatedSkills: SkillCard[] = item.related_skill_ids?.length
    ? await getSkillCardsBySlugs(item.related_skill_ids.map(String)).catch(() => [])
    : []

  // 正文：无版本数据时给空态文案
  const content = active?.content?.trim() || ''

  // NewsArticle JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: active?.title || item.title,
    datePublished: item.published_at || undefined,
    dateModified: item.published_at || undefined,
    mainEntityOfPage: `${SITE_URL}/news/${item.slug}`,
    ...(item.source_url ? { url: item.source_url } : {}),
    publisher: {
      '@type': 'Organization',
      name: 'ArcDock',
      url: SITE_URL,
    },
    ...(item.tags?.length ? { keywords: item.tags.join(',') } : {}),
    ...(active?.keywords?.length
      ? { keywords: [...(item.tags || []), ...active.keywords].join(',') }
      : {}),
  }

  return (
    <div className="page-wrapper min-h-screen px-4 sm:px-6 lg:px-8">
      {/* 面包屑 */}
      <nav aria-label="面包屑" className="flex items-center gap-1.5 pt-6 text-[13px] text-[var(--fg3)]">
        <Link href="/" className="hover:text-[var(--primary)]">
          首页
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/news" className="hover:text-[var(--primary)]">
          AI 资讯
        </Link>
        <span aria-hidden="true">/</span>
        <span className="max-w-[40ch] truncate text-[var(--fg2)]">{item.title}</span>
      </nav>

      <article className="mx-auto max-w-3xl pb-12 pt-6">
        {/* 头部：元信息 + 标题 */}
        <header>
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--fg3)]">
            {item.published_at && (
              <time dateTime={item.published_at}>{formatDate(item.published_at)}</time>
            )}
            {item.category && (
              <span className="rounded bg-[var(--bg2)] px-1.5 py-0.5 text-[var(--fg2)]">
                {item.category}
              </span>
            )}
            {sourceDomain(item.source_url) && (
              <a
                href={item.source_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--fg3)] hover:text-[var(--primary)]"
              >
                来源：{sourceDomain(item.source_url)} ↗
              </a>
            )}
          </div>
          <h1 className="mt-3 text-[26px] font-bold leading-snug text-[var(--fg)]">
            {active?.title || item.title}
          </h1>
        </header>

        {/* 版本切换（beginner=入门解读 / intermediate=进阶视角 / advanced=专业分析） */}
        {availableLevels.length > 1 && (
          <div className="mt-5">
            <LevelSwitcher slug={item.slug} current={active?.version_type || level} available={availableLevels} />
          </div>
        )}
        {availableLevels.length === 1 && active && (
          <p className="mt-5 text-[13px] text-[var(--fg3)]">
            当前阅读：{VERSION_LABELS[active.version_type]}
          </p>
        )}

        {/* 正文 */}
        <div className="content-card mt-6 p-6 sm:p-8">
          {content ? (
            <NewsContent content={content} />
          ) : (
            <p className="py-8 text-center text-sm text-[var(--fg3)]">
              该资讯的正文还在生成中，稍后再来看看。
            </p>
          )}
        </div>

        {/* 相关工具内链：related_skill_ids → /skill/[slug] 迷你卡片，空则隐藏 */}
        {relatedSkills.length > 0 && (
          <section aria-label="相关工具" className="mt-10">
            <h2 className="mb-4 text-[18px] font-medium text-[var(--fg)]">相关工具</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {relatedSkills.map((skill) => (
                <Link
                  key={skill.slug}
                  href={`/skill/${skill.slug}`}
                  className="content-card group flex items-center gap-3 p-4"
                >
                  {skill.icon_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={skill.icon_url}
                      alt={skill.name}
                      loading="lazy"
                      className="h-10 w-10 flex-shrink-0 rounded-md border border-[var(--border)] bg-[var(--bg2)] object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg2)] text-lg"
                    >
                      🛠️
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-[var(--fg)] transition group-hover:text-[var(--primary)]">
                      {skill.name}
                    </span>
                    {skill.tagline && (
                      <span className="mt-0.5 block truncate text-[13px] text-[var(--fg3)]">
                        {skill.tagline}
                      </span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 底部：返回列表 */}
        <div className="mt-10 border-t border-[var(--border)] pt-6">
          <Link
            href="/news"
            className="text-sm text-[var(--fg2)] transition hover:text-[var(--primary)]"
          >
            ← 返回资讯列表
          </Link>
        </div>
      </article>

      {/* NewsArticle JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
