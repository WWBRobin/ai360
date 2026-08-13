import Link from 'next/link'
import {
  getFeaturedSkills,
  getPlatforms,
  getScenarios,
  getSkillsByCategory,
} from '@/lib/supabase'
import { getAllArticleMetas } from '@/lib/articles'
import type { SkillCard } from '@/types'
import SubscribeForm from '@/components/SubscribeForm'

// ISR：首页每 5 分钟增量静态重新生成
export const revalidate = 300

// ===== 分类卡片配置 =====
const CATEGORY_CARDS = [
  { scenarioSlug: 'memory', icon: '🧠', title: '记忆增强', subtitle: '让 AI 记住你', desc: '让 AI 跨会话记住你的偏好和历史' },
  { scenarioSlug: 'search', icon: '🔍', title: '联网搜索', subtitle: '让 AI 上网', desc: '让 AI 能实时获取最新信息' },
  { scenarioSlug: 'file', icon: '📁', title: '文件操作', subtitle: 'AI 读写文件', desc: '让 AI 直接操作你的文件' },
  { scenarioSlug: 'connect', icon: '🔗', title: '工具连接', subtitle: 'AI 接外部', desc: '让 AI 接通 GitHub/Slack/邮件' },
  { scenarioSlug: 'ecommerce-copy', icon: '🛍️', title: '电商营销', subtitle: '做电商文案', desc: '帮你做电商文案和主图' },
  { scenarioSlug: 'content-creation', icon: '📝', title: '内容创作', subtitle: '写文章', desc: '帮你写文章和社交媒体内容' },
  { scenarioSlug: 'data-analysis', icon: '📊', title: '数据分析', subtitle: '看懂数据', desc: '帮你分析数据和生成报告' },
  { scenarioSlug: 'design', icon: '🎨', title: '设计创意', subtitle: '做设计', desc: 'AI 帮你做海报和 UI 设计' },
  { scenarioSlug: 'video', icon: '🎬', title: '视频制作', subtitle: '做视频', desc: 'AI 帮你做视频和剪辑' },
]

export default async function HomePage() {
  // 并行获取数据
  const [featuredSkills, platforms, scenarios, infraSkills, sceneSkills] = await Promise.all([
    getFeaturedSkills(6).catch(() => []),
    getPlatforms().catch(() => []),
    getScenarios().catch(() => []),
    getSkillsByCategory('infrastructure').catch(() => []),
    getSkillsByCategory('scene').catch(() => []),
  ])

  // 编辑精选：评分最高的3个
  const topPicks = [...featuredSkills]
    .sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))
    .slice(0, 3)

  // 文章
  const articles = (await getAllArticleMetas?.().catch(() => [])) ?? []
  const latestArticles = articles.slice(0, 4)

  // 统计
  const totalSkills = 528

  // 每个分类的最优工具
  const getBestSkill = (scenarioSlug: string) => {
    const skills = [...infraSkills, ...sceneSkills].filter(s => 
      s.scenario_slugs?.includes(scenarioSlug)
    )
    if (skills.length === 0) return null
    return skills.sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))[0]
  }

  const getSkillCount = (scenarioSlug: string) => {
    return [...infraSkills, ...sceneSkills].filter(s => 
      s.scenario_slugs?.includes(scenarioSlug)
    ).length
  }

  return (
    <>
      {/* ===== Hero 区 ===== */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            找到最适合你的 <span className="gradient-text">AI 工具</span>
          </h1>
          <p className="text-gray-500 text-lg md:text-xl mb-8">
            {totalSkills} 个工具 · 实测评测 · 哪个好一目了然
          </p>
          
          {/* 大搜索框 */}
          <form action="/search" className="max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <input
                type="text"
                name="q"
                placeholder="🔍 搜索：做电商文案 / AI画图 / 写代码..."
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl shadow-sm focus:border-indigo-400 focus:outline-none transition bg-white"
              />
              <button
                type="submit"
                className="absolute right-3 bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-600 transition whitespace-nowrap"
              >
                搜索
              </button>
            </div>
          </form>
          
          {/* 热门标签 */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="text-sm text-gray-400">热门：</span>
            {['做电商文案', 'AI画图', 'PPT生成', '视频制作', '写代码', 'AI搜索'].map(tag => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 分类导航区（核心：360导航+深度感）===== */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">📂 浏览分类</h2>
          <p className="text-gray-500 mt-1">找到你需要的工具类型，每个都有深度评测</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORY_CARDS.map((cat) => {
            const best = getBestSkill(cat.scenarioSlug)
            const count = getSkillCount(cat.scenarioSlug) || 0
            return (
              <Link
                key={cat.scenarioSlug}
                href={`/scenario/${cat.scenarioSlug}`}
                className="block bg-white rounded-2xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-lg transition group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{cat.icon}</div>
                  {count > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                      {count} 个工具
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-indigo-600 transition">
                  {cat.title}
                </h3>
                <p className="text-sm text-gray-400 mb-3">{cat.desc}</p>
                
                {/* 最优工具 */}
                {best && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <div className="text-xs text-gray-400">最优推荐</div>
                      <div className="text-sm font-medium text-gray-700">⭐ {best.name}</div>
                    </div>
                    {best.overall_score && (
                      <div className="text-lg font-bold text-indigo-500">
                        {Number(best.overall_score).toFixed(1)}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-3 text-xs text-indigo-500 font-medium group-hover:underline">
                  查看全部 →
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ===== 编辑精选 ===== */}
      {topPicks.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">⭐ 编辑精选</h2>
              <p className="text-gray-500 mt-1">本周最值得用的 AI 工具</p>
            </div>
            
            <div className="space-y-3">
              {topPicks.map((skill, i) => (
                <Link
                  key={skill.id}
                  href={`/skill/${skill.slug}`}
                  className="block bg-white rounded-2xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-lg transition group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition">
                        {skill.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{skill.tagline}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {skill.overall_score && (
                        <div className="text-lg font-bold text-indigo-500">
                          ⭐ {Number(skill.overall_score).toFixed(1)}
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        {skill.free_quota || skill.platform_name}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Link
                href="/search"
                className="text-sm text-indigo-500 font-medium hover:underline"
              >
                查看全部 {totalSkills} 个工具 →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== 深度评测 ===== */}
      {latestArticles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">📖 深度评测</h2>
            <p className="text-gray-500 mt-1">每个评测都实测过，告诉你到底选哪个</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {latestArticles.map((article: any) => (
              <Link
                key={article.slug}
                href={`/guide/${article.slug}`}
                className="block bg-white rounded-2xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-lg transition group"
              >
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2">{article.description}</p>
                <div className="mt-3 text-xs text-indigo-500 font-medium">
                  阅读评测 →
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== 新手入门 ===== */}
      <section className="bg-gradient-to-r from-indigo-500 to-purple-500 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            🚀 刚接触 AI 工具？
          </h2>
          <p className="text-indigo-100 text-lg mb-8">
            不知道从哪开始？我们准备了完整的新手入门指南
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/essential"
              className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition"
            >
              从这里开始 →
            </Link>
            <Link
              href="/guide/install-guide"
              className="bg-indigo-400 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-300 transition border border-white/30"
            >
              装机指南
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 平台导航 ===== */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">📍 按平台浏览</h2>
          <p className="text-gray-500 text-sm mt-1">你在用哪个平台？看该平台下的推荐</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {platforms.filter(p => p.skill_count > 0).map(platform => (
            <Link
              key={platform.slug}
              href={`/platform/${platform.slug}`}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-indigo-300 hover:shadow-sm transition"
            >
              <span className="font-medium text-gray-700">{platform.name}</span>
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                {platform.skill_count}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== 订阅区 ===== */}
      <section id="subscribe" className="bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">📬 订阅 AI360 周报</h2>
          <p className="text-gray-500 text-sm mb-6">每周收到最新的 AI 工具评测 + 行业动态</p>
          <SubscribeForm withCard={false} />
        </div>
      </section>
    </>
  )
}
