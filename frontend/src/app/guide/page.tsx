import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllArticleMetas } from '@/lib/articles'

export const metadata: Metadata = {
  title: '深度指南 — AI Skill 横评与装机必备 | AI360',
  description:
    'AI Agent 装机必备、记忆/搜索/电商文案方案横评。我们实测过的工具，告诉你哪个值得装。',
}

export default function GuideIndexPage() {
  const articles = getAllArticleMetas()

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
          我们实测过的 AI Skill 横评与装机必备完整指南。每个结论都基于实际测试和数据。
        </p>
      </header>

      {/* 文章卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {articles.map((a) => (
          <Link
            key={a.slug}
            href={`/guide/${a.slug}`}
            className="group block bg-white rounded-2xl border border-gray-200 p-6 card-hover hover:border-indigo-300"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl shrink-0">{a.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded font-medium">
                    {a.tag}
                  </span>
                </div>
                <h2 className="font-bold text-gray-900 group-hover:text-indigo-600 transition line-clamp-2">
                  {a.title}
                </h2>
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
