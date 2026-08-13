'use client'

import { useState } from 'react'
import Link from 'next/link'

/**
 * AI360 首页 — 灵光色 #FF8C00 极简线条风格
 * 字体层级5级：18px(区块标题)/15px(卡片标题)/14px(正文导航)/13px(描述)/11px(标签)
 */

const PLATFORMS = [
  { slug: 'hermes', name: 'Hermes', count: 271, logo: 'https://avatars.githubusercontent.com/u/193596547?v=4', color: '#6366f1' },
  { slug: 'gpts', name: 'GPTs', count: 86, logo: '', color: '#10a37f' },
  { slug: 'coze', name: '扣子', count: 25, logo: '', color: '#3b82f6' },
  { slug: 'saas', name: 'SaaS', count: 24, logo: '', color: '#8b5cf6' },
  { slug: 'mcp', name: 'MCP', count: 22, logo: '', color: '#f59e0b' },
  { slug: 'claude', name: 'Claude', count: 20, logo: '', color: '#d97706' },
  { slug: 'openclaw', name: 'OpenClaw', count: 14, logo: 'https://avatars.githubusercontent.com/u/183860714?v=4', color: '#ef4444' },
  { slug: 'codex', name: 'Codex', count: 8, logo: '', color: '#06b6d4' },
  { slug: 'dify', name: 'Dify', count: 7, logo: '', color: '#2563eb' },
  { slug: 'n8n', name: 'n8n', count: 4, logo: '', color: '#ea580c' },
  { slug: 'claude-code', name: 'Claude Code', count: 4, logo: '', color: '#d97706' },
  { slug: 'qwen', name: '千问', count: 2, logo: '', color: '#7c3aed' },
]

const FEATURED = [
  { name: 'Brave Search MCP', score: 4.8, platform: 'MCP', desc: '免费 AI 搜索引擎，无需 API Key', free: '免费2000次/月', difficulty: 4, stability: 4, href: '/skill/brave-search-mcp', icon: '', color: '#ef4444' },
  { name: 'Hermes Hook 引擎', score: 4.8, platform: 'Hermes', desc: '21个Hook+40条规则，防幻觉+质量门控', free: '完全免费', difficulty: 4, stability: 5, href: '/skill/hermes-hooks', icon: 'https://avatars.githubusercontent.com/u/193596547?v=4', color: '#6366f1' },
  { name: '系统化根因调试', score: 5.0, platform: 'Hermes', desc: '4阶段调试：先理解bug再修复', free: '完全免费', difficulty: 4, stability: 5, href: '/skill/systematic-debugging', icon: 'https://avatars.githubusercontent.com/u/193596547?v=4', color: '#6366f1' },
  { name: '流行Web设计系统库', score: 5.0, platform: 'Hermes', desc: '54套真实设计系统(Stripe/Linear/Vercel)', free: '完全免费', difficulty: 3, stability: 5, href: '/skill/popular-web-designs', icon: 'https://avatars.githubusercontent.com/u/193596547?v=4', color: '#6366f1' },
  { name: 'GitHub PR 工作流', score: 5.0, platform: 'Hermes', desc: 'PR全生命周期：分支/提交/CI/合并', free: '完全免费', difficulty: 3, stability: 5, href: '/skill/github-pr-workflow', icon: 'https://avatars.githubusercontent.com/u/193596547?v=4', color: '#6366f1' },
  { name: 'AI工具评测框架', score: 5.0, platform: 'Hermes', desc: '5问框架评测任何AI工具/Skill', free: '完全免费', difficulty: 3, stability: 5, href: '/skill/ai-tool-evaluation', icon: 'https://avatars.githubusercontent.com/u/193596547?v=4', color: '#6366f1' },
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
      if (prev.length >= 3) return [slug, ...prev.slice(0, 2)]
      return [...prev, slug]
    })
  }

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
          <span className="text-[#D1D5DB] text-[14px]">⌕</span>
          <input type="text" name="q" placeholder="搜索平台" className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#1F2937] placeholder:text-[#D1D5DB]" />
        </form>

        {/* PLATFORMS */}
        <div className="mb-5">
          <h3 className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-[0.05em] px-3 mb-2">PLATFORMS</h3>
          <nav>
            {sortedPlatforms.map(p => {
              const active = platforms.includes(p.slug)
              return (
                <Link key={p.slug} href={`/platform/${p.slug}`}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] transition relative mb-0.5 ${
                    active ? 'bg-[rgba(255,140,0,0.12)]' : 'hover:bg-[rgba(255,140,0,0.06)]'
                  }`}>
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#FF8C00] rounded-[2px]" />}
                  <div className="flex items-center gap-2 pl-2">
                    {p.logo ? (
                      <img src={p.logo} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
                    ) : (
                      <span className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ backgroundColor: p.color }}>
                        {p.name[0]}
                      </span>
                    )}
                    <span className={`${active ? 'font-semibold text-[#FF8C00]' : 'text-[#1F2937] font-medium'}`}>{p.name}</span>
                  </div>
                  <span className={`text-[11px] ${active ? 'text-[#FF8C00]' : 'text-[#9CA3AF]'}`}>{p.count}</span>
                </Link>
              )
            })}
          </nav>
          <Link href="/search" className="flex items-center justify-center px-3 py-1.5 mt-2 border border-dashed border-[#E5E7EB] rounded-lg text-[14px] text-[#6B7280] hover:border-[#FF8C00] hover:text-[#FF8C00] transition">
            全部平台(19个) →
          </Link>
        </div>

        {/* 新手引导横幅 */}
        <Link href="/essential" className="flex items-center gap-2.5 px-3 py-2.5 mb-3 border border-[#F0F0F0] rounded-[10px] hover:border-[#FF8C00] hover:bg-[rgba(255,140,0,0.04)] transition group">
          <span className="text-[16px] shrink-0">👋</span>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-[#1F2937]">第一次来？</div>
            <div className="text-[13px] text-[#9CA3AF] leading-tight">3 分钟找到你需要的 Skill</div>
          </div>
          <span className="text-[14px] text-[#9CA3AF] group-hover:text-[#FF8C00] transition shrink-0">→</span>
        </Link>

        {/* LEARN — 引导式卡片 */}
        <div>
          <h3 className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-[0.05em] px-3 mb-2">LEARN</h3>
          
          <Link href="/scenario/content-creation" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,140,0,0.06)] transition mb-1">
            <span className="w-7 h-7 flex items-center justify-center bg-[rgba(255,140,0,0.08)] rounded-md text-[14px] shrink-0">🎯</span>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-[#1F2937]">按场景找 Skill</div>
              <div className="text-[13px] text-[#9CA3AF] leading-tight">不知道用什么？从需求出发</div>
            </div>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[rgba(255,140,0,0.12)] text-[#E67300] font-semibold shrink-0">新手推荐</span>
          </Link>

          <Link href="/platform/hermes" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,140,0,0.06)] transition mb-1">
            <span className="w-7 h-7 flex items-center justify-center bg-[rgba(255,140,0,0.08)] rounded-md text-[14px] shrink-0">🔧</span>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-[#1F2937]">按工具学</div>
              <div className="text-[13px] text-[#9CA3AF] leading-tight">深入了解每个平台的玩法</div>
            </div>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[rgba(0,0,0,0.04)] text-[#9CA3AF] shrink-0">进阶</span>
          </Link>

          <Link href="/compare" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,140,0,0.06)] transition">
            <span className="w-7 h-7 flex items-center justify-center bg-[rgba(255,140,0,0.08)] rounded-md text-[14px] shrink-0">📊</span>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-[#1F2937]">工具对比</div>
              <div className="text-[13px] text-[#9CA3AF] leading-tight">同功能不同平台怎么选</div>
            </div>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[rgba(0,0,0,0.04)] text-[#9CA3AF] shrink-0">实用</span>
          </Link>
        </div>
      </aside>

      {/* === 主内容区 === */}
      <main className="flex-1 min-w-0 px-6 md:px-10 py-6">
        
        {/* 场景 Tab 第一行 */}
        <div className="flex gap-1 border-b border-[#F0F0F0] mb-3 overflow-x-auto scrollbar-hide">
          {['all', '写作创作', '数据办公', '研究分析', '开发编程', '设计媒体', '自动化', 'AI增强'].map((s, i) => (
            <button key={s} onClick={() => setSceneTab(s)}
              className={`px-4 py-2.5 text-[14px] border-b-2 transition whitespace-nowrap ${
                sceneTab === s ? 'border-[#FF8C00] text-[#FF8C00] font-medium' : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
              }`}>
              {s === 'all' ? '全部' : s}
              {s !== 'all' && <span className="ml-1 text-[11px] text-[#9CA3AF]">{[68,65,35,106,37,52,20][i-1]}</span>}
            </button>
          ))}
        </div>

        {/* 类型 Tab 第二行 + 排序 */}
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
            <span className="text-[14px] text-[#9CA3AF]">共 528 个工具</span>
            <select className="text-[14px] text-[#4B5563] border border-[#E5E7EB] rounded-md px-2 py-1 bg-white">
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
                <div className="flex items-center gap-2">
                  {skill.icon ? (
                    <img src={skill.icon} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                  ) : (
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] font-bold text-white shrink-0" style={{ backgroundColor: skill.color }}>
                      {skill.name[0]}
                    </span>
                  )}
                  <div>
                    <span className="text-[15px] font-semibold text-[#1F2937] group-hover:text-[#FF8C00]">{skill.name}</span>
                    <span className="ml-2 text-[11px] text-[#9CA3AF]">{skill.platform}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tag tag-free">免费</span>
                  <span className="text-[15px] font-bold text-[#FF8C00]">{skill.score}</span>
                </div>
              </div>
              <p className="text-[13px] text-[#4B5563] mb-3 leading-relaxed">{skill.desc}</p>
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
            <h2 className="text-[18px] font-bold text-[#1F2937]">深度评测</h2>
            <Link href="/guide" className="text-[13px] text-[#FF8C00] hover:underline">全部 →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {GUIDES.map(g => (
              <Link key={g.slug} href={`/guide/${g.slug}`}
                className="block p-3 border border-[#F0F0F0] rounded-lg hover:border-[#E5E7EB] transition group">
                <h3 className="text-[14px] font-medium text-[#1F2937] group-hover:text-[#FF8C00] mb-1 leading-snug">{g.title}</h3>
                <p className="text-[13px] text-[#9CA3AF]">{g.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
