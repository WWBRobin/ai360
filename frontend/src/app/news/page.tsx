import type { Metadata } from 'next'
import Link from 'next/link'

import { getPublishedNews, formatDate, sourceDomain, PAGE_SIZE } from './queries'

/**
 * /news — 新闻列表页
 * ISR：5 分钟增量静态重新生成（内容管线持续写入 published 新闻）
 */
export const revalidate = 300

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.vokki.cn'

export const metadata: Metadata = {
  title: 'AI 资讯 — 每日新闻与深度解读 | ArcDock',
  description:
    'AI Skill / Agent 领域新闻动态：新工具发布、平台更新、行业事件。每条新闻提供入门解读 / 进阶视角 / 专业分析三种阅读深度。',
  alternates: { canonical: '/news' },
  openGraph: {
    title: 'AI 资讯 — 每日新闻与深度解读 | ArcDock',
    description: 'AI Skill / Agent 领域新闻动态，三种阅读深度任选。',
    url: `${SITE_URL}/news`,
    type: 'website',
  },
}

export default async function NewsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const { items, total } = await getPublishedNews(page)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="page-wrapper min-h-screen px-4 sm:px-6 lg:px-8">
      {/* 标题板块 — 与首页/深度评测对齐 */}
      <div className="pt-10 pb-8">
        <h1 className="text-[28px] font-bold leading-tight text-[var(--fg)]">AI 资讯</h1>
        <p className="mt-1.5 text-[15px] text-[var(--fg3)]">
          {total > 0 ? (
            <>
              <span className="font-bold text-[var(--primary)]">{total}</span> 条已发布资讯。
              每条提供入门解读 / 进阶视角 / 专业分析三种深度，按需选读。
            </>
          ) : (
            'AI Skill / Agent 领域新闻动态，新工具发布、平台更新、行业事件。'
          )}
        </p>
      </div>

      <main className="pb-12">
        {items.length === 0 ? (
          /* 空态：管线尚未发布内容时友好引导 */
          <div className="content-card flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="text-3xl" aria-hidden="true">
              📰
            </span>
            <p className="text-[16px] font-medium text-[var(--fg)]">暂无资讯内容</p>
            <p className="max-w-md text-sm text-[var(--fg3)]">
              资讯板块正在建设中，内容管线即将上线。先去看看
              <Link href="/" className="mx-1 text-[var(--primary)] hover:underline">
                Skill 聚合
              </Link>
              和
              <Link href="/guide" className="mx-1 text-[var(--primary)] hover:underline">
                深度评测
              </Link>
              吧。
            </p>
          </div>
        ) : (
          <>
            {/* 新闻卡片列表：一行一张（含标题/日期/分类/来源/标签） */}
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <Link key={item.id} href={`/news/${item.slug}`} className="content-card group block p-5">
                  <div className="flex items-center gap-2 text-[12px] text-[var(--fg3)]">
                    <time dateTime={item.published_at || undefined}>
                      {formatDate(item.published_at)}
                    </time>
                    {item.category && (
                      <span className="rounded bg-[var(--bg2)] px-1.5 py-0.5 text-[var(--fg2)]">
                        {item.category}
                      </span>
                    )}
                    {sourceDomain(item.source_url) && (
                      <span className="truncate">来源：{sourceDomain(item.source_url)}</span>
                    )}
                  </div>
                  <h2 className="mt-2 text-[17px] font-medium leading-snug text-[var(--fg)] transition group-hover:text-[var(--primary)]">
                    {item.title}
                  </h2>
                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {item.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[12px] text-[var(--fg3)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* 分页（总数 > 一页时才显示） */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/news?page=${page - 1}`}
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--fg2)] transition hover:border-[var(--fg4)] hover:text-[var(--fg)]"
                  >
                    上一页
                  </Link>
                )}
                <span className="px-2 text-sm text-[var(--fg3)]">
                  {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/news?page=${page + 1}`}
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--fg2)] transition hover:border-[var(--fg4)] hover:text-[var(--fg)]"
                  >
                    下一页
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
