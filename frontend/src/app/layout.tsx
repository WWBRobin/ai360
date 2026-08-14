import Link from 'next/link'
import type { Metadata } from 'next'
import './globals.css'
import MobileNav from '@/components/MobileNav'
import TopNavTabs from '@/components/TopNavTabs'
import ThemeToggle from '@/components/ThemeToggle'
import AuthButton from '@/components/AuthButton'

// 站点根域名。生产部署到 vokki.cn；可用 NEXT_PUBLIC_SITE_URL 覆盖（如预览部署）。
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.vokki.cn'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ArcDock — AI Agent 时代的 360',
    template: '%s · ArcDock',
  },
  description:
    '发现好工具 · 判断哪个好 · 基础工具一次配齐。AI Skill 独立第三方评测聚合平台。',
  keywords: [
    'AI Skill',
    'AI工具推荐',
    'Agent技能',
    '装机必备',
    '扣子',
    'Claude Skills',
    'GPTs',
  ],
  applicationName: 'ArcDock',
  authors: [{ name: 'ArcDock' }],
  creator: 'ArcDock',
  publisher: 'ArcDock',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ArcDock — AI Agent 时代的 360',
    description:
      '发现好工具 · 判断哪个好 · 基础工具一次配齐。AI Skill 独立第三方评测聚合平台。',
    url: SITE_URL,
    siteName: 'ArcDock',
    locale: 'zh_CN',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ArcDock — AI Skill 独立第三方评测聚合平台',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ArcDock — AI Agent 时代的 360',
    description:
      '发现好工具 · 判断哪个好 · 基础工具一次配齐。AI Skill 独立第三方评测聚合平台。',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  manifest: '/manifest.webmanifest',
}

// JSON-LD 结构化数据：WebSite + Organization（全站级别，放在根 layout）
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'ArcDock',
      description: 'AI Agent 时代的 360 — AI Skill 独立第三方评测聚合平台',
      inLanguage: 'zh-CN',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'ArcDock',
      url: SITE_URL,
      slogan: 'AI Agent 时代的 360',
      description:
        '发现好工具 · 判断哪个好 · 基础工具一次配齐。AI Skill 独立第三方评测聚合平台。',
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-[var(--bg)] text-[var(--fg)] min-h-screen flex flex-col">
        {/* 暗色切换脚本 — 跟随系统 + localStorage，渲染前执行避免闪白 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        {/* JSON-LD 结构化数据 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />

        {/* 顶栏 — 对标 mcp.so 两行结构：第一行 Logo+搜索框+头像，第二行导航 Tab */}
        <nav className="sticky top-0 z-50 bg-[var(--bg)] border-b border-[var(--border)]">
          {/* 第一行 */}
          <div className="page-wrapper flex items-center h-16 px-4 sm:px-6 lg:px-8 gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <img src="/logo-light.png" alt="ArcDock" className="h-10 w-auto dark:hidden" />
              <img src="/logo-dark.png" alt="ArcDock" className="h-10 w-auto hidden dark:block" />
              <span className="flex flex-col leading-none">
                <span className="font-semibold text-[18px] text-[var(--fg)] tracking-tight">ArcDock</span>
                <span className="text-[12px] text-[var(--fg3)] mt-1 ml-1">弧光万象</span>
              </span>
            </Link>
            <form action="/search" className="ml-auto max-w-md w-full">
              <input
                type="text"
                name="q"
                placeholder="搜索 Skill / MCP / 工具..."
                className="w-full h-9 px-4 border border-[var(--border)] rounded-md text-[14px] text-[var(--fg)] bg-[var(--card)] outline-none focus:border-[var(--primary)] transition"
              />
            </form>
            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
          {/* 第二行：导航 Tab */}
          <TopNavTabs />
        </nav>

        {/* 主内容 */}
        <main className="flex-1">
          {children}
        </main>

        {/* 底部 */}
        <footer className="bg-gray-900 text-gray-400 mt-16">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
              {/* 品牌 + slogan — 跨两列 */}
              <div className="col-span-2">
                <Link href="/" className="inline-flex items-center gap-2 mb-3">
                  <span className="text-white font-bold text-lg">ArcDock</span>
                </Link>
                <p className="text-sm leading-relaxed max-w-xs">
                  AI 工具独立评测平台。发现好工具，判断哪个好，基础工具一次配齐。
                </p>
                <Link
                  href="/subscribe"
                  className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-[var(--primary)] hover:text-[var(--fg)] transition"
                >
                  订阅每周更新
                  <span aria-hidden>→</span>
                </Link>
              </div>

              {/* 快速导航 */}
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">导航</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/essential" className="hover:text-white transition">装机必备</Link></li>
                  <li><Link href="/scenario/content-creation" className="hover:text-white transition">场景库</Link></li>
                  <li><Link href="/platform/coze" className="hover:text-white transition">平台库</Link></li>
                  <li><Link href="/compare" className="hover:text-white transition">横评</Link></li>
                  <li><Link href="/search" className="hover:text-white transition">搜索</Link></li>
                </ul>
              </div>

              {/* 热门平台 */}
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">热门平台</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/platform/coze" className="hover:text-white transition">扣子 Coze</Link></li>
                  <li><Link href="/platform/gpts" className="hover:text-white transition">GPTs</Link></li>
                  <li><Link href="/platform/claude" className="hover:text-white transition">Claude Skills</Link></li>
                  <li><Link href="/platform/dify" className="hover:text-white transition">Dify</Link></li>
                </ul>
              </div>

              {/* 评测标准 */}
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">评测</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/guide" className="hover:text-white transition">深度指南</Link></li>
                  <li><Link href="/guide/install-guide" className="hover:text-white transition">装机教程</Link></li>
                  <li><Link href="/guide/ai-beginner-guide" className="hover:text-white transition">入门指南</Link></li>
                </ul>
                <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                  独立第三方 · 不收上架费
                </p>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
              <span>© 2026 ArcDock · vokki.cn · 独立评测 · 不收上架费</span>
              <span className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                数据每日更新 · 更新于 2026-08-13
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
