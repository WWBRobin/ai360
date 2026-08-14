import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// 管理后台共享布局：顶部导航 + 禁止收录
// 鉴权：与现有 admin 页面一致（MVP 无认证，靠路由隐藏，见 /admin/page.tsx 注释）
export const metadata: Metadata = {
  title: '管理后台',
  robots: { index: false, follow: false },
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Skill 管理' },
  { href: '/admin/news-review', label: '新闻审核' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <div
        className="border-b sticky top-0 z-10"
        style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-6">
          <span className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
            ArcDock Admin
          </span>
          <nav className="flex items-center gap-4 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:opacity-70 transition"
                style={{ color: 'var(--fg2)' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {children}
    </div>
  )
}
