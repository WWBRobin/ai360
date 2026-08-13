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

const LEARN_BY_TOOL = ['Hermes 入门', '扣子指南', 'Codex 起步']
const LEARN_BY_SCENE = ['写作创作', '开发编程', '研究分析']

export default function AppSidebar() {
  const [selected, setSelected] = useState<string[]>(['hermes'])
  const [showAllPlatforms, setShowAllPlatforms] = useState(false)
  const [learnExpand, setLearnExpand] = useState<'tool' | 'scene' | null>(null)

  const togglePlatform = (slug: string) => {
    setSelected(prev => {
      if (prev.includes(slug)) return prev.filter(s => s !== slug)
      if (prev.length >= 3) return [prev[1], prev[2], slug] // 最多3个，踢掉最早的
      return [...prev, slug]
    })
  }

  // 选中项置顶，其余按热度
  const sortedPlatforms = [
    ...PLATFORMS.filter(p => selected.includes(p.slug)),
    ...PLATFORMS.filter(p => !selected.includes(p.slug)),
  ]
  const visiblePlatforms = showAllPlatforms ? sortedPlatforms : sortedPlatforms.slice(0, 5)

  return (
    <>
      <aside className="hidden md:block w-[240px] shrink-0 border-r border-[#F0F0F0] sticky top-14 h-[calc(100vh-56px)] overflow-y-auto z-10">
        <div className="p-3 space-y-5">
          {/* 平台选择 */}
          <div>
            <div className="sidebar-title">平台（多选≤3）</div>
            <div className="space-y-0.5">
              {visiblePlatforms.map(p => {
                const isSelected = selected.includes(p.slug)
                return (
                  <button
                    key={p.slug}
                    onClick={() => togglePlatform(p.slug)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-sm transition-all ${
                      isSelected
                        ? 'text-[#7C3AED] font-medium'
                        : 'text-[#374151] hover:bg-[rgba(124,58,237,0.04)]'
                    }`}
                    style={isSelected ? { background: 'transparent' } : {}}
                  >
                    {/* 选中态：左侧3px竖线，不用紫底 */}
                    {isSelected && (
                      <span className="w-[3px] h-4 rounded-full bg-[#7C3AED] absolute ml-[-12px]" />
                    )}
                    {/* Logo 占位（未来放平台Logo） */}
                    <span className="w-6 h-6 rounded-full bg-[#F5F3FF] flex items-center justify-center text-[10px] font-bold text-[#7C3AED] shrink-0">
                      {p.name[0]}
                    </span>
                    <span className="flex-1 text-left">{p.name}</span>
                    {isSelected && <span className="text-[#7C3AED]">✓</span>}
                    <span className="text-[11px] text-[#9CA3AF]">{p.count}</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setShowAllPlatforms(!showAllPlatforms)}
              className="w-full text-center text-[12px] text-[#7C3AED] hover:underline mt-2 py-1"
            >
              {showAllPlatforms ? '收起' : `全部平台 (${PLATFORMS.length}个) →`}
            </button>
          </div>

          {/* 分隔线 */}
          <div className="border-t border-[#F0F0F0]" />

          {/* 学习成长 */}
          <div>
            <div className="sidebar-title">学习成长</div>
            <div className="space-y-0.5">
              {/* 按场景学 */}
              <button
                onClick={() => setLearnExpand(learnExpand === 'scene' ? null : 'scene')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-sm text-[#374151] hover:bg-[rgba(124,58,237,0.04)] transition"
              >
                <span>按场景学</span>
                <span className="text-[10px] text-[#9CA3AF]">{learnExpand === 'scene' ? '▾' : '▸'}</span>
              </button>
              {learnExpand === 'scene' && (
                <div className="ml-3 space-y-0.5">
                  {LEARN_BY_SCENE.map(s => (
                    <Link key={s} href="/learn/scene" className="block px-3 py-1.5 text-[13px] text-[#6B7280] hover:text-[#7C3AED] transition">
                      {s}
                    </Link>
                  ))}
                </div>
              )}
              {/* 按工具学 */}
              <button
                onClick={() => setLearnExpand(learnExpand === 'tool' ? null : 'tool')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-sm text-[#374151] hover:bg-[rgba(124,58,237,0.04)] transition"
              >
                <span>按工具学</span>
                <span className="text-[10px] text-[#9CA3AF]">{learnExpand === 'tool' ? '▾' : '▸'}</span>
              </button>
              {learnExpand === 'tool' && (
                <div className="ml-3 space-y-0.5">
                  {LEARN_BY_TOOL.map(s => (
                    <Link key={s} href="/learn/tool" className="block px-3 py-1.5 text-[13px] text-[#6B7280] hover:text-[#7C3AED] transition">
                      {s}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[11px] text-[#9CA3AF] px-3 mt-2">适合 AI 小白和职场新人</p>
          </div>

          {/* 分隔线 */}
          <div className="border-t border-[#F0F0F0]" />

          {/* 快捷入口 */}
          <div>
            <Link href="/compare" className="block px-3 py-2 text-sm text-[#374151] hover:text-[#7C3AED] transition rounded-[10px] hover:bg-[rgba(124,58,237,0.04)]">
              工具对比
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
