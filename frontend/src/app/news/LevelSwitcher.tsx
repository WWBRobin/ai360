'use client'

import Link from 'next/link'

import { VERSION_LABELS, VERSION_ORDER, type VersionType } from './queries'

/**
 * 版本切换器 — 切换 ?level= query 参数，由服务端按参数读取对应版本。
 * 纯 Link 实现（无 JS 状态），SEO 友好且禁 JS 时也可用。
 *
 * available: 该新闻实际存在的版本类型；缺的版本不渲染（不提供死链接）。
 */
export default function LevelSwitcher({
  slug,
  current,
  available,
}: {
  slug: string
  current: VersionType
  available: VersionType[]
}) {
  if (available.length <= 1) return null

  return (
    <nav
      aria-label="阅读版本切换"
      className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg2)] p-1"
    >
      {VERSION_ORDER.filter((t) => available.includes(t)).map((t) => {
        const active = t === current
        return (
          <Link
            key={t}
            href={`/news/${slug}?level=${t}`}
            scroll={false}
            aria-current={active ? 'page' : undefined}
            className={`rounded-md px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition ${
              active
                ? 'bg-[var(--card)] text-[var(--primary)] shadow-sm'
                : 'text-[var(--fg3)] hover:text-[var(--fg)]'
            }`}
          >
            {VERSION_LABELS[t]}
          </Link>
        )
      })}
    </nav>
  )
}
