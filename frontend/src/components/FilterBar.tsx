'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

interface PlatformOption {
  slug: string
  name: string
  count: number
}

interface FilterBarProps {
  platforms?: PlatformOption[]
  total: number
  showPlatformFilter?: boolean
  testedCount?: number
}

type SortKey = 'recommended' | 'latest' | 'rating'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recommended', label: '综合评分' },
  { value: 'latest', label: '最新上架' },
  { value: 'rating', label: '评分最高' },
]

/**
 * proto7 排序栏：左侧总数 + 右侧排序/平台筛选
 * 样式与 proto7-scenario.html / proto7-platform.html 的 .sortbar 一致
 */
export default function FilterBar({
  platforms = [],
  total,
  showPlatformFilter = true,
  testedCount,
}: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentPlatform = searchParams.get('platform') || 'all'
  const currentSort = (searchParams.get('sort') as SortKey) || 'recommended'

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all' && value !== 'recommended') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  const selectClass =
    'text-[13px] text-[#2a2724] rounded-lg px-3 py-[7px] cursor-pointer outline-none transition ' +
    'border border-[#e3e0dd] bg-[#fcfbf9] ' +
    'focus:border-[#1c1a18] focus:shadow-[0_0_0_3px_rgba(28, 26, 24,0.12)]'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="text-[13px] text-[#656360]">
        共 <b className="text-[#2a2724]">{total}</b> 个
        {testedCount != null && (
          <span className="text-[#a1a1a1]"> · 实测 <b className="text-[#2a2724]">{testedCount}</b></span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showPlatformFilter && platforms.length > 0 && (
          <select
            value={currentPlatform}
            onChange={(e) => updateParam('platform', e.target.value)}
            className={selectClass}
            aria-label="平台筛选"
          >
            <option value="all">全部平台</option>
            {platforms.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}（{p.count}）
              </option>
            ))}
          </select>
        )}
        <select
          value={currentSort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className={selectClass}
          aria-label="排序方式"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
