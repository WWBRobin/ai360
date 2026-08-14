'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'

// ===== 维度配置 =====

interface FilterOption {
  slug: string
  name: string
  count: number
}

interface SearchSidebarProps {
  categories: FilterOption[]
  platforms: FilterOption[]
  scenarios: { slug: string; name: string; icon: string; count: number }[]
  trialCounts: { yes: number; no: number }
  total: number
}

type SortKey = 'recommended' | 'rating' | 'latest' | 'easiest'

const SORT_OPTIONS: { value: SortKey; label: string; icon: string }[] = [
  { value: 'recommended', label: '综合推荐', icon: '✨' },
  { value: 'rating', label: '评分最高', icon: '⭐' },
  { value: 'latest', label: '最新评测', icon: '🕐' },
  { value: 'easiest', label: '最易上手', icon: '🎯' },
]

const RATING_OPTIONS = [
  { value: '4', label: '4 分以上', icon: '⭐⭐⭐⭐' },
  { value: '3', label: '3 分以上', icon: '⭐⭐⭐' },
]

export default function SearchSidebar({
  categories,
  platforms,
  scenarios,
  trialCounts,
  total,
}: SearchSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // 当前选中状态
  const selectedCategory = searchParams.get('category') || 'all'
  const selectedPlatform = searchParams.get('platform') || 'all'
  const selectedScenario = searchParams.get('scenario') || 'all'
  const selectedRating = searchParams.get('rating') || 'all'
  const selectedTrial = searchParams.get('trial') || 'all'
  const currentSort = (searchParams.get('sort') as SortKey) || 'recommended'

  // 计算已激活的筛选条件数量
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedCategory !== 'all') count++
    if (selectedPlatform !== 'all') count++
    if (selectedScenario !== 'all') count++
    if (selectedRating !== 'all') count++
    if (selectedTrial !== 'all') count++
    return count
  }, [selectedCategory, selectedPlatform, selectedScenario, selectedRating, selectedTrial])

  // 更新 URL 参数
  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all' && value !== '') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  // 清除所有筛选
  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    params.delete('platform')
    params.delete('scenario')
    params.delete('rating')
    params.delete('trial')
    // 保留 q 和 sort
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [router, pathname, searchParams])

  return (
    <aside className="w-full lg:w-64 lg:flex-shrink-0">
      <div className="lg:sticky lg:top-20 space-y-5">
        {/* 头部：标题 + 清除 */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <span>🎛️ 筛选</span>
            {activeFilterCount > 0 && (
              <span className="bg-[var(--primary)] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                {activeFilterCount}
              </span>
            )}
          </h2>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-[var(--fg3)] hover:text-[var(--primary)] transition"
            >
              清除全部
            </button>
          )}
        </div>

        {/* 排序 */}
        <div className="bg-[var(--card)] rounded-xl border border-gray-200 p-3">
          <div className="text-xs font-semibold text-gray-500 mb-2 px-1">排序方式</div>
          <div className="space-y-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParam('sort', opt.value)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-2 ${
                  currentSort === opt.value
                    ? 'bg-[rgba(var(--dim-rgb),0.08)] text-[var(--primary)] font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-xs">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 分类 */}
        {categories.length > 0 && (
          <FilterGroup title="分类">
            <FilterButton
              active={selectedCategory === 'all'}
              onClick={() => updateParam('category', 'all')}
              label="全部分类"
              count={total}
            />
            {categories.map((cat) => (
              <FilterButton
                key={cat.slug}
                active={selectedCategory === cat.slug}
                onClick={() => updateParam('category', cat.slug)}
                label={cat.name}
                count={cat.count}
              />
            ))}
          </FilterGroup>
        )}

        {/* 平台 */}
        {platforms.length > 0 && (
          <FilterGroup title="平台">
            <FilterButton
              active={selectedPlatform === 'all'}
              onClick={() => updateParam('platform', 'all')}
              label="全部平台"
              count={total}
            />
            {platforms.map((p) => (
              <FilterButton
                key={p.slug}
                active={selectedPlatform === p.slug}
                onClick={() => updateParam('platform', p.slug)}
                label={p.name}
                count={p.count}
              />
            ))}
          </FilterGroup>
        )}

        {/* 场景 */}
        {scenarios.length > 0 && (
          <FilterGroup title="场景">
            <FilterButton
              active={selectedScenario === 'all'}
              onClick={() => updateParam('scenario', 'all')}
              label="全部场景"
              count={total}
            />
            {scenarios.map((s) => (
              <FilterButton
                key={s.slug}
                active={selectedScenario === s.slug}
                onClick={() => updateParam('scenario', s.slug)}
                label={`${s.icon} ${s.name}`}
                count={s.count}
              />
            ))}
          </FilterGroup>
        )}

        {/* 评分 */}
        <div className="bg-[var(--card)] rounded-xl border border-gray-200 p-3">
          <div className="text-xs font-semibold text-gray-500 mb-2 px-1">评分</div>
          <div className="space-y-1">
            <FilterButton
              active={selectedRating === 'all'}
              onClick={() => updateParam('rating', 'all')}
              label="不限"
            />
            {RATING_OPTIONS.map((opt) => (
              <FilterButton
                key={opt.value}
                active={selectedRating === opt.value}
                onClick={() => updateParam('rating', opt.value)}
                label={opt.label}
              />
            ))}
          </div>
        </div>

        {/* 试用 */}
        <div className="bg-[var(--card)] rounded-xl border border-gray-200 p-3">
          <div className="text-xs font-semibold text-gray-500 mb-2 px-1">是否可试用</div>
          <div className="space-y-1">
            <FilterButton
              active={selectedTrial === 'all'}
              onClick={() => updateParam('trial', 'all')}
              label="不限"
              count={total}
            />
            <FilterButton
              active={selectedTrial === 'yes'}
              onClick={() => updateParam('trial', 'yes')}
              label="✅ 可免费试用"
              count={trialCounts.yes}
            />
            <FilterButton
              active={selectedTrial === 'no'}
              onClick={() => updateParam('trial', 'no')}
              label="📦 仅安装"
              count={trialCounts.no}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}

// ===== 子组件 =====

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--card)] rounded-xl border border-gray-200 p-3">
      <div className="text-xs font-semibold text-gray-500 mb-2 px-1">{title}</div>
      <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-hide">{children}</div>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition flex items-center justify-between gap-2 ${
        active
          ? 'bg-[rgba(var(--dim-rgb),0.08)] text-[var(--primary)] font-medium'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <span
          className={`text-xs flex-shrink-0 ${
            active ? 'text-[var(--primary)]' : 'text-gray-300'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}
