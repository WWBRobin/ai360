import Link from 'next/link'

const ARTICLES = [
  { slug: 'install-guide', title: 'AI Agent 装机必备：2026 年基础工具链完整指南', desc: '记忆/搜索/文件/代码/连接，30 分钟一次配齐' },
  { slug: 'memory-comparison', title: 'AI 怎么记住你？4 款记忆方案横评', desc: 'claude-mem / Mem0 / Supermemory 实测对比' },
  { slug: 'search-comparison', title: '怎么让 AI 能上网？3 款搜索方案对比', desc: 'Tavily / Firecrawl / Brave Search MCP 实测' },
  { slug: 'ecommerce-copy', title: '电商文案 Skill 实测对比', desc: '小红书图文神器Pro vs 品牌朋友圈文案 vs 文心一言4.5' },
]

interface ArticleListProps {
  articles?: typeof ARTICLES
  title?: string
  count?: number
}

export default function ArticleList({ articles = ARTICLES, title = '深度评测', count = 4 }: ArticleListProps) {
  const items = articles.slice(0, count)
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">📖 {title}</h2>
        <p className="text-gray-400 mt-1 text-sm">每个评测都实测过，告诉你到底选哪个</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(article => (
          <Link key={article.slug} href={`/guide/${article.slug}`} className="cat-card rounded-2xl p-5 group">
            <h3 className="font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition line-clamp-2">{article.title}</h3>
            <p className="text-sm text-gray-400 line-clamp-2">{article.desc}</p>
            <div className="mt-3 text-xs text-indigo-500 font-medium">阅读评测 →</div>
          </Link>
        ))}
      </div>
    </section>
  )
}
