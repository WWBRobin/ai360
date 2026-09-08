'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PromptItem } from '@/lib/prompts-shared'
import { SMOKE_FAIL, SMOKE_OK } from '@/lib/prompts-shared'

/**
 * 提示词库货架（v1 线框 α 拍板版）
 * - SSR：「全部」总览 = 五组并置各前 6 条（GEO 吃满组关键词）；组 Tab 首批 30
 * - 展开更多：懒取 /prompts/{slug}.json（public 静态件，一次取全组，客户端分页）
 * - 组内搜索：取全组后过滤标题+内容（未取全前只搜已加载条目，提示语随动）
 * - 行卡：点行=进详情页；点「复制」=复制全文
 */

export type ShelfGroup = {
  slug: string
  name: string
  desc: string
  total: number
  zh: number
  tested: number
  head: PromptItem[]
}

const PAGE = 30

/** 组全量数据懒取缓存（slug -> items | undefined） */
const groupCache = new Map<string, PromptItem[]>()
const pending = new Map<string, Promise<PromptItem[]>>()

function ensureGroup(slug: string): Promise<PromptItem[]> {
  if (groupCache.has(slug)) return Promise.resolve(groupCache.get(slug)!)
  if (pending.has(slug)) return pending.get(slug)!
  const p = fetch(`/prompts/${slug}.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json()
    })
    .then((d: { items: PromptItem[] }) => {
      groupCache.set(slug, d.items)
      pending.delete(slug)
      return d.items
    })
    .catch((e) => {
      pending.delete(slug)
      throw e
    })
  pending.set(slug, p)
  return p
}

function copyText(t: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(t)
  return new Promise((resolve) => {
    const ta = document.createElement('textarea')
    ta.value = t
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    resolve()
  })
}

function CopyBtn({ item, big }: { item: PromptItem; big?: boolean }) {
  const [st, setSt] = useState<'idle' | 'ok'>('idle')
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          await copyText(item.content)
          setSt('ok')
          setTimeout(() => setSt('idle'), 1600)
        } catch {
          /* 剪贴板被浏览器策略拦时静默；行卡点进详情页还有大复制按钮 */
        }
      }}
      className={
        big
          ? 'inline-flex h-[46px] items-center gap-2 rounded-[10px] bg-[var(--primary)] px-[26px] text-[14.5px] font-bold text-[var(--on-primary)] transition hover:opacity-85'
          : 'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3.5 text-[12.5px] font-semibold text-[var(--on-primary)] transition hover:opacity-85'
      }
      aria-label={`复制提示词：${item.title}`}
    >
      {st === 'ok' ? '已复制 ✓' : big ? '复制提示词' : '复制'}
    </button>
  )
}

export function Badge({ item }: { item: PromptItem }) {
  return (
    <>
      {item.language === 'zh' && (
        <span className="inline-flex h-[22px] items-center rounded-full bg-[var(--bg2)] px-[9px] text-[11px] font-semibold whitespace-nowrap text-[var(--fg2)]">
          中文
        </span>
      )}
      {item.applyType !== 'chat' && (
        <span className="inline-flex h-[22px] items-center rounded-full bg-[var(--blue-bg)] px-[9px] text-[11px] font-semibold whitespace-nowrap text-[var(--blue)]">
          写进配置
        </span>
      )}
      {SMOKE_OK.has(item.smoke) && (
        <span className="inline-flex h-[22px] items-center rounded-full bg-[var(--green-bg)] px-[9px] text-[11px] font-semibold whitespace-nowrap text-[var(--green)]">
          已实测✓
        </span>
      )}
      {SMOKE_FAIL.has(item.smoke) && (
        <span className="inline-flex h-[22px] items-center rounded-full bg-[var(--red-bg)] px-[9px] text-[11px] font-semibold whitespace-nowrap text-[var(--red)]" title="机器冒烟判卷未通过：保留在库作诚实记录，使用前请自行验证">
          实测未过
        </span>
      )}
    </>
  )
}

function Row({ item, no }: { item: PromptItem; no: number }) {
  return (
    <Link
      href={`/prompts/${item.id}`}
      className="flex cursor-pointer items-center gap-3.5 rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-4 py-3 transition hover:border-[var(--fg4)]"
    >
      <span className="w-[34px] shrink-0 font-mono text-[11.5px] text-[var(--fg4)]">{String(no).padStart(2, '0')}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-semibold leading-[1.4] text-[var(--fg)]">{item.title}</span>
        <span className="mt-0.5 block truncate text-[12.5px] leading-[1.5] text-[var(--fg3)]">{item.summary}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        <Badge item={item} />
      </span>
      <CopyBtn item={item} />
    </Link>
  )
}

function GroupHead({ g, onAll }: { g: ShelfGroup; onAll: () => void }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2.5 pt-5 pb-2.5">
      <b className="text-[16.5px] font-bold text-[var(--fg)]">{g.name}</b>
      <span className="font-mono text-[12.5px] text-[var(--fg3)]">{g.total} 条</span>
      <span className="text-[12.5px] text-[var(--fg3)]">{g.desc}</span>
      {g.tested > 0 && (
        <span className="inline-flex h-[22px] items-center rounded-full bg-[var(--green-bg)] px-[9px] text-[11px] font-semibold text-[var(--green)]">
          组内有已实测✓
        </span>
      )}
      <button
        type="button"
        onClick={onAll}
        className="ml-auto cursor-pointer text-[13px] font-semibold text-[var(--primary)] hover:underline"
      >
        查看全部 {g.total} 条 →
      </button>
    </div>
  )
}

export default function PromptShelf({
  groups,
  initialTab = 'all',
}: {
  groups: ShelfGroup[]
  initialTab?: string
}) {
  const byslug = useMemo(() => Object.fromEntries(groups.map((g) => [g.slug, g])), [groups])
  // 「全部」总览的组序：小组精品在前（43 条治毛病 → 204 风格 → 902 指令 → 665 框架 → 1094 角色）
  const overviewOrder = useMemo(() => {
    const pref = ['fixes', 'styles', 'commands', 'templates', 'roles']
    return [...groups].sort((a, b) => pref.indexOf(a.slug) - pref.indexOf(b.slug))
  }, [groups])

  const [tab, setTab] = useState(initialTab)
  const [q, setQ] = useState('')
  const [shown, setShown] = useState(30) // 组视图当前显示数
  const [full, setFull] = useState<PromptItem[] | null>(null) // 当前组全量（懒取后）
  const [loadingMore, setLoadingMore] = useState(false)
  const rafRef = useRef(false)

  const active = tab !== 'all' ? byslug[tab] : null

  // 切组/搜索时重置
  const switchTab = useCallback((slug: string) => {
    setTab(slug)
    setQ('')
    setShown(30)
    setFull(null)
  }, [])

  // 组视图数据源：SSR head 前 30，懒取后有全量
  const items = useMemo(() => {
    if (!active) return []
    const src = full ?? active.head
    return src.slice(0, full ? shown : Math.min(shown, active.head.length))
  }, [active, full, shown])

  // 搜索：输入即懒取全组（一次），对全组过滤
  useEffect(() => {
    if (!active || !q.trim() || full || groupCache.has(active.slug)) return
    ensureGroup(active.slug)
      .then((items) => setFull(items))
      .catch(() => {})
  }, [q, active, full])

  const filtered = useMemo(() => {
    if (!active || !q.trim()) return items
    const s = q.trim().toLowerCase()
    return items.filter((x) => x.title.toLowerCase().includes(s) || x.content.toLowerCase().includes(s))
  }, [items, q, active])

  const expand = () => {
    if (!active) return
    setLoadingMore(true)
    ensureGroup(active.slug)
      .then((items) => {
        setFull(items)
        setShown((n) => n + PAGE)
      })
      .finally(() => {
        if (rafRef.current) return
        rafRef.current = true
        requestAnimationFrame(() => {
          rafRef.current = false
          setLoadingMore(false)
        })
      })
  }

  const remaining = active ? Math.max(0, active.total - (full ? shown : Math.min(shown, active.head.length))) : 0

  return (
    <div>
      {/* Tab 行 */}
      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] py-2.5">
        <button
          type="button"
          onClick={() => switchTab('all')}
          className={`inline-flex h-[34px] cursor-pointer items-center rounded-full px-[15px] text-[13.5px] whitespace-nowrap transition ${
            tab === 'all'
              ? 'bg-[var(--primary)] font-semibold text-[var(--on-primary)]'
              : 'border border-[var(--border)] bg-[var(--card)] text-[var(--fg2)] hover:border-[var(--fg4)] hover:text-[var(--fg)]'
          }`}
        >
          全部 <span className="ml-1 font-mono text-[11.5px] opacity-65">{groups.reduce((a, g) => a + g.total, 0)}</span>
        </button>
        {groups.map((g) => (
          <button
            key={g.slug}
            type="button"
            onClick={() => switchTab(g.slug)}
            className={`inline-flex h-[34px] cursor-pointer items-center rounded-full px-[15px] text-[13.5px] whitespace-nowrap transition ${
              tab === g.slug
                ? 'bg-[var(--primary)] font-semibold text-[var(--on-primary)]'
                : 'border border-[var(--border)] bg-[var(--card)] text-[var(--fg2)] hover:border-[var(--fg4)] hover:text-[var(--fg)]'
            }`}
          >
            {g.name} <span className="ml-1 font-mono text-[11.5px] opacity-65">{g.total}</span>
          </button>
        ))}
        {active && (
          <div className="ml-auto flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`在「${active.name}」${q.trim() || full ? '全组' : '已加载条目'}中搜索…`}
              className="h-[34px] w-[240px] rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-[13.5px] text-[var(--fg)] outline-none placeholder:text-[var(--fg4)] focus:border-[var(--fg3)]"
            />
          </div>
        )}
      </div>

      {/* 「全部」总览：五组并置（SSR 直出） */}
      {tab === 'all' &&
        overviewOrder.map((g) => (
          <section key={g.slug} className="mt-6 border-t border-[var(--border)] pt-1 first:mt-0 first:border-t-0">
            <GroupHead g={g} onAll={() => switchTab(g.slug)} />
            <div className="flex flex-col gap-2">
              {g.head.slice(0, 6).map((item, i) => (
                <Row key={item.id} item={item} no={i + 1} />
              ))}
            </div>
          </section>
        ))}

      {/* 组视图 */}
      {active && (
        <div>
          <GroupHead g={active} onAll={() => {}} />
          <div className="flex flex-col gap-2">
            {filtered.map((item, i) => (
              <Row key={item.id} item={item} no={i + 1} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2.5 py-16 text-[13.5px] text-[var(--fg3)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg2)] text-xl">🔍</div>
              <b className="text-[14px] text-[var(--fg2)]">没有匹配「{q}」的条目</b>
              <span>换个词试试，或清空搜索看全部 {active.total} 条</span>
              <button type="button" className="cursor-pointer font-semibold text-[var(--primary)]" onClick={() => setQ('')}>
                清空搜索 ←
              </button>
            </div>
          )}
          {!q.trim() && remaining > 0 && (
            <button
              type="button"
              onClick={expand}
              disabled={loadingMore}
              className="mt-4 mb-2 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-dashed border-[var(--fg4)] bg-[var(--card)] text-[13.5px] text-[var(--fg2)] transition hover:border-[var(--fg3)] hover:text-[var(--fg)] disabled:opacity-60"
            >
              {loadingMore ? '加载中…' : `展开更多 · 本组还有 ${remaining} 条 ⌄`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
