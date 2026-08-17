'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  searchSymptoms,
  SYMPTOM_CATEGORIES,
  entryCategory,
  exitHref,
  EXIT_LABEL,
  type SymptomEntry,
  type SymptomCategory,
  type SymptomSolution,
} from '@/lib/symptom-data'

/** 兜底提交：暂用 mailto（Phase2 接真实反馈渠道后替换） */
const FEEDBACK_MAILTO = 'mailto:feedback@arcdock.cn?subject=问诊百科补充&body='

/**
 * 问诊百科客户端组件：搜索框（symptom+aliases 本地匹配）+ 分类 chips + 卡片展开。
 * 数据来自 Server page 的 props（SSR 首屏直出全部 15 条，curl 可见），交互全部客户端。
 */
export default function AskClient({ entries }: { entries: SymptomEntry[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<SymptomCategory>('全部')
  const [openId, setOpenId] = useState<string | null>(null)

  // 分类计数（静态口径：15 条全量，不随搜索词变化）
  const counts = useMemo(() => {
    const c: Record<string, number> = { 全部: entries.length }
    for (const e of entries) {
      const cat = entryCategory(e)
      c[cat] = (c[cat] || 0) + 1
    }
    return c
  }, [entries])

  // 搜索 + 分类过滤（搜索词匹配 symptom/aliases）
  const filtered = useMemo(() => {
    const searched = searchSymptoms(entries, query)
    if (category === '全部') return searched
    return searched.filter((e) => entryCategory(e) === category)
  }, [entries, query, category])

  const noResult = filtered.length === 0

  return (
    <>
      <div className="ask-head">
        <h1 className="ask-title">AI 问诊</h1>
        <p className="ask-sub">用 AI 遇到问题？说症状，找方案。</p>
      </div>

      <input
        type="search"
        className="ask-search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="输入症状关键词，比如：失忆 / 不听话 / 装不上 / key 泄露…"
        aria-label="搜索症状"
      />

      <div className="ask-chips" role="tablist" aria-label="症状分类">
        {SYMPTOM_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={category === cat}
            className={`ask-chip ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
            <span className="ask-chip-count">{counts[cat] || 0}</span>
          </button>
        ))}
      </div>

      {noResult ? (
        <FallbackCard query={query} />
      ) : (
        <div className="ask-list">
          {filtered.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              open={openId === entry.id}
              onToggle={() => setOpenId(openId === entry.id ? null : entry.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}

/* ================= 条目卡片 ================= */

function EntryCard({
  entry,
  open,
  onToggle,
}: {
  entry: SymptomEntry
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className={`ask-card ${open ? 'open' : ''}`}>
      <button type="button" className="ask-card-head" onClick={onToggle} aria-expanded={open}>
        <div className="ask-card-title-row">
          <span className="ask-card-title">{entry.symptom}</span>
          <span className="ask-card-toggle">{open ? '收起 ↑' : '查看方案 →'}</span>
        </div>
        {entry.aliases.length > 0 && (
          <div className="ask-card-aliases">
            {entry.aliases.slice(0, 5).map((a) => (
              <span key={a} className="ask-alias">
                {a}
              </span>
            ))}
          </div>
        )}
        {/* causes 摘要（type+desc） */}
        <div className="ask-card-causes">
          {entry.causes.map((c) => (
            <div key={c.type} className="ask-card-cause">
              <span className="ask-cause-type">{c.type}</span>
              <span>{c.desc}</span>
            </div>
          ))}
        </div>
      </button>

      {/* 详情（SSR 直出 DOM，CSS 控制显隐——爬虫可见，点击展开） */}
      <div className="ask-detail">
        {/* causes 完整（带 ratio + 占比为估计值角标） */}
        <section className="ask-detail-section">
          <div className="ask-detail-label">
            原因分析
            <span className="ask-estimate-badge">占比为估计值</span>
          </div>
          {entry.causes.map((c) => (
            <div key={c.type} className="ask-cause-row">
              <span className="ask-cause-type">{c.type}</span>
              <span className="ask-cause-desc">{c.desc}</span>
              <span className="ask-cause-ratio">{c.ratio}</span>
            </div>
          ))}
        </section>

        {/* solutions（step + exit 链接化） */}
        <section className="ask-detail-section">
          <div className="ask-detail-label">怎么解决</div>
          <div className="ask-solution-list">
            {entry.solutions.map((s, i) => (
              <SolutionRow key={i} solution={s} index={i} />
            ))}
          </div>
        </section>

        {/* prevention */}
        <section className="ask-detail-section">
          <div className="ask-detail-label">怎么预防</div>
          <p className="ask-prevention">{entry.prevention}</p>
        </section>

        {/* evidence */}
        {entry.evidence && (
          <section className="ask-detail-section">
            <div className="ask-detail-label">依据</div>
            <p className="ask-evidence">{entry.evidence}</p>
          </section>
        )}
      </div>
    </div>
  )
}

/* ================= 方案行（step + exit 链接映射） ================= */

function SolutionRow({ solution, index }: { solution: SymptomSolution; index: number }) {
  const href = exitHref(solution.exit, solution.ref)
  return (
    <div className="ask-solution">
      <span className="ask-solution-num">{index + 1}</span>
      <span className="ask-solution-step">{solution.step}</span>
      {href ? (
        <Link href={href} className="ask-solution-exit">
          {EXIT_LABEL[solution.exit] || solution.exit} →
        </Link>
      ) : (
        // 百科自链：/ask/[slug] 详情路由 Phase2 补，暂不渲染链接只显示文字
        <span className="ask-solution-exit plain" title="详情页 Phase2 开放">
          {EXIT_LABEL[solution.exit] || solution.exit}
        </span>
      )}
    </div>
  )
}

/* ================= 诚实兜底卡（搜索无结果） ================= */

function FallbackCard({ query }: { query: string }) {
  const subject = encodeURIComponent(`问诊百科补充：${query || '未命名症状'}`)
  const body = encodeURIComponent(
    `症状关键词：${query || ''}\n\n（来自 /ask 问诊百科，48 小时内补上方案）`,
  )
  return (
    <div className="ask-fallback">
      <h2 className="ask-fallback-title">这个问题还没有方案</h2>
      <p className="ask-fallback-sub">
        问诊百科首批 15 条还没覆盖「{query || '这个症状'}」——把它提交给我们，48 小时内补上对应条目和解决方案。
      </p>
      <a className="ask-fallback-cta" href={`${FEEDBACK_MAILTO}${subject}&body=${body}`}>
        提交问题，48 小时内补上 →
      </a>
    </div>
  )
}
