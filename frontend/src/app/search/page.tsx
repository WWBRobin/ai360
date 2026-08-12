import type { Metadata } from 'next'
import { searchSkills } from '@/lib/supabase'
import SkillCardComponent from '@/components/SkillCard'

// 搜索结果页不索引（低价值、易产生重复内容）
export const metadata: Metadata = {
  title: '搜索',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const sp = await searchParams
  const query = sp.q || ''
  const results = query ? await searchSkills(query) : []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">
        {query ? `搜索"${query}"` : '搜索 AI Skill'}
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        {results.length > 0 ? `找到 ${results.length} 个结果` : query ? '没有找到相关结果' : '输入关键词开始搜索'}
      </p>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((skill) => (
            <SkillCardComponent key={skill.id} skill={skill} />
          ))}
        </div>
      ) : query ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-400">没有找到包含"{query}"的 Skill</p>
          <p className="text-gray-400 text-sm mt-2">试试换个关键词，或浏览<a href="/essential" className="text-indigo-500">装机必备</a></p>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-400">在上方搜索框输入关键词</p>
        </div>
      )}
    </div>
  )
}
