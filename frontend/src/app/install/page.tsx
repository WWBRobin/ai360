import type { Metadata } from 'next'
import './install.css'
import InstallClient from '@/components/install/InstallClient'

export const metadata: Metadata = {
  title: '装机陪跑',
  description:
    '按场景生成你的专属装机单——扣子、豆包、Kimi、通义万相、ArcDock 中转站，每一步有人陪，卡住有人管，装完即点亮能力。',
  alternates: { canonical: '/install' },
}

export default function InstallPage() {
  return (
    <div className="page-wrapper px-4 sm:px-6 lg:px-8">
      <div className="install-page max-w-[860px] mx-auto pt-8 pb-16">
        <InstallClient />
      </div>
    </div>
  )
}
