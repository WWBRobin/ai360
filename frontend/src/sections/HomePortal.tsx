'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import AppSidebar from '@/components/AppSidebar'
import LevelFilterSwitch from '@/components/LevelFilterSwitch'
import { useUserLevel } from '@/hooks/useUserLevel'
import { fitSkill, sortBySmartFit, LEVEL_FILTER_STORAGE_KEY, LEVEL_DIFFICULTY_META, levelToNumber, type FitKind } from '@/lib/levels'
import type { SkillCard } from '@/types'

/**
 * ArcDock 首页 — 功能页（筛选全在当前页，不跳转）
 */

const TYPES = ['全部', 'Skill', '工具', 'MCP']

/** 类型互斥口径：MCP(slug/name含mcp) / 工具(有API且非MCP) / Skill(其余) —— 三类互斥，和=全部 */
const isMcpSkill = (s: SkillCard) => s.slug.includes('mcp') || s.name.toLowerCase().includes('mcp')
const isToolSkill = (s: SkillCard) => !!s.api_supported && !isMcpSkill(s)

/** 类型 Tab 实时计数 — 与 activeType 筛选逻辑严格同口径（基于平台过滤后的集合） */
function typeCount(platformSkills: SkillCard[], t: string): number {
  if (t === '全部') return platformSkills.length
  if (t === 'MCP') return platformSkills.filter(isMcpSkill).length
  if (t === '工具') return platformSkills.filter(isToolSkill).length
  return platformSkills.filter(s => !isMcpSkill(s) && !isToolSkill(s)).length
}

const GUIDES = [
  { slug: 'install-guide', title: '装机必备完整指南', desc: '30分钟配齐所有基础工具' },
  { slug: 'memory-comparison', title: 'AI 怎么记住你？4款横评', desc: 'claude-mem / Mem0 / Supermemory 实测' },
  { slug: 'search-comparison', title: '怎么让 AI 能上网？3款对比', desc: 'Tavily / Firecrawl / Brave Search' },
  { slug: 'ecommerce-copy', title: '电商文案 Skill 实测', desc: '3款文案工具谁写的好' },
]

/** 未标注 L 档时的兜底：老 difficulty_score（1-5，越高越易）→ 简易文案 */
function difficultyLabel(score: number | null | undefined): string {
  if (score == null) return '—'
  if (score >= 4.5) return '一看就会'
  if (score >= 3.5) return '简单配置'
  if (score >= 2.5) return '需要理解工作流'
  if (score >= 1.5) return '需要技术基础'
  return '需要开发能力'
}

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
  const [searchQuery, setSearchQuery] = useState('')
  const [showCount, setShowCount] = useState(20)
  const [levelFilter, setLevelFilter] = useState(false)
  const { level: userLevel, loaded: levelLoaded } = useUserLevel()
  // 平台过滤（侧栏多选联动）
  const [platformFilter, setPlatformFilter] = useState<string[]>([])
  useEffect(() => {
    // 深链支持：/skills/classic?platform=xxx（软件管家 Skill 类"去 Skill中心找"入口）。
    // 纯客户端读 location.search（不用 useSearchParams，避免 SSR/Suspense 坑），只在该参数存在时覆盖一次。
    try {
      const q = new URLSearchParams(window.location.search).get('platform')
      if (q) {
        const fromDeep = [q]
        setPlatformFilter(fromDeep)
        localStorage.setItem('arcdock-platform-filter', JSON.stringify(fromDeep))
        window.dispatchEvent(new CustomEvent('arcdock-platform-change', { detail: fromDeep }))
        return
      }
    } catch {}
    try {
      const saved = JSON.parse(localStorage.getItem('arcdock-platform-filter') || '[]')
      if (Array.isArray(saved)) setPlatformFilter(saved)
    } catch {}
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string[]>).detail
      if (Array.isArray(detail)) setPlatformFilter(detail)
    }
    window.addEventListener('arcdock-platform-change', onChange)
    return () => window.removeEventListener('arcdock-platform-change', onChange)
  }, [])

  // localStorage 恢复开关状态（仅在已评测时生效）
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LEVEL_FILTER_STORAGE_KEY)
      if (saved === 'on') setLevelFilter(true)
    } catch {}
  }, [])

  // 智能筛选是否生效（已评测 + 开关开启）
  const smartFilterOn = levelFilter && levelLoaded && !!userLevel

  // 平台过滤后的基础集（场景/类型计数口径与之一致）
  const platformSkills = useMemo(
    () => platformFilter.length ? skills.filter(s => platformFilter.includes(s.platform_slug || '')) : skills,
    [skills, platformFilter]
  )

  // 类型过滤后的集合（场景计数基于此——上层筛选影响下层数字）
  const typeFiltered = useMemo(() => {
    if (activeType === 'all') return platformSkills
    if (activeType === 'MCP') return platformSkills.filter(isMcpSkill)
    if (activeType === '工具') return platformSkills.filter(isToolSkill)
    return platformSkills.filter(s => !isMcpSkill(s) && !isToolSkill(s))
  }, [platformSkills, activeType])

  // 场景计数：基于平台+类型过滤后的集合实时计算（数字与实际筛选结果严格一致）
  const sceneCount = (slug: string) => slug === 'all' ? typeFiltered.length : typeFiltered.filter(s => s.scenario_slugs?.includes(slug)).length
  const SCENES = [
    { slug: 'all', name: '全部', count: sceneCount('all') },
    { slug: 'content-creation', name: '写作创作', count: sceneCount('content-creation') },
    { slug: 'office', name: '数据办公', count: sceneCount('office') },
    { slug: 'research', name: '研究分析', count: sceneCount('research') },
    { slug: 'code', name: '开发编程', count: sceneCount('code') },
    { slug: 'design', name: '设计媒体', count: sceneCount('design') },
    { slug: 'automation', name: '自动化', count: sceneCount('automation') },
    { slug: 'model-router', name: 'AI增强', count: sceneCount('model-router') },
    { slug: 'uncategorized', name: '其他', count: sceneCount('uncategorized') },
  ]

  const filteredSkills = useMemo(() => {
    let result = [...platformSkills]

    // 关键词搜索（工具名/平台/标签）
    if (searchQuery.trim()) {
      const kw = searchQuery.trim().toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(kw) ||
        (s.platform_name || '').toLowerCase().includes(kw) ||
        (s.tagline || '').toLowerCase().includes(kw)
      )
    }

    // 场景筛选
    if (activeScene !== 'all') {
      result = result.filter(s => s.scenario_slugs?.includes(activeScene))
    }

    // 类型筛选（互斥口径：MCP / 工具=有API非MCP / Skill=其余）
    if (activeType !== 'all') {
      if (activeType === 'MCP') {
        result = result.filter(isMcpSkill)
      } else if (activeType === 'Skill') {
        result = result.filter(s => !isMcpSkill(s) && !isToolSkill(s))
      } else if (activeType === '工具') {
        result = result.filter(isToolSkill)
      }
    }

    // 排序
    if (smartFilterOn && userLevel) {
      // 智能排序：适配分×0.5 + 热度分×0.3；未标注卡片保持原序（稳定排序）
      result = sortBySmartFit(result, userLevel)
    } else if (sortBy === 'score') {
      result.sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'easiest') {
      result.sort((a, b) => (a.difficulty_score ?? 99) - (b.difficulty_score ?? 99))
    }

    return result
  }, [platformSkills, searchQuery, activeScene, activeType, sortBy, smartFilterOn, userLevel])

  const displayedSkills = filteredSkills.slice(0, showCount)

  return (
    <div className="page-wrapper px-4 sm:px-6 lg:px-8">
      {/* 标题区 — 横跨全宽，对标 mcp.so */}
      <div className="pt-10 pb-8">
        <h1 className="text-[28px] font-bold text-[var(--fg)] leading-tight">发现最适合你的 AI 工具</h1>
        <p className="text-[15px] text-[var(--fg3)] mt-1.5">{platformSkills.length} 个工具{platformFilter.length > 0 ? ` · 已选 ${platformFilter.length} 个平台` : ` · ${platformCount} 个平台`} · 独立评测</p>
      </div>
      {/* 双栏 */}
      <div className="flex gap-8">
      <AppSidebar />

      <main className="flex-1 min-w-0 pb-10">

        {/* 类型Tab + 排序 — 第一行（先选形态再选场景） */}
        <div className="flex items-center gap-6 py-1 border-b border-[var(--border)]">
          {TYPES.map(t => {
            const isActive = (t === '全部' && activeType === 'all') || activeType === t
            return (
              <button
                key={t}
                onClick={() => setActiveType(t === '全部' ? 'all' : t)}
                className={`relative inline-flex h-10 shrink-0 items-center px-1 text-sm font-medium whitespace-nowrap transition ${
                  isActive ? 'text-[var(--fg)]' : 'text-[var(--fg3)] hover:text-[var(--fg)]'
                }`}
              >
                {t}
                <span className="ml-1 text-[11px] text-[var(--fg3)]">{typeCount(platformSkills, t)}</span>
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[var(--primary)]" aria-hidden="true" />
                )}
              </button>
            )
          })}
          <div className="ml-auto flex items-center gap-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}` }}
              placeholder="搜索，回车语义搜索"
              className="h-8 w-44 rounded-md border border-[var(--border)] bg-transparent px-2.5 text-[13px] text-[var(--fg)] placeholder:text-[var(--fg4)] outline-none focus:border-[var(--primary)] transition"
            />
            <LevelFilterSwitch
              enabled={levelFilter}
              onChange={setLevelFilter}
            />
            <span className="text-[14px] text-[var(--fg3)]">共 {filteredSkills.length} 个</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-[14px] text-[var(--fg2)] border border-[var(--border)] rounded-md px-2 py-1 bg-[var(--card)] outline-none"
            >
              <option value="score">综合评分</option>
              <option value="easiest">上手最易</option>
              <option value="name">名称排序</option>
            </select>
          </div>
        </div>

        {/* 场景筛选 — 第二行（先形态后场景） */}
        <div className="flex items-center gap-6 py-1 overflow-x-auto scrollbar-hide">
          {SCENES.map(s => (
            <button
              key={s.slug}
              onClick={() => setActiveScene(s.slug)}
              className={`relative inline-flex h-10 shrink-0 items-center px-1 text-sm font-medium whitespace-nowrap transition ${
                activeScene === s.slug
                  ? 'text-[var(--fg)]'
                  : 'text-[var(--fg3)] hover:text-[var(--fg)]'
              }`}
            >
              {s.name}
              <span className="ml-1.5 text-[11px] text-[var(--fg3)]">{s.count}</span>
              {activeScene === s.slug && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[var(--primary)]" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>

        {/* 工具卡片网格 — 动态渲染筛选结果 */}
        {filteredSkills.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[14px] text-[var(--fg3)]">该筛选下暂无工具</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
            {displayedSkills.map(skill => {
              // 智能筛选标记（只对已评测用户 + 有 level_min 标注的卡片生效）
              const fit = smartFilterOn && userLevel ? fitSkill(userLevel, skill) : null
              const fitKind: FitKind | null = fit?.kind === 'later' && fit.adaptScore === 50 ? null : (fit?.kind ?? null)
              const isLocked = fitKind === 'later'
              return (
              <Link key={skill.slug} href={`/skill/${skill.slug}`} className={`content-card block p-5 group relative${isLocked ? ' opacity-60' : ''}`}>
                {/* 锁定卡片保持可点击，仅视觉降级（40% 蒙层由 opacity-60 近似） */}
                {isLocked && (
                  <span className="absolute top-3 right-3 text-[14px] text-[var(--fg3)]" title="当前等级暂不建议，可先收藏">🔒</span>
                )}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    {skill.icon_url ? (
                      <img src={skill.icon_url} alt={skill.name} loading="lazy" className="w-9 h-9 rounded-[10px] object-cover shrink-0" />
                    ) : skill.platform_slug ? (
                      <img src={`/platform-logos/${skill.platform_slug}.png`} alt={skill.name} loading="lazy" className="w-9 h-9 rounded-[10px] object-cover shrink-0"
                        onError={e => { e.currentTarget.style.display = 'none' }} />
                    ) : (
                      <span className="w-9 h-9 rounded-[10px] bg-[var(--primary)] flex items-center justify-center text-[14px] font-semibold text-[var(--on-primary)] shrink-0">
                        {skill.name[0]}
                      </span>
                    )}
                    <div>
                      <div className="text-[15px] font-medium text-[var(--fg)] group-hover:text-[var(--primary)] transition">{skill.name}</div>
                      <div className="text-[11px] text-[var(--fg3)]">{skill.platform_name}</div>
                    </div>
                  </div>
                  {skill.overall_score && (
                    <span className="text-[15px] font-semibold text-[var(--fg2)]">{skill.overall_score.toFixed(1)}</span>
                  )}
                </div>
                <p className="text-[13px] text-[var(--fg2)] mb-2 leading-relaxed line-clamp-2">{skill.tagline}</p>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {skill.overall_score && <span className="tag tag-tested">ArcDock 实测</span>}
                  {!skill.overall_score && <span className="tag" style={{ background: 'var(--bg2)', color: 'var(--fg3)' }}>收录未评测</span>}
                  {skill.free_quota && <span className="tag tag-free">免费</span>}
                  {fitKind === 'fit' && (
                    <span className="tag" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>✅ 适合你</span>
                  )}
                  {fitKind === 'challenge' && (
                    <span className="tag" style={{ background: 'rgba(245,158,11,0.14)', color: '#b45309' }}>⬆️ 进阶挑战</span>
                  )}
                  {fitKind === 'later' && (
                    <span className="tag" style={{ background: 'var(--bg2)', color: 'var(--fg3)' }}>🔒 建议稍后</span>
                  )}
                </div>
                {skill.overall_score && (
                  <div className="flex items-center gap-4 pt-2 border-t border-[var(--bg2)] text-[11px] text-[var(--fg3)]">
                    <span>
                      上手 {skill.level_min
                        ? `${LEVEL_DIFFICULTY_META[skill.level_min as keyof typeof LEVEL_DIFFICULTY_META]?.label ?? skill.level_min}`
                        : difficultyLabel(skill.difficulty_score)}
                    </span>
                    <span>稳定 {skill.stability_score}/5</span>
                    {skill.free_quota && <span className="text-[var(--fg2)]">{skill.free_quota.substring(0, 15)}</span>}
                  </div>
                )}
              </Link>
              )
            })}
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
        <div className="border-t border-[var(--border)] pt-6 pb-8">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[18px] font-bold text-[var(--fg)]">深度评测</h2>
            <Link href="/guide" className="text-[13px] text-[var(--primary)] hover:underline">全部 →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {GUIDES.map(g => (
              <Link key={g.slug} href={`/guide/${g.slug}`} className="block p-3 border border-[var(--border)] rounded-lg hover:border-[var(--border)] transition group">
                <h3 className="text-[14px] font-medium text-[var(--fg)] group-hover:text-[var(--primary)] mb-1 leading-snug">{g.title}</h3>
                <p className="text-[13px] text-[var(--fg3)]">{g.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      </div>
    </div>
  )
}
