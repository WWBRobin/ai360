import Link from 'next/link'

/**
 * 精简 Hero - 只有一句话 + 搜索在导航栏
 */
export default function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-indigo-50/50 to-white py-8 md:py-12 border-b border-gray-100">
      <div className="max-w-3xl mx-auto text-center px-4">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
          AI 工具那么多，<span className="gradient-text">哪个值得装？</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base">
          528 个工具 · 19 个平台 · 独立评测 · 每日更新
        </p>
      </div>
    </section>
  )
}
