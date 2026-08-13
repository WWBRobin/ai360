'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

interface FacetOption {
  slug: string
  name: string
  count: number
  icon?: string
}
interface Facets {
  categories: FacetOption[]
  platforms: FacetOption[]
  scenarios: FacetOption[]
  trialCounts: { yes: number; no: number }
}
interface Filters {
  category: string
  platform: string
  scenario: string
  rating: string
  trial: string
}

interface Props {
  tabs: { key: string; label: string; num?: number }[]
  facets: Facets
  filters: Filters
  query: string
}

type SortKey = 'recommended' | 'rating' | 'latest' | 'easiest'
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recommended', label: '最相关' },
  { value: 'latest', label: '最新上架' },
  { value: 'rating', label: '评分最高' },
  { value: 'easiest', label: '最易上手' },
]

export function SearchControls({ tabs, facets, filters, query }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  const currentSort = (searchParams.get('sort') as SortKey) || 'recommended'
  const currentSortLabel = SORT_OPTIONS.find((s) => s.value === currentSort)?.label || '最相关'

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  // 统一更新 searchParams（保留 q，覆盖某个 key）
  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === 'all' || value === '') params.delete(key)
      else params.set(key, value)
      const qs = params.toString()
      router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  const setSort = (v: SortKey) => {
    updateParam('sort', v === 'recommended' ? null : v)
    setSortOpen(false)
  }

  return (
    <>
      {/* Tab 行 */}
      <div className="border-b border-[rgba(0,0,0,0.06)]">
        <div className="flex gap-0">
          {tabs.map((t) => {
            // 简易 tab：只切换基础筛选（免费/评分/装机必备）
            const tabFilters: Record<string, Partial<Filters>> = {
              all: { trial: 'all', rating: 'all', category: 'all' },
              free: { trial: 'yes', rating: 'all', category: 'all' },
              rating: { rating: '4', trial: 'all', category: 'all' },
              essential: { category: 'infrastructure', trial: 'all', rating: 'all' },
            }
            const isActive =
              (t.key === 'all' && filters.trial === 'all' && filters.rating === 'all' && filters.category === 'all') ||
              (t.key === 'free' && filters.trial === 'yes') ||
              (t.key === 'rating' && filters.rating === '4') ||
              (t.key === 'essential' && filters.category === 'infrastructure')
            const next = tabFilters[t.key] || {}
            const href = (() => {
              const params = new URLSearchParams(searchParams.toString())
              if (query) params.set('q', query)
              for (const [k, v] of Object.entries(next)) {
                if (v === 'all') params.delete(k)
                else params.set(k, v as string)
              }
              const qs = params.toString()
              return `/search${qs ? `?${qs}` : ''}`
            })()
            return (
              <Link
                key={t.key}
                href={href}
                className={`px-[18px] py-2.5 text-[14px] border-b-[3px] -mb-px transition whitespace-nowrap ${
                  isActive
                    ? 'text-[#C99700] font-bold border-[#C99700]'
                    : 'text-[#888] font-medium border-transparent hover:text-[#000]'
                }`}
              >
                {t.label}
                {typeof t.num === 'number' && (
                  <span className={`text-[11px] ml-1 ${isActive ? 'text-[#C99700]' : 'text-[#bbb]'}`}>
                    {t.num}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* 排序 + 筛选维度条 */}
      <div className="flex items-center justify-between py-5 flex-wrap gap-3">
        {/* 左：筛选维度 chips（来自 facets） */}
        <div className="flex items-center gap-2 flex-wrap">
          {facets.categories.length > 0 && (
            <FilterSelect
              label="分类"
              value={filters.category === 'all' ? '全部分类' : facets.categories.find((c) => c.slug === filters.category)?.name || '分类'}
              options={facets.categories.map((c) => ({ value: c.slug, label: `${c.name} (${c.count})` }))}
              allLabel="全部分类"
              current={filters.category}
              onChange={(v) => updateParam('category', v)}
            />
          )}
          {facets.platforms.length > 0 && (
            <FilterSelect
              label="平台"
              value={filters.platform === 'all' ? '全部平台' : facets.platforms.find((p) => p.slug === filters.platform)?.name || '平台'}
              options={facets.platforms.map((p) => ({ value: p.slug, label: `${p.name} (${p.count})` }))}
              allLabel="全部平台"
              current={filters.platform}
              onChange={(v) => updateParam('platform', v)}
            />
          )}
          {facets.scenarios.length > 0 && (
            <FilterSelect
              label="场景"
              value={filters.scenario === 'all' ? '全部场景' : facets.scenarios.find((s) => s.slug === filters.scenario)?.name || '场景'}
              options={facets.scenarios.map((s) => ({ value: s.slug, label: `${s.icon || '🎯'} ${s.name} (${s.count})` }))}
              allLabel="全部场景"
              current={filters.scenario}
              onChange={(v) => updateParam('scenario', v)}
            />
          )}
        </div>

        {/* 右：排序下拉 */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[rgba(0,0,0,0.06)] rounded-lg text-[13px] text-[#555] bg-white cursor-pointer transition hover:border-[#C99700] hover:text-[#C99700]"
          >
            {currentSortLabel} <span style={{ fontSize: '10px' }}>▾</span>
          </button>
          {sortOpen && (
            <div className="absolute top-full right-0 mt-1.5 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)] min-w-[150px] z-50 overflow-hidden">
              {SORT_OPTIONS.map((s) => (
                <div
                  key={s.value}
                  onClick={() => setSort(s.value)}
                  className={`px-4 py-2.5 text-[13px] cursor-pointer transition ${
                    s.value === currentSort
                      ? 'text-[#000] font-semibold bg-[rgba(201,151,0,0.06)]'
                      : 'text-[#555] hover:bg-[#FAFAFA] hover:text-[#C99700]'
                  }`}
                >
                  {s.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ===== 筛选下拉（select 替代） =====
function FilterSelect({
  label,
  value,
  options,
  allLabel,
  current,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  allLabel: string
  current: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative group">
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-1.5 text-[13px] text-[#555] bg-white border border-[rgba(0,0,0,0.06)] rounded-lg cursor-pointer outline-none transition hover:border-[#C99700] hover:text-[#C99700]"
        aria-label={label}
      >
        <option value="all">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#aaa]">▾</span>
      {current !== 'all' && <span className="sr-only">{value}</span>}
    </div>
  )
}
