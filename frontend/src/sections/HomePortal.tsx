'use client'

import { useState } from 'react'
import Link from 'next/link'

/**
 * AI360 首页 v6 — 大平台站布局
 * 左侧导航栏 + 顶部Tab + 中间深度内容区
 */

const PLATFORMS = [
  { slug: 'hermes', name: 'Hermes', count: 271 },
  { slug: 'gpts', name: 'GPTs', count: 86 },
  { slug: 'coze', name: '扣子', count: 25 },
  { slug: 'saas', name: 'SaaS', count: 24 },
  { slug: 'mcp', name: 'MCP', count: 22 },
  { slug: 'claude', name: 'Claude', count: 20 },
  { slug: 'openclaw', name: 'OpenClaw', count: 14 },
  { slug: 'codex', name: 'Codex', count: 8 },
  { slug: 'dify', name: 'Dify', count: 7 },
  { slug: 'n8n', name: 'n8n', count: 4 },
  { slug: 'claude-code', name: 'Claude Code', count: 4 },
  { slug: 'qwen', name: '千问', count: 2 },
]

const SCENARIOS = [
  { slug: 'memory', title: '记忆增强', count: 8 },
  { slug: 'search', title: '联网搜索', count: 6 },
  { slug: 'file', title: '文件操作', count: 1 },
  { slug: 'connect', title: '工具连接', count: 1 },
  { slug: 'ecommerce-copy', title: '电商营销', count: 3 },
  { slug: 'content-creation', title: '内容创作', count: 49 },
  { slug: 'design', title: '设计创意', count: 9 },
  { slug: 'video', title: '视频制作', count: 12 },
  { slug: 'data-analysis', title: '数据分析', count: 3 },
  { slug: 'code', title: '编程开发', count: 66 },
]

const TABS = [
  { id: 'all', label: '全部' },
  { id: 'essential', label: '装机必备' },
  { id: 'latest', label: '最新上架' },
  { id: 'picks', label: '精选' },
  { id: 'reviews', label: '评测' },
] as const

type TabId = typeof TABS[number]['id']

// 精选工具数据（静态，有深度信息）
const FEATURED = [
  { name: 'Tavily', score: 4.9, platform: 'MCP', tag: 'AI360实测', desc: '让 AI 联网搜索最新信息', free: '免费1000次/月', difficulty: 4, stability: 5, href: '/skill/tavily-search' },
  { name: 'claude-mem', score: 4.8, platform: 'Claude', tag: 'AI360实测', desc: '让 AI 跨会话记住项目上下文', free: '完全免费', difficulty: 2, stability: 3, href: '/skill/claude-mem' },
  { name: 'Composio', score: 4.7, platform: 'MCP', tag: 'AI360实测', desc: '让 AI 一次连接 1000+ 外部应用', free: '免费2万次/月', difficulty: 3, stability: 4, href: '/skill/composio' },
  { name: 'Hermes 能力增强', score: 4.6, platform: 'Hermes', tag: 'AI360实测', desc: 'Hook引擎+向量知识库+记忆系统', free: '完全免费', difficulty: 4, stability: 5, href: '/skill/hermes-power-hub' },
  { name: 'Brave Search MCP', score: 4.8, platform: 'MCP', tag: 'AI360实测', desc: '免费 AI 搜索引擎，无需 API Key', free: '免费2000次/月', difficulty: 4, stability: 4, href: '/skill/brave-search-mcp' },
  { name: 'Frontend Design', score: 4.7, platform: 'Claude', tag: 'AI360实测', desc: 'AI 生成专业级前端 UI 设计', free: '免费', difficulty: 3, stability: 4, href: '/skill/frontend-design' },
]

const GUIDES = [
  { slug: 'install-guide', title: '装机必备完整指南', desc: '记忆/搜索/文件/代码/连接，30分钟配齐' },
  { slug: 'memory-comparison', title: 'AI 怎么记住你？4款记忆方案横评', desc: 'claude-mem / Mem0 / Supermemory 实测' },
  { slug: 'search-comparison', title: '怎么让 AI 能上网？3款搜索方案对比', desc: 'Tavily / Firecrawl / Brave Search MCP' },
  { slug: 'ecommerce-copy', title: '电商文案 Skill 实测对比', desc: '3款文案工具谁写出来的能直接发' },
]

export default function HomePortal() {
  const [tab, setTab] = useState<TabId>('all')
  const [activePlatform, setActivePlatform] = useState<string | null>(null)
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [filterTested, setFilterTested] = useState(false)
  const [filterFree, setFilterFree] = useState(false)

  return (
    <div className="flex min-h-screen bg-white">
      {/* === 左侧导航栏 === */}
      <aside className="hidden md:block w-56 shrink-0 border-r border-gray-100 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
        <div className="p-4 space-y-6">
          
          {/* 平台导航 */}
          <div>
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">平台</h3>
            <nav className="space-y-0.5">
              {PLATFORMS.map(p => (
                <button
                  key={p.slug}
                  onClick={() => { setActivePlatform(activePlatform === p.slug ? null : p.slug); setActiveScenario(null) }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition ${
                    activePlatform === p.slug ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{p.name}</span>
                  <span className="text-[10px] text-gray-300">{p.count}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* 场景导航 */}
          <div>
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">场景</h3>
            <nav className="space-y-0.5">
              {SCENARIOS.map(s => (
                <Link
                  key={s.slug}
                  href={`/scenario/${s.slug}`}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  <span>{s.title}</span>
                  <span className="text-[10px] text-gray-300">{s.count}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* 筛选 */}
          <div>
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">筛选</h3>
            <div className="space-y-1 px-2">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={filterTested} onChange={() => setFilterTested(!filterTested)} className="rounded border-gray-300" />
                AI360 实测
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={filterFree} onChange={() => setFilterFree(!filterFree)} className="rounded border-gray-300" />
                免费工具
              </label>
            </div>
          </div>

          {/* 快捷入口 */}
          <div className="border-t border-gray-100 pt-4">
            <Link href="/essential" className="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600">
              新手入门
            </Link>
            <Link href="/compare" className="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600">
              工具对比
            </Link>
            <Link href="/guide" className="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600">
              深度评测
            </Link>
            <Link href="/subscribe" className="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600">
              订阅周报
            </Link>
          </div>
        </div>
      </aside>

      {/* === 主内容区 === */}
      <main className="flex-1 min-w-0">
        {/* 顶部 Tab */}
        <div className="border-b border-gray-100 sticky top-14 z-30 bg-white">
          <div className="px-6 flex gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-3 text-sm border-b-2 transition ${
                  tab === t.id ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 内容 */}
        <div className="p-6">
          {/* === 全部/精选 === */}
          {(tab === 'all' || tab === 'picks') && (
            <div>
              {/* 平台筛选提示 */}
              {activePlatform && (
                <div className="mb-4 text-sm text-gray-500">
                  筛选中：<span className="text-blue-600 font-medium">{PLATFORMS.find(p => p.slug === activePlatform)?.name}</span>
                  <button onClick={() => setActivePlatform(null)} className="ml-2 text-gray-400 hover:text-gray-600">清除</button>
                </div>
              )}

              {/* 工具卡片列表（有深度） */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {FEATURED.map(skill => (
                  <Link key={skill.href} href={skill.href} className="block p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition group">
                    {/* 第一行：名称 + 评分 + 标签 */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">{skill.name}</span>
                        <span className="ml-2 text-[10px] text-gray-400">{skill.platform}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium">{skill.tag}</span>
                        <span className="text-base font-bold text-amber-600">{skill.score}</span>
                      </div>
                    </div>
                    {/* 第二行：一句话描述 */}
                    <p className="text-xs text-gray-500 mb-3">{skill.desc}</p>
                    {/* 第三行：三维评分 */}
                    <div className="flex items-center gap-4 text-[11px] text-gray-400">
                      <span>上手 {skill.difficulty}/5</span>
                      <span>稳定 {skill.stability}/5</span>
                      <span className="text-gray-500">{skill.free}</span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-6 text-center">
                <Link href="/search" className="text-sm text-blue-600 hover:underline">查看全部 528 个工具 →</Link>
              </div>
            </div>
          )}

          {/* === 装机必备 === */}
          {tab === 'essential' && (
            <div>
              <p className="text-sm text-gray-500 mb-4">刚接触 AI？先装这些核心工具。</p>
              <Link href="/essential"
                className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
                查看装机必备完整指南 →
              </Link>
            </div>
          )}

          {/* === 最新上架 === */}
          {tab === 'latest' && (
            <div>
              <p className="text-sm text-gray-500 mb-4">最近新增的工具</p>
              <div className="text-sm text-gray-400">持续更新中...</div>
            </div>
          )}

          {/* === 评测 === */}
          {tab === 'reviews' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GUIDES.map(g => (
                  <Link key={g.slug} href={`/guide/${g.slug}`}
                    className="block p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition group">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 mb-1">{g.title}</h3>
                    <p className="text-xs text-gray-400">{g.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
