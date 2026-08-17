import type { Metadata } from 'next'
import './equipment.css'
import EquipmentClient from '@/components/equipment/EquipmentClient'
import { getMyEquipment } from '@/lib/equipment'

export const metadata: Metadata = {
  title: '我的装备',
  description:
    '你装好的 AI 装备都在这里——软件、助手、Skill、订阅，随时回来看看，该用的用、该换的换、该修的修。',
  alternates: { canonical: '/equipment' },
}

/**
 * 我的装备（管家最小版）。
 * 服务端查 DB（v1 空，try-catch 降级），客户端组件读 localStorage 装机记录合并渲染。
 */
export default async function EquipmentPage() {
  const dbEquipment = await getMyEquipment()
  return (
    <div className="page-wrapper px-4 sm:px-6 lg:px-8">
      <div className="equipment-page max-w-[860px] mx-auto pt-8 pb-16">
        <EquipmentClient dbEquipment={dbEquipment} />
      </div>
    </div>
  )
}
