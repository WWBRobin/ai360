'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { ToolItem } from '@/lib/tools-data'
import './tools.css'

/**
 * 二级页列表（A 形态 · 线框规格 + 体检视觉语汇）
 * toolbar：类内搜索 + 综合/实测优先/名称排序 + 仅实测筛选
 * 行卡：名称定宽150 + 描述 + 实测徽标 + 钩子位（评测灰/装机黑实心/官网）+ hover轻上浮
 * 加载更多：默认 8 条分页
 */

type SortKey = 'sort' | 'verified' | 'name'
const PAGE = 8

const INSTALLABLE = new Set([
  'DeepSeek', '通义千问', 'Kimi', '扣子 Coze', 'Dify', 'n8n', 'Cursor',
  'Claude', 'ChatGPT', '秘塔 AI 搜索', 'WPS AI', 'Obsidian', 'Notion',
])

export default function CatListClient({ cat, list }: { cat: string; list: ToolItem[] }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('sort')
  const [onlyVerified, setOnlyVerified] = useState(false)
  const [shown, setShown] = useState(PAGE)

  const filtered = useMemo(() => {
    let arr = list
    if (q.trim()) {
      const k = q.trim().toLowerCase()
      arr = arr.filter((t) => t.name.toLowerCase().includes(k) || t.desc.toLowerCase().includes(k))
    }
    if (onlyVerified) arr = arr.filter((t) => t.verify === 'verified')
    arr = arr.slice().sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'zh')
      if (sort === 'verified') {
        if (a.verify === b.verify) return a.sort - b.sort
        return a.verify === 'verified' ? -1 : 1
      }
      return a.sort - b.sort
    })
    return arr
  }, [list, q, onlyVerified, sort])

  const visible = filtered.slice(0, shown)
  const isSkill = cat === 'skill'

  return (
    <div>
      {/* toolbar（线框 .toolbar） */}
      <div className="flex gap-2 mb-2.5 items-center flex-wrap">
        <div className="flex-1 min-w-[180px] h-8 bg-[var(--card)] border border-[var(--border)] rounded-[6px] flex items-center px-3 gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg3)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setShown(PAGE) }}
            placeholder="在本类中搜索…"
            className="flex-1 bg-transparent outline-none text-[12px] text-[var(--fg)] placeholder:text-[var(--fg4)] min-w-0"
          />
        </div>
        {([['sort', '综合 ↓'], ['verified', '实测优先'], ['name', '名称']] as [SortKey, string][]).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setSort(k)}
            className={`h-8 px-3 rounded-[6px] text-[12px] whitespace-nowrap transition ${sort === k ? 'bg-[var(--primary)] text-[var(--on-primary)]' : 'bg-[var(--bg2)] text-[var(--fg2)] hover:text-[var(--fg)]'}`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setOnlyVerified((v) => !v); setShown(PAGE) }}
          className={`h-8 px-3 rounded-[6px] text-[12px] whitespace-nowrap transition ${onlyVerified ? 'bg-[var(--primary)] text-[var(--on-primary)]' : 'bg-[var(--bg2)] text-[var(--fg2)] hover:text-[var(--fg)]'}`}
        >
          {onlyVerified ? '☑' : '☐'} 仅实测
        </button>
      </div>

      {/* 行卡（线框 .row-a + hover 上浮） */}
      <div>
        {visible.map((t) => (
          <div key={t.name} className="tools-rowa">
            <div className="nm" title={t.name}>
              {t.name}
              {t.verify === 'verified' && <span className="tools-verified" style={{ marginLeft: 6 }}>实测</span>}
            </div>
            <div className="dc" title={t.desc}>{t.desc}</div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="tools-go off" title="评测制作中">评测</span>
              {INSTALLABLE.has(t.name) ? (
                <Link href="/essential" className="tools-go dark" title="去装机">装机</Link>
              ) : (
                <span className="tools-go off" title="暂无装机指南">装机</span>
              )}
              {isSkill && t.skillPlatform ? (
                <Link href={`/skills/classic?platform=${t.skillPlatform}`} className="tools-go" title="去 Skill中心 看该平台生态">看生态</Link>
              ) : null}
              <a href={t.url} target="_blank" rel="noopener noreferrer nofollow" className="tools-go">官网↗</a>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="tools-empty">没有匹配的工具</div>}
      </div>

      {shown < filtered.length && (
        <button
          type="button"
          onClick={() => setShown((s) => s + PAGE)}
          className="tools-more w-full"
        >
          加载更多（已显示 {visible.length} / {filtered.length}）…
        </button>
      )}
    </div>
  )
}
