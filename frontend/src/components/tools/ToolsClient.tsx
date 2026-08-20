'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { ToolItem } from '@/lib/tools-data'
import './tools.css'

/**
 * 软件管家门户（分层版 C 精确对齐线框 + AI体检视觉语汇融合）
 * 结构规格（线框）：hero灰底圆角块+stats行 / 层带2px黑粗底线+L徽标+右计数 / L1·L3=4列 L2=3列
 *   / 工具行白底圆角小卡+钩子位 / more虚线居中按钮
 * 视觉语汇（体检页）：eyebrow小标签 / 关键词绿高亮 / 数字带单位主次分明 / 卡片hover轻上浮 / L徽标绿点睛
 * 拍板落实：评分不显示 / 评测置灰 / 装机可装才亮 / Skill类深链 / 中转只留自营
 */

interface Layer {
  id: number
  tag: string
  name: string
  sub: string
  cats: string[]
  tint: string
}
interface Cat {
  slug: string
  name: string
  desc: string
}

const CAT_PAGE: Record<string, string> = {
  llm: '/tools/llm', apps: '/tools/apps', search: '/tools/search', gen: '/tools/gen',
  office: '/tools/office', coding: '/tools/coding', agent: '/tools/agent',
  skill: '/tools/skill', mcp: '/tools/mcp', data: '/tools/data', relay: '/tools/relay',
}

const INSTALLABLE = new Set([
  'DeepSeek', '通义千问', 'Kimi', '扣子 Coze', 'Dify', 'n8n', 'Cursor',
  'Claude', 'ChatGPT', '秘塔 AI 搜索', 'WPS AI', 'Obsidian', 'Notion',
])

export default function ToolsClient({ layers, cats, tools }: {
  layers: Layer[]
  cats: Cat[]
  tools: ToolItem[]
}) {
  const [q, setQ] = useState('')

  const catMap = useMemo(() => Object.fromEntries(cats.map((c) => [c.slug, c])), [cats])
  const byCat = useMemo(() => {
    const m: Record<string, ToolItem[]> = {}
    for (const t of tools) (m[t.slug] ||= []).push(t)
    for (const k of Object.keys(m)) m[k].sort((a, b) => a.sort - b.sort)
    return m
  }, [tools])
  const verifiedCount = useMemo(() => tools.filter((t) => t.verify === 'verified').length, [tools])

  return (
    <div>
      {/* ══ Hero：灰底圆角块（线框 .hero + 体检语汇）══ */}
      <section className="tools-hero">
        <div className="tools-eyebrow">ArcDock · 软件管家</div>
        <h1 className="tools-hero-title">
          AI 世界的导航 —— <em>只收知名头部</em>，从大模型到 API 中转
        </h1>
        <p className="tools-hero-sub">三层进阶：先认识，再用好，最后玩透。每个工具都有 ArcDock 的判断。</p>
        <form action="/search" className="tools-search">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--fg3)" strokeWidth="2" strokeLinecap="round" className="shrink-0"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`搜索 ${tools.length} 个工具 / 类别…`}
              className="flex-1 bg-transparent outline-none text-[13px] text-[var(--fg)] placeholder:text-[var(--fg4)] min-w-0"
            />
          </div>
          <span className="text-[11px] text-[var(--fg3)] hidden sm:block shrink-0">回车 → 全站搜索（4256 词语义索引）</span>
        </form>
        {/* stats 数据行（线框 .hero .stats，数字主次分明=体检语汇） */}
        <div className="tools-stats">
          <span><b>11</b> 大类</span>
          <span className="sep">·</span>
          <span><b>{tools.length}</b> 头部工具</span>
          <span className="sep">·</span>
          <span><b>{verifiedCount}</b> 实测核验</span>
          <span className="sep hidden sm:inline">·</span>
          <span className="hidden sm:inline">数据 v3 · 更新引擎规划中</span>
        </div>
      </section>

      {/* ══ 三段层带 ══ */}
      {layers.map((layer) => {
        const layerCount = layer.cats.reduce((s, c) => s + (byCat[c]?.length ?? 0), 0)
        return (
          <section key={layer.id} className="mb-5 tools-layer" style={{ '--lt': layer.tint } as React.CSSProperties}>
            <div className="tools-layer-head">
              <div className="flex items-baseline min-w-0">
                <span className="tools-layer-title">
                  <span className="tools-layer-badge">{layer.tag}</span>
                  {layer.name}
                </span>
                <span className="tools-layer-desc truncate hidden sm:block">{layer.sub}</span>
              </div>
              <span className="tools-layer-count">{layer.cats.length} 类 · <b>{layerCount}</b> 个</span>
            </div>

            <div className={`tools-layer-shell grid grid-cols-1 md:grid-cols-2 ${layer.cats.length === 3 ? 'lg:grid-cols-3 tools-grid3' : 'lg:grid-cols-4 tools-grid4'} gap-3`}>
              {layer.cats.map((slug) => {
                const cat = catMap[slug]
                if (!cat) return null
                const list = byCat[slug] ?? []
                const isSkill = slug === 'skill'
                const isRelay = slug === 'relay'
                return (
                  <div key={slug} className="tools-cat">
                    <div className="tools-cat-head">
                      <Link href={isSkill ? '/skills/classic' : CAT_PAGE[slug]} className="tools-cat-name">
                        {cat.name}
                        <span className="cnt">{list.length}</span>
                      </Link>
                      <span className="tools-cat-all">
                        {isSkill ? 'Skill中心 →' : isRelay ? '官方自营' : `全部 ${list.length} →`}
                      </span>
                    </div>
                    {list.slice(0, 4).map((t) => (
                      <div key={t.name} className="tools-row" title={t.desc}>
                        <a href={t.url} target="_blank" rel="noopener noreferrer nofollow" className="n">{t.name}</a>
                        <span className="hk">
                          <span className="tools-hk off" title="评测制作中">评测</span>
                          {INSTALLABLE.has(t.name) ? (
                            <Link href="/essential" className="tools-hk on" title="去装机">装机</Link>
                          ) : (
                            <span className="tools-hk off" title="暂无装机指南">装机</span>
                          )}
                          {isSkill && t.skillPlatform ? (
                            <Link href={`/skills/classic?platform=${t.skillPlatform}`} className="tools-hk" title="去 Skill中心 看该平台生态">看生态</Link>
                          ) : null}
                        </span>
                      </div>
                    ))}
                    {isSkill ? (
                      <Link href="/skills/classic" className="tools-more">去 Skill中心 找（按平台筛选）→</Link>
                    ) : isRelay ? null : (
                      <Link href={CAT_PAGE[slug]} className="tools-more">查看全部 {list.length} 个 →</Link>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* ══ 图例脚注（线框 .legend）══ */}
      <div className="tools-legend">
        <span>评分暂不显示（口径 P1 制定中，不编造分数）</span>
        <span>钩子位：评测 → 制作中置灰 ｜ 装机 → /essential ｜ 官网 → 外链新窗</span>
        <span>实测核验 {verifiedCount} / {tools.length}</span>
      </div>
    </div>
  )
}
