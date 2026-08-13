'use client'

import Link from 'next/link'
import { useState } from 'react'

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

export default function AppSidebar() {
  const [selected, setSelected] = useState<string[]>(['hermes'])
  const [showAll, setShowAll] = useState(false)

  const togglePlatform = (slug: string) => {
    setSelected(prev => {
      if (prev.includes(slug)) return prev.filter(s => s !== slug)
      if (prev.length >= 3) return [...prev.slice(1), slug]
      return [...prev, slug]
    })
  }

  const sorted = [
    ...PLATFORMS.filter(p => selected.includes(p.slug)),
    ...PLATFORMS.filter(p => !selected.includes(p.slug)),
  ]
  const visible = showAll ? sorted : sorted.slice(0, 5)

  return (
    <aside className="hidden md:flex flex-col w-[240px] shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto z-10">
      <div className="py-4">
        {/* 平台区 */}
        <div className="px-4 mb-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">平台</span>
            <span className="text-[10px] text-[#D1D5DB]">多选≤3</span>
          </div>
        </div>

        <div className="px-2">
          {visible.map(p => {
            const isSelected = selected.includes(p.slug)
            return (
              <button
                key={p.slug}
                onClick={() => togglePlatform(p.slug)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] transition-all duration-200"
                style={{
                  background: isSelected ? 'rgba(124,58,237,0.08)' : 'transparent',
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(124,58,237,0.06)' }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                {/* Logo 占位 — 无背景，Logo 自己说话 */}
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ background: '#F5F3FF', color: '#7C3AED' }}
                >
                  {p.name[0]}
                </span>
                <span
                  className="flex-1 text-left text-[14px] transition"
                  style={{
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? '#7C3AED' : '#1F2937',
                  }}
                >
                  {p.name}
                </span>
                <span
                  className="text-[13px]"
                  style={{ color: isSelected ? '#7C3AED' : '#9CA3AF' }}
                >
                  {p.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* 全部平台按钮 */}
        <div className="px-4 mt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-center py-1.5 rounded-[8px] text-[12px] transition"
            style={{
              color: '#7C3AED',
              background: 'rgba(124,58,237,0.04)',
              border: '1px dashed rgba(124,58,237,0.2)',
            }}
          >
            {showAll ? '收起' : `全部平台 (${PLATFORMS.length}个) →`}
          </button>
        </div>

        {/* 分隔线 */}
        <div className="mx-4 my-4 h-px" style={{ background: 'rgba(124,58,237,0.08)' }} />

        {/* 学习成长 */}
        <div className="px-4 mb-2">
          <span className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">学习成长</span>
        </div>

        <div className="px-3 space-y-2.5">
          {/* 按场景学 — 玻璃态卡片 */}
          <Link href="/learn/scene"
            className="block rounded-[12px] p-3.5 transition-all duration-200 group"
            style={{
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 2px 8px rgba(99,102,241,0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.8)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.08)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.6)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.04)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div className="text-[14px] font-semibold text-[#1F2937] mb-1">按场景学</div>
            <div className="text-[12px] text-[#9CA3AF]">办公提效 · 内容创作 · 数据分析</div>
          </Link>

          {/* 按工具学 — 玻璃态卡片 */}
          <Link href="/learn/tool"
            className="block rounded-[12px] p-3.5 transition-all duration-200 group"
            style={{
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 2px 8px rgba(99,102,241,0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.8)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.08)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.6)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.04)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div className="text-[14px] font-semibold text-[#1F2937] mb-1">按工具学</div>
            <div className="text-[12px] text-[#9CA3AF]">Hermes · Claude · Coze</div>
          </Link>
        </div>

        <p className="text-[11px] text-[#9CA3AF] px-4 mt-2.5">适合 AI 小白和职场新人</p>

        {/* 分隔线 */}
        <div className="mx-4 my-4 h-px" style={{ background: 'rgba(124,58,237,0.08)' }} />

        {/* 快捷入口 */}
        <div className="px-2">
          <Link href="/compare"
            className="flex items-center px-2.5 py-2 rounded-[8px] text-[14px] text-[#1F2937] hover:text-[#7C3AED] transition"
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,58,237,0.06)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span className="flex-1">工具对比</span>
            <span className="text-[#D1D5DB] text-xs">→</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}
