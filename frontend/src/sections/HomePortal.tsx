'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import AppSidebar from '@/components/AppSidebar'
import type { SkillCard } from '@/types'

/**
 * AI360 首页 — 功能页（筛选全在当前页，不跳转）
 */

const TYPES = ['全部', 'Skill', '工具', 'MCP']

const GUIDES = [
  { slug: 'install-guide', title: '装机必备完整指南', desc: '30分钟配齐所有基础工具' },
  { slug: 'memory-comparison', title: 'AI 怎么记住你？4款横评', desc: 'claude-mem / Mem0 / Supermemory 实测' },
  { slug: 'search-comparison', title: '怎么让 AI 能上网？3款对比', desc: 'Tavily / Firecrawl / Brave Search' },
  { slug: 'ecommerce-copy', title: '电商文案 Skill 实测', desc: '3款文案工具谁写的好' },
]

export default function HomePortal({
  totalCount = 0,
  platformCount = 0,
  sceneCounts = {},
  skills = [],
}: {
  totalCount?: number
  platformCount?: number
  sceneCounts?: Record<string, number>
  skills?: SkillCard[]
}) {
  const [activeScene, setActiveScene] = useState('all')
  const [activeType, setActiveType] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [showCount, setShowCount] = useState(20)

  const SCENES = [
    { slug: 'all', name: '全部', count: totalCount },
    { slug: 'content-creation', name: '写作创作', count: sceneCounts['content-creation'] || 0 },
    { slug: 'office', name: '数据办公', count: sceneCounts['office'] || 0 },
    { slug: 'research', name: '研究分析', count: sceneCounts['research'] || 0 },
    { slug: 'code', name: '开发编程', count: sceneCounts['code'] || 0 },
    { slug: 'design', name: '设计媒体', count: sceneCounts['design'] || 0 },
    { slug: 'automation', name: '自动化', count: sceneCounts['automation'] || 0 },
    { slug: 'model-router', name: 'AI增强', count: sceneCounts['model-router'] || 0 },
  ]

  // 当前页筛选
  const filteredSkills = useMemo(() => {
    let result = [...skills]

    // 场景筛选
    if (activeScene !== 'all') {
      result = result.filter(s => s.scenario_slugs?.includes(activeScene))
    }

    // 类型筛选（用 category 字段）
    if (activeType !== 'all') {
      if (activeType === 'MCP') {
        result = result.filter(s => s.slug.includes('mcp') || s.name.toLowerCase().includes('mcp'))
      } else if (activeType === 'Skill') {
        result = result.filter(s => s.category !== 'infrastructure')
      } else if (activeType === '工具') {
        result = result.filter(s => s.api_supported)
      }
    }

    // 排序
    if (sortBy === 'score') {
      result.sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [skills, activeScene, activeType, sortBy])

  const displayedSkills = filteredSkills.slice(0, showCount)

  return (
    <div className="page-wrapper">
      {/* 标题区 — 横跨全宽，对标 mcp.so */}
      <div className="px-6 md:px-10 pt-10 pb-4">
        <h1 className="text-[28px] font-bold text-[#1F2937] leading-tight">发现最适合你的 AI 工具</h1>
        <p className="text-[15px] text-[#9CA3AF] mt-1.5">{totalCount} 个工具 · {platformCount} 个平台 · 独立评测</p>
      </div>
      {/* 双栏 */}
      <div className="flex">
      <AppSidebar />

      <main className="flex-1 min-w-0 px-6 md:px-10 pb-10">

        {/* 场景筛选 — 当前页筛选不跳转 */}
        <div className="flex items-center gap-2 py-3 border-b border-[#F0F0F0] overflow-x-auto scrollbar-hide">
          {SCENES.map(s => (
            <button
              key={s.slug}
              onClick={() => setActiveScene(s.slug)}
              className={`text-[13px] px-3.5 py-1.5 rounded-full border whitespace-nowrap transition ${
                activeScene === s.slug
                  ? 'bg-[#FF8C00] text-white border-[#FF8C00] font-semibold'
                  : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#FF8C00] hover:text-[#1F2937]'
              }`}
            >
              {s.name}
              <span className={`ml-1 text-[11px] ${activeScene === s.slug ? 'text-white/70' : 'text-[#9CA3AF]'}`}>{s.count}</span>
            </button>
          ))}
        </div>

        {/* 类型Tab + 排序 — 当前页 */}
        <div className="flex items-center gap-2 py-3">
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => setActiveType(t === '全部' ? 'all' : t)}
              className={`text-[14px] px-4 py-1.5 rounded-full border font-medium transition ${
                (t === '全部' && activeType === 'all') || activeType === t
                  ? 'bg-[#FF8C00] text-white border-[#FF8C00]'
                  : 'text-[#6B7280] border-[#E5E7EB] hover:border-[#FF8C00] hover:text-[#1F2937]'
              }`}
            >
              {t}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[14px] text-[#9CA3AF]">共 {filteredSkills.length} 个</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-[14px] text-[#4B5563] border border-[#E5E7EB] rounded-md px-2 py-1 bg-white outline-none"
            >
              <option value="score">综合评分</option>
              <option value="name">名称排序</option>
            </select>
          </div>
        </div>

        {/* 工具卡片网格 — 动态渲染筛选结果 */}
        {filteredSkills.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[14px] text-[#9CA3AF]">该筛选下暂无工具</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
            {displayedSkills.map(skill => (
              <Link key={skill.slug} href={`/skill/${skill.slug}`} className="content-card block p-5 group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    {skill.icon_url ? (
                      <img src={skill.icon_url} alt={skill.name} loading="lazy" className="w-9 h-9 rounded-[10px] object-cover shrink-0" />
                    ) : skill.platform_slug ? (
                      <img src={`/platform-logos/${skill.platform_slug}.png`} alt={skill.name} loading="lazy" className="w-9 h-9 rounded-[10px] object-cover shrink-0"
                        onError={e => { e.currentTarget.style.display = 'none' }} />
                    ) : (
                      <span className="w-9 h-9 rounded-[10px] bg-[#FF8C00] flex items-center justify-center text-[14px] font-bold text-white shrink-0">
                        {skill.name[0]}
                      </span>
                    )}
                    <div>
                      <div className="text-[15px] font-semibold text-[#1F2937] group-hover:text-[#FF8C00] transition">{skill.name}</div>
                      <div className="text-[11px] text-[#9CA3AF]">{skill.platform_name}</div>
                    </div>
                  </div>
                  {skill.overall_score && (
                    <span className="text-[15px] font-bold text-[#FF8C00]">{skill.overall_score.toFixed(1)}</span>
                  )}
                </div>
                <p className="text-[13px] text-[#4B5563] mb-2 leading-relaxed line-clamp-2">{skill.tagline}</p>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {skill.overall_score && <span className="tag tag-tested">AI360 实测</span>}
                  {!skill.overall_score && <span className="tag" style={{ background: '#F3F4F6', color: '#9CA3AF' }}>收录未评测</span>}
                  {skill.free_quota && <span className="tag tag-free">免费</span>}
                </div>
                {skill.overall_score && (
                  <div className="flex items-center gap-4 pt-2 border-t border-[#F8F8F8] text-[11px] text-[#9CA3AF]">
                    <span>上手 {skill.difficulty_score}/5</span>
                    <span>稳定 {skill.stability_score}/5</span>
                    {skill.free_quota && <span className="text-[#4B5563]">{skill.free_quota.substring(0, 15)}</span>}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* 加载更多 */}
        {filteredSkills.length > displayedSkills.length && (
          <div className="text-center pb-8">
            <button onClick={() => setShowCount(prev => prev + 20)} className="btn-outline px-6 py-2 text-[14px]">
              加载更多（还有 {filteredSkills.length - displayedSkills.length} 个）
            </button>
          </div>
        )}

        {/* 评测文章 */}
        <div className="border-t border-[#F0F0F0] pt-6 pb-8">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[18px] font-bold text-[#1F2937]">深度评测</h2>
            <Link href="/guide" className="text-[13px] text-[#FF8C00] hover:underline">全部 →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {GUIDES.map(g => (
              <Link key={g.slug} href={`/guide/${g.slug}`} className="block p-3 border border-[#F0F0F0] rounded-lg hover:border-[#E5E7EB] transition group">
                <h3 className="text-[14px] font-medium text-[#1F2937] group-hover:text-[#FF8C00] mb-1 leading-snug">{g.title}</h3>
                <p className="text-[13px] text-[#9CA3AF]">{g.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      </div>
    </div>
  )
}
