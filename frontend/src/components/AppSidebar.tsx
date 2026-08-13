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
    <aside className="hidden md:block w-[260px] shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto"
      style={{ background: 'transparent', border: 'none' }}>
      <div className="px-4 py-6">
        {/* 搜索框 */}
        <div className="search-input flex items-center gap-2 px-3 py-2 mb-5">
          <span className="text-[#D1D5DB] text-sm">⌕</span>
          <input type="text" placeholder="搜索..." className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#1F2937] placeholder:text-[#D1D5DB]" />
        </div>

        {/* 平台区 */}
        <div className="mb-1">
          <div className="flex items-center justify-between mb-2 px-3">
            <span className="text-[11px] font-medium text-[#9CA3AF] uppercase" style={{ letterSpacing: '0.05em' }}>平台</span>
            <span className="text-[10px] text-[#D1D5DB]">多选≤3</span>
          </div>
        </div>

        <div className="px-3">
          {visible.map(p => {
            const isSelected = selected.includes(p.slug)
            return (
              <button
                key={p.slug}
                onClick={() => togglePlatform(p.slug)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] transition-all duration-150 relative"
                style={{ background: isSelected ? 'rgba(255,140,0,0.06)' : 'transparent' }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,140,0,0.04)' }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                {/* Logo 占位 — 无背景色 */}
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-[#9CA3AF]" style={{ background: 'transparent', border: '1px solid #F0F0F0' }}>
                  {p.name[0]}
                </span>
                <span className="flex-1 text-left text-[14px]" style={{ fontWeight: isSelected ? 600 : 500, color: isSelected ? '#FF8C00' : '#1F2937' }}>
                  {p.name}
                </span>
                <span className="text-[13px]" style={{ color: isSelected ? '#FF8C00' : '#9CA3AF' }}>
                  {p.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* 全部平台 */}
        <div className="px-3 mt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-center py-1.5 rounded-[8px] text-[12px] transition"
            style={{ border: '1px dashed #E5E7EB', color: '#6B7280', background: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FF8C00'; e.currentTarget.style.color = '#FF8C00' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280' }}
          >
            {showAll ? '收起' : `全部平台 (${PLATFORMS.length}个) →`}
          </button>
        </div>

        {/* 学习成长 — 纯文字行，间距分隔 */}
        <div className="mt-5">
          <div className="px-3 mb-2">
            <span className="text-[11px] font-medium text-[#9CA3AF] uppercase" style={{ letterSpacing: '0.05em' }}>学习成长</span>
          </div>
          <div className="px-3">
            <Link href="/learn/scene"
              className="flex items-center px-3 py-2 rounded-[6px] text-[13px] transition"
              style={{ color: '#4B5563' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,140,0,0.04)'; e.currentTarget.style.color = '#FF8C00' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4B5563' }}
            >
              <span className="flex-1">按场景学</span>
              <span className="text-[12px] text-[#D1D5DB]">→</span>
            </Link>
            <Link href="/learn/tool"
              className="flex items-center px-3 py-2 rounded-[6px] text-[13px] transition"
              style={{ color: '#4B5563' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,140,0,0.04)'; e.currentTarget.style.color = '#FF8C00' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4B5563' }}
            >
              <span className="flex-1">按工具学</span>
              <span className="text-[12px] text-[#D1D5DB]">→</span>
            </Link>
          </div>
        </div>

        {/* 工具对比 — 间距分隔 */}
        <div className="mt-5 px-3">
          <Link href="/compare"
            className="flex items-center px-3 py-2 rounded-[8px] text-[14px] font-medium transition"
            style={{ color: '#4B5563' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,140,0,0.04)'; e.currentTarget.style.color = '#FF8C00' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4B5563' }}
          >
            <span className="flex-1">工具对比</span>
            <span className="text-[12px] text-[#D1D5DB]">→</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}
