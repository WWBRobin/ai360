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
    <div className="flex min-h-screen relative">
      <AppSidebar />
      <main className="flex-1 min-w-0 relative z-10">
        <div className="px-8 py-8 max-w-[820px]">
          {/* 面包屑 */}
          <nav className="flex items-center gap-2 text-[12px] text-[#aaa] mb-5">
            <Link href="/" className="hover:text-[#7C3AED] transition">
              首页
            </Link>
            <span>/</span>
            <Link href="/guide" className="hover:text-[#7C3AED] transition">
              深度评测
            </Link>
            <span>/</span>
            <span className="text-[#333]">{article.tag}</span>
          </nav>

          {/* 文章头 */}
          <header className="mb-8 pb-6 border-b border-[#F0F0F0]">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                style={{ background: '#EDE9FE', color: '#7C3AED' }}
              >
                {article.tag}
              </span>
              <span className="text-[12px] text-[#aaa]">深度评测</span>
            </div>
            <h1 className="text-[28px] font-bold text-[#1A1A1A] leading-tight mb-3">
              <span className="mr-2">{article.icon}</span>
              {article.title}
            </h1>
            <p className="text-[15px] text-[#666] leading-[1.7]">{article.summary}</p>
          </header>

          {/* 正文：markdown 渲染（沿用全局 prose-guide 排版） */}
          <article className="prose-guide">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
          </article>

          {/* 相关文章（glass-card） */}
          {related.length > 0 && (
            <section className="mt-14 border-t border-[#F0F0F0] pt-8">
              <h2 className="mb-4 text-[17px] font-bold text-[#000]">继续阅读</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {related.map((a) => (
                  <Link key={a.slug} href={`/guide/${a.slug}`} className="glass-card block p-4 group">
                    <div className="text-2xl mb-2">{a.icon}</div>
                    <div className="font-medium text-[#000] text-sm line-clamp-2 group-hover:text-[#7C3AED] transition">
                      {a.title}
                    </div>
                    <div className="text-[12px] text-[#7C3AED] mt-2 font-medium">阅读 →</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 返回 */}
          <div className="mt-10 text-center">
            <Link
              href="/guide"
              className="inline-block text-sm text-[#7C3AED] font-medium hover:underline"
            >
              ← 查看全部评测
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
