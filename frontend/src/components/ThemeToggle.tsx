'use client'

import { useEffect, useState } from 'react'

/**
 * 主题切换按钮 — 太阳/月亮，跟随系统 + 手动覆盖
 * 对标 mcp.so 的暗色模式切换
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
    setMounted(true)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? '切换到浅色模式' : '切换到暗色模式'}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--border)] text-[var(--fg2)] transition hover:text-[var(--fg)] hover:border-[var(--fg4)]"
    >
      {mounted && dark ? (
        /* 太阳（暗色模式，点击切浅色） */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        /* 月亮（浅色模式，点击切暗色） */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  )
}
