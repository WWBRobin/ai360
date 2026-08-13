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

  const [selected, setSelected] = useState<SkillDetail[]>(initialSelected)
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const selectedSlugs = useMemo(() => selected.map((s) => s.slug), [selected])

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

  const clearAll = useCallback(() => {
    setSelected([])
    syncUrl([])
  }, [syncUrl])

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
      {/* ===== 工具选择器（content-card） ===== */}
      <section className="content-card p-5 mb-7">
        <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
          <div className="text-[12px] font-bold text-[#000] uppercase tracking-wide">
            已选工具
            <span className="text-[12px] font-normal text-[#aaa] normal-case ml-2">
              （{selected.length}/{maxSelect}）
            </span>
          </div>
          {selected.length > 0 && (
            <button onClick={clearAll} className="text-[12px] text-[#aaa] hover:text-red-500 transition">
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
            className="w-full px-4 py-2.5 text-[13px] bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#FF8C00] transition disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {showDropdown && selected.length < maxSelect && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-[#eee] rounded-xl shadow-lg max-h-72 overflow-y-auto">
              {filtered.length > 0 ? (
                filtered.map((c) => (
                  <button
                    key={c.slug}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addSkill(c)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#FAFAFA] transition border-b border-gray-50 last:border-0"
                  >
                    <span className="text-lg flex-shrink-0">
                      {c.icon_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.icon_url} alt="" className="w-6 h-6 rounded-md object-cover" />
                      ) : (
                        CATEGORY_ICONS[c.category] || '🧩'
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-gray-800 truncate">{c.name}</div>
                      <div className="text-[12px] text-gray-400 truncate">
                        {c.platform_name}
                        {c.tagline ? ` · ${c.tagline}` : ''}
                      </div>
                    </div>
                    {c.overall_score != null && (
                      <span className="text-[12px] text-[#FF8C00] flex-shrink-0">⭐{c.overall_score.toFixed(1)}</span>
                    )}
                    <span className="text-[#FF8C00] text-sm flex-shrink-0">+</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-[13px] text-gray-400">
                  {query ? `没有找到"${query}"` : '输入关键词搜索'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 已选 chips（chip 样式：圆角 + × 移除） */}
        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {selected.map((s) => (
              <span
                key={s.slug}
                className="inline-flex items-center gap-2 bg-[#FAFAFA] border border-[#E5E7EB] rounded-full px-4 py-2 text-[13px] text-[#333] font-medium"
              >
                <Link href={`/skill/${s.slug}`} className="flex items-center gap-1.5 hover:text-[#FF8C00] transition">
                  {s.name}
                  <span className="text-[11px] text-[#aaa]">{s.platform_name}</span>
                </Link>
                <button
                  onClick={() => removeSkill(s.slug)}
                  className="w-4 h-4 rounded-full bg-[#ccc] text-white flex items-center justify-center text-[10px] hover:bg-red-600 transition ml-1"
                  aria-label={`移除 ${s.name}`}
                >
                  ×
                </button>
              </span>
            ))}
            {selected.length < maxSelect && (
              <button
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>('input[type="text"]')
                  input?.focus()
                }}
                className="inline-flex items-center gap-1.5 bg-white border border-dashed border-[#ccc] rounded-full px-4 py-2 text-[13px] text-[#999] hover:border-[#FF8C00] hover:text-[#FF8C00] transition"
              >
                + 添加工具
              </button>
            )}
          </div>
        ) : (
          <p className="text-[13px] text-[#999]">还没有选择。在上方搜索框输入 Skill 名称开始对比。</p>
        )}
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

// ===== 对比表格（斑马纹 + 胜出高亮）=====

function CompareTable({ selected }: { selected: SkillDetail[] }) {
  const bestOverall = pickBest(selected, (s) => s.overall_score)
  const bestDifficulty = pickBest(selected, (s) => s.difficulty_score)
  const bestStability = pickBest(selected, (s) => s.stability_score)

  return (
    <section>
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <h2 className="text-[17px] font-bold text-[#000] flex items-center gap-2">
          多维对比
        </h2>
        <span className="text-[12px] text-[#aaa]">
          <span className="text-[#16a34a] font-bold">⬆</span> 为优势项 · 金色高亮为胜出
        </span>
      </div>

      {/* 表格容器（content-card） */}
      <div className="content-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[14px] min-w-[640px]">
            <tbody>
              {/* 表头：Skill 名 */}
              <tr>
                <th className="sticky left-0 z-10 bg-[#FAFAFA] w-[170px] min-w-[170px] align-bottom text-left p-3.5 text-[12px] font-semibold text-[#000] uppercase tracking-wide border-b border-[#f0f0f0]">
                  维度
                </th>
                {selected.map((s) => (
                  <th
                    key={s.slug}
                    className="align-bottom text-left p-3.5 border-b border-[#f0f0f0] min-w-[200px]"
                  >
                    <div className="text-[15px] font-bold text-[#000] mb-1.5">{s.name}</div>
                    <div className="flex gap-1 flex-wrap mb-1.5">
                      <span className="tag tag-official">{s.platform_name}</span>
                      {s.overall_score != null && (
                        <span className="tag tag-tested">实测 {s.overall_score.toFixed(1)}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#aaa]">{CATEGORY_LABELS[s.category] || s.category}</div>
                  </th>
                ))}
              </tr>

              {/* 综合评分 */}
              <Row
                label="综合评分"
                highlight={bestOverall}
                selected={selected}
                zebra={1}
                cell={(s) =>
                  s.overall_score != null ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#FF8C00] text-xs">{scoreToStars(s.overall_score)}</span>
                      <span className="font-semibold text-gray-800">{s.overall_score.toFixed(1)}</span>
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
                zebra={2}
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
                zebra={1}
                cell={(s) =>
                  s.difficulty_score != null ? (
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#FF8C00] text-xs">{scoreToStars(s.difficulty_score)}</span>
                        <span className="font-medium text-gray-800">{s.difficulty_score}/5</span>
                      </div>
                      {s.difficulty_notes && <p className="text-gray-500 text-xs mt-1">{s.difficulty_notes}</p>}
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
                zebra={2}
                cell={(s) =>
                  s.stability_score != null ? (
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#FF8C00] text-xs">{scoreToStars(s.stability_score)}</span>
                        <span className="font-medium text-gray-800">{s.stability_score}/5</span>
                      </div>
                      {s.stability_notes && <p className="text-gray-500 text-xs mt-1">{s.stability_notes}</p>}
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
                zebra={1}
                cell={(s) =>
                  s.free_quota ? (
                    <span className="font-medium text-[#16a34a]">{s.free_quota}</span>
                  ) : (
                    <span className="text-gray-400">未提供</span>
                  )
                }
              />

              {/* Q5 Token 成本 */}
              <Row
                label="⑤ Token 成本"
                selected={selected}
                zebra={2}
                cell={(s) =>
                  s.token_cost ? <span className="text-gray-700">{s.token_cost}</span> : <span className="text-gray-400">暂无</span>
                }
              />

              {/* 分类 */}
              <Row
                label="分类"
                selected={selected}
                zebra={1}
                cell={(s) => (
                  <span className="text-xs px-2 py-0.5 rounded tag-free">
                    {CATEGORY_ICONS[s.category]} {CATEGORY_LABELS[s.category] || s.category}
                  </span>
                )}
              />

              {/* 试用 */}
              <Row
                label="在线试用"
                selected={selected}
                zebra={2}
                cell={(s) =>
                  s.trial_enabled ? (
                    <Link
                      href={`/skill/${s.slug}`}
                      className="text-[12px] bg-[rgba(255,140,0,0.06)] text-[#FF8C00] px-2.5 py-1 rounded-lg font-medium inline-block"
                    >
                      支持试用 →
                    </Link>
                  ) : (
                    <span className="text-[12px] text-gray-400">不支持</span>
                  )
                }
              />

              {/* 安装 */}
              <Row
                label="安装"
                selected={selected}
                zebra={1}
                cell={(s) => (
                  <a
                    href={s.install_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block btn-primary text-[12px] px-3 py-1.5"
                  >
                    去 {s.platform_name} →
                  </a>
                )}
              />
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[12px] text-[#aaa] mt-3">数据基于 AI360 实测。胜出项以金色高亮 + ⬆ 标注。</p>

      {/* 结论区（content-card + 金顶条） */}
      <ConclusionBar
        selected={selected}
        bestOverall={bestOverall}
        bestDifficulty={bestDifficulty}
        bestStability={bestStability}
      />
    </section>
  )
}

// ===== 单行（斑马纹 + 胜出高亮）=====

function Row({
  label,
  selected,
  cell,
  highlight,
  zebra,
}: {
  label: string
  selected: SkillDetail[]
  cell: (s: SkillDetail) => React.ReactNode
  highlight?: string | null
  zebra?: number
}) {
  // 斑马纹：奇数行 #FAFAFA，偶数行透明
  const baseBg = zebra === 1 ? '#FAFAFA' : 'rgba(255,255,255,0.4)'
  return (
    <tr className="transition">
      <th
        className="sticky left-0 z-10 text-left p-3.5 border-b border-[#f0f0f0] text-[12px] font-semibold text-[#000] uppercase tracking-wide align-top whitespace-nowrap"
        style={{ background: baseBg }}
      >
        {label}
      </th>
      {selected.map((s) => {
        const isBest = highlight && highlight === s.slug
        return (
          <td
            key={s.slug}
            className="p-3.5 border-b border-[#f0f0f0] align-top"
            style={{
              background: isBest ? 'rgba(255,140,0,0.06)' : baseBg,
              color: isBest ? '#16a34a' : undefined,
              fontWeight: isBest ? 700 : undefined,
            }}
          >
            {isBest && <span className="text-[#16a34a] mr-1">⬆</span>}
            {cell(s)}
          </td>
        )
      })}
    </tr>
  )
}

// ===== 结论区（content-card + 金色顶条 + 金色标题）=====

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
  const winnerName = winner?.name
  const winnerScore = winner?.overall_score?.toFixed(1)
  const easiestName = selected.find((s) => s.slug === bestDifficulty)?.name
  const stableName = selected.find((s) => s.slug === bestStability)?.name

  const items = [
    {
      label: `最佳综合 · ${winnerName || ''}`,
      text:
        winner && winnerScore
          ? `综合评分最高（${winnerScore}/5）。如果你不确定选哪个，选它通常不会错。`
          : '暂无综合评分数据。',
      show: !!winnerName,
    },
    {
      label: '上手最简单',
      text: easiestName ? `${easiestName} 的上手难度评分最高，新手友好。` : '暂无上手难度数据。',
      show: !!easiestName,
    },
    {
      label: '输出最稳定',
      text: stableName ? `${stableName} 的输出稳定性评分最高，适合对一致性要求高的场景。` : '暂无稳定性数据。',
      show: !!stableName,
    },
    {
      label: '一句话建议',
      text: '综合评分高不一定最适合你。如果你的核心诉求是"好上手"或"免费够用"，优先看对应维度。',
      show: true,
    },
  ].filter((x) => x.show)

  return (
    <section className="mt-8">
      <h2 className="text-[17px] font-bold text-[#000] mb-4 flex items-center gap-2">
        AI360 评测结论 <span className="text-[12px] text-[#aaa] font-normal">实测推荐</span>
      </h2>
      <div className="content-card p-7 relative overflow-hidden">
        {/* 金色顶条 */}
        <div className="absolute top-0 left-0 right-0 h-[5px] bg-[#FF8C00]" />
        <h3 className="text-[22px] font-bold mb-1.5 text-[#FF8C00]" style={{ letterSpacing: '0.02em' }}>
          最终推荐
        </h3>
        <p className="text-[13px] text-[#aaa] mb-5">基于多维度实测对比，按场景给出选型建议</p>

        {items.map((it, i) => (
          <div key={i} className="py-4 border-b border-[#f0f0f0] last:border-b-0">
            <div
              className="inline-flex items-center text-[12px] font-bold text-white uppercase tracking-wide mb-2 px-3 py-1 rounded-md bg-[#FF8C00]"
            >
              {it.label}
            </div>
            <p className="text-[14px] text-[#666] leading-[1.7]">{it.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ===== 空状态提示 =====

function EmptyHint() {
  return (
    <div className="content-card text-center py-16">
      <div className="w-[72px] h-[72px] rounded-full mx-auto mb-4 flex items-center justify-center text-[#FF8C00] bg-[rgba(255,140,0,0.06)]">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3v18M3 12h18" />
        </svg>
      </div>
      <p className="text-[15px] text-[#666] mb-1.5">至少选择 2 个 Skill 才能对比</p>
      <p className="text-[13px] text-[#999]">
        在上方搜索框添加，或从
        <Link href="/" className="text-[#FF8C00] mx-1 hover:underline">
          首页精选
        </Link>
        里挑两个感兴趣的试试。
      </p>
    </div>
  )
}

// ===== 工具函数 =====

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
