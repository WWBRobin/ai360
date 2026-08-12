import Link from 'next/link'
import {
  getFeaturedSkills,
  getPlatforms,
  getScenarios,
  getSkillsByCategory,
} from '@/lib/supabase'
import SkillCardComponent from '@/components/SkillCard'
import type { SkillCard } from '@/types'

// ===== 装机必备四个分类卡片配置（含静态 fallback，DB 为空时也能展示）=====
const ESSENTIAL_CARDS = [
  {
    scenarioSlug: 'memory',
    icon: '🧠',
    title: '记忆增强',
    desc: '让 AI 记住你的偏好和历史',
    fallback: [
      { name: 'claude-mem', score: 4.8 },
      { name: 'Mem0', score: 4.5 },
      { name: 'Supermemory', score: 4.3 },
    ],
    fallbackTotal: 4,
  },
  {
    scenarioSlug: 'search',
    icon: '🔍',
    title: '联网搜索',
    desc: '让 AI 能上网获取最新信息',
    fallback: [
      { name: 'Tavily', score: 4.9 },
      { name: 'Firecrawl', score: 4.7 },
      { name: 'Brave Search', score: 4.2 },
    ],
    fallbackTotal: 3,
  },
  {
    scenarioSlug: 'file',
    icon: '📁',
    title: '文件与代码',
    desc: '让 AI 读写文件、跑代码',
    fallback: [
      { name: 'E2B 沙箱', score: 4.6 },
      { name: 'Filesystem MCP', score: 4.4 },
      { name: 'Document Skills', score: 4.5 },
    ],
    fallbackTotal: 5,
  },
  {
    scenarioSlug: 'connect',
    icon: '🔗',
    title: '工具连接',
    desc: '让 AI 接通外部应用',
    fallback: [
      { name: 'Composio', score: 4.7 },
      { name: 'Zapier AI', score: 4.3 },
      { name: '扣子知识库', score: 4.4 },
    ],
    fallbackTotal: 3,
  },
] as const

// Hero 热门场景标签（静态）
const HOT_SCENES = [
  { label: '做电商文案', slug: 'ecommerce-copy' },
  { label: '做 PPT', slug: 'office' },
  { label: '做短视频', slug: 'video' },
  { label: '写代码', slug: 'code' },
  { label: '数据分析', slug: 'data-analysis' },
]

export default async function HomePage() {
  // 并行拉取数据（任一失败都返回空数组，不影响渲染）
  const [featuredSkills, platforms, scenarios, infraSkills] = await Promise.all([
    getFeaturedSkills(6),
    getPlatforms(),
    getScenarios(),
    getSkillsByCategory('infra'),
  ])

  // 按场景 slug 把 infra 工具分桶，供装机必备卡片用真实数据填充
  const infraByScenario = new Map<string, SkillCard[]>()
  for (const s of infraSkills) {
    const key = s.scenario_slugs[0] ?? ''
    if (!infraByScenario.has(key)) infraByScenario.set(key, [])
    infraByScenario.get(key)!.push(s)
  }

  // 场景推荐区：取前 6 个顶级场景
  const topScenarios = scenarios.slice(0, 6)

  return (
    <>
      {/* ===== 1. Hero 搜索区 ===== */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            AI Agent 时代的 360
          </h1>
          <p className="text-gray-500 text-lg mb-8">
            发现好工具 · 判断哪个好 · 基础工具一次配齐
          </p>

          {/* 大搜索框（GET 提交，Server Component 友好） */}
          <form action="/search" className="relative">
            <input
              type="text"
              name="q"
              placeholder="🔍 搜索工具名 / 场景 / 平台 — 例如：做电商主图"
              className="w-full px-6 py-4 pr-28 text-lg border-2 border-gray-200 rounded-2xl shadow-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition"
            >
              搜索
            </button>
          </form>

          {/* 热门场景标签 */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 items-center">
            <span className="text-sm text-gray-400">热门：</span>
            {HOT_SCENES.map((s) => (
              <Link
                key={s.slug}
                href={`/scenario/${s.slug}`}
                className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 2. 装机必备区（核心特色）===== */}
      <section id="essential" className="max-w-7xl mx-auto px-4 py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">🔧 装机必备</h2>
          <p className="text-gray-500 mt-1">刚接触 AI Agent？先装这些，一步到位。</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ESSENTIAL_CARDS.map((card) => {
            const realSkills = infraByScenario.get(card.scenarioSlug) ?? []
            // 真实数据优先，按评分降序取前 3；为空则用 fallback
            const tools =
              realSkills.length > 0
                ? [...realSkills]
                    .sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0))
                    .slice(0, 3)
                    .map((s) => ({ name: s.name, score: s.overall_score ?? null }))
                : card.fallback.map((f) => ({ name: f.name, score: f.score }))
            const totalCount = realSkills.length > 0 ? realSkills.length : card.fallbackTotal

            return (
              <Link
                key={card.scenarioSlug}
                href={`/scenario/${card.scenarioSlug}`}
                className="block bg-white rounded-2xl border border-gray-200 p-5 card-hover hover:border-indigo-300"
              >
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{card.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{card.desc}</p>
                <div className="space-y-1">
                  {tools.map((t) => (
                    <div key={t.name} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 truncate">{t.name}</span>
                      {t.score !== null && (
                        <span
                          className={`text-xs whitespace-nowrap ${
                            t.score >= 4.5
                              ? 'text-green-500'
                              : t.score >= 3.5
                                ? 'text-amber-500'
                                : 'text-gray-400'
                          }`}
                        >
                          ⭐{t.score.toFixed(1)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-indigo-600 font-medium">
                    查看 {totalCount} 个工具 →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        {/* ===== 3. 装机指南 CTA 横幅 ===== */}
        <div className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">📖 完整装机指南</h3>
              <p className="text-indigo-100 text-sm mt-1">
                30 分钟配齐所有基础工具，附安装命令
              </p>
            </div>
            <Link
              href="/guide"
              className="bg-white text-indigo-600 px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap hover:bg-indigo-50 transition"
            >
              查看指南 →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 4. 场景推荐区 ===== */}
      <section id="scenes" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">🎯 场景推荐</h2>
            <p className="text-gray-500 mt-1">你要做什么？我们帮你找最佳方案。</p>
          </div>

          {topScenarios.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {topScenarios.map((sc) => (
                <Link
                  key={sc.slug}
                  href={`/scenario/${sc.slug}`}
                  className="bg-gray-50 rounded-xl p-4 text-center hover:bg-indigo-50 transition"
                >
                  <div className="text-2xl mb-2">{sc.icon ?? '📦'}</div>
                  <div className="text-sm font-medium text-gray-700">{sc.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {sc.skill_count ?? 0} 个工具
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {HOT_SCENES.map((s) => (
                <Link
                  key={s.slug}
                  href={`/scenario/${s.slug}`}
                  className="bg-gray-50 rounded-xl p-4 text-center hover:bg-indigo-50 transition"
                >
                  <div className="text-2xl mb-2">📦</div>
                  <div className="text-sm font-medium text-gray-700">{s.label}</div>
                  <div className="text-xs text-gray-400 mt-1">查看工具</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== 5. 平台导航区 ===== */}
      <section id="platforms" className="max-w-7xl mx-auto px-4 py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">📍 按平台找</h2>
          <p className="text-gray-500 mt-1">你在用哪个平台？看该平台下的推荐。</p>
        </div>

        {platforms.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {platforms.map((p) => (
              <Link
                key={p.slug}
                href={`/platform/${p.slug}`}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-indigo-400 transition"
              >
                <span className="font-medium text-gray-700">{p.name}</span>
                {p.skill_count > 0 && (
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                    {p.skill_count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">平台数据加载中……</p>
        )}
      </section>

      {/* ===== 6. 最新评测区 ===== */}
      <section id="reviews" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">📋 最新评测</h2>
            <p className="text-gray-500 mt-1">我们实测过的 Skill，告诉你哪个值得装。</p>
          </div>

          {/* 本周横评推荐条 */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-amber-400 text-white text-xs px-2 py-0.5 rounded font-medium">
                    🔥 本周横评
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date().toISOString().slice(0, 10)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  AI Agent 装机必备：12 个基础工具完整指南
                </h3>
                <p className="text-sm text-gray-500">
                  刚接触 AI Agent？记忆/搜索/文件/代码/连接，一次配齐。附安装命令和实测评价。
                </p>
              </div>
              <Link
                href="/guide"
                className="bg-white text-gray-700 px-4 py-2 rounded-xl font-medium text-sm border border-gray-200 whitespace-nowrap hover:border-indigo-400 hover:text-indigo-600 transition"
              >
                阅读 →
              </Link>
            </div>
          </div>

          {/* Skill 卡片网格 */}
          {featuredSkills.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredSkills.map((skill) => (
                  <SkillCardComponent key={skill.id} skill={skill} />
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link href="/reviews" className="text-sm text-indigo-600 font-medium hover:underline">
                  查看全部评测 →
                </Link>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">评测数据加载中……</p>
          )}
        </div>
      </section>
    </>
  )
}
