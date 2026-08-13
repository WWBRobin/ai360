import Link from 'next/link'

const PICKS = [
  { name: 'Tavily 搜索', score: 4.9, desc: '让 AI 能联网搜索，免费 1000 次/月', quota: '免费1000次/月', href: '/skill/tavily-search' },
  { name: 'claude-mem', score: 4.8, desc: '让 AI 记住你，Claude Code 用户必装', quota: '完全免费', href: '/skill/claude-mem' },
  { name: 'Composio', score: 4.7, desc: '让 AI 连接 1000+ 外部应用', quota: '免费2万次/月', href: '/skill/composio' },
]

interface EditorPicksProps {
  picks?: typeof PICKS
  totalSkills?: number
}

export default function EditorPicks({ picks = PICKS, totalSkills = 528 }: EditorPicksProps) {
  return (
    <section className="bg-white py-16 border-y border-gray-100">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">⭐ 编辑精选</h2>
          <p className="text-gray-400 mt-1 text-sm">本周最值得用的 AI 工具</p>
        </div>
        <div className="space-y-3">
          {picks.map((pick, i) => (
            <Link key={pick.href} href={pick.href} className="pick-card block rounded-xl p-5 group">
              <div className="flex items-center gap-4">
                <div className="text-3xl shrink-0">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition text-base">{pick.name}</h3>
                  <p className="text-sm text-gray-400 truncate">{pick.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold gradient-text">{pick.score.toFixed(1)}</div>
                  <div className="text-xs text-gray-300">{pick.quota}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href="/search" className="text-sm text-indigo-500 font-medium hover:underline">
            查看全部 {totalSkills} 个工具 →
          </Link>
        </div>
      </div>
    </section>
  )
}
