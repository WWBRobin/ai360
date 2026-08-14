import type { Metadata } from 'next'
import Link from 'next/link'
import SubscribeForm from '@/components/SubscribeForm'

export const metadata: Metadata = {
  title: '订阅周报',
  description: '订阅 ArcDock 周报，每周收到最新的 Skill 评测 + 行业动态。',
  alternates: { canonical: '/subscribe' },
  openGraph: {
    title: '订阅 ArcDock 周报',
    description: '每周收到最新的 Skill 评测 + 行业动态。',
  },
}

export default function SubscribePage() {
  return (
    <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16 min-h-[70vh] flex items-center">
      <div className="max-w-2xl mx-auto px-4 w-full">
        {/* 标题区 */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            订阅 ArcDock 周报
          </h1>
          <p className="text-gray-500 text-lg">
            每周收到最新的 Skill 评测 + 行业动态
          </p>
        </div>

        {/* 订阅表单 */}
        <div className="max-w-lg mx-auto">
          <SubscribeForm
            withCard
            placeholder="you@example.com"
            buttonText="订阅周报"
          />
        </div>

        {/* 价值点说明 */}
        <div className="mt-10 max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-[var(--card)]/60 rounded-xl p-4">
            <div className="text-2xl mb-1">🧪</div>
            <div className="text-sm font-medium text-gray-700">实测评测</div>
            <div className="text-xs text-gray-400 mt-1">每个 Skill 都亲手测过</div>
          </div>
          <div className="bg-[var(--card)]/60 rounded-xl p-4">
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-sm font-medium text-gray-700">省时间</div>
            <div className="text-xs text-gray-400 mt-1">不用自己一个个去试</div>
          </div>
          <div className="bg-[var(--card)]/60 rounded-xl p-4">
            <div className="text-2xl mb-1">🚫</div>
            <div className="text-sm font-medium text-gray-700">不广告</div>
            <div className="text-xs text-gray-400 mt-1">不收上架费，不卖排名</div>
          </div>
        </div>

        {/* 返回首页 */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-indigo-600 hover:underline"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </section>
  )
}
