import Link from 'next/link'

/**
 * 门户式首页 v2 — 专业风格
 * 去 emoji、去彩虹渐变、学 mcp.so 的克制配色
 */

const PLATFORMS = [
  { slug: 'hermes', name: 'Hermes', count: 271 },
  { slug: 'gpts', name: 'GPTs', count: 86 },
  { slug: 'coze', name: '扣子 Coze', count: 25 },
  { slug: 'saas', name: 'SaaS', count: 24 },
  { slug: 'mcp', name: 'MCP', count: 22 },
  { slug: 'claude', name: 'Claude', count: 20 },
  { slug: 'openclaw', name: 'OpenClaw', count: 14 },
  { slug: 'codex', name: 'Codex', count: 8 },
  { slug: 'dify', name: 'Dify', count: 7 },
  { slug: 'n8n', name: 'n8n', count: 4 },
  { slug: 'claude-code', name: 'Claude Code', count: 4 },
  { slug: 'qwen', name: '千问', count: 2 },
]

const SCENARIOS = [
  { slug: 'ecommerce-copy', title: '电商营销', desc: '文案、主图、推广' },
  { slug: 'content-creation', title: '内容创作', desc: '写作、社媒、博客' },
  { slug: 'design', title: '设计创意', desc: '海报、UI、品牌' },
  { slug: 'video', title: '视频制作', desc: '生成、剪辑、字幕' },
  { slug: 'data-analysis', title: '数据分析', desc: '报表、图表、洞察' },
  { slug: 'code', title: '编程开发', desc: '编码、调试、部署' },
  { slug: 'memory', title: '记忆增强', desc: 'AI 记住你的上下文' },
  { slug: 'search', title: '联网搜索', desc: 'AI 获取实时信息' },
  { slug: 'file', title: '文件操作', desc: 'AI 读写本地文件' },
  { slug: 'connect', title: '工具连接', desc: 'AI 对接外部应用' },
]

const PICKS = [
  { name: 'Tavily', score: 4.9, desc: 'AI 联网搜索', tag: '免费1000次/月', href: '/skill/tavily-search' },
  { name: 'claude-mem', score: 4.8, desc: 'AI 持久记忆', tag: '完全免费', href: '/skill/claude-mem' },
  { name: 'Composio', score: 4.7, desc: 'AI 连接外部应用', tag: '免费2万次/月', href: '/skill/composio' },
]

const GUIDES = [
  { slug: 'install-guide', title: '装机必备完整指南' },
  { slug: 'memory-comparison', title: '4 款记忆方案横评' },
  { slug: 'search-comparison', title: '3 款搜索方案对比' },
  { slug: 'ecommerce-copy', title: '电商文案实测' },
]

export default function HomePortal() {
  return (
    <div className="bg-white">
      {/* 精简标题 */}
      <div className="hero-bg py-6 px-4 text-center">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1">
          AI 工具那么多，<span className="brand-text">哪个值得装？</span>
        </h1>
        <p className="text-gray-500 text-sm">
          528 个工具 · 19 个平台 · 独立评测
        </p>
      </div>

      {/* 三栏布局 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* 左栏：按平台（最大面积）*/}
          <div className="lg:col-span-5">
            <div className="ai-card p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">按平台浏览</h2>
                <span className="text-xs text-gray-400">你用哪个？</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {PLATFORMS.map(p => (
                  <Link key={p.slug} href={`/platform/${p.slug}`}
                    className="flex flex-col items-center gap-0.5 py-3 px-1 rounded-lg hover:bg-gray-50 transition">
                    <span className="text-sm font-medium text-gray-800 hover:text-blue-600">{p.name}</span>
                    <span className="count-badge">{p.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* 中栏：按场景 */}
          <div className="lg:col-span-4">
            <div className="ai-card p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">按场景浏览</h2>
                <span className="text-xs text-gray-400">你要做什么？</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {SCENARIOS.map(s => (
                  <Link key={s.slug} href={`/scenario/${s.slug}`}
                    className="py-2.5 px-2 rounded-lg hover:bg-gray-50 transition">
                    <div className="text-sm font-medium text-gray-800 hover:text-blue-600">{s.title}</div>
                    <div className="text-[11px] text-gray-400">{s.desc}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* 右栏：编辑精选 */}
          <div className="lg:col-span-3">
            <div className="ai-card p-4 h-full">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">编辑精选</h2>
                <span className="tag-tested">实测</span>
              </div>
              <div className="space-y-2.5">
                {PICKS.map((pick, i) => (
                  <Link key={pick.href} href={pick.href}
                    className="block py-2 px-1 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium text-gray-900 hover:text-blue-600">{pick.name}</span>
                      <span className="text-sm font-bold score-text">{pick.score}</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{pick.desc}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{pick.tag}</div>
                  </Link>
                ))}
              </div>
              <Link href="/search" className="block mt-3 pt-2 border-t border-gray-50 text-center text-[11px] text-blue-600 hover:underline">
                查看全部 528 个 →
              </Link>
            </div>
          </div>
        </div>

        {/* 底部一行：评测 + 新手入口 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
          <div className="lg:col-span-8">
            <div className="ai-card p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">深度评测</h2>
                <Link href="/guide" className="text-xs text-blue-600 hover:underline">全部 →</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {GUIDES.map(g => (
                  <Link key={g.slug} href={`/guide/${g.slug}`}
                    className="py-2.5 px-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition">
                    <span className="text-xs font-medium text-gray-700 hover:text-blue-600">{g.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <Link href="/essential"
              className="cta-section block p-4 hover:bg-gray-900 transition">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-sm font-bold">新手入门</div>
                  <div className="text-xs text-gray-400 mt-0.5">不知道装什么？从这里开始</div>
                </div>
                <span className="ml-auto text-gray-400">→</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
