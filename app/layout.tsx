import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Skill 评测聚合平台 — 什么 AI 工具都能在这里找到',
  description: '跨平台 AI Skill 独立第三方评测：发现好工具、判断哪个好、一键试用。我们是 AI 时代的 360。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-bold text-gray-900">
              AI Skill 评测<span className="text-primary">·</span>平台
            </Link>
            <nav className="flex items-center gap-4 text-sm text-gray-600">
              <Link href="/" className="hover:text-gray-900">首页</Link>
              <a href="https://vokki.cn" className="hover:text-gray-900">关于我们</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400">
          AI Skill 评测聚合平台 · 独立第三方立场 · 不收上架费，不卖排名
        </footer>
      </body>
    </html>
  );
}
