import { getSkillsByPlatform, getPlatforms } from '@/lib/supabase'
import SkillCardComponent from '@/components/SkillCard'
import type { Metadata } from 'next'

export async function generateStaticParams() {
  const platforms = await getPlatforms()
  return platforms.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const platforms = await getPlatforms()
  const platform = platforms.find(p => p.slug === params.slug)
  return {
    title: `${platform?.name || params.slug} 上的 Skill 评测 — AI360`,
    description: `${platform?.name || ''}平台上最好用的 AI Skill 推荐，独立第三方评测。`,
  }
}

export default async function PlatformPage({ params }: { params: { slug: string } }) {
  const skills = await getSkillsByPlatform(params.slug)
  const platforms = await getPlatforms()
  const platform = platforms.find(p => p.slug === params.slug)

  if (!platform) return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">平台不存在</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 面包屑 */}
      <div className="text-sm text-gray-400 mb-4">
        <a href="/" className="hover:text-indigo-500">首页</a> / {platform.name}
      </div>

      {/* 标题 */}
      <h1 className="text-2xl font-bold mb-1">{platform.name}</h1>
      <p className="text-gray-500 text-sm mb-2">{platform.description}</p>
      <p className="text-sm text-gray-400 mb-6">{skills.length} 个已评测 Skill</p>

      {/* 平台切换 */}
      <div className="flex flex-wrap gap-2 mb-8">
        {platforms.map(p => (
          <a
            key={p.slug}
            href={`/platform/${p.slug}`}
            className={`px-3 py-1 text-sm rounded-lg transition ${
              p.slug === params.slug
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.name}
          </a>
        ))}
      </div>

      {/* Skill 列表 */}
      {skills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map(skill => (
            <SkillCardComponent key={skill.id} skill={skill} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-gray-400">该平台暂无已评测 Skill</p>
          <p className="text-gray-400 text-sm mt-2">我们正在持续收录中</p>
        </div>
      )}
    </div>
  )
}
