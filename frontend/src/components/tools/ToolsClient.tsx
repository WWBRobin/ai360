'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { ToolItem } from '@/lib/tools-data'
import './tools.css'

/**
 * 软件管家门户 · A- 定稿形态（2026-08-20 用户拍板）
 * 结构：玻璃banner（保留）+ 左栏类目唯一索引（L1绿/L2蓝/L3琥珀分组）+ 右区双态
 *   默认态 = 「从这开始」说明卡(仅首次) + 第一个类内容
 *   选类态 = 定位条 + 类头 + 头部精选(Top1大卡+Top2/3小卡) + 长尾紧凑列表 + 全部入口
 * 视觉：全部延续现版风格——层色体系/玻璃壳/双轨令牌，纯客户端切换不跳页
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

/** 层色映射（与 CSS .tools-layer[style*=tint] 同源） */
const TINT_COLOR: Record<string, string> = {
  green: 'var(--green)',
  blue: 'var(--blue)',
  amber: '#d97706',
}

/** 每类 Top3 的编辑判断文案（AI 起稿 + 人工过；后补机制，先给首批） */
const PICKS_COPY: Record<string, { i: number; text: string }[]> = {
  llm: [
    { i: 0, text: '事实标准。生态最全、能力天花板，日常与写代码都是第一档；境内访问建议走中转。' },
    { i: 1, text: '国产性价比之王。免费档直连可用，推理能力强，中文场景几乎无门槛。' },
    { i: 2, text: '长文与代码最强一档。写作和重构体验突出，需境外网络。' },
  ],
  apps: [
    { i: 0, text: '最出圈的 AI 独立产品，开箱即用的对话助手标杆。' },
    { i: 1, text: '笔记场景的 AI 化标杆，知识库+写作一体。' },
    { i: 2, text: '国内可直连的搜索问答助手，零门槛起步。' },
  ],
  search: [
    { i: 0, text: 'AI 搜索品类定义者，答案带引用源。' },
    { i: 1, text: '国内直连、无广告的 AI 搜索，中文体验好。' },
    { i: 2, text: '无广告、结果质量高的付费搜索。' },
  ],
  gen: [
    { i: 0, text: '字节系文生图/视频，中文理解一流，境内直连。' },
    { i: 1, text: '快手系视频生成，动作连贯度第一档。' },
    { i: 2, text: '文生图品质标杆，艺术风格最强（需境外网络）。' },
  ],
  office: [
    { i: 0, text: '国内办公场景第一选择，中文文档体验好。' },
    { i: 1, text: 'Office 全家桶 AI 化，企业生态最全。' },
    { i: 2, text: '英文写作润色的事实标准。' },
  ],
  coding: [
    { i: 0, text: '代码补全普及者，IDE 集成成熟。' },
    { i: 1, text: '终端里的 AI 工程师，重构与脚本一把梭。' },
    { i: 2, text: 'AI 原生编辑器，代码库理解最深。' },
  ],
  agent: [
    { i: 0, text: '字节系 Agent 平台，中文生态+模板最全。' },
    { i: 1, text: '开源 Agent 应用平台，私有部署首选。' },
    { i: 2, text: 'Agent 开发框架，代码党的乐高。' },
  ],
  skill: [
    { i: 0, text: '扣子官方技能市场，中文 Skill 生态主阵地。' },
    { i: 1, text: 'OpenAI 定制 GPT 市场，全球最大。' },
    { i: 2, text: 'Anthropic 官方技能体系，工程化最强。' },
  ],
  mcp: [
    { i: 0, text: '协议官方仓库，MCP 生态源头。' },
    { i: 1, text: '社区 MCP Servers 目录，收录最全。' },
    { i: 2, text: '地图/出行数据接入 MCP 官方实现。' },
  ],
  data: [
    { i: 0, text: '托管向量库标杆，省心首选。' },
    { i: 1, text: '开源向量数据库，自主部署主流。' },
    { i: 2, text: 'Milvus 托管版，开箱即用。' },
  ],
  relay: [
    { i: 0, text: '官方自营中转：一个密钥用所有模型，官方同价+智能路由省钱。' },
  ],
}

const layerCatCount = (l: Layer) => l.cats.length
const byLayerCount = (l: Layer, byCat: Record<string, ToolItem[]>) => l.cats.reduce((s2, c) => s2 + (byCat[c]?.length ?? 0), 0)

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
  const [active, setActive] = useState('llm')

  const catMap = useMemo(() => Object.fromEntries(cats.map((c) => [c.slug, c])), [cats])
  const byCat = useMemo(() => {
    const m: Record<string, ToolItem[]> = {}
    for (const t of tools) (m[t.slug] ||= []).push(t)
    for (const k of Object.keys(m)) m[k].sort((a, b) => a.sort - b.sort)
    return m
  }, [tools])
  const verifiedCount = useMemo(() => tools.filter((t) => t.verify === 'verified').length, [tools])

  const activeLayer = layers.find((l) => l.cats.includes(active))!
  const list = byCat[active] ?? []
  const picks = list.slice(0, 3)
  const tail = list.slice(3)
  const picksCopy = PICKS_COPY[active] ?? []
  const isSkill = active === 'skill'
  const isRelay = active === 'relay'

  const selectCat = (slug: string) => {
    setActive(slug)
  }

  return (
    <div>
      {/* ══ 玻璃 Banner（保留现版视觉，不动）══ */}
      <section className="tools-hero">
        <div className="tools-eyebrow">ArcDock · 软件导航</div>
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

      {/* ══ A- 主体：左栏唯一索引 + 右区双态 ══ */}
      <div className="tools-am layout-am">
        {/* 左栏 */}
        <aside className="tools-side">
          {layers.map((layer) => (
            <div key={layer.id} className="mb-3 tools-side-groupwrap" data-tint={layer.tint}>
              <div className="tools-side-group">
                <span className="tools-side-dot" style={{ background: TINT_COLOR[layer.tint] }} />
                {layer.tag} · {layer.name}
              </div>
              {layer.cats.map((slug) => {
                const m = catMap[slug]
                const n = byCat[slug]?.length ?? 0
                const on = slug === active
                const skillTag = slug === 'skill'
                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => selectCat(slug)}
                    className={`tools-side-item ${on ? 'on' : ''}`}
                  >
                    <span className="truncate">{m?.name ?? slug}</span>
                    <span className="c">{skillTag ? `${n}↗` : n}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </aside>

        {/* 右区 */}
        <div className="tools-main">
          {/* ① 层主标题（原定位条升级：层名做卡片主标题，层色锚点） */}
          <div className="tools-crumb-am" style={{ ['--lt-color' as string]: TINT_COLOR[activeLayer.tint] }}>
            <span className="l-dot" />
            <b className="layer-title">{activeLayer.tag} · {activeLayer.name}</b>
            <span className="sub">{activeLayer.sub}</span>
            <span className="tail-count">{layerCatCount(activeLayer)} 类 · {byLayerCount(activeLayer, byCat)} 个</span>
          </div>

          {/* ② 类头 */}
          <div className="tools-cathead-am" style={{ ['--lt-color' as string]: TINT_COLOR[activeLayer.tint] }}>
            <div className="name">
              <span className="sq" />
              {catMap[active]?.name}
              <span className="cnt">{list.length} 个</span>
            </div>
            <div className="desc">{catMap[active]?.desc}</div>
            {isSkill ? (
              <Link href="/skills/classic" className="all">去 Skill中心（307 条）→</Link>
            ) : isRelay ? (
              <Link href="/essential" className="all">去装机 →</Link>
            ) : (
              <Link href={CAT_PAGE[active]} className="all">全部 {list.length} →</Link>
            )}
          </div>

          {/* ③ 头部精选：Top1 大卡 + Top2/3 小卡 */}
          <div className={`tools-picks ${picks.length === 1 ? 'one' : picks.length === 4 ? 'four' : ''}`}>
            {picks.map((t, idx) => (
              <div key={t.name} className={`pick ${idx === 0 ? 'big' : ''}`}>
                <div className="top">
                  <span className="idx">Top {idx + 1}</span>
                  <span className="nm">{t.name}</span>
                  {t.verify === 'verified' && <span className="tag ok">实测</span>}
                  {t.verify === 'blocked_local' && idx === 0 && <span className="tag">境内需梯</span>}
                </div>
                <div className="desc">{picksCopy[idx]?.text ?? t.desc}</div>
                <div className="foot">
                  <span className="hk off" title="评测制作中">评测</span>
                  {INSTALLABLE.has(t.name) && (
                    <Link href="/essential" className="hk g" title="去装机">装机 →</Link>
                  )}
                  {isSkill && t.skillPlatform && (
                    <Link href={`/skills/classic?platform=${t.skillPlatform}`} className="hk" title="去 Skill中心 看该平台生态">看生态 →</Link>
                  )}
                  <a href={t.url} target="_blank" rel="noopener noreferrer nofollow" className="hk">官网 ↗</a>
                </div>
              </div>
            ))}
          </div>

          {/* ④ 长尾紧凑列表 */}
          {tail.length > 0 && (
            <>
              <div className="tools-tail-head">其余 {tail.length} 个 · 按 ArcDock 综合排序</div>
              <div className="tools-tail">
                {tail.slice(0, 8).map((t, i) => (
                  <div key={t.name} className="t-row">
                    <span className="t-num">{i + 4}</span>
                    <span className="t-name">{t.name}</span>
                    {t.verify === 'verified' && <span className="t-ver">实测</span>}
                    <span className="t-hks">
                      <span className="t-hk off">评测</span>
                      {INSTALLABLE.has(t.name) && <Link href="/essential" className="t-hk g">装机</Link>}
                      {isSkill && t.skillPlatform && (
                        <Link href={`/skills/classic?platform=${t.skillPlatform}`} className="t-hk">看生态</Link>
                      )}
                      <a href={t.url} target="_blank" rel="noopener noreferrer nofollow" className="t-hk">官网↗</a>
                    </span>
                  </div>
                ))}
                {tail.length > 8 ? (
                  <Link href={isSkill ? '/skills/classic' : isRelay ? '/essential' : CAT_PAGE[active]} className="t-more">
                    展开其余 {tail.length - 8} 个 …（全部 {list.length}）
                  </Link>
                ) : null}
              </div>
            </>
          )}

          {/* Skill 类尾部大出口 */}
          {isSkill && (
            <div className="tools-skill-exit">
              想找具体 Skill？<Link href="/skills/classic">去 Skill中心（307 条 · 平台筛选 · 场景 Tab）→</Link>
            </div>
          )}
        </div>
      </div>

      {/* 图例脚注 */}
      <div className="tools-legend">
        <span>评分暂不显示（口径 P1 制定中，不编造分数）</span>
        <span>钩子位：评测 → 制作中置灰 ｜ 装机 → /essential ｜ 官网 → 外链新窗</span>
        <span>实测核验 {verifiedCount} / {tools.length}</span>
      </div>
    </div>
  )
}
