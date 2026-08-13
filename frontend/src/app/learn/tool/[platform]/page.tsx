import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AppSidebar from '@/components/AppSidebar'
import PathDetailClient from '@/components/learn/PathDetailClient'
import { TOOL_PATHS, getToolPath } from '@/lib/learn-paths'

export const dynamicParams = true

export async function generateStaticParams() {
  return TOOL_PATHS.map((p) => ({ platform: p.platform }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ platform: string }>
}): Promise<Metadata> {
  const { platform } = await params
  const path = getToolPath(platform)
  if (!path) {
    return { title: '学习路径未找到' }
  }
  const title = `${path.platformName} 学习路径`
  const description = `${path.platformIcon} ${path.description} — 闯关式 ${path.steps.length} 步学习路径。`
  return {
    title,
    description,
    alternates: { canonical: `/learn/tool/${platform}` },
    openGraph: { title: `${title} · AI360`, description, type: 'website' },
  }
}

interface PageProps {
  params: Promise<{ platform: string }>
}

export default async function ToolLearnPage({ params }: PageProps) {
  const { platform } = await params
  const path = getToolPath(platform)

  if (!path) {
    notFound()
  }

  return (
    <>
      <AppSidebar />
      <PathDetailClient
        steps={path.steps}
        title={`${path.platformName} 学习路径`}
        icon={path.platformIcon}
        description={path.description}
        backHref="/learn#tool-paths"
        backLabel="按工具学"
        breadcrumb={path.platformName}
        kind="tool"
      />
    </>
  )
}
