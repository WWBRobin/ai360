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
    <div className="flex gap-2.5 flex-wrap py-4 border-b border-[#EEF0F3]">
      {tags.map((t) => {
        const isActive = t.id === active
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`text-[13px] px-3.5 py-[7px] rounded-[20px] whitespace-nowrap inline-flex items-center gap-1.5 transition ${
              isActive
                ? 'bg-[rgba(201,151,0,0.08)] text-[#C99700] border border-[rgba(201,151,0,0.30)] shadow-[0_4px_12px_rgba(201,151,0,0.20)]'
                : 'bg-white text-[#6B7280] border border-transparent shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:shadow-md'
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
