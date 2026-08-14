'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

interface PlatformOption {
  slug: string
  name: string
  count: number
}

interface ScenarioFilterProps {
  platforms?: PlatformOption[]
  total: number
  showPlatformFilter?: boolean
}

type SortKey = 'recommended' | 'latest' | 'rating'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recommended', label: '综合推荐' },
  { value: 'latest', label: '最新' },
  { value: 'rating', label: '评分最高' },
]

export default function ScenarioFilter({
  platforms = [],
  total,
  showPlatformFilter = true,
}: ScenarioFilterProps) {
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
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="flex flex-wrap items-center gap-4 py-4">
      {/* 结果计数 */}
      <span className="text-sm text-gray-500">
        共 <span className="font-semibold text-gray-900">{total}</span> 个 Skill
      </span>

      <div className="flex-1" />

      {/* 平台筛选（可关闭，平台页不需要） */}
      {showPlatformFilter && platforms.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <span className="hidden sm:inline">平台</span>
          <select
            value={currentPlatform}
            onChange={(e) => updateParam('platform', e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#1c1a18] focus:outline-none focus:ring-1 focus:ring-[#1c1a18]"
          >
            <option value="all">全部平台</option>
            {platforms.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}（{p.count}）
              </option>
            ))}
          </select>
        </label>
      )}

      {/* 排序方式 */}
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <span className="hidden sm:inline">排序</span>
        <select
          value={currentSort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#1c1a18] focus:outline-none focus:ring-1 focus:ring-[#1c1a18]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
