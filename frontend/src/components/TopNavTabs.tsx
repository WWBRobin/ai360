'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * 顶部导航 Tab — 对标 mcp.so
 * 第二行导航：h-11，激活项主色文字 + 底部 2px 下划线
 * 2026-08-19 顶栏收敛（软件管家任务书）：+软件管家(/tools)；Skill聚合+能力扩展库收成一个「Skill中心」(/skills/classic)
 * 纯 pathname 高亮（不用 useSearchParams），SSR 完整输出导航词
 */

const TABS = [
  { label: '装机必备', href: '/essential', match: (p: string) => p.startsWith('/essential') },
  { label: '软件导航', href: '/tools', match: (p: string) => p.startsWith('/tools') },
  { label: '软件管家', href: '/equipment', match: (p: string) => p.startsWith('/equipment') },
  { label: 'AI体检', href: '/assessment', match: (p: string) => p.startsWith('/assessment') },
  { label: '学习中心', href: '/learn', match: (p: string) => p.startsWith('/learn') },
  { label: 'Skill中心', href: '/skills/classic', match: (p: string) => p.startsWith('/skills') },
  { label: '资讯', href: '/news', match: (p: string) => p.startsWith('/news') },
]

export default function TopNavTabs() {
  const pathname = usePathname()

  return (
    <div className="page-wrapper flex items-center gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
      <nav className="-ml-4 flex items-center gap-1">
        {TABS.map((tab) => {
          const active = tab.match(pathname)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              // Next 16: 动态路由默认跳过 prefetch（仅静态路由自动全量预取）。
              // 本站关键 tab 多为动态路由，显式开启全量 prefetch。
              prefetch={true}
              className={`relative inline-flex h-11 shrink-0 items-center px-4 text-sm font-medium whitespace-nowrap transition ${
                active ? 'text-[var(--primary)]' : 'text-[var(--fg2)] hover:text-[var(--fg)]'
              }`}
            >
              {tab.label}
              {active && (
                <span
                  className="bg-[var(--primary)] absolute inset-x-4 bottom-0 h-0.5 rounded-md"
                  aria-hidden="true"
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
