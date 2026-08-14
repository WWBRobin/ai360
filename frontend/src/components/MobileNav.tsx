'use client'

import { useState } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/essential', label: '装机必备' },
  { href: '/scenario/content-creation', label: '场景库' },
  { href: '/platform/coze', label: '平台库' },
  { href: '/compare', label: '横评' },
] as const

/**
 * 移动端汉堡菜单。
 * - md 及以上隐藏（桌面端用 layout 里的水平链接）。
 * - md 以下显示汉堡按钮，点击展开下拉菜单。
 * - 菜单项点击后自动收起。
 */
export default function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? '关闭菜单' : '打开菜单'}
        aria-expanded={open}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:bg-gray-100 transition"
      >
        {open ? (
          /* 关闭 ✕ */
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          /* 汉堡 ☰ */
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* 下拉面板 */}
      {open && (
        <>
          {/* 点击遮罩关闭 */}
          <div
            className="fixed inset-0 top-14 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <nav
            className="absolute left-0 right-0 top-14 z-50 bg-white border-b border-gray-200 shadow-lg"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-base font-medium text-[#656360] hover:bg-[rgba(28, 26, 24,0.06)] hover:text-[#1c1a18] transition"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}
    </div>
  )
}
