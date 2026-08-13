import type { Metadata } from 'next'
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
    openGraph: { title: `${title} · AI360`, description, type: 'website' },
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
    <>
      <AppSidebar />
      <PathDetailClient
        steps={path.steps}
        title={`${path.name} 学习路径`}
        icon={path.icon}
        description={path.description}
        backHref="/learn#scene-paths"
        backLabel="按场景学"
        breadcrumb={path.name}
        kind="scene"
      />
    </>
  )
}
