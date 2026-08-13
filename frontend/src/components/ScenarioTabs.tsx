'use client'

import { useState } from 'react'

export interface ScenarioTab {
  slug: string
  name: string
  count: number
}

export type Tab = 'scene' | 'type'

const TYPES = ['全部', 'Skill', '工具', 'MCP']

/**
 * proto7 双行 Tab：
 *  - 第一行：7 个场景 Tab（带数量），当前高亮（tab-active）
 *  - 第二行：4 个类型 Tab（全部/Skill/工具/MCP）
 *  对齐 proto7-scenario.html / proto7-platform.html 的 .tabs + .tabs2
 */
export default function ScenarioTabs({
  scenes,
  activeScene,
}: {
  scenes: ScenarioTab[]
  activeScene: string
}) {
  const [activeType, setActiveType] = useState(0)

  return (
    <>
      {/* 第一行：场景 */}
      <div className="flex gap-0 border-b border-[#EEF0F3] overflow-x-auto scrollbar-hide">
        {scenes.map((s) => {
          const isActive = s.slug === activeScene
          return (
            <a
              key={s.slug}
              href={s.slug === activeScene ? undefined : `/scenario/${s.slug}`}
              className={`relative px-4 py-3 text-sm whitespace-nowrap transition ${
                isActive ? 'tab-active' : 'tab-inactive'
              }`}
            >
              {s.name}
              <span className="text-[11px] text-[#9CA3AF] ml-1">{s.count}</span>
            </a>
          )
        })}
      </div>

      {/* 第二行：类型 */}
      <div className="flex gap-4 py-3 border-b border-[#EEF0F3]">
        {TYPES.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveType(i)}
            className={`text-[13px] transition ${
              activeType === i ? 'text-[#FF8C00] font-semibold' : 'text-[#9CA3AF] hover:text-[#6B7280]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </>
  )
}
