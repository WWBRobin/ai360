import Link from 'next/link'

const SCENARIOS = [
  { slug: 'ecommerce-copy', icon: '🛍️', title: '做电商', desc: '文案+主图' },
  { slug: 'content-creation', icon: '📝', title: '写内容', desc: '文章+社媒' },
  { slug: 'design', icon: '🎨', title: '做设计', desc: '海报+UI' },
  { slug: 'video', icon: '🎬', title: '做视频', desc: '生成+剪辑' },
  { slug: 'data-analysis', icon: '📊', title: '看数据', desc: '分析+报告' },
  { slug: 'code', icon: '💻', title: '写代码', desc: '编程+调试' },
  { slug: 'memory', icon: '🧠', title: '加记忆', desc: 'AI记住你' },
  { slug: 'search', icon: '🔍', title: '能搜索', desc: 'AI上网' },
  { slug: 'file', icon: '📁', title: '读写文件', desc: '直接操作' },
  { slug: 'connect', icon: '🔗', title: '连工具', desc: '接外部App' },
]

export default function ScenarioEntry() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-10">
      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">装完了，能干什么？</h2>
        <p className="text-gray-400 text-sm">按你要做的事找工具</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {SCENARIOS.map(s => (
          <Link key={s.slug} href={`/scenario/${s.slug}`}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all group">
            <span className="text-xl shrink-0">{s.icon}</span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-800 group-hover:text-indigo-600">{s.title}</div>
              <div className="text-[11px] text-gray-400">{s.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
