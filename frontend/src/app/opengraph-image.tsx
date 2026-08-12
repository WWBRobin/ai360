import { ImageResponse } from 'next/og'

/**
 * 根级 Open Graph 图片生成器（Next.js 16 文件约定）
 *
 * 放在 app/ 根目录，会对全站所有路由自动生成 og:image / twitter:image meta 标签，
 * 无需手动在每个页面的 metadata 里配置 images，也无需单独维护 og.png 静态文件。
 *
 * 构建时静态优化生成（默认缓存），输出 1200×630 PNG。
 */
export const alt = 'AI360 — AI Agent 时代的 360'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #eef2ff 0%, #ffffff 50%, #f5f3ff 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo + 品牌名 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              fontSize: 88,
              lineHeight: 1,
            }}
          >
            🔧
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              color: '#111827',
              letterSpacing: -2,
            }}
          >
            AI360
          </div>
        </div>

        {/* Slogan */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 600,
            color: '#4f46e5',
            marginBottom: 16,
          }}
        >
          AI Agent 时代的 360
        </div>

        {/* 副标 */}
        <div
          style={{
            fontSize: 30,
            color: '#6b7280',
          }}
        >
          发现好工具 · 判断哪个好 · 基础工具一次配齐
        </div>

        {/* 底部标签 */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 48,
          }}
        >
          {['独立评测', '不收上架费', '5 维度横评'].map((tag) => (
            <div
              key={tag}
              style={{
                fontSize: 24,
                color: '#4f46e5',
                background: '#eef2ff',
                borderRadius: 999,
                padding: '8px 24px',
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
