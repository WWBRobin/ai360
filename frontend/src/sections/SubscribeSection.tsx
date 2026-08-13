import SubscribeForm from '@/components/SubscribeForm'

export default function SubscribeSection() {
  return (
    <section id="subscribe" className="bg-gray-50 py-12 border-t border-gray-100">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">📬 订阅 AI360 周报</h2>
        <p className="text-gray-400 text-sm mb-6">每周收到最新的 AI 工具评测 + 行业动态</p>
        <SubscribeForm withCard={false} />
      </div>
    </section>
  )
}
