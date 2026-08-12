import Link from 'next/link'
import type { Metadata } from 'next'
import './globals.css'
import MobileNav from '@/components/MobileNav'

// 站点根域名。生产部署到 vokki.cn；可用 NEXT_PUBLIC_SITE_URL 覆盖（如预览部署）。
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vokki.cn'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'AI360 — AI Agent 时代的 360',
    template: '%s · AI360',
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
  applicationName: 'AI360',
  authors: [{ name: 'AI360' }],
  creator: 'AI360',
  publisher: 'AI360',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'AI360 — AI Agent 时代的 360',
    description:
      '发现好工具 · 判断哪个好 · 基础工具一次配齐。AI Skill 独立第三方评测聚合平台。',
    url: SITE_URL,
    siteName: 'AI360',
    locale: 'zh_CN',
    type: 'website',
    // og:image 由根级 opengraph-image.tsx 文件约定自动注入，无需在此重复声明
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI360 — AI Agent 时代的 360',
    description:
      '发现好工具 · 判断哪个好 · 基础工具一次配齐。AI Skill 独立第三方评测聚合平台。',
    // twitter:image 同样由根级 opengraph-image.tsx 自动注入
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
      name: 'AI360',
      description: 'AI Agent 时代的 360 — AI Skill 独立第三方评测聚合平台',
      inLanguage: 'zh-CN',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'AI360',
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
      <body className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
        {/* JSON-LD 结构化数据 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />

        {/* 顶部导航 */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-md bg-white/90">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl">🔧</span>
                  <span className="font-bold text-gray-900">AI360</span>
              </Link>
              <div className="hidden md:flex items-center gap-5 text-sm text-gray-600">
                <Link href="/essential" className="hover:text-indigo-600 transition">装机必备</Link>
                <Link href="/scenario/content-creation" className="hover:text-indigo-600 transition">场景推荐</Link>
                <Link href="/platform/coze" className="hover:text-indigo-600 transition">按平台</Link>
                <Link href="/compare" className="hover:text-indigo-600 transition">对比</Link>
              </div>
            </div>
            {/* 搜索框 */}
            <form action="/search" className="flex items-center gap-2">
              <input
                type="text"
                name="q"
                placeholder="搜索工具 / 场景..."
                className="w-24 md:w-48 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:bg-white transition"
              />
            </form>
            {/* 移动端汉堡菜单（md 以下显示，补充被隐藏的导航链接） */}
            <MobileNav />
          </div>
        </nav>

        {/* 主内容 */}
        <main className="flex-1">
          {children}
        </main>

        {/* 底部 */}
        <footer className="bg-gray-900 text-gray-400 py-10 mt-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h4 className="text-white font-bold mb-3 flex items-center gap-1">
                  <span>🔧</span> AI360
                </h4>
                <p className="text-sm leading-relaxed">
                  AI Agent 时代的 360。发现好工具，判断哪个好，基础工具一次配齐。
                </p>
              </div>
              <div>
                <h4 className="text-white font-bold mb-3">评测标准</h4>
                <p className="text-sm leading-relaxed">
                  独立第三方，不收上架费，不卖排名。5 维度评测：场景/上手/稳定/免费额度/Token成本。
                </p>
              </div>
              <div>
                <h4 className="text-white font-bold mb-3">覆盖平台</h4>
                <p className="text-sm leading-relaxed">
                  扣子 / GPTs / Claude / Dify / Hermes / 千问 / 文心 / Codex / WorkBuddy / LobeChat
                </p>
              </div>
              <div>
                <h4 className="text-white font-bold mb-3">关于</h4>
                <p className="text-sm leading-relaxed">
                  评测方法完全公开，测试用例可查。每个推荐都基于实际测试和数据。
                </p>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-6 text-xs text-gray-500 flex flex-wrap justify-between gap-2">
              <span>© 2026 AI360 · vokki.cn · 独立评测 · 不收上架费</span>
              <span>更新于 2026-08-13</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
