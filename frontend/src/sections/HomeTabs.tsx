'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const PLATFORMS = [
  { slug: 'hermes', icon: '🔧', name: 'Hermes', count: 271, color: '#e0e7ff' },
  { slug: 'gpts', icon: '💬', name: 'GPTs', count: 86, color: '#dcfce7' },
  { slug: 'coze', icon: '🤖', name: '扣子', count: 25, color: '#fef3c7' },
  { slug: 'saas', icon: '☁️', name: 'SaaS', count: 24, color: '#f0f9ff' },
  { slug: 'mcp', icon: '🔌', name: 'MCP', count: 22, color: '#f3e8ff' },
  { slug: 'claude', icon: '🧠', name: 'Claude', count: 20, color: '#fce7f3' },
  { slug: 'openclaw', icon: '🦅', name: 'OpenClaw', count: 14, color: '#fef2f2' },
  { slug: 'codex', icon: '📦', name: 'Codex', count: 8, color: '#f1f5f9' },
  { slug: 'dify', icon: '🏗️', name: 'Dify', count: 7, color: '#e0f2fe' },
  { slug: 'n8n', icon: '🔄', name: 'n8n', count: 4, color: '#fee2e2' },
  { slug: 'claude-code', icon: '⚡', name: 'Claude Code', count: 4, color: '#fce7f3' },
  { slug: 'qwen', icon: '🌟', name: '千问', count: 2, color: '#fffbeb' },
]

const SCENARIOS = [
  { slug: 'ecommerce-copy', icon: '🛍️', title: '做电商', desc: '文案+主图' },
  { slug: 'content-creation', icon: '📝', title: '写内容', desc: '文章+社媒' },
  { slug: 'design', icon: '🎨', title: '做设计', desc: '海报+UI' },
  { slug: 'video', icon: '🎬', title: '做视频', desc: '生成+剪辑' },
  { slug: 'data-analysis', icon: '📊', title: '看数据', desc: '分析+报告' },
  { slug: 'code', icon: '💻', title: '写代码', desc: '编程+调试' },
  { slug: 'memory', icon: '🧠', title: '加记忆', desc: 'AI记住你' },
  { slug: 'search', icon: '🔍', title: '能搜索', desc: 'AI上网' },
  { slug: 'file', icon: '📁', title: '读写文件', desc: '直接操作' },
  { slug: 'connect', icon: '🔗', title: '连工具', desc: '接外部App' },
]

const PICKS = [
  { name: 'Tavily 搜索', score: 4.9, desc: '让 AI 能联网搜索', quota: '免费1000次/月', href: '/skill/tavily-search' },
  { name: 'claude-mem', score: 4.8, desc: '让 AI 记住你', quota: '完全免费', href: '/skill/claude-mem' },
  { name: 'Composio', score: 4.7, desc: '让 AI 连接 1000+ 应用', quota: '免费2万次/月', href: '/skill/composio' },
]

const TABS = [
  { id: 'platform', label: '按平台', icon: '📱' },
  { id: 'scene', label: '按场景', icon: '🎯' },
  { id: 'picks', label: '精选', icon: '⭐' },
] as const

type TabId = typeof TABS[number]['id']

export default function HomeTabs() {
  const [tab, setTab] = useState<TabId>('platform')

  return (
    <div className="bg-white">
      {/* 精简 Hero */}
      <div className="text-center pt-10 pb-6 px-4 bg-gradient-to-b from-indigo-50/40 to-white">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
          AI 工具那么多，<span className="gradient-text">哪个值得装？</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base">
          528 个工具 · 19 个平台 · 独立评测 · 每日更新
        </p>
      </div>

      {/* Tab 切换栏 */}
      <div className="sticky top-[57px] z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-5xl mx-auto flex justify-center gap-1 px-4">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                tab === t.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 内容区 */}
      <div className="max-w-5xl mx-auto px-4 py-8 min-h-[400px]">
        {/* 按平台 */}
        {tab === 'platform' && (
          <div>
            <p className="text-center text-gray-400 text-sm mb-6">选你的平台，看该装什么</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {PLATFORMS.map(p => (
                <Link key={p.slug} href={`/platform/${p.slug}`}
                  className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all group"
                  style={{ backgroundColor: p.color }}>
                  <span className="text-2xl">{p.icon}</span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">{p.name}</span>
                  <span className="text-[10px] text-gray-400">{p.count}个</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 按场景 */}
        {tab === 'scene' && (
          <div>
            <p className="text-center text-gray-400 text-sm mb-6">按你要做的事找工具</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {SCENARIOS.map(s => (
                <Link key={s.slug} href={`/scenario/${s.slug}`}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all group">
                  <span className="text-xl shrink-0">{s.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 group-hover:text-indigo-600">{s.title}</div>
                    <div className="text-[11px] text-gray-400">{s.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 精选 */}
        {tab === 'picks' && (
          <div>
            <p className="text-center text-gray-400 text-sm mb-6">本周最值得用的 AI 工具</p>
            <div className="space-y-3 max-w-2xl mx-auto">
              {PICKS.map((pick, i) => (
                <Link key={pick.href} href={pick.href}
                  className="pick-card flex items-center gap-4 rounded-xl p-5 bg-white border border-gray-100 group">
                  <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600">{pick.name}</h3>
                    <p className="text-sm text-gray-400 truncate">{pick.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-bold gradient-text">{pick.score.toFixed(1)}</div>
                    <div className="text-[10px] text-gray-300">{pick.quota}</div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link href="/search" className="text-sm text-indigo-500 hover:underline">查看全部 528 个工具 →</Link>
            </div>
          </div>
        )}
      </div>

      {/* 固定底部区：评测 + CTA */}
      <div className="border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📖 深度评测</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/guide/install-guide" className="block rounded-xl p-4 bg-white border border-gray-100 hover:border-indigo-200 transition group">
              <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 mb-1">装机必备完整指南</h3>
              <p className="text-sm text-gray-400">30分钟配齐所有基础工具</p>
            </Link>
            <Link href="/guide/memory-comparison" className="block rounded-xl p-4 bg-white border border-gray-100 hover:border-indigo-200 transition group">
              <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 mb-1">AI怎么记住你？4款横评</h3>
              <p className="text-sm text-gray-400">claude-mem/Mem0/Supermemory实测</p>
            </Link>
            <Link href="/guide/search-comparison" className="block rounded-xl p-4 bg-white border border-gray-100 hover:border-indigo-200 transition group">
              <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 mb-1">怎么让AI能上网？3款对比</h3>
              <p className="text-sm text-gray-400">Tavily/Firecrawl/Brave实测</p>
            </Link>
            <Link href="/guide/ecommerce-copy" className="block rounded-xl p-4 bg-white border border-gray-100 hover:border-indigo-200 transition group">
              <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 mb-1">电商文案Skill实测对比</h3>
              <p className="text-sm text-gray-400">3款文案工具谁写的好</p>
            </Link>
          </div>
        </div>
      </div>

      {/* 新手 CTA */}
      <div className="max-w-5xl mx-auto px-4 pb-10">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 md:p-8 text-center">
          <p className="text-white font-bold text-lg mb-2">🚀 刚接触 AI 工具？</p>
          <p className="text-white/80 text-sm mb-4">不知道从哪开始？3分钟入门</p>
          <div className="flex justify-center gap-3">
            <Link href="/essential" className="bg-white text-indigo-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-50">新手入门 →</Link>
            <Link href="/guide/install-guide" className="bg-white/20 text-white px-5 py-2.5 rounded-xl font-bold text-sm border border-white/30">装机指南</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
