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

// ISR
export const revalidate = 300

// ===== 分类卡片配置 =====
const CATEGORY_CARDS = [
  { scenarioSlug: 'memory', icon: '🧠', title: '记忆增强', desc: '让 AI 跨会话记住你的偏好和历史', color: 'from-blue-50 to-indigo-50' },
  { scenarioSlug: 'search', icon: '🔍', title: '联网搜索', desc: '让 AI 能实时获取最新信息', color: 'from-green-50 to-emerald-50' },
  { scenarioSlug: 'file', icon: '📁', title: '文件操作', desc: '让 AI 直接操作你的文件', color: 'from-amber-50 to-orange-50' },
  { scenarioSlug: 'connect', icon: '🔗', title: '工具连接', desc: '让 AI 接通 GitHub/Slack/邮件', color: 'from-purple-50 to-fuchsia-50' },
  { scenarioSlug: 'ecommerce-copy', icon: '🛍️', title: '电商营销', desc: '帮你做电商文案和主图', color: 'from-pink-50 to-rose-50' },
  { scenarioSlug: 'content-creation', icon: '📝', title: '内容创作', desc: '帮你写文章和社交媒体内容', color: 'from-cyan-50 to-sky-50' },
  { scenarioSlug: 'data-analysis', icon: '📊', title: '数据分析', desc: '帮你分析数据和生成报告', color: 'from-teal-50 to-green-50' },
  { scenarioSlug: 'design', icon: '🎨', title: '设计创意', desc: 'AI 帮你做海报和 UI 设计', color: 'from-violet-50 to-purple-50' },
  { scenarioSlug: 'video', icon: '🎬', title: '视频制作', desc: 'AI 帮你做视频和剪辑', color: 'from-red-50 to-orange-50' },
]

export default async function HomePage() {
  const [featuredSkills, platforms, scenarios, infraSkills, sceneSkills] = await Promise.all([
    getFeaturedSkills(6).catch(() => []),
    getPlatforms().catch(() => []),
    getScenarios().catch(() => []),
    getSkillsByCategory('infrastructure').catch(() => []),
    getSkillsByCategory('scene').catch(() => []),
  ])

  // 编辑精选：过滤掉英文 slug，优先显示中文名的
  const topPicks = [...featuredSkills]
    .filter(s => {
      // 过滤掉纯英文/下划线名字的（Hermes 批量导入的）
      return !/^[a-z_]+$/.test(s.name)
    })
    .sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))
    .slice(0, 3)

  const articles = getAllArticleMetas()
  const latestArticles = articles.slice(0, 4)
  const totalSkills = 528

  // 每个分类数据
  const allSkills = [...infraSkills, ...sceneSkills]
  const getBestSkill = (slug: string) => {
    const skills = allSkills.filter(s => s.scenario_slugs?.includes(slug))
    if (skills.length === 0) return null
    return skills.sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))[0]
  }
  const getSkillCount = (slug: string) => allSkills.filter(s => s.scenario_slugs?.includes(slug)).length

  return (
    <>
      {/* ===== Hero ===== */}
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
            {totalSkills} 个工具 · 实测评比 · 哪个好一目了然
          </p>

          {/* 大搜索框 */}
          <form action="/search" className="max-w-2xl mx-auto">
            <div className="search-glow relative flex items-center bg-white rounded-2xl shadow-lg border border-gray-100">
              <span className="pl-5 text-xl text-gray-300">🔍</span>
              <input
                type="text"
                name="q"
                placeholder="搜索：做电商文案 / AI画图 / 写代码..."
                className="flex-1 px-3 py-4 text-base bg-transparent focus:outline-none placeholder:text-gray-300"
              />
              <button
                type="submit"
                className="btn-primary m-1.5 px-6 py-2.5 rounded-xl font-medium whitespace-nowrap"
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
                className="px-3 py-1 bg-white/60 backdrop-blur border border-gray-100 rounded-full text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-white transition"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 分类导航 ===== */}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORY_CARDS.map((cat) => {
            const best = getBestSkill(cat.scenarioSlug)
            const count = getSkillCount(cat.scenarioSlug) || 0
            return (
              <Link
                key={cat.scenarioSlug}
                href={`/scenario/${cat.scenarioSlug}`}
                className={`cat-card rounded-2xl p-5 bg-gradient-to-br ${cat.color} group`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl drop-shadow-sm">{cat.icon}</div>
                  {count > 0 && (
                    <span className="text-xs bg-white/70 text-gray-500 px-2.5 py-1 rounded-full font-medium">
                      {count} 个工具
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-indigo-600 transition">
                  {cat.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4">{cat.desc}</p>

                {best && (
                  <div className="flex items-center justify-between pt-3 border-t border-black/5">
                    <div className="min-w-0">
                      <div className="text-xs text-gray-400">最优推荐</div>
                      <div className="text-sm font-semibold text-gray-700 truncate">⭐ {best.name}</div>
                    </div>
                    {best.overall_score && (
                      <div className="text-xl font-bold gradient-text shrink-0 ml-2">
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
        <section className="bg-white py-16 border-y border-gray-100">
          <div className="max-w-5xl mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">⭐ 编辑精选</h2>
              <p className="text-gray-400 mt-1 text-sm">本周最值得用的 AI 工具</p>
            </div>

            <div className="space-y-3">
              {topPicks.map((skill, i) => (
                <Link
                  key={skill.id}
                  href={`/skill/${skill.slug}`}
                  className="pick-card block rounded-xl p-5 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl shrink-0">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition text-base">
                        {skill.name}
                      </h3>
                      <p className="text-sm text-gray-400 truncate">{skill.tagline}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {skill.overall_score && (
                        <div className="text-2xl font-bold gradient-text">
                          {Number(skill.overall_score).toFixed(1)}
                        </div>
                      )}
                      <div className="text-xs text-gray-300">
                        {skill.free_quota || skill.platform_name || ''}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link href="/search" className="text-sm text-indigo-500 font-medium hover:underline">
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
            <p className="text-gray-400 mt-1 text-sm">每个评测都实测过，告诉你到底选哪个</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {latestArticles.map((article: any) => (
              <Link
                key={article.slug}
                href={`/guide/${article.slug}`}
                className="cat-card rounded-2xl p-5 group"
              >
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2">{article.description}</p>
                <div className="mt-3 text-xs text-indigo-500 font-medium">阅读评测 →</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== 新手入门 CTA ===== */}
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
              <Link
                href="/essential"
                className="bg-white text-indigo-600 px-7 py-3 rounded-xl font-bold hover:bg-indigo-50 transition shadow-lg"
              >
                新手入门 →
              </Link>
              <Link
                href="/guide/install-guide"
                className="bg-white/20 text-white px-7 py-3 rounded-xl font-bold hover:bg-white/30 transition border border-white/30"
              >
                📖 装机指南
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 平台导航 ===== */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">📍 按平台浏览</h2>
          <p className="text-gray-400 text-sm mt-1">你在用哪个平台？看该平台下的推荐</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {platforms.filter(p => p.skill_count > 0).map(platform => (
            <Link
              key={platform.slug}
              href={`/platform/${platform.slug}`}
              className="platform-tag flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5"
            >
              <span className="text-sm font-medium text-gray-600">{platform.name}</span>
              <span className="text-xs bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded-md font-medium">
                {platform.skill_count}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== 订阅区 ===== */}
      <section id="subscribe" className="bg-gray-50 py-12 border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">📬 订阅 AI360 周报</h2>
          <p className="text-gray-400 text-sm mb-6">每周收到最新的 AI 工具评测 + 行业动态</p>
          <SubscribeForm withCard={false} />
        </div>
      </section>
    </>
  )
}
