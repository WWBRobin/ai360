'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  buildEquipmentFromInstallPlan,
  getSwapRecommendations,
  GROUP_LABELS,
  GROUP_ORDER,
  type EquipmentItem,
  type InstallPlanState,
  type SwapRecommendation,
} from '@/lib/equipment'
import { BulbIcon } from '@/components/learn/lamp/LampIcons'

const PLAN_KEY = 'arcdock-install-plan'

function readPlan(): InstallPlanState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(PLAN_KEY)
    return raw ? (JSON.parse(raw) as InstallPlanState) : null
  } catch {
    return null
  }
}

/**
 * 我的装备（管家最小版）客户端组件。
 * SSR 默认渲染空状态（保证 curl/爬虫可见「你的 AI 装备是空的」），
 * mounted 后读 localStorage 装机记录（arcdock-install-plan），有已装项则切资产态。
 * 数据来源 = DB（dbEquipment，v1 空）+ localStorage 装机记录（v1 主力）。
 */
export default function EquipmentClient({ dbEquipment }: { dbEquipment: EquipmentItem[] }) {
  const [mounted, setMounted] = useState(false)
  const [equipment, setEquipment] = useState<EquipmentItem[]>(dbEquipment)

  useEffect(() => {
    const local = buildEquipmentFromInstallPlan(readPlan())
    const merged = [...dbEquipment]
    const seen = new Set(dbEquipment.map((e) => e.slug))
    for (const e of local) {
      if (!seen.has(e.slug)) {
        merged.push(e)
        seen.add(e.slug)
      }
    }
    setEquipment(merged)
    setMounted(true)
  }, [dbEquipment])

  const hasEquipment = equipment.length > 0
  const litCount = equipment.filter((e) => e.lit).length
  // 健康分：数据少（无任何 health_score）时隐藏
  const scored = equipment.filter((e) => typeof e.healthScore === 'number' && e.healthScore !== null)
  const avgHealth =
    scored.length > 0
      ? Math.round(scored.reduce((s, e) => s + (e.healthScore as number), 0) / scored.length)
      : null
  const swaps = getSwapRecommendations(equipment.map((e) => e.slug))

  if (!hasEquipment) {
    return <EmptyState />
  }

  return (
    <div>
      <div className="equipment-head">
        <h1 className="equipment-title">我的 AI 装备</h1>
        <p className="equipment-sub">你装好的装备都在这，随时回来看看——该用的用，该换的换。</p>
      </div>

      {/* 资产总览条 */}
      <div className="equipment-summary">
        <div className="equipment-summary-item">
          <span className="num">{equipment.length}</span>
          <span className="label">件装备</span>
        </div>
        <div className="equipment-summary-item">
          <span className="num">{litCount}</span>
          <span className="label">件已点亮</span>
        </div>
        {avgHealth !== null && (
          <div className="equipment-summary-item">
            <span className="num">{avgHealth}</span>
            <span className="label">健康分</span>
          </div>
        )}
      </div>

      {/* 按类型分组列表（v1 先支持 software+assistant，空组不渲染） */}
      {GROUP_ORDER.map((group) => {
        const items = equipment.filter((e) => e.group === group)
        if (items.length === 0) return null
        return (
          <section key={group} className="equipment-group">
            <h2 className="equipment-group-title">{GROUP_LABELS[group]}</h2>
            <div className="equipment-list">
              {items.map((item) => (
                <EquipmentRow key={item.slug} item={item} />
              ))}
            </div>
          </section>
        )
      })}

      {/* 该换没换（数据不足整块隐藏，不留空壳） */}
      {swaps.length > 0 && <SwapBlock swaps={swaps} />}

      {/* 底部入口：跑一次装备体检（过渡，体检页未建前链 /assessment）+ 问诊百科 */}
      <div className="equipment-footer">
        <Link href="/assessment" className="equipment-footer-link">
          跑一次装备体检 →
        </Link>
        <span className="equipment-footer-sep" aria-hidden>
          ·
        </span>
        <Link href="/ask" className="equipment-footer-link equipment-footer-link-secondary">
          AI 出问题了？问诊 →
        </Link>
      </div>
    </div>
  )
}

/* ================= 空状态 ================= */

function EmptyState() {
  return (
    <div className="equipment-empty">
      <div className="equipment-empty-icon">
        <BulbIcon lit={false} size={48} />
      </div>
      <h1 className="equipment-empty-title">你的 AI 装备是空的</h1>
      <p className="equipment-empty-sub">
        装上第一批工具，它们会在这里一盏盏点亮，变成你的专属 AI 装备台。
      </p>
      <Link href="/install" className="equipment-cta">
        3 分钟配第一件装备 →
      </Link>
      <div className="equipment-preview">
        <p className="equipment-preview-label">装 5 件后你的装备台会长这样</p>
        <div className="equipment-preview-lamps">
          {[0, 1, 2].map((i) => (
            <span key={i} className="equipment-preview-lamp">
              <BulbIcon lit size={26} />
            </span>
          ))}
          {[3, 4].map((i) => (
            <span key={i} className="equipment-preview-lamp dim">
              <BulbIcon lit={false} size={26} />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ================= 装备行 ================= */

function EquipmentRow({ item }: { item: EquipmentItem }) {
  return (
    <div className="equipment-row">
      <span className="equipment-logo" aria-hidden>
        {item.name[0]}
      </span>
      <div className="equipment-main">
        <div className="equipment-name-row">
          <span className="equipment-name">{item.name}</span>
          <span className={`equipment-badge ${item.status === 'needs_repair' ? 'warn' : 'ok'}`}>
            {item.status === 'needs_repair' ? '待修 ⚠️' : '已装 ✓'}
          </span>
        </div>
        {item.why && <p className="equipment-why">{item.why}</p>}
      </div>
      <div className="equipment-actions">
        {item.useUrl && (
          <a href={item.useUrl} target="_blank" rel="noreferrer" className="equipment-use">
            去使用 →
          </a>
        )}
        <Link href="/install" className="equipment-escort">
          查看陪跑 →
        </Link>
      </div>
    </div>
  )
}

/* ================= 该换没换 ================= */

function SwapBlock({ swaps }: { swaps: SwapRecommendation[] }) {
  return (
    <section className="equipment-swap">
      <h2 className="equipment-group-title">该换没换</h2>
      <div className="equipment-swap-list">
        {swaps.map((s) => (
          <div key={s.lowName} className="equipment-swap-row">
            <span>
              你装的「{s.lowName}」评分 {s.lowRating.toFixed(1)}，同场景「{s.betterName}」评分{' '}
              {s.betterRating.toFixed(1)}
            </span>
            <a href={s.betterUrl} target="_blank" rel="noreferrer" className="equipment-swap-cta">
              看看 {s.betterName} →
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
