import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

/**
 * /platform — 平台库列表页（footer「平台库」指向这里，替代此前直指 /platform/coze 的错位）
 */

export const metadata: Metadata = {
  title: '平台库 — 全部 AI 平台 | ArcDock',
  description: '浏览 ArcDock 收录的全部 AI 平台：Hermes、GPTs、扣子 Coze、Claude、MCP、Dify 等，按工具数量排序。',
  alternates: { canonical: '/platform' },
}

export const revalidate = 3600

export default async function PlatformListPage() {
  let platforms: { name: string; slug: string; description: string | null; skill_count: number }[] = []
  try {
    const { data } = await supabase
      .from('platforms')
      .select('name, slug, description, skill_count')
      .order('skill_count', { ascending: false })
    if (data) platforms = data.filter((p: { skill_count: number }) => (p.skill_count || 0) > 0)
  } catch (err) {
    // 构建/ISR 预渲染时 Supabase 不可达：降级空态，绝不 rethrow 保 build
    console.warn('[build-degrade] /platform 平台数据拉取失败，渲染空态', err)
    platforms = []
  }

  return (
    <div className="page-wrapper px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="pt-10 pb-8">
        <h1 className="text-[28px] font-bold text-[var(--fg)] leading-tight">🏛️ 平台库</h1>
        <p className="text-[15px] text-[var(--fg3)] mt-1.5">
          共 {platforms.length} 个平台 · 点击进入平台详情与旗下全部工具
        </p>
      </div>
      {platforms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
          {platforms.map((p) => (
            <Link
              key={p.slug}
              href={`/platform/${p.slug}`}
              className="content-card block p-5 group"
            >
              <div className="flex items-center gap-3 mb-2">
                <img src={`/platform-logos/${p.slug}.png`} alt={p.name} className="w-9 h-9 rounded-[10px] object-cover" loading="lazy" />
                <div>
                  <div className="text-[15px] font-medium text-[var(--fg)] group-hover:text-[var(--primary)] transition">{p.name}</div>
                  <div className="text-[11px] text-[var(--fg3)]">{p.skill_count} 个工具</div>
                </div>
              </div>
              {p.description && (
                <p className="text-[13px] text-[var(--fg2)] leading-relaxed line-clamp-2">{p.description}</p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="pb-10">
          <div className="content-card rounded-xl p-10 text-center">
            <div className="text-5xl mb-4">🏛️</div>
            <p className="text-[15px] font-medium text-[var(--fg2)] mb-1.5">平台内容加载中</p>
            <p className="text-[13px] text-[var(--fg3)]">数据拉取失败或尚未就绪，页面会自动重试刷新。</p>
          </div>
        </div>
      )}
    </div>
  )
}
