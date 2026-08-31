import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Skill体检',
  description:
    'AI Skill 安全扫描：64 类风险模式装前拦截+存量全检，全程本地运行，内容不上传。NVIDIA 研究：26.1% 公开 Skill 存在漏洞。桌面端内测报名中。',
}

/**
 * Skill 体检落地页（8/31 线框定稿集成）
 * - 全站 chrome 由 layout/TopNavTabs 接管（Skill体检高亮），本页不含顶栏
 * - Web 只演示不假装扫本地（红线）：主 CTA=下载桌面端
 * - 数字红线：26.1%/5.2% 必须标 NVIDIA 来源；307 条货架口径如实
 * - 视觉：主站令牌（globals.css），恐惧钩子只作信号，红绿克制（双色制立法）
 */
import SkillCheckLanding from '@/components/skillcheck/SkillCheckLanding'

export default function SkillCheckPage() {
  return <SkillCheckLanding />
}
