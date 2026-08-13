import Link from 'next/link'

/**
 * 门户式首页 v3 — 去掉拼凑感
 * 不用方框包裹区块，用排版层次和间距区分
 * 学 360导航/mcp.so 的整体流式布局
 */

const PLATFORMS = [
  { slug: 'hermes', name: 'Hermes', count: 271 },
  { slug: 'gpts', name: 'GPTs', count: 86 },
  { slug: 'coze', name: '扣子', count: 25 },
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
  { slug: 'memory', title: '记忆增强', desc: '记住上下文' },
  { slug: 'search', title: '联网搜索', desc: '获取实时信息' },
  { slug: 'file', title: '文件操作', desc: '读写本地文件' },
  { slug: 'connect', title: '工具连接', desc: '对接外部应用' },
  { slug: 'ecommerce-copy', title: '电商营销', desc: '文案和主图' },
  { slug: 'content-creation', title: '内容创作', desc: '写作和社媒' },
  { slug: 'design', title: '设计创意', desc: '海报和UI' },
  { slug: 'video', title: '视频制作', desc: '生成和剪辑' },
  { slug: 'data-analysis', title: '数据分析', desc: '报表和图表' },
  { slug: 'code', title: '编程开发', desc: '编码和调试' },
]

const PICKS = [
  { name: 'Tavily', score: 4.9, desc: 'AI联网搜索', tag: '免费1000次/月', href: '/skill/tavily-search' },
  { name: 'claude-mem', score: 4.8, desc: 'AI持久记忆', tag: '完全免费', href: '/skill/claude-mem' },
  { name: 'Composio', score: 4.7, desc: 'AI连接外部应用', tag: '免费2万次/月', href: '/skill/composio' },
]

const GUIDES = [
  { slug: 'install-guide', title: '装机必备完整指南' },
  { slug: 'memory-comparison', title: '4款记忆方案横评' },
  { slug: 'search-comparison', title: '3款搜索方案对比' },
  { slug: 'ecommerce-copy', title: '电商文案实测' },
]

export default function HomePortal() {
  return (
    <div className="bg-white min-h-screen">
      {/* === 标题区 === */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <h1 className="text-lg md:text-2xl font-bold text-gray-900">
            AI 工具那么多，<span className="text-blue-600">哪个值得装？</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">528 个工具 · 19 个平台 · 独立评测</p>
        </div>
      </div>

      {/* === 主体内容区（统一流式，不分方框）=== */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* 第一行：平台入口（占大面积）+ 精选（右侧窄栏） */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          
          {/* 左侧：平台 + 场景（合在一起，不分两个方框） */}
          <div className="lg:col-span-3">
            {/* 平台 */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">按平台</h2>
              <div className="grid grid-cols-6 md:grid-cols-6 gap-x-4 gap-y-2">
                {PLATFORMS.map(p => (
                  <Link key={p.slug} href={`/platform/${p.slug}`}
                    className="flex items-baseline justify-between py-1.5 border-b border-gray-50 hover:border-blue-200 transition group">
                    <span className="text-sm text-gray-700 group-hover:text-blue-600">{p.name}</span>
                    <span className="text-[10px] text-gray-300">{p.count}</span>
                  </Link>
                ))}
              </div>
            </div>
            
            {/* 场景 */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">按场景</h2>
              <div className="grid grid-cols-5 gap-x-4 gap-y-2">
                {SCENARIOS.map(s => (
                  <Link key={s.slug} href={`/scenario/${s.slug}`}
                    className="py-1.5 border-b border-gray-50 hover:border-blue-200 transition group">
                    <div className="text-sm text-gray-700 group-hover:text-blue-600">{s.title}</div>
                    <div className="text-[10px] text-gray-300">{s.desc}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：精选 */}
          <div className="lg:col-span-1 lg:border-l lg:border-gray-100 lg:pl-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">编辑精选</h2>
            <div className="space-y-3">
              {PICKS.map(pick => (
                <Link key={pick.href} href={pick.href} className="block group">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-gray-800 group-hover:text-blue-600">{pick.name}</span>
                    <span className="text-sm font-semibold text-amber-600">{pick.score}</span>
                  </div>
                  <div className="text-[11px] text-gray-400">{pick.desc}</div>
                  <div className="text-[10px] text-gray-300">{pick.tag}</div>
                </Link>
              ))}
            </div>
            <Link href="/search" className="block mt-4 text-[11px] text-blue-600 hover:underline">
              查看全部 528 个 →
            </Link>
          </div>
        </div>

        {/* 分隔线 */}
        <div className="border-t border-gray-100 my-6"></div>

        {/* 第二行：评测 + 新手入口 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* 评测 */}
          <div className="lg:col-span-3">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">深度评测</h2>
              <Link href="/guide" className="text-[11px] text-blue-600 hover:underline">全部 →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {GUIDES.map(g => (
                <Link key={g.slug} href={`/guide/${g.slug}`}
                  className="text-sm text-gray-600 hover:text-blue-600 transition py-1">
                  {g.title}
                </Link>
              ))}
            </div>
          </div>

          {/* 新手入口 */}
          <div className="lg:col-span-1">
            <Link href="/essential" className="block group">
              <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600">新手入门</div>
              <div className="text-[11px] text-gray-400 mt-0.5">不知道装什么？从这里开始 →</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
