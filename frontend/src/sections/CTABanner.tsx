import Link from 'next/link'

export default function CTABanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 pb-16">
      <div className="rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur"></div>
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            🚀 刚接触 AI 工具？从这里开始
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            不知道从哪开始？我们准备了完整的新手入门指南，3 分钟学会
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/essential" className="bg-white text-indigo-600 px-7 py-3 rounded-xl font-bold hover:bg-indigo-50 transition shadow-lg">
              新手入门 →
            </Link>
            <Link href="/guide/install-guide" className="bg-white/20 text-white px-7 py-3 rounded-xl font-bold hover:bg-white/30 transition border border-white/30">
              📖 装机指南
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
