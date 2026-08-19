import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI体检',
  description:
    '170 项 AI 环境体检：密钥安全、权限风险、成本浪费、性能健康。本地处理，数据不出电脑。桌面端内测报名中。',
}

/**
 * AI 体检落地页（v10 原型集成）
 * - 全站 chrome 由 layout/TopNavTabs 接管（AI体检高亮），本页不含顶栏
 * - 视觉：主站 .dark 令牌为基，科技感集中在 ScanPanel 组件内
 * - 原评测问卷已挪至 /assessment/quiz（保留资产，无导航入口）
 * - 'use client' 需求由 AssessmentLanding 内部组件承担，本页保持 Server Component
 */
import AssessmentLanding from '@/components/assessment/AssessmentLanding'

export default function AssessmentPage() {
  return <AssessmentLanding />
}
