import type { Metadata } from 'next'
import AppSidebar from '@/components/AppSidebar'
import LearnHomeClient from '@/components/learn/LearnHomeClient'

export const metadata: Metadata = {
  title: '学习中心',
  description:
    '闯关式 AI 学习路径。按工具学（Hermes/扣子/Claude/GPTs）或按场景学（写文章/搭Agent/自动化/数据分析），每完成一步解锁下一步。',
  alternates: { canonical: '/learn' },
  openGraph: {
    title: '学习中心 · AI360',
    description: '闯关式 AI 学习路径 — 按工具学 / 按场景学',
    type: 'website',
  },
}

export default function LearnPage() {
  return (
    <div className="page-wrapper px-4 sm:px-6 lg:px-8 flex gap-8 min-h-screen">
      <AppSidebar />
      <LearnHomeClient />
    </div>
  )
}
