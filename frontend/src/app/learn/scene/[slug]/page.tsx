import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AppSidebar from '@/components/AppSidebar'
import PathDetailClient from '@/components/learn/PathDetailClient'
import { SCENE_PATHS, getScenePath } from '@/lib/learn-paths'

export const dynamicParams = true

export async function generateStaticParams() {
  return SCENE_PATHS.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const path = getScenePath(slug)
  if (!path) {
    return { title: '学习路径未找到' }
  }
  const title = `${path.name} 学习路径`
  const description = `${path.icon} ${path.description} — 闯关式 ${path.steps.length} 步学习路径。`
  return {
    title,
    description,
    alternates: { canonical: `/learn/scene/${slug}` },
    openGraph: { title: `${title} · ArcDock`, description, type: 'website' },
  }
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function SceneLearnPage({ params }: PageProps) {
  const { slug } = await params
  const path = getScenePath(slug)

  if (!path) {
    notFound()
  }

  return (
    <div className="page-wrapper px-4 sm:px-6 lg:px-8 min-h-screen">
      {/* 标题板块 — 横跨全宽，对齐首页 */}
      <div className="pt-10 pb-8">
        <nav className="text-[12px] text-[var(--fg3)] mb-4">
          <Link href="/" className="hover:text-[var(--primary)]">首页</Link>
          <span> / </span>
          <Link href="/learn" className="hover:text-[var(--primary)]">学习中心</Link>
          <span> / </span>
          <span className="text-[var(--fg2)]">{path.name}</span>
        </nav>
        <h1 className="text-[28px] font-bold text-[var(--fg)] leading-tight">
          <span className="mr-2">{path.icon}</span>
          {path.name} 学习路径
        </h1>
        <p className="text-[15px] text-[var(--fg3)] mt-1.5">{path.description}</p>
      </div>

      {/* 双栏 */}
      <div className="flex gap-8">
        <AppSidebar />
        <PathDetailClient
          steps={path.steps}
          backHref="/learn#scene-paths"
          backLabel="按场景学"
          kind="scene"
        />
      </div>
    </div>
  )
}
