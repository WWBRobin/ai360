'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { ArticleMeta } from '@/lib/articles'

// 标签 → 金色 tag-free 样式（统一极简线条金色）
type TagKind = 'compare' | 'review' | 'tutorial' | 'beginner' | 'tested'
const TAG_STYLES: Record<TagKind, { bg: string; color: string }> = {
  compare: { bg: 'rgba(28, 26, 24,0.06)', color: '#1c1a18' },
  review: { bg: 'rgba(28, 26, 24,0.06)', color: '#1c1a18' },
  tutorial: { bg: 'rgba(28, 26, 24,0.06)', color: '#1c1a18' },
  beginner: { bg: 'rgba(28, 26, 24,0.06)', color: '#1c1a18' },
  tested: { bg: 'rgba(28, 26, 24,0.06)', color: '#1c1a18' },
}
const TAG_LABELS: Record<TagKind, string> = {
  review: '评测',
  compare: '横评',
  tutorial: '教程',
  beginner: '入门',
  tested: '实测',
}

// 把文章的 tag（中文分类）映射到原型标签分类
function classifyArticle(a: ArticleMeta): { kinds: TagKind[]; conclusion: string; hasTutorial: boolean; duration: string } {
  const tag = a.tag
  const kinds: TagKind[] = []
  if (tag.includes('横评') || a.title.includes('横评') || a.title.includes('对比') || a.title.includes('盘点')) {
    kinds.push('compare')
  }
  if (tag.includes('教程') || a.title.includes('指南') || a.title.includes('完全指南')) {
    kinds.push('tutorial')
  }
  if (tag.includes('入门') || a.title.includes('入门') || a.title.includes('零基础')) {
    kinds.push('beginner')
  }
  if (tag.includes('实测') || a.title.includes('实测') || tag.includes('横评')) {
    kinds.push('tested')
  }
  if (kinds.length === 0) kinds.push('review')

  // 结论：尝试从 summary 提取"选…/推荐…"短语
  let conclusion = ''
  if (a.summary.includes('选')) {
    const m = a.summary.match(/选[^。，；,;]{2,18}/)
    if (m) conclusion = m[0]
  }
  if (!conclusion && a.summary.includes('推荐')) {
    conclusion = '实测推荐'
  }
  if (!conclusion) conclusion = '实测推荐'

  const hasTutorial = kinds.includes('tutorial') || a.title.includes('指南') || a.title.includes('教程')
  const duration = a.summary.length > 120 ? '15 分钟' : a.summary.length > 80 ? '10 分钟' : '6 分钟'

  return { kinds, conclusion, hasTutorial, duration }
}

const TABS = [
  { key: 'latest', label: '最新' },
  { key: 'hot', label: '最热' },
  { key: 'beginner', label: '入门' },
  { key: 'compare', label: '横评' },
  { key: 'tutorial', label: '教程' },
]

const PAGE_SIZE = 8

export function GuideList({ articles }: { articles: ArticleMeta[] }) {
  const [activeTab, setActiveTab] = useState('latest')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const classified = articles.map((a) => ({ a, info: classifyArticle(a) }))
    if (activeTab === 'latest' || activeTab === 'hot') return classified
    if (activeTab === 'beginner') return classified.filter((x) => x.info.kinds.includes('beginner'))
    if (activeTab === 'compare') return classified.filter((x) => x.info.kinds.includes('compare'))
    if (activeTab === 'tutorial') return classified.filter((x) => x.info.kinds.includes('tutorial'))
    return classified
  }, [articles, activeTab])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const switchTab = (k: string) => {
    setActiveTab(k)
    setPage(1)
  }

  return (
    <>
      {/* Tab */}
      <div className="px-8">
        <div className="border-b border-[rgba(0,0,0,0.06)]">
          <div className="flex gap-0">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={`px-[18px] py-2.5 text-[14px] border-b-[3px] -mb-px transition ${
                  activeTab === t.key
                    ? 'text-[#1c1a18] font-bold border-[#1c1a18]'
                    : 'text-[#888] font-medium border-transparent hover:text-[#000]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 文章列表（单列） */}
      <div className="px-8 py-7 flex flex-col gap-4">
        {pageItems.map(({ a, info }) => (
          <Link key={a.slug} href={`/guide/${a.slug}`} className="content-card block p-[22px_24px] group">
            {/* 标题 */}
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <h2 className="text-[18px] font-bold text-[#000] leading-[1.4] flex-1 group-hover:text-[#1c1a18] transition">
                {a.title}
              </h2>
            </div>

            {/* 标签行 */}
            <div className="flex gap-1.5 mb-2.5 flex-wrap items-center">
              {info.kinds.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center text-[10px] font-bold px-2 py-[3px] rounded-md leading-[1.4]"
                  style={{ background: TAG_STYLES[k].bg, color: TAG_STYLES[k].color }}
                >
                  {TAG_LABELS[k]}
                </span>
              ))}
              {info.hasTutorial && (
                <span
                  className="inline-flex items-center text-[10px] font-bold px-2 py-[3px] rounded-md leading-[1.4]"
                  style={{ background: 'rgba(28, 26, 24,0.06)', color: '#1c1a18' }}
                >
                  有教程
                </span>
              )}
            </div>

            {/* 摘要 */}
            <p className="text-[14px] text-[#666] leading-[1.7] mb-3.5 line-clamp-2">{a.summary}</p>

            {/* 元信息行 */}
            <div className="flex items-center gap-3.5 flex-wrap">
              <span className="text-[12px] text-[#aaa]">{a.tag}</span>
              <span className="w-[3px] h-[3px] rounded-full bg-[#ddd]" />
              <span className="text-[12px] text-[#aaa]">{info.duration}阅读</span>
              <span
                className="text-[12px] font-semibold px-3 py-1 rounded-full ml-auto"
                style={{ background: 'rgba(28, 26, 24,0.06)', color: '#1c1a18' }}
              >
                {info.conclusion}
              </span>
              {info.hasTutorial && (
                <span className="text-[12px] font-semibold text-[#1c1a18] inline-flex items-center gap-1">
                  查看配套教程
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </span>
              )}
            </div>
          </Link>
        ))}

        {pageItems.length === 0 && (
          <div className="text-center py-16 text-[#888]">
            <p className="text-[15px]">该分类暂无文章</p>
          </div>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 px-8 pb-8">
          <button
            onClick={() => setPage(Math.max(1, current - 1))}
            disabled={current <= 1}
            className="min-w-[36px] h-9 px-2.5 flex items-center justify-center text-[13px] text-[#666] rounded-[10px] hover:bg-[rgba(28, 26, 24,0.08)] hover:text-[#1c1a18] transition disabled:opacity-40 disabled:hover:bg-transparent"
          >
            «
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`min-w-[36px] h-9 px-2.5 flex items-center justify-center text-[13px] rounded-[10px] transition ${
                p === current
                  ? 'text-white font-bold bg-[#1c1a18]'
                  : 'text-[#666] hover:bg-[rgba(28, 26, 24,0.08)] hover:text-[#1c1a18]'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(totalPages, current + 1))}
            disabled={current >= totalPages}
            className="min-w-[36px] h-9 px-2.5 flex items-center justify-center text-[13px] text-[#666] rounded-[10px] hover:bg-[rgba(28, 26, 24,0.08)] hover:text-[#1c1a18] transition disabled:opacity-40 disabled:hover:bg-transparent"
          >
            »
          </button>
        </div>
      )}
    </>
  )
}
