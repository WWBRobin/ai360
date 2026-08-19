import type { Metadata } from 'next'
import AssessmentClient from '@/components/assessment/AssessmentClient'

export const metadata: Metadata = {
  title: '能力评测 · ArcDock',
  description:
    '5 道题测出你的 AI 能力等级（L1-L5）和学习场景，获得个性化学习路径推荐。30 秒完成。',
  alternates: { canonical: '/assessment' },
  openGraph: {
    title: '能力评测 · ArcDock',
    description: '5 道题测出你的 AI 能力等级，获得个性化学习路径推荐',
    type: 'website',
  },
}

/**
 * 能力评测页。
 * 答题阶段全屏居中（不出侧栏，专注答题）；结果出来后切回带侧栏的标准布局。
 */
export default function AssessmentPage() {
  return (
    <div className="page-wrapper px-4 sm:px-6 lg:px-8 min-h-screen">
      <AssessmentClient />
    </div>
  )
}
