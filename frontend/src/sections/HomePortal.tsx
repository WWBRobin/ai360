import Link from 'next/link'

const PLATFORMS = [
  { slug: 'hermes', icon: '🔧', name: 'Hermes', count: 271 },
  { slug: 'gpts', icon: '💬', name: 'GPTs', count: 86 },
  { slug: 'coze', icon: '🤖', name: '扣子', count: 25 },
  { slug: 'saas', icon: '☁️', name: 'SaaS', count: 24 },
  { slug: 'mcp', icon: '🔌', name: 'MCP', count: 22 },
  { slug: 'claude', icon: '🧠', name: 'Claude', count: 20 },
  { slug: 'openclaw', icon: '🦅', name: 'OpenClaw', count: 14 },
  { slug: 'codex', icon: '📦', name: 'Codex', count: 8 },
  { slug: 'dify', icon: '🏗️', name: 'Dify', count: 7 },
  { slug: 'n8n', icon: '🔄', name: 'n8n', count: 4 },
  { slug: 'claude-code', icon: '⚡', name: 'Claude Code', count: 4 },
  { slug: 'qwen', icon: '🌟', name: '千问', count: 2 },
]

const SCENARIOS = [
  { slug: 'ecommerce-copy', icon: '🛍️', title: '做电商' },
  { slug: 'content-creation', icon: '📝', title: '写内容' },
  { slug: 'design', icon: '🎨', title: '做设计' },
  { slug: 'video', icon: '🎬', title: '做视频' },
  { slug: 'data-analysis', icon: '📊', title: '看数据' },
  { slug: 'code', icon: '💻', title: '写代码' },
  { slug: 'memory', icon: '🧠', title: '加记忆' },
  { slug: 'search', icon: '🔍', title: '能搜索' },
  { slug: 'file', icon: '📁', title: '读写文件' },
  { slug: 'connect', icon: '🔗', title: '连工具' },
]

const PICKS = [
  { name: 'Tavily', score: 4.9, desc: 'AI联网搜索', href: '/skill/tavily-search' },
  { name: 'claude-mem', score: 4.8, desc: 'AI记住你', href: '/skill/claude-mem' },
  { name: 'Composio', score: 4.7, desc: 'AI连1000+应用', href: '/skill/composio' },
]

const GUIDES = [
  { slug: 'install-guide', title: '装机必备指南' },
  { slug: 'memory-comparison', title: '记忆方案横评' },
  { slug: 'search-comparison', title: '搜索方案对比' },
  { slug: 'ecommerce-copy', title: '电商文案实测' },
]

/**
 * 门户式首页 — 一屏展示所有入口，点击进入
 * 不滚动，不Tab，不瀑布流
 */
export default function HomePortal() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 精简标题（不占太多空间） */}
      <div className="bg-gradient-to-b from-indigo-50/40 to-transparent pt-6 pb-4 px-4 text-center">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1">
          AI 工具那么多，<span className="gradient-text">哪个值得装？</span>
        </h1>
        <p className="text-gray-400 text-xs md:text-sm">528个工具 · 19个平台 · 独立评测</p>
      </div>

      {/* 三栏布局：平台 | 场景+精选 | 评测+入口 */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* 左栏：按平台（用户核心需求） */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900">📱 按平台找</h2>
                <span className="text-xs text-gray-400">你用哪个？</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {PLATFORMS.map(p => (
                  <Link key={p.slug} href={`/platform/${p.slug}`}
                    className="flex flex-col items-center gap-0.5 p-2.5 rounded-lg hover:bg-indigo-50 transition group">
                    <span className="text-xl">{p.icon}</span>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-indigo-600">{p.name}</span>
                    <span className="text-[9px] text-gray-400">{p.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* 中栏：按场景 */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900">🎯 按场景找</h2>
                <span className="text-xs text-gray-400">你要干啥？</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SCENARIOS.map(s => (
                  <Link key={s.slug} href={`/scenario/${s.slug}`}
                    className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-indigo-50 transition group">
                    <span className="text-lg shrink-0">{s.icon}</span>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-indigo-600">{s.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* 右栏：编辑精选 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 h-full">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900">⭐ 精选</h2>
                <span className="text-xs text-gray-400">最值得装</span>
              </div>
              <div className="space-y-2">
                {PICKS.map((pick, i) => (
                  <Link key={pick.href} href={pick.href}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-indigo-50 transition group">
                    <span className="text-sm">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 group-hover:text-indigo-600 truncate">{pick.name}</div>
                      <div className="text-[10px] text-gray-400 truncate">{pick.desc}</div>
                    </div>
                    <span className="text-xs font-bold text-indigo-500 shrink-0">{pick.score}</span>
                  </Link>
                ))}
              </div>
              <Link href="/search" className="block mt-3 pt-2 border-t border-gray-50 text-center text-[11px] text-indigo-500 hover:underline">
                查看全部 528 个 →
              </Link>
            </div>
          </div>
        </div>

        {/* 底部一行：评测 + 新手入口 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
          {/* 评测文章 */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900">📖 深度评测</h2>
                <Link href="/guide" className="text-xs text-indigo-500 hover:underline">全部 →</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {GUIDES.map(g => (
                  <Link key={g.slug} href={`/guide/${g.slug}`}
                    className="p-2.5 rounded-lg bg-gray-50 hover:bg-indigo-50 transition group">
                    <span className="text-xs font-medium text-gray-700 group-hover:text-indigo-600">{g.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* 新手入口 */}
          <div className="lg:col-span-4">
            <Link href="/essential"
              className="block bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-4 text-white hover:shadow-lg transition h-full">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚀</span>
                <div>
                  <div className="text-sm font-bold">新手入门</div>
                  <div className="text-xs text-white/80">不知道装什么？从这里开始</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
