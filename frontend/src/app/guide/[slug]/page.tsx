import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getArticle, getArticleSlugs, getAllArticleMetas } from '@/lib/articles'

/** 预生成 4 篇文章页 */
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

  const related = getAllArticleMetas().filter((a) => a.slug !== slug)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* 面包屑 */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-indigo-600 transition">
          首页
        </Link>
        <span>›</span>
        <Link href="/guide" className="hover:text-indigo-600 transition">
          深度指南
        </Link>
        <span>›</span>
        <span className="text-gray-700">{article.tag}</span>
      </nav>

      {/* 文章头 */}
      <header className="mb-8 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded font-medium">
            {article.tag}
          </span>
          <span className="text-xs text-gray-400">深度指南</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          <span className="mr-2">{article.icon}</span>
          {article.title}
        </h1>
        <p className="mt-3 text-gray-500">{article.summary}</p>
      </header>

      {/* 正文：markdown 渲染 */}
      <article className="prose-guide">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
      </article>

      {/* 相关文章 */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-gray-100 pt-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">继续阅读</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {related.map((a) => (
              <Link
                key={a.slug}
                href={`/guide/${a.slug}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 transition"
              >
                <div className="text-2xl mb-2">{a.icon}</div>
                <div className="font-medium text-gray-800 text-sm line-clamp-2">
                  {a.title}
                </div>
                <div className="text-xs text-indigo-600 mt-2">阅读 →</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 返回首页 */}
      <div className="mt-10 text-center">
        <Link
          href="/guide"
          className="inline-block text-sm text-indigo-600 font-medium hover:underline"
        >
          ← 查看全部指南
        </Link>
      </div>
    </div>
  )
}
