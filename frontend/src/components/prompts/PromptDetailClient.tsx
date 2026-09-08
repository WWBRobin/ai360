'use client'

import { useState } from 'react'
import type { PromptItem } from '@/lib/prompts-shared'

/** 详情页大复制按钮（客户端组件） */
export default function CopyBtn({ item }: { item: PromptItem }) {
  const [st, setSt] = useState<'idle' | 'ok'>('idle')
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(item.content)
          else {
            const ta = document.createElement('textarea')
            ta.value = item.content
            ta.style.position = 'fixed'
            ta.style.opacity = '0'
            document.body.appendChild(ta)
            ta.select()
            document.execCommand('copy')
            document.body.removeChild(ta)
          }
          setSt('ok')
          setTimeout(() => setSt('idle'), 1600)
        } catch {
          /* 静默：全文就在上方展示框里，可手动选择复制 */
        }
      }}
      className="inline-flex h-[46px] cursor-pointer items-center gap-2 rounded-[10px] bg-[var(--primary)] px-[26px] text-[14.5px] font-bold text-[var(--on-primary)] transition hover:opacity-85"
      aria-label={`复制提示词：${item.title}`}
    >
      {st === 'ok' ? '已复制 ✓' : '复制提示词'}
    </button>
  )
}

export { Badge } from './PromptShelf'
