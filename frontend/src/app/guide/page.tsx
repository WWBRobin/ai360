import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllArticleMetas, type ArticleMeta } from '@/lib/articles'

export const metadata: Metadata = {
  title: '深度指南 — AI 全站文章索引 | AI360',
  description:
    'AI 入门教程、工具横评、编程/办公/学习/安全全场景实战指南。从装机必备到行业应用，一篇覆盖你需要的全部 AI 知识。',
}

export default function GuideIndexPage() {
  const articles = getAllArticleMetas()

  // 精选（前 4 篇）与其余分组
  const featured = articles.slice(0, 4)
  const rest = articles.slice(4)

  // 其余按分类分组，保持 manifest 顺序
  const groups: { tag: string; items: ArticleMeta[] }[] = []
  for (const a of rest) {
    let g = groups.find((x) => x.tag === a.tag)
    if (!g) {
      g = { tag: a.tag, items: [] }
      groups.push(g)
    }
    g.items.push(a)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* 面包屑 */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-indigo-600 transition">
          首页
        </Link>
        <span>›</span>
        <span className="text-gray-700">深度指南</span>
      </nav>

      {/* 标题 */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          📚 深度指南
        </h1>
        <p className="text-gray-500 mt-2">
          共 {articles.length} 篇文章。装机必备、工具横评、编程/办公/学习/安全全场景实战指南——每个结论都基于实际测试和数据。
        </p>
      </header>

      {/* 精选横评 */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          ⭐ 精选横评
          <span className="text-xs font-normal text-gray-400">实测对比</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {featured.map((a) => (
            <Link
              key={a.slug}
              href={`/guide/${a.slug}`}
              className="group block bg-white rounded-2xl border border-indigo-100 p-6 card-hover hover:border-indigo-300 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl shrink-0">{a.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded font-medium">
                      {a.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition line-clamp-2">
                    {a.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {a.summary}
                  </p>
                  <div className="mt-3 text-xs text-indigo-600 font-medium">
                    阅读全文 →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 分类文章 */}
      {groups.map((g) => (
        <section key={g.tag} className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            {g.tag}
            <span className="text-xs font-normal text-gray-400">
              {g.items.length} 篇
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {g.items.map((a) => (
              <Link
                key={a.slug}
                href={`/guide/${a.slug}`}
                className="group block bg-white rounded-xl border border-gray-200 p-5 card-hover hover:border-indigo-300"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl shrink-0">{a.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition line-clamp-2">
                      {a.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">
                      {a.summary}
                    </p>
                    <div className="mt-2 text-xs text-indigo-600 font-medium">
                      阅读 →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* 底部 CTA */}
      <div className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 text-center">
        <p className="text-gray-600 text-sm">
          想直接按场景找工具？浏览{' '}
          <Link href="/essential" className="text-indigo-600 font-medium hover:underline">
            装机必备
          </Link>{' '}
          或{' '}
          <Link href="/" className="text-indigo-600 font-medium hover:underline">
            首页精选
          </Link>
        </p>
      </div>
    </div>
  )
}
