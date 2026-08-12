'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { SkillDetail, SkillCard } from '@/types'
import {
  scoreToStars,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
} from '@/lib/supabase'

interface Props {
  initialSelected: SkillDetail[]
  candidates: SkillCard[]
  maxSelect?: number
}

export default function CompareClient({
  initialSelected,
  candidates,
  maxSelect = 3,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 选中项用 slug 去重维护；SkillDetail 列表作为真相源
  const [selected, setSelected] = useState<SkillDetail[]>(initialSelected)
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const selectedSlugs = useMemo(() => selected.map((s) => s.slug), [selected])

  // 同步 URL（slugs 查询参数），便于分享/刷新
  const syncUrl = useCallback(
    (slugs: string[]) => {
      const params = new URLSearchParams(searchParams.toString())
      if (slugs.length > 0) {
        params.set('slugs', slugs.join(','))
      } else {
        params.delete('slugs')
      }
      const qs = params.toString()
      router.replace(`/compare${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [router, searchParams]
  )

  // 添加 Skill（从候选池找卡片，转成精简 detail 形态）
  const addSkill = useCallback(
    (card: SkillCard) => {
      setSelected((prev) => {
        if (prev.some((s) => s.slug === card.slug)) return prev
        if (prev.length >= maxSelect) return prev
        const detail = cardToDetail(card)
        const next = [...prev, detail]
        syncUrl(next.map((s) => s.slug))
        return next
      })
      setQuery('')
      setShowDropdown(false)
    },
    [maxSelect, syncUrl]
  )

  // 移除 Skill
  const removeSkill = useCallback(
    (slug: string) => {
      setSelected((prev) => {
        const next = prev.filter((s) => s.slug !== slug)
        syncUrl(next.map((s) => s.slug))
        return next
      })
    },
    [syncUrl]
  )

  // 清空
  const clearAll = useCallback(() => {
    setSelected([])
    syncUrl([])
  }, [syncUrl])

  // 过滤候选（搜索 + 排除已选）
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return candidates
      .filter((c) => !selectedSlugs.includes(c.slug))
      .filter((c) =>
        q
          ? c.name.toLowerCase().includes(q) ||
            (c.tagline || '').toLowerCase().includes(q) ||
            c.platform_name.toLowerCase().includes(q)
          : true
      )
      .slice(0, 20)
  }, [candidates, query, selectedSlugs])

  return (
    <div>
      {/* ===== 选择器 ===== */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <span>🎯</span> 选择要对比的 Skill
              <span className="text-xs font-normal text-gray-400">
                （{selected.length}/{maxSelect}）
              </span>
            </h2>
            {selected.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-gray-400 hover:text-red-500 transition"
              >
                清空全部
              </button>
            )}
          </div>

          {/* 搜索 + 下拉 */}
          <div className="relative mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder={
                selected.length >= maxSelect
                  ? `已达上限（${maxSelect} 个），移除一个后再添加`
                  : '搜索并添加 Skill…'
              }
              disabled={selected.length >= maxSelect}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {showDropdown && selected.length < maxSelect && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                {filtered.length > 0 ? (
                  filtered.map((c) => (
                    <button
                      key={c.slug}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addSkill(c)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-indigo-50 transition border-b border-gray-50 last:border-0"
                    >
                      <span className="text-lg flex-shrink-0">
                        {c.icon_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.icon_url}
                            alt=""
                            className="w-6 h-6 rounded-md object-cover"
                          />
                        ) : (
                          CATEGORY_ICONS[c.category] || '🧩'
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {c.name}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {c.platform_name}
                          {c.tagline ? ` · ${c.tagline}` : ''}
                        </div>
                      </div>
                      {c.overall_score != null && (
                        <span className="text-xs text-amber-500 flex-shrink-0">
                          ⭐{c.overall_score.toFixed(1)}
                        </span>
                      )}
                      <span className="text-indigo-400 text-sm flex-shrink-0">+</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">
                    {query ? `没有找到"${query}"` : '输入关键词搜索'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 已选 chips */}
          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selected.map((s) => (
                <span
                  key={s.slug}
                  className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm"
                >
                  <span className="text-base">
                    {CATEGORY_ICONS[s.category] || '🧩'}
                  </span>
                  <Link
                    href={`/skill/${s.slug}`}
                    className="font-medium hover:underline"
                  >
                    {s.name}
                  </Link>
                  <span className="text-xs text-indigo-300">{s.platform_name}</span>
                  <button
                    onClick={() => removeSkill(s.slug)}
                    className="ml-1 text-indigo-300 hover:text-red-500 transition"
                    aria-label={`移除 ${s.name}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              还没有选择。在上方搜索框输入 Skill 名称开始对比。
            </p>
          )}
        </div>
      </section>

      {/* ===== 对比结果 ===== */}
      {selected.length >= 2 ? (
        <CompareTable selected={selected} />
      ) : (
        <EmptyHint />
      )}
    </div>
  )
}

// ===== 对比表格 =====

function CompareTable({ selected }: { selected: SkillDetail[] }) {
  // 计算每个维度（越高越好）的"最佳" winner slug
  const bestOverall = pickBest(selected, (s) => s.overall_score)
  const bestDifficulty = pickBest(selected, (s) => s.difficulty_score)
  const bestStability = pickBest(selected, (s) => s.stability_score)

  return (
    <section>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <span>📋</span> 五问评测对比
        </h2>
        <p className="text-xs text-gray-400">
          <span className="inline-block w-2.5 h-2.5 bg-green-100 border border-green-300 rounded mr-1 align-middle" />
          绿底 = 该维度最佳
        </p>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full border-collapse text-sm min-w-[640px]">
          <tbody>
            {/* 表头：Skill 名 */}
            <tr>
              <th className="sticky left-0 z-10 bg-white w-32 min-w-[8rem] align-bottom text-left p-3 border-b border-gray-200">
                <span className="text-xs text-gray-400 font-normal">对比项</span>
              </th>
              {selected.map((s) => (
                <th
                  key={s.slug}
                  className="align-bottom text-left p-3 border-b border-gray-200 min-w-[200px]"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl flex-shrink-0">
                      {s.icon_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.icon_url}
                          alt=""
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                      ) : (
                        CATEGORY_ICONS[s.category] || '🧩'
                      )}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/skill/${s.slug}`}
                        className="font-bold text-gray-900 hover:text-indigo-600 transition block truncate"
                      >
                        {s.name}
                      </Link>
                      <span className="text-xs text-gray-400">
                        {s.platform_name}
                      </span>
                    </div>
                  </div>
                </th>
              ))}
            </tr>

            {/* 综合评分 */}
            <Row
              label="综合评分"
              highlight={bestOverall}
              selected={selected}
              cell={(s) =>
                s.overall_score != null ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 text-xs">
                      {scoreToStars(s.overall_score)}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {s.overall_score.toFixed(1)}
                    </span>
                    <span className="text-gray-400 text-xs">/5</span>
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )
              }
            />

            {/* Q1 场景 */}
            <Row
              label="① 解决什么场景"
              selected={selected}
              cell={(s) =>
                s.scenario_summary ? (
                  <p className="text-gray-600 leading-relaxed">{s.scenario_summary}</p>
                ) : (
                  <span className="text-gray-400">暂无</span>
                )
              }
            />

            {/* Q2 上手难度 */}
            <Row
              label="② 上手难度"
              highlight={bestDifficulty}
              selected={selected}
              cell={(s) =>
                s.difficulty_score != null ? (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400 text-xs">
                        {scoreToStars(s.difficulty_score)}
                      </span>
                      <span className="font-medium text-gray-800">
                        {s.difficulty_score}/5
                      </span>
                    </div>
                    {s.difficulty_notes && (
                      <p className="text-gray-500 text-xs mt-1">{s.difficulty_notes}</p>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">暂无评分</span>
                )
              }
            />

            {/* Q3 稳定性 */}
            <Row
              label="③ 输出稳定性"
              highlight={bestStability}
              selected={selected}
              cell={(s) =>
                s.stability_score != null ? (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400 text-xs">
                        {scoreToStars(s.stability_score)}
                      </span>
                      <span className="font-medium text-gray-800">
                        {s.stability_score}/5
                      </span>
                    </div>
                    {s.stability_notes && (
                      <p className="text-gray-500 text-xs mt-1">{s.stability_notes}</p>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">暂无评分</span>
                )
              }
            />

            {/* Q4 免费额度 */}
            <Row
              label="④ 免费额度"
              selected={selected}
              cell={(s) =>
                s.free_quota ? (
                  <span className="font-medium text-green-600">{s.free_quota}</span>
                ) : (
                  <span className="text-gray-400">未提供</span>
                )
              }
            />

            {/* Q5 Token 成本 */}
            <Row
              label="⑤ Token 成本"
              selected={selected}
              cell={(s) =>
                s.token_cost ? (
                  <span className="text-gray-700">{s.token_cost}</span>
                ) : (
                  <span className="text-gray-400">暂无</span>
                )
              }
            />

            {/* 分类 */}
            <Row
              label="分类"
              selected={selected}
              cell={(s) => (
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    s.category === 'infra'
                      ? 'bg-blue-100 text-blue-600'
                      : s.category === 'scene'
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {CATEGORY_ICONS[s.category]} {CATEGORY_LABELS[s.category] || s.category}
                </span>
              )}
            />

            {/* 试用 */}
            <Row
              label="在线试用"
              selected={selected}
              cell={(s) =>
                s.trial_enabled ? (
                  <Link
                    href={`/skill/${s.slug}`}
                    className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg font-medium inline-block"
                  >
                    支持试用 →
                  </Link>
                ) : (
                  <span className="text-xs text-gray-400">不支持</span>
                )
              }
            />

            {/* 操作：安装 */}
            <Row
              label="安装"
              selected={selected}
              cell={(s) => (
                <a
                  href={s.install_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs px-3 py-1.5 text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition"
                >
                  去 {s.platform_name} →
                </a>
              )}
            />
          </tbody>
        </table>
      </div>

      {/* 结论提示 */}
      <ConclusionBar
        selected={selected}
        bestOverall={bestOverall}
        bestDifficulty={bestDifficulty}
        bestStability={bestStability}
      />
    </section>
  )
}

// ===== 单行（横向对比一项维度）=====

function Row({
  label,
  selected,
  cell,
  highlight,
}: {
  label: string
  selected: SkillDetail[]
  cell: (s: SkillDetail) => React.ReactNode
  highlight?: string | null
}) {
  return (
    <tr className="hover:bg-gray-50/50 transition">
      <th className="sticky left-0 z-10 bg-white bg-inherit text-left p-3 border-b border-gray-100 text-xs font-medium text-gray-500 align-top whitespace-nowrap">
        {label}
      </th>
      {selected.map((s) => (
        <td
          key={s.slug}
          className={`p-3 border-b border-gray-100 align-top ${
            highlight && highlight === s.slug ? 'bg-green-50' : ''
          }`}
        >
          {cell(s)}
        </td>
      ))}
    </tr>
  )
}

// ===== 结论栏 =====

function ConclusionBar({
  selected,
  bestOverall,
  bestDifficulty,
  bestStability,
}: {
  selected: SkillDetail[]
  bestOverall: string | null
  bestDifficulty: string | null
  bestStability: string | null
}) {
  const winner = selected.find((s) => s.slug === bestOverall)
  if (!winner) return null

  return (
    <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">💡</span>
        <div className="text-sm text-gray-700 leading-relaxed">
          <p className="font-medium text-gray-900 mb-1">对比结论</p>
          <p>
            综合评分最高：
            <Link
              href={`/skill/${winner.slug}`}
              className="text-indigo-600 font-medium hover:underline mx-0.5"
            >
              {winner.name}（{winner.overall_score?.toFixed(1)}/5）
            </Link>
            。
            {bestDifficulty && (
              <>
                {' '}上手最简单：
                <span className="text-gray-800 font-medium">
                  {selected.find((s) => s.slug === bestDifficulty)?.name}
                </span>
                。
              </>
            )}
            {bestStability && (
              <>
                {' '}输出最稳定：
                <span className="text-gray-800 font-medium">
                  {selected.find((s) => s.slug === bestStability)?.name}
                </span>
                。
              </>
            )}
          </p>
          <p className="text-gray-500 mt-1.5 text-xs">
            提示：综合评分高不一定最适合你。如果你的核心诉求是"好上手"或"免费够用"，优先看对应维度。
          </p>
        </div>
      </div>
    </div>
  )
}

// ===== 空状态提示 =====

function EmptyHint() {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">⚖️</div>
      <p className="text-gray-500 mb-1">至少选择 2 个 Skill 才能对比</p>
      <p className="text-gray-400 text-sm">
        在上方搜索框添加，或从
        <Link href="/" className="text-indigo-500 mx-1 hover:underline">
          首页精选
        </Link>
        里挑两个感兴趣的试试。
      </p>
    </div>
  )
}

// ===== 工具函数 =====

// 取"越高越好"维度中得分最高者的 slug（并列时返回第一个，无数据返回 null）
function pickBest(
  selected: SkillDetail[],
  getter: (s: SkillDetail) => number | null
): string | null {
  let bestSlug: string | null = null
  let bestVal = -Infinity
  let hasAny = false
  for (const s of selected) {
    const v = getter(s)
    if (v != null && v > bestVal) {
      bestVal = v
      bestSlug = s.slug
      hasAny = true
    }
  }
  return hasAny ? bestSlug : null
}

// 把 SkillCard 转成精简 SkillDetail（客户端新增项没有评测 notes，可接受）
function cardToDetail(card: SkillCard): SkillDetail {
  return {
    id: card.id,
    name: card.name,
    slug: card.slug,
    tagline: card.tagline,
    description: null,
    category: card.category,
    install_url: card.install_url,
    icon_url: card.icon_url,
    developer_name: null,
    version: null,
    trial_enabled: card.trial_enabled,
    trial_config: null,
    platform_name: card.platform_name,
    platform_slug: card.platform_slug,
    platform_base_url: null,
    platform_api_supported: card.api_supported,
    overall_score: card.overall_score,
    difficulty_score: card.difficulty_score,
    difficulty_notes: null,
    stability_score: card.stability_score,
    stability_notes: null,
    free_quota: card.free_quota,
    free_quota_score: null,
    token_cost: null,
    token_efficiency_score: null,
    scenario_summary: null,
    evaluation_method: null,
    test_cases: null,
    version_at_eval: null,
    evaluated_at: card.evaluated_at,
    guide_content: null,
    guide_difficulty: null,
  }
}
