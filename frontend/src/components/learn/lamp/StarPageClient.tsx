'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLampState, type ChoiceEvent } from '@/hooks/useLampState'
import { inlineMd, isMatrixHead } from '@/lib/lamp-data'
import type { Lamp, LampBlock, LampSection } from '@/lib/lamp-data'
import { XHS_STAR, stars } from '@/lib/star-meta'
import { BulbIcon, StarIcon, ArrowRIcon, ArrowLIcon } from './LampIcons'
import MatrixTable from './MatrixTable'
import DiagnosePanel from './DiagnosePanel'

/**
 * 星页三视图（v3 正式版，对照原型 hash 路由，React 用组件态）：
 * 1. star  星卡：标题/一句话/进度/5盏缩略/路径对比
 * 2. lamps 灯盏列表
 * 3. lamp  灯盏详情：五段式正文 + 评判矩阵 + 满意度分叉 + 点亮
 */

type View = { k: 'star' } | { k: 'lamps' } | { k: 'lamp'; slug: string }

export default function StarPageClient({ lamps }: { lamps: Lamp[] }) {
  const [view, setView] = useState<View>({ k: 'star' })
  const router = useRouter()
  const { mounted, litSet, isLit, lightLamp, unlightLamp, recordChoice, queueLen } = useLampState(XHS_STAR.slug)

  /** 每盏灯当前选的工具（诊断带出 + 切换链记录），localStorage 里 choices 只存最新即可 */
  const [toolSel, setToolSel] = useState<Record<string, string>>({})
  const [diagOpen, setDiagOpen] = useState<string | null>(null)
  const [allLitFlash, setAllLitFlash] = useState(false)

  const litCount = mounted ? lamps.filter((l) => litSet.has(l.slug)).length : 0

  function go(v: View) {
    setView(v)
    window.scrollTo(0, 0)
  }

  function handleChoice(lampSlug: string, ev: ChoiceEvent) {
    // 切换链：若已有选择且 key 不同 → switched_from 记旧值（MatrixTable 传入时已算）
    setToolSel((prev) => ({ ...prev, [lampSlug]: ev.tool_key }))
    recordChoice(ev)
  }

  /** 满意 → 本盏完成；最后一盏满意 → 全链点亮 */
  function satisfied(lampSlug: string) {
    lightLamp(lampSlug)
    setDiagOpen(null)
    const idx = lamps.findIndex((l) => l.slug === lampSlug)
    const next = lamps[idx + 1]
    if (litSet.size + 1 >= lamps.length) {
      setAllLitFlash(true)
      setTimeout(() => setAllLitFlash(false), 2600)
    } else if (next) {
      go({ k: 'lamp', slug: next.slug })
    } else {
      go({ k: 'lamps' })
    }
  }

  /* ================= 视图 1：星卡 ================= */
  if (view.k === 'star') {
    const allLit = mounted && litCount === lamps.length && lamps.length > 0
    return (
      <div className="lamp-wrap">
        <nav className="lamp-crumb">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              router.push('/learn')
            }}
          >
            学习中心
          </a>
          <span className="sep">/</span>
          <span>{XHS_STAR.title}</span>
        </nav>

        <div className="lamp-star-hero">
          <span className="lamp-star-badge">✦ 标杆星 · Phase -1 首选</span>
          <div className="lamp-star-icon">
            <span className="halo" />
            <StarIcon />
          </div>
          <h1 className="lamp-star-title">{XHS_STAR.title}</h1>
          <div className="lamp-star-tags">
            <span className="lamp-tag">{XHS_STAR.scene}</span>
            <span className="lamp-tag">{XHS_STAR.dim}</span>
            <span className="lamp-tag">总分 {XHS_STAR.score}</span>
          </div>
          <p className="lamp-star-desc">{XHS_STAR.desc}</p>

          {/* 5 盏灯缩略 */}
          <div className="lamp-mini-row">
            {lamps.map((l, i) => {
              const lit = mounted && litSet.has(l.slug)
              return (
                <button
                  key={l.slug}
                  type="button"
                  className={`lamp-mini${lit ? ' lit' : ''}`}
                  title={l.title}
                  onClick={() => go({ k: 'lamp', slug: l.slug })}
                >
                  <BulbIcon lit={lit} size={20} />
                  <span className="lamp-mini-idx">{String(i + 1).padStart(2, '0')}</span>
                </button>
              )
            })}
          </div>

          <div className="lamp-progress">
            <div className="lamp-progress-label">
              <span>点亮进度</span>
              <span className="num">
                {litCount} / {lamps.length} 盏灯
              </span>
            </div>
            <div className="lamp-progress-track">
              <div className="lamp-progress-fill" style={{ width: `${(litCount / Math.max(lamps.length, 1)) * 100}%` }} />
            </div>
          </div>

          <div className="lamp-cta-row">
            <button type="button" className="lamp-btn-primary" onClick={() => go({ k: 'lamps' })}>
              {allLit ? '回顾已点亮的灯盏' : '开始点亮第一盏灯'} <ArrowRIcon />
            </button>
            {queueLen > 0 && <span className="lamp-queue-hint">{queueLen} 条选择待登录后上报</span>}
          </div>
        </div>

        {/* 路径对比 */}
        <div className="lamp-paths">
          <div className="lamp-section-h">
            <span className="dot" />
            这颗星有 {XHS_STAR.paths.length} 条实现路径（能力—方案解耦，按需选）
          </div>
          <div className="lamp-table-wrap">
            <table className="lamp-compare">
              <thead>
                <tr>
                  <th>方案</th>
                  <th>上手</th>
                  <th>效果</th>
                  <th>成本</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {XHS_STAR.paths.map((p) => (
                  <tr key={p.name}>
                    <td className="name">{p.name}</td>
                    <td className="lamp-stars">{stars(p.up)}</td>
                    <td className="lamp-stars">{stars(p.effect)}</td>
                    <td className="lamp-cost">{p.cost}</td>
                    <td className="lamp-rec">{p.rec ? '✓ 推荐入门' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="lamp-table-note">
            {XHS_STAR.sixDim} ｜ 成本对比度 {XHS_STAR.costContrast}（DeepSeek 写文案 ≈¥0.005 vs GPT-4o ≈¥0.15，待验证实时价）
          </p>
        </div>

        {allLitFlash && <AllLitToast />}
      </div>
    )
  }

  /* ================= 视图 2：灯盏列表 ================= */
  if (view.k === 'lamps') {
    return (
      <div className="lamp-wrap">
        <nav className="lamp-crumb">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              go({ k: 'star' })
            }}
          >
            <StarIcon size={13} />
          </a>
          <span className="sep">/</span>
          <span>{XHS_STAR.title}</span>
        </nav>
        <div className="lamp-list-head">
          <h2 className="lamp-list-title">{XHS_STAR.title}</h2>
          <p className="lamp-list-sub">平台拆成 {lamps.length} 盏灯，一盏一盏点亮——大颗粒表达，细颗粒执行。</p>
        </div>
        <div className="lamp-progress" style={{ maxWidth: 'none', margin: '0 0 24px' }}>
          <div className="lamp-progress-label">
            <span>已点亮</span>
            <span className="num">
              {litCount} / {lamps.length}
            </span>
          </div>
          <div className="lamp-progress-track">
            <div className="lamp-progress-fill" style={{ width: `${(litCount / Math.max(lamps.length, 1)) * 100}%` }} />
          </div>
        </div>
        <div className="lamp-cards">
          {lamps.map((l, i) => {
            const lit = mounted && litSet.has(l.slug)
            return (
              <button key={l.slug} type="button" className="lamp-card" onClick={() => go({ k: 'lamp', slug: l.slug })}>
                <span className={`lamp-bulb${lit ? ' lit' : ''}`}>
                  <BulbIcon lit={lit} />
                </span>
                <span className="lamp-card-main">
                  <span className="lamp-card-title">
                    <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                    {l.title}
                  </span>
                  <span className="lamp-card-intro">{l.intro}</span>
                </span>
                <span className={`lamp-state ${lit ? 'lit' : 'unlit'}`}>{lit ? '已点亮' : '未点亮'}</span>
                <span className="lamp-arrow">
                  <ArrowRIcon />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  /* ================= 视图 3：灯盏详情 ================= */
  const lamp = lamps.find((l) => l.slug === view.slug)
  if (!lamp) {
    return (
      <div className="lamp-wrap">
        <p>灯盏不存在。</p>
        <button type="button" onClick={() => go({ k: 'lamps' })}>
          返回列表
        </button>
      </div>
    )
  }
  const idx = lamps.findIndex((l) => l.slug === lamp.slug)
  const lit = mounted && litSet.has(lamp.slug)
  const prev = lamps[idx - 1]
  const next = lamps[idx + 1]

  return (
    <div className="lamp-wrap">
      <nav className="lamp-crumb">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            go({ k: 'star' })
          }}
        >
          <StarIcon size={13} />
        </a>
        <span className="sep">/</span>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            go({ k: 'lamps' })
          }}
        >
          {XHS_STAR.title}
        </a>
        <span className="sep">/</span>
        <span>灯盏 {idx + 1}</span>
      </nav>

      <div className="lamp-detail-head">
        <span className={`lamp-bulb${lit ? ' lit' : ''}`} style={{ width: 52, height: 52 }}>
          <BulbIcon lit={lit} size={34} />
        </span>
        <div style={{ minWidth: 0 }}>
          <h2 className="lamp-detail-title">{lamp.title}</h2>
          <div className="lamp-detail-meta">
            <span className="lamp-tag">
              {XHS_STAR.scene} · {XHS_STAR.dim}
            </span>
            <button
              type="button"
              className={`lamp-lit-btn ${lit ? 'on' : 'off'}`}
              onClick={() => (lit ? unlightLamp(lamp.slug) : lightLamp(lamp.slug))}
            >
              {lit ? '✓ 已点亮（点击取消）' : '点亮这盏灯'}
            </button>
          </div>
        </div>
      </div>

      {lamp.sections.map((s, si) => (
        <Section
          key={si}
          idx={si + 1}
          section={s}
          lampSlug={lamp.slug}
          selectedTool={toolSel[lamp.slug] || null}
          onSelect={(ev) => handleChoice(lamp.slug, ev)}
        />
      ))}

      {/* 满意度分叉（v3 核心交互） */}
      <div className="satisfaction-fork">
        <div className="sf-title">这一盏走完了——结果怎么样？</div>
        <div className="sf-btns">
          <button type="button" className="sf-btn ok" onClick={() => satisfied(lamp.slug)}>
            ✅ 满意，下一盏
          </button>
          <button
            type="button"
            className={`sf-btn bad${diagOpen === lamp.slug ? ' open' : ''}`}
            onClick={() => setDiagOpen(diagOpen === lamp.slug ? null : lamp.slug)}
          >
            😕 结果不理想，帮我看看
          </button>
        </div>
        {lit && <div className="sf-done">✓ 本盏已点亮。可以随时回来重走或换工具再试。</div>}
      </div>

      <DiagnosePanel
        lampSlug={lamp.slug}
        toolName={toolSel[lamp.slug] || null}
        open={diagOpen === lamp.slug}
        onClose={() => setDiagOpen(null)}
      />

      <div className="lamp-detail-nav">
        {prev ? (
          <button type="button" className="lamp-nav-card" onClick={() => go({ k: 'lamp', slug: prev.slug })}>
            <span className="nav-ico">
              <ArrowLIcon />
            </span>
            <span>
              <span className="nav-label">上一盏</span>
              <br />
              <span className="nav-title">{prev.title}</span>
            </span>
          </button>
        ) : (
          <span className="lamp-nav-card" style={{ visibility: 'hidden' }} />
        )}
        {next ? (
          <button type="button" className="lamp-nav-card next" onClick={() => go({ k: 'lamp', slug: next.slug })}>
            <span>
              <span className="nav-label">下一盏</span>
              <br />
              <span className="nav-title">{next.title}</span>
            </span>
            <span className="nav-ico">
              <ArrowRIcon />
            </span>
          </button>
        ) : (
          <span className="lamp-nav-card next" style={{ visibility: 'hidden' }} />
        )}
      </div>

      {allLitFlash && <AllLitToast />}
    </div>
  )
}

/* ============ 子组件 ============ */

function AllLitToast() {
  return (
    <div className="all-lit-toast">
      <BulbIcon lit size={22} />
      <span>五盏全亮！「{XHS_STAR.title}」完成——点亮是完成旅程的纪念，不是质量认证。</span>
    </div>
  )
}

/** 一个小节：五段式正文渲染（p/table/checklist/methodNote/sources） */
function Section({
  idx,
  section,
  lampSlug,
  selectedTool,
  onSelect,
}: {
  idx: number
  section: LampSection
  lampSlug: string
  selectedTool: string | null
  onSelect: (ev: ChoiceEvent) => void
}) {
  const isMatrix = useMemo(() => isMatrixHead(section.head), [section.head])
  return (
    <section className="lamp-section">
      <div className="lamp-section-head">
        <span className="lamp-section-step">{idx}</span>
        <h3 className="lamp-section-title">{section.head}</h3>
      </div>
      <div className="lamp-section-body">
        {section.blocks.map((b, bi) => (
          <Block
            key={bi}
            block={b}
            lampSlug={lampSlug}
            isMatrixSection={isMatrix}
            selectedTool={selectedTool}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  )
}

function Block({
  block,
  lampSlug,
  isMatrixSection,
  selectedTool,
  onSelect,
}: {
  block: LampBlock
  lampSlug: string
  isMatrixSection: boolean
  selectedTool: string | null
  onSelect: (ev: ChoiceEvent) => void
}) {
  switch (block.kind) {
    case 'p':
      return <p dangerouslySetInnerHTML={{ __html: inlineMd(block.text) }} />
    case 'table':
      // 工具方案表 → 评判矩阵组件；其余表（复盘表模板等）→ 只读渲染
      if (isMatrixSection) {
        return <MatrixTable lampSlug={lampSlug} table={block.table} selectedTool={selectedTool} onSelect={onSelect} />
      }
      return (
        <div className="lamp-table-wrap">
          <table className="lamp-compare">
            <thead>
              <tr>{block.table.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {block.table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, ci) =>
                    ci === 0 ? (
                      <td key={ci} className="name" dangerouslySetInnerHTML={{ __html: inlineMd(c) }} />
                    ) : (
                      <td key={ci} dangerouslySetInnerHTML={{ __html: inlineMd(c) }} />
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'checklist':
      return (
        <ul className="lamp-checklist">
          {block.items.map((it, i) => (
            <li key={i}>
              <span className="checkbox" />
              <span dangerouslySetInnerHTML={{ __html: inlineMd(it) }} />
            </li>
          ))}
        </ul>
      )
    case 'methodNote':
      return (
        <blockquote className="lamp-method-note">
          ⚠️ <strong>方法论来源说明：</strong>
          <span dangerouslySetInnerHTML={{ __html: inlineMd(block.text.replace(/^\*\*方法论来源说明：?/, '').replace(/\*\*$/, '')) }} />
        </blockquote>
      )
    case 'sources':
      return (
        <div className="lamp-source-list">
          {block.sources.map((s, i) => (
            <div key={i} className="lamp-source-item">
              <span className="s-ico">↗</span>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            </div>
          ))}
        </div>
      )
    default:
      return null
  }
}
