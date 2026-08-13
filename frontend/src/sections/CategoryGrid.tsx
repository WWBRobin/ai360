import Link from 'next/link'
import { tokens } from '@/theme/tokens'

export const CATEGORIES = [
  { slug: 'memory', icon: '🧠', title: '记忆增强', desc: '让 AI 跨会话记住你的偏好和历史', bg: tokens.colors.categories.memory },
  { slug: 'search', icon: '🔍', title: '联网搜索', desc: '让 AI 能实时获取最新信息', bg: tokens.colors.categories.search },
  { slug: 'file', icon: '📁', title: '文件操作', desc: '让 AI 直接操作你的文件', bg: tokens.colors.categories.file },
  { slug: 'connect', icon: '🔗', title: '工具连接', desc: '让 AI 接通 GitHub/Slack/邮件', bg: tokens.colors.categories.connect },
  { slug: 'ecommerce-copy', icon: '🛍️', title: '电商营销', desc: '帮你做电商文案和主图', bg: tokens.colors.categories.ecommerce },
  { slug: 'content-creation', icon: '📝', title: '内容创作', desc: '帮你写文章和社交媒体内容', bg: tokens.colors.categories.content },
  { slug: 'data-analysis', icon: '📊', title: '数据分析', desc: '帮你分析数据和生成报告', bg: tokens.colors.categories.data },
  { slug: 'design', icon: '🎨', title: '设计创意', desc: 'AI 帮你做海报和 UI 设计', bg: tokens.colors.categories.design },
  { slug: 'video', icon: '🎬', title: '视频制作', desc: 'AI 帮你做视频和剪辑', bg: tokens.colors.categories.video },
]

interface CategoryGridProps {
  categories?: typeof CATEGORIES
  columns?: 2 | 3 | 4
}

export default function CategoryGrid({ categories = CATEGORIES, columns = 3 }: CategoryGridProps) {
  const colClass = columns === 4 ? 'lg:grid-cols-4' : columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
  
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="mb-8 flex items-baseline justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📂 浏览分类</h2>
          <p className="text-gray-400 mt-1 text-sm">找到你需要的工具类型，每个都有深度评测</p>
        </div>
        <Link href="/essential" className="text-sm text-indigo-500 hover:underline hidden md:block">
          新手从这里开始 →
        </Link>
      </div>
      <div className={`grid grid-cols-1 ${colClass} gap-4`}>
        {categories.map(cat => (
          <Link key={cat.slug} href={`/scenario/${cat.slug}`}
            className="cat-card rounded-2xl p-5 group" style={{ backgroundColor: cat.bg }}>
            <div className="flex items-start justify-between mb-3">
              <div className="text-4xl">{cat.icon}</div>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-indigo-600 transition">{cat.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{cat.desc}</p>
            <div className="mt-3 text-xs text-indigo-500 font-medium group-hover:underline">查看全部 →</div>
          </Link>
        ))}
      </div>
    </section>
  )
}
