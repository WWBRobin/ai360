'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { ToolItem } from '@/lib/tools-data'

/**
 * 软件管家客户端（分层版 C）
 * 一层=看：hero 搜索（接 /search）+ 三段分层门户，每类头部 3-4 条 + 查看全部；
 * 钩子位：评测（置灰，评测页未立项）/ 装机（→/essential）/ 官网（外链）；
 * 评分不显示（v3 无 score 字段，禁编造）——评分位留槽由二级页承接。
 */

interface Layer {
  id: number
  tag: string
  name: string
  sub: string
  cats: string[]
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

/** 钩子位：装机路由映射（装机清单里有对应项才亮，否则置灰） */
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

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="pt-10 pb-8">
        <div className="text-[13px] text-[var(--fg3)] mb-2">ArcDock · 软件管家</div>
        <h1 className="text-[30px] font-bold text-[var(--fg)] leading-tight tracking-tight">
          AI 世界的导航
        </h1>
        <p className="text-[14px] text-[var(--fg2)] mt-2 mb-6">
          {tools.length} 款头部工具 · 11 大类 · 只收知名，不收野鸡
        </p>
        <form action="/search" className="max-w-[520px] flex items-center gap-2 search-input px-4 h-11">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--fg3)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜工具名或用途，如：写文案、做PPT、聊天机器人…"
            className="flex-1 bg-transparent outline-none text-[14px] text-[var(--fg)] placeholder:text-[var(--fg4)]"
          />
          <button type="submit" className="btn-primary !px-4 !py-1.5 text-[13px]">搜索</button>
        </form>
      </section>

      {/* ===== 三段分层 ===== */}
      {layers.map((layer) => (
        <section key={layer.id} className="mb-10">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-[12px] font-semibold text-[var(--green)]">{layer.tag}</span>
            <h2 className="text-[20px] font-bold text-[var(--fg)]">{layer.name}</h2>
            <span className="text-[13px] text-[var(--fg3)]">{layer.sub}</span>
            <span className="ml-auto text-[12px] text-[var(--fg3)]">
              {layer.cats.length} 类 · {layer.cats.reduce((s, c) => s + (byCat[c]?.length ?? 0), 0)} 个
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {layer.cats.map((slug) => {
              const cat = catMap[slug]
              if (!cat) return null
              const list = byCat[slug] ?? []
              const isSkill = slug === 'skill'
              return (
                <div key={slug} className="content-card !p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Link href={CAT_PAGE[slug]} className="text-[15px] font-semibold text-[var(--fg)] hover:underline">
                        {cat.name}
                      </Link>
                      <div className="text-[12px] text-[var(--fg3)] mt-0.5">{cat.desc}</div>
                    </div>
                    <div className="text-[12px] shrink-0">
                      {isSkill ? (
                        <Link href="/skills/classic" className="text-[var(--blue)] hover:underline font-medium">
                          去 Skill中心 找 →
                        </Link>
                      ) : (
                        <Link href={CAT_PAGE[slug]} className="text-[var(--fg3)] hover:text-[var(--fg)]">
                          查看全部 {list.length} 个 →
                        </Link>
                      )}
                    </div>
                  </div>
                  <ul className="divide-y divide-[var(--border)]">
                    {list.slice(0, 4).map((t) => (
                      <li key={t.name} className="py-2.5 flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <a
                            href={t.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="text-[13.5px] font-medium text-[var(--fg)] hover:underline truncate inline-block max-w-full"
                          >
                            {t.name}
                          </a>
                          <div className="text-[12px] text-[var(--fg3)] truncate">{t.desc}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* 评测钩子：评测页未立项，置灰 */}
                          <span className="text-[11px] px-2 py-0.5 rounded text-[var(--fg4)] bg-[var(--bg2)] cursor-not-allowed" title="评测制作中">
                            评测
                          </span>
                          {/* 装机钩子：可装才亮 */}
                          {INSTALLABLE.has(t.name) ? (
                            <Link href="/essential" className="text-[11px] px-2 py-0.5 rounded text-[var(--green)] bg-[var(--green-bg)] hover:underline">
                              装机
                            </Link>
                          ) : (
                            <span className="text-[11px] px-2 py-0.5 rounded text-[var(--fg4)] bg-[var(--bg2)] cursor-not-allowed" title="暂无装机指南">
                              装机
                            </span>
                          )}
                          {/* Skill 类：有平台深链 */}
                          {isSkill && t.skillPlatform ? (
                            <Link
                              href={`/skills/classic?platform=${t.skillPlatform}`}
                              className="text-[11px] px-2 py-0.5 rounded text-[var(--blue)] bg-[var(--blue-bg)] hover:underline"
                            >
                              看生态 →
                            </Link>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
