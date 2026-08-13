import Link from 'next/link'
import { tokens } from '@/theme/tokens'

export default function HeroSection() {
  return (
    <section className="hero-gradient py-16 md:py-24">
      <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
        <div className="inline-block mb-4">
          <span className="text-xs font-medium text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
            🔧 AI360 · AI 工具评测导航
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-5 leading-tight">
          找到最适合你的 <span className="gradient-text">AI 工具</span>
        </h1>
        <p className="text-gray-500 text-lg md:text-xl mb-8">
          528 个工具 · 实测评比 · 哪个好一目了然
        </p>
        <form action="/search" className="max-w-2xl mx-auto">
          <div className="search-glow relative flex items-center bg-white rounded-2xl shadow-lg border border-gray-100">
            <span className="pl-5 text-xl text-gray-300">🔍</span>
            <input
              type="text" name="q"
              placeholder="搜索：做电商文案 / AI画图 / 写代码..."
              className="flex-1 px-3 py-4 text-base bg-transparent focus:outline-none placeholder:text-gray-300"
            />
            <button type="submit" className="btn-primary m-1.5 px-6 py-2.5 rounded-xl font-medium whitespace-nowrap">
              搜索
            </button>
          </div>
        </form>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="text-sm text-gray-400">热门：</span>
          {['做电商文案', 'AI画图', 'PPT生成', '视频制作', '写代码', 'AI搜索'].map(tag => (
            <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}
              className="px-3 py-1 bg-white/60 backdrop-blur border border-gray-100 rounded-full text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-white transition">
              {tag}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
