import type { Metadata } from 'next'
import { getAllArticleMetas, type ArticleMeta } from '@/lib/articles'
import AppSidebar from '@/components/AppSidebar'
import { GuideList } from './GuideList'

export const metadata: Metadata = {
  title: '深度指南 — AI 全站文章索引 | AI360',
  description:
    'AI 入门教程、工具横评、编程/办公/学习/安全全场景实战指南。从装机必备到行业应用，一篇覆盖你需要的全部 AI 知识。',
}

export default function GuideIndexPage() {
  const articles = getAllArticleMetas()

  return (
    <div className="page-wrapper flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 min-w-0 relative z-10">
        {/* 页头 */}
        <div className="px-8 pt-10 pb-2">
          <h1 className="text-[26px] font-bold text-[var(--fg)] mb-2.5" style={{ letterSpacing: '-0.4px' }}>
            深度评测
          </h1>
          <p className="text-[15px] text-[var(--fg2)] leading-[1.7] max-w-[640px]">
            <span className="font-bold text-[var(--primary)]">
              {articles.length}
            </span>{' '}
            篇深度评测文章。每一篇都基于 5 维度门控 + 8 种验证方法，给出明确的推荐结论。不写软文，只说实话。
          </p>
        </div>

        {/* Tab + 文章列表 + 分页（客户端交互） */}
        <GuideList articles={articles} />
      </main>
    </div>
  )
}
