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

        {/* 顶栏 — 统一极简白底 */}
        <nav className="sticky top-0 z-50 bg-white border-b border-[#F0F0F0]">
          <div className="page-wrapper flex items-center gap-6 h-14 px-6">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF8C00]"></span>
              <span className="font-bold text-[16px] text-[#1F2937]">AI360</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-[14px] text-[#4B5563] hover:text-[#1F2937] transition">Skill聚合</Link>
              <Link href="/essential" className="text-[14px] text-[#4B5563] hover:text-[#1F2937] transition">装机必备</Link>
              <Link href="/guide" className="text-[14px] text-[#4B5563] hover:text-[#1F2937] transition">深度横评</Link>
            </div>
            <form action="/search" className="ml-auto flex items-center w-[200px] md:w-[300px]">
              <input
                type="text"
                name="q"
                placeholder="搜索 Skill / MCP / 工具..."
                className="w-full h-[34px] px-3 border border-[#E5E7EB] rounded-lg text-[13px] text-[#1F2937] bg-white outline-none focus:border-[#FF8C00] focus:shadow-[0_0_0_3px_rgba(255,140,0,0.12)] transition"
              />
            </form>
            <div className="w-8 h-8 rounded-full bg-[#FF8C00] flex items-center justify-center text-white text-[14px] font-bold shrink-0">W</div>
          </div>
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
                  <span className="text-white font-bold text-lg">AI360</span>
                </Link>
                <p className="text-sm leading-relaxed max-w-xs">
                  AI 工具独立评测平台。发现好工具，判断哪个好，基础工具一次配齐。
                </p>
                <Link
                  href="/subscribe"
                  className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-[#FF8C00] hover:text-[#E67300] transition"
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
              <span>© 2026 AI360 · vokki.cn · 独立评测 · 不收上架费</span>
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
