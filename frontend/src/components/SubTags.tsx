'use client'

import { useState } from 'react'

export interface SubTag {
  id: string
  icon: string
  label: string
  count: number
}

/**
 * proto7 二级横排标签（平台页场景维度筛选）
 * 对齐 proto7-platform.html 的 .subtags / .subtag
 */
export default function SubTags({ tags }: { tags: SubTag[] }) {
  const [active, setActive] = useState(tags[0]?.id ?? '')
  if (tags.length === 0) return null
  return (
    <div className="flex gap-2.5 flex-wrap py-4 border-b border-[var(--border)]">
      {tags.map((t) => {
        const isActive = t.id === active
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`text-[13px] px-3.5 py-[7px] rounded-[20px] whitespace-nowrap inline-flex items-center gap-1.5 transition ${
              isActive
                ? 'bg-[rgba(var(--dim-rgb),0.08)] text-[var(--primary)] border border-[rgba(var(--dim-rgb),0.30)] shadow-[0_4px_12px_rgba(var(--dim-rgb),0.20)]'
                : 'bg-[var(--card)] text-[var(--fg2)] border border-transparent shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:shadow-md'
            }`}
          >
            <span className="text-sm font-bold">{t.icon}</span>
            {t.label}
            <span className={`text-[10px] ml-0.5 ${isActive ? 'opacity-85' : 'opacity-60'}`}>{t.count}</span>
          </button>
        )
      })}
    </div>
  )
}
