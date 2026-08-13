'use client'

import { useState } from 'react'
import Link from 'next/link'
import AppSidebar from '@/components/AppSidebar'

/**
 * AI360 首页 v8 — 恢复左侧栏 + filter-bar
 */

const SCENES = [
  { name: '全部', count: 593 },
  { name: '写作创作', count: 68 },
  { name: '数据办公', count: 65 },
  { name: '研究分析', count: 35 },
  { name: '开发编程', count: 106 },
  { name: '设计媒体', count: 37 },
  { name: '自动化', count: 52 },
  { name: 'AI增强', count: 20 },
]

const TYPES = ['全部', 'Skill', '工具', 'MCP', '插件']

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
  const [activeScene, setActiveScene] = useState('全部')
  const [activeType, setActiveType] = useState('全部')

  return (
    <div className="page-wrapper flex">
      <AppSidebar />

      <main className="flex-1 min-w-0 px-6 md:px-10 py-6">
        {/* 定位 + h1 */}
        <div className="pb-2">
          <h1 className="text-[18px] font-bold text-[#1F2937] mb-1">
            发现最适合你的 AI 工具
          </h1>
          <p className="text-[13px] text-[#9CA3AF]">593 个工具 · 19 个平台 · 独立评测 · 每日更新</p>
        </div>

        {/* filter-bar 场景筛选 */}
        <div className="flex items-center gap-2 py-3 border-b border-[#F0F0F0] overflow-x-auto scrollbar-hide">
          {SCENES.map(s => (
            <button key={s.name} onClick={() => setActiveScene(s.name)}
              className={`text-[13px] px-3.5 py-1.5 rounded-full border whitespace-nowrap transition ${
                activeScene === s.name
                  ? 'bg-[#FF8C00] text-white border-[#FF8C00] font-semibold'
                  : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#FF8C00] hover:text-[#1F2937]'
              }`}>
              {s.name}
              <span className={`ml-1 text-[11px] ${activeScene === s.name ? 'text-white/70' : 'text-[#9CA3AF]'}`}>{s.count}</span>
            </button>
          ))}
        </div>

        {/* 类型 Tab + 排序 */}
        <div className="flex items-center gap-2 py-3">
          {TYPES.map(t => (
            <button key={t} onClick={() => setActiveType(t)}
              className={`text-[14px] px-4 py-1.5 rounded-full border font-medium transition ${
                activeType === t ? 'bg-[#FF8C00] text-white border-[#FF8C00]' : 'text-[#6B7280] border-[#E5E7EB] hover:border-[#FF8C00] hover:text-[#1F2937]'
              }`}>
              {t}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[14px] text-[#9CA3AF]">共 593 个工具</span>
            <select className="text-[14px] text-[#4B5563] border border-[#E5E7EB] rounded-md px-2 py-1 bg-white outline-none">
              <option>综合评分</option>
              <option>最新上架</option>
              <option>评分最高</option>
            </select>
          </div>
        </div>

        {/* 工具卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
          {FEATURED.map(skill => (
            <Link key={skill.href} href={skill.href}
              className="content-card block p-5 group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  {skill.icon ? (
                    <img src={skill.icon} alt={skill.name} loading="lazy" className="w-9 h-9 rounded-[10px] object-cover shrink-0" />
                  ) : (
                    <span className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[14px] font-bold text-white shrink-0" style={{ backgroundColor: skill.color }}>
                      {skill.name[0]}
                    </span>
                  )}
                  <div>
                    <div className="text-[15px] font-semibold text-[#1F2937] group-hover:text-[#FF8C00] transition">{skill.name}</div>
                    <div className="text-[11px] text-[#9CA3AF]">{skill.platform}</div>
                  </div>
                </div>
                <span className="text-[15px] font-bold text-[#FF8C00]">{skill.score}</span>
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
        <div className="border-t border-[#F0F0F0] pt-6 pb-8">
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
