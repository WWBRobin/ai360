'use client'

import { useState } from 'react'
import Link from 'next/link'

/**
 * AI360 首页 — 灵光色 #FF8C00 极简线条风格
 * 侧栏：透明无边框，平台多选，LEARN引导式入口
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

const FEATURED = [
  { name: 'Tavily', score: 4.9, platform: 'MCP', desc: '让 AI 联网搜索最新信息', free: '免费1000次/月', difficulty: 4, stability: 5, href: '/skill/tavily-search' },
  { name: 'claude-mem', score: 4.8, platform: 'Claude', desc: '让 AI 跨会话记住项目上下文', free: '完全免费', difficulty: 2, stability: 3, href: '/skill/claude-mem' },
  { name: 'Composio', score: 4.7, platform: 'MCP', desc: '让 AI 一次连接 1000+ 外部应用', free: '免费2万次/月', difficulty: 3, stability: 4, href: '/skill/composio' },
  { name: 'Brave Search', score: 4.8, platform: 'MCP', desc: '免费 AI 搜索引擎，无需 API Key', free: '免费2000次/月', difficulty: 4, stability: 4, href: '/skill/brave-search-mcp' },
  { name: 'Frontend Design', score: 4.7, platform: 'Claude', desc: 'AI 生成专业级前端 UI 设计', free: '免费', difficulty: 3, stability: 4, href: '/skill/frontend-design' },
  { name: 'Systematic Debugging', score: 4.5, platform: 'Hermes', desc: '4 阶段根因调试方法论', free: '完全免费', difficulty: 4, stability: 5, href: '/skill/systematic-debugging' },
]

const GUIDES = [
  { slug: 'install-guide', title: '装机必备完整指南', desc: '30分钟配齐所有基础工具' },
  { slug: 'memory-comparison', title: 'AI 怎么记住你？4款横评', desc: 'claude-mem / Mem0 / Supermemory 实测' },
  { slug: 'search-comparison', title: '怎么让 AI 能上网？3款对比', desc: 'Tavily / Firecrawl / Brave Search' },
  { slug: 'ecommerce-copy', title: '电商文案 Skill 实测', desc: '3款文案工具谁写的好' },
]

export default function HomePortal() {
  const [platforms, setPlatforms] = useState<string[]>(['hermes'])
  const [sceneTab, setSceneTab] = useState('all')
  const [typeTab, setTypeTab] = useState('all')

  const togglePlatform = (slug: string) => {
    setPlatforms(prev => {
      if (prev.includes(slug)) return prev.filter(p => p !== slug)
      if (prev.length >= 3) return [slug, ...prev.slice(0, 2)] // 最多3个，新的置顶
      return [...prev, slug]
    })
  }

  // 排序：选中的置顶
  const sortedPlatforms = [...PLATFORMS].sort((a, b) => {
    const ai = platforms.indexOf(a.slug)
    const bi = platforms.indexOf(b.slug)
    if (ai !== -1 && bi === -1) return -1
    if (ai === -1 && bi !== -1) return 1
    return 0
  })

  return (
    <div className="page-wrapper flex">
      {/* === 左侧栏 — 透明无边框 === */}
      <aside className="hidden md:block w-[260px] shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto px-4 py-6">
        
        {/* 搜索框 */}
        <form action="/search" className="search-input flex items-center gap-2 px-3 py-2 mb-5">
          <span className="text-[#D1D5DB] text-sm">⌕</span>
          <input type="text" name="q" placeholder="搜索平台" className="flex-1 bg-transparent border-none outline-none text-sm text-[#1F2937] placeholder:text-[#D1D5DB]" />
        </form>

        {/* PLATFORMS */}
        <div className="mb-5">
          <h3 className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-[0.05em] px-3 mb-2">PLATFORMS</h3>
          <nav>
            {sortedPlatforms.map(p => {
              const active = platforms.includes(p.slug)
              return (
                <button key={p.slug} onClick={() => togglePlatform(p.slug)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition relative mb-0.5 ${
                    active ? 'bg-[rgba(255,140,0,0.12)]' : 'hover:bg-[rgba(255,140,0,0.06)]'
                  }`}>
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#FF8C00] rounded-[2px]" />}
                  <span className={`pl-2 ${active ? 'font-semibold text-[#FF8C00]' : 'text-[#1F2937] font-medium'}`}>{p.name}</span>
                  <span className={`text-xs ${active ? 'text-[#FF8C00]' : 'text-[#9CA3AF]'}`}>{p.count}</span>
                </button>
              )
            })}
          </nav>
          <Link href="/search" className="flex items-center justify-center px-3 py-1.5 mt-2 border border-dashed border-[#E5E7EB] rounded-lg text-xs text-[#6B7280] hover:border-[#FF8C00] hover:text-[#FF8C00] transition">
            全部平台(19个) →
          </Link>
        </div>

        {/* 新手引导横幅 */}
        <Link href="/essential" className="flex items-center gap-2.5 px-3 py-2.5 mb-3 border border-[#F0F0F0] rounded-[10px] hover:border-[#FF8C00] hover:bg-[rgba(255,140,0,0.04)] transition group">
          <span className="text-base shrink-0">👋</span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-[#1F2937]">第一次来？</div>
            <div className="text-[11px] text-[#9CA3AF] leading-tight">3 分钟找到你需要的 Skill</div>
          </div>
          <span className="text-sm text-[#9CA3AF] group-hover:text-[#FF8C00] transition shrink-0">→</span>
        </Link>

        {/* LEARN — 引导式卡片 */}
        <div>
          <h3 className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-[0.05em] px-3 mb-2">LEARN</h3>
          
          <Link href="/scenario/content-creation" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,140,0,0.06)] transition mb-1">
            <span className="w-7 h-7 flex items-center justify-center bg-[rgba(255,140,0,0.08)] rounded-md text-sm shrink-0">🎯</span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-[#1F2937]">按场景找 Skill</div>
              <div className="text-[11px] text-[#9CA3AF] leading-tight">不知道用什么？从需求出发</div>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(255,140,0,0.12)] text-[#E67300] font-semibold shrink-0">新手推荐</span>
          </Link>

          <Link href="/platform/hermes" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,140,0,0.06)] transition mb-1">
            <span className="w-7 h-7 flex items-center justify-center bg-[rgba(255,140,0,0.08)] rounded-md text-sm shrink-0">🔧</span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-[#1F2937]">按工具学</div>
              <div className="text-[11px] text-[#9CA3AF] leading-tight">深入了解每个平台的玩法</div>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(0,0,0,0.04)] text-[#9CA3AF] shrink-0">进阶</span>
          </Link>

          <Link href="/compare" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,140,0,0.06)] transition">
            <span className="w-7 h-7 flex items-center justify-center bg-[rgba(255,140,0,0.08)] rounded-md text-sm shrink-0">📊</span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-[#1F2937]">工具对比</div>
              <div className="text-[11px] text-[#9CA3AF] leading-tight">同功能不同平台怎么选</div>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(0,0,0,0.04)] text-[#9CA3AF] shrink-0">实用</span>
          </Link>
        </div>
      </aside>

      {/* === 主内容区 === */}
      <main className="flex-1 min-w-0 px-6 md:px-10 py-6">
        
        {/* 场景 Tab 第一行 */}
        <div className="flex gap-1 border-b border-[#F0F0F0] mb-3 overflow-x-auto scrollbar-hide">
          {['all', '写作创作', '数据办公', '研究分析', '开发编程', '设计媒体', '自动化', 'AI增强'].map((s, i) => (
            <button key={s} onClick={() => setSceneTab(s)}
              className={`px-4 py-2.5 text-sm border-b-2 transition whitespace-nowrap ${
                sceneTab === s ? 'border-[#FF8C00] text-[#FF8C00] font-medium' : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
              }`}>
              {s === 'all' ? '全部' : s}
              {s !== 'all' && <span className="ml-1 text-[10px] text-[#9CA3AF]">{[68,65,35,106,37,52,20][i-1]}</span>}
            </button>
          ))}
        </div>

        {/* 类型 Tab 第二行 */}
        <div className="flex gap-1 mb-5">
          {['all', 'Skill', '工具', 'MCP', '插件'].map(t => (
            <button key={t} onClick={() => setTypeTab(t)}
              className={`px-3 py-1 text-[13px] rounded-md transition ${
                typeTab === t ? 'bg-[rgba(255,140,0,0.12)] text-[#FF8C00] font-medium' : 'text-[#9CA3AF] hover:text-[#4B5563]'
              }`}>
              {t === 'all' ? '全部' : t}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[13px] text-[#9CA3AF]">共 528 个工具</span>
            <select className="text-[13px] text-[#4B5563] border border-[#E5E7EB] rounded-md px-2 py-1 bg-white">
              <option>综合评分</option>
              <option>最新上架</option>
              <option>评分最高</option>
            </select>
          </div>
        </div>

        {/* 工具卡片网格 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {FEATURED.map(skill => (
            <Link key={skill.href} href={skill.href}
              className="content-card block p-5 group">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-sm font-semibold text-[#1F2937] group-hover:text-[#FF8C00]">{skill.name}</span>
                  <span className="ml-2 text-[11px] text-[#9CA3AF]">{skill.platform}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tag tag-free">免费</span>
                  <span className="text-base font-bold text-[#FF8C00]">{skill.score}</span>
                </div>
              </div>
              <p className="text-xs text-[#4B5563] mb-3 leading-relaxed">{skill.desc}</p>
              <div className="flex items-center gap-4 pt-2 border-t border-[#F8F8F8] text-[11px] text-[#9CA3AF]">
                <span>上手 {skill.difficulty}/5</span>
                <span>稳定 {skill.stability}/5</span>
                <span className="text-[#4B5563]">{skill.free}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* 评测文章 */}
        <div className="mt-8 pt-6 border-t border-[#F0F0F0]">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#1F2937]">深度评测</h2>
            <Link href="/guide" className="text-xs text-[#FF8C00] hover:underline">全部 →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {GUIDES.map(g => (
              <Link key={g.slug} href={`/guide/${g.slug}`}
                className="block p-3 border border-[#F0F0F0] rounded-lg hover:border-[#E5E7EB] transition group">
                <h3 className="text-xs font-medium text-[#1F2937] group-hover:text-[#FF8C00] mb-1 leading-snug">{g.title}</h3>
                <p className="text-[11px] text-[#9CA3AF]">{g.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
