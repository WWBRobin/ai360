import Link from 'next/link'
import './home.css'

/**
 * SoftwareCard —— 首页 B 软件卡（信息架构 v1 §四 · 软件卡规格）
 *
 * 纯展示 Server Component（无交互，无需 'use client'）。
 * 数据源：src/lib/software-cards.json 的 software_cards 数组（19 平台）。
 *
 * 卡片结构：
 *   [logo 圆形首字] 平台名    ⭐4.5
 *   one_liner（说人话一句话）
 *   🆓免费 · 🇨🇳国内直连 · 不要梯子（三硬门槛标，派生规则见 deriveBadges）
 *   适合L1+ · 装机约3分钟
 *   [开始用 →]（主按钮，链 /install）
 *   进阶：{name}的更多能力 →（仅 layer=workbench，链 /skills）
 */

export interface SoftwareCardData {
  id: string
  name: string
  layer: 'workbench' | 'assistant'
  one_liner: string
  rating: number
  free_tier: string
  price: string
  region: string
  proxy_needed: boolean
  install_minutes: number
  entry_level: string
  category: string
  install_url: string
  why_recommended: string
  evidence: string
  estimated: boolean
  updated_at: string
}

export interface CardBadges {
  free: boolean
  cn: boolean
  noProxy: boolean
}

/**
 * 三硬门槛标派生规则（任务书原文）：
 *   free_tier 含"免费" → 🆓标
 *   region=cn          → 🇨🇳标
 *   proxy_needed=false → "不要梯子"，否则显示"要梯子"⚠️
 */
export function deriveBadges(card: SoftwareCardData): CardBadges {
  return {
    free: card.free_tier.includes('免费'),
    cn: card.region === 'cn',
    noProxy: !card.proxy_needed,
  }
}

/** ⭐评分文本（保留 1 位小数） */
export function ratingText(rating: number): string {
  return `⭐${rating.toFixed(1)}`
}

/** 圆形 logo 首字：取名称第一个字符（"扣子 Coze" → "扣"） */
export function logoChar(name: string): string {
  return name.trim().charAt(0) || '?'
}

/** "适合L1+" / "装机约3分钟" */
export function entryText(level: string): string {
  return `适合${level}+`
}
export function installText(minutes: number): string {
  return `装机约${minutes}分钟`
}

export default function SoftwareCard({ card }: { card: SoftwareCardData }) {
  const badges = deriveBadges(card)
  return (
    <div className="softcard">
      {/* 顶行：logo + 平台名 + 评分 */}
      <div className="softcard-head">
        <span className="softcard-logo" aria-hidden>
          {logoChar(card.name)}
        </span>
        <span className="softcard-name">{card.name}</span>
        <span className="softcard-rating">{ratingText(card.rating)}</span>
      </div>

      {/* 说人话一句话 */}
      <p className="softcard-liner">{card.one_liner}</p>

      {/* 三硬门槛标 */}
      <div className="softcard-gates">
        {badges.free && <span className="softcard-gate">🆓免费</span>}
        {badges.cn && <span className="softcard-gate">🇨🇳国内直连</span>}
        {badges.noProxy ? (
          <span className="softcard-gate">不要梯子</span>
        ) : (
          <span className="softcard-gate softcard-gate-warn">⚠️要梯子</span>
        )}
      </div>

      {/* 入门门槛 + 装机时间 */}
      <div className="softcard-meta">
        {entryText(card.entry_level)} · {installText(card.install_minutes)}
      </div>

      {/* 主按钮 → /install */}
      <Link href="/install" className="softcard-btn">
        开始用 →
      </Link>

      {/* 进阶入口（仅工作台层）→ /skills */}
      {card.layer === 'workbench' && (
        <Link href="/skills" className="softcard-advanced">
          进阶：{card.name}的更多能力 →
        </Link>
      )}
    </div>
  )
}
