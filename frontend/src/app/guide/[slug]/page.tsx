import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getArticle, getArticleSlugs, getAllArticleMetas } from '@/lib/articles'
import AppSidebar from '@/components/AppSidebar'

/** 预生成文章页 */
export function generateStaticParams() {
  return getArticleSlugs().map((slug) => ({ slug }))
}

/** 每篇文章独立 SEO 元数据 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) return { title: '未找到文章 | AI360' }

  return {
    title: `${article.title} | AI360`,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      type: 'article',
    },
  }
}

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()

  // 最多展示 3 篇相关文章（同分类优先，其次按顺序）
  const all = getAllArticleMetas()
  const others = all.filter((a) => a.slug !== slug)
  const sameTag = others.filter((a) => a.tag === article.tag)
  const related = [...sameTag, ...others.filter((a) => a.tag !== article.tag)].slice(0, 3)

  return (
    <div className="page-wrapper px-4 sm:px-6 lg:px-8 min-h-screen">
      {/* 标题板块 — 横跨全宽，对齐首页 */}
      <div className="pt-10 pb-8">
        <nav className="flex items-center gap-2 text-[12px] text-[var(--fg3)] mb-4">
          <Link href="/" className="hover:text-[var(--primary)] transition">
            首页
          </Link>
          <span>/</span>
          <Link href="/guide" className="hover:text-[var(--primary)] transition">
            深度评测
          </Link>
          <span>/</span>
          <span className="text-[var(--fg)]">{article.tag}</span>
        </nav>
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(var(--dim-rgb),0.06)', color: 'var(--primary)' }}
          >
            {article.tag}
          </span>
          <span className="text-[12px] text-[var(--fg3)]">深度评测</span>
        </div>
        <h1 className="text-[28px] font-bold text-[var(--fg)] leading-tight">
          <span className="mr-2">{article.icon}</span>
          {article.title}
        </h1>
        <p className="text-[15px] text-[var(--fg3)] mt-1.5 leading-[1.7]">{article.summary}</p>
      </div>

      {/* 双栏 */}
      <div className="flex gap-8">
      <AppSidebar />
      <main className="flex-1 min-w-0 relative z-10 pb-10">
          {/* 正文：markdown 渲染（沿用全局 prose-guide 排版） */}
          <article className="prose-guide">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
          </article>

          {/* 相关文章（content-card） */}
          {related.length > 0 && (
            <section className="mt-14 border-t border-[var(--border)] pt-8">
              <h2 className="mb-4 text-[17px] font-bold text-[var(--fg)]">继续阅读</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {related.map((a) => (
                  <Link key={a.slug} href={`/guide/${a.slug}`} className="content-card block p-4 group">
                    <div className="text-2xl mb-2">{a.icon}</div>
                    <div className="font-medium text-[var(--fg)] text-sm line-clamp-2 group-hover:text-[var(--primary)] transition">
                      {a.title}
                    </div>
                    <div className="text-[12px] text-[var(--primary)] mt-2 font-medium">阅读 →</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 返回 */}
          <div className="mt-10 text-center">
            <Link
              href="/guide"
              className="inline-block text-sm text-[var(--primary)] font-medium hover:underline"
            >
              ← 查看全部评测
            </Link>
          </div>
      </main>
      </div>
    </div>
  )
}
