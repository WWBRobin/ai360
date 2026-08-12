import type { MetadataRoute } from 'next'

/**
 * PWA Web App Manifest（Next.js 16 Metadata Route）
 *
 * 让站点可被「添加到主屏幕」，支持基本 PWA 能力。
 * 图标复用 app/favicon.ico（已存在）。
 *
 * 输出: https://vokki.cn/manifest.webmanifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AI360 — AI Agent 时代的 360',
    short_name: 'AI360',
    description:
      '发现好工具 · 判断哪个好 · 基础工具一次配齐。AI Skill 独立第三方评测聚合平台。',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4f46e5', // indigo-600，与站点主色一致
    lang: 'zh-CN',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
    categories: ['productivity', 'utilities'],
  }
}
