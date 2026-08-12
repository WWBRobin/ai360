import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { SkillDetail, AlternativeSkill, SkillCard } from '@/types'
import {
  getSkillDetail,
  getSkillsByScenario,
  scoreToStars,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
} from '@/lib/supabase'
import SkillCardComponent from '@/components/SkillCard'
import TrialBox from '@/components/TrialBox'

// ISR：详情页每 1 小时增量静态重新生成
export const revalidate = 3600

// ===== 元数据 =====

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const skill = await getSkillDetail(slug)

  if (!skill) {
    return { title: '未找到该 Skill' }
  }

  const title = `${skill.name} — 评测 / 试用 / 安装`
  const description =
    skill.tagline ||
    `${skill.name}：5 维度评测（场景/上手/稳定/免费额度/Token 成本），含同类对比与在线试用。`

  return {
    title,
    description,
    keywords: [
      skill.name,
      skill.platform_name,
      'AI Skill 评测',
      'AI 工具推荐',
      CATEGORY_LABELS[skill.category] || skill.category,
    ],
    alternates: {
      canonical: `/skill/${skill.slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      ...(skill.icon_url ? { images: [skill.icon_url] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

// ===== 预生成静态参数（构建时预渲染已发布的 Skill；失败返回空数组，运行时按需渲染）=====

export async function generateStaticParams() {
  try {
    const skills = await getSkillsByScenario('').catch(() => [])
    // 兜底：上面 RPC 可能不支持空 scenario，直接取首页精选 + 常见场景
    const slugs = new Set<string>()
    skills.forEach((s) => s.slug && slugs.add(s.slug))
    if (slugs.size === 0) {
      const featured = await import('@/lib/supabase').then((m) =>
        m.getFeaturedSkills(50)
      )
      featured.forEach((s) => s.slug && slugs.add(s.slug))
    }
    return Array.from(slugs).map((slug) => ({ slug }))
  } catch {
    return []
  }
}

// ===== 页面主体 =====

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const skill = await getSkillDetail(slug)

  if (!skill) {
    notFound()
  }

  const alternatives: AlternativeSkill[] = skill.alternatives || []
  const related = await getRelatedSkills(skill).catch(() => [])

  const evaluatedDate = skill.evaluated_at
    ? new Date(skill.evaluated_at).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* 1. 面包屑 */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-5 flex-wrap">
        <Link href="/" className="hover:text-indigo-600 transition">首页</Link>
        <span>›</span>
        {skill.platform_slug ? (
          <Link
            href={`/platform/${skill.platform_slug}`}
            className="hover:text-indigo-600 transition"
          >
            {skill.platform_name || '平台'}
          </Link>
        ) : (
          <span>{skill.platform_name || '平台'}</span>
        )}
        <span>›</span>
        <span className="text-gray-600">{skill.name}</span>
      </nav>

      {/* 2. 标题区 */}
      <header className="mb-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl overflow-hidden">
            {skill.icon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={skill.icon_url}
                alt={skill.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{CATEGORY_ICONS[skill.category] || '🧩'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
              {skill.name}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">{skill.tagline}</p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {/* 评分 */}
              {skill.overall_score != null && (
                <span className="flex items-center gap-1 text-sm">
                  <span className="text-amber-400">
                    {scoreToStars(skill.overall_score)}
                  </span>
                  <span className="font-medium text-gray-700">
                    {skill.overall_score.toFixed(1)}
                  </span>
                </span>
              )}
              {/* 平台标签 */}
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                {skill.platform_name}
              </span>
              {/* 分类标签 */}
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  skill.category === 'infra'
                    ? 'bg-blue-100 text-blue-600'
                    : skill.category === 'scene'
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                {CATEGORY_ICONS[skill.category]}{' '}
                {CATEGORY_LABELS[skill.category] || skill.category}
              </span>
              {/* 开发者 */}
              {skill.developer_name && (
                <span className="text-xs text-gray-400">
                  by {skill.developer_name}
                </span>
              )}
              {/* 评测时间 */}
              {evaluatedDate && (
                <span className="text-xs text-gray-400">
                  · 评测于 {evaluatedDate}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 描述 */}
        {skill.description && (
          <p className="mt-5 text-gray-600 leading-relaxed text-sm md:text-base">
            {skill.description}
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左：主内容（5 问 + 对比 + 指南） */}
        <div className="lg:col-span-2 space-y-8">
          {/* 3. 五问评测 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📋</span> 五问评测
            </h2>
            <div className="space-y-3">
              <QuestionRow
                index={1}
                title="解决什么场景？"
                body={
                  skill.scenario_summary || (
                    <span className="text-gray-400">暂无场景说明</span>
                  )
                }
              />
              <ScoreQuestionRow
                index={2}
                title="上手难度如何？"
                score={skill.difficulty_score}
                notes={skill.difficulty_notes}
                scoreLabel="上手"
              />
              <ScoreQuestionRow
                index={3}
                title="输出稳定吗？"
                score={skill.stability_score}
                notes={skill.stability_notes}
                scoreLabel="稳定"
              />
              <QuestionRow
                index={4}
                title="免费额度够用吗？"
                body={
                  skill.free_quota ? (
                    <span className="font-medium text-green-600">
                      {skill.free_quota}
                    </span>
                  ) : (
                    <span className="text-gray-400">暂无免费额度或未提供</span>
                  )
                }
              />
              <QuestionRow
                index={5}
                title="Token 成本高吗？"
                body={
                  skill.token_cost ? (
                    <span>{skill.token_cost}</span>
                  ) : (
                    <span className="text-gray-400">暂无成本数据</span>
                  )
                }
              />
            </div>
          </section>

          {/* 4. 同类对比 */}
          {alternatives.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>⚖️</span> 同类对比
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 text-gray-500 text-xs">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">工具</th>
                      <th className="text-left px-3 py-2 font-medium">平台</th>
                      <th className="text-center px-3 py-2 font-medium">评分</th>
                      <th className="text-center px-3 py-2 font-medium">上手</th>
                      <th className="text-center px-3 py-2 font-medium">稳定</th>
                      <th className="text-left px-3 py-2 font-medium">免费额度</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* 当前 Skill 高亮 */}
                    <tr className="bg-indigo-50/50">
                      <td className="px-3 py-2 font-medium text-indigo-700">
                        {skill.name}
                        <span className="ml-1 text-[10px] text-indigo-400">
                          当前
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {skill.platform_name}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-700">
                        {skill.overall_score != null
                          ? skill.overall_score.toFixed(1)
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-700">
                        {skill.difficulty_score != null
                          ? `${skill.difficulty_score}/5`
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-700">
                        {skill.stability_score != null
                          ? `${skill.stability_score}/5`
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {skill.free_quota || '—'}
                      </td>
                    </tr>
                    {alternatives.map((alt) => (
                      <tr key={(alt as any).slug} className="hover:bg-gray-50 transition">
                        <td className="px-3 py-2">
                          <Link
                            href={`/skill/${(alt as any).slug}`}
                            className="text-gray-800 hover:text-indigo-600 hover:underline"
                          >
                            {(alt as any).name}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {(alt as any).platform_name}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700">
                          {(alt as any).overall_score != null
                            ? (alt as any).overall_score.toFixed(1)
                            : '—'}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-400">
                          —
                        </td>
                        <td className="px-3 py-2 text-center text-gray-400">
                          —
                        </td>
                        <td className="px-3 py-2 text-gray-400">
                          —
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* 5. 使用指南 */}
          {skill.guide_content && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📖</span> 使用指南
                {skill.guide_difficulty && (
                  <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    难度：{skill.guide_difficulty}
                  </span>
                )}
              </h2>
              <div className="prose prose-sm max-w-none bg-gray-50 rounded-xl p-5 text-gray-700 leading-relaxed whitespace-pre-wrap">
                {skill.guide_content}
              </div>
            </section>
          )}
        </div>

        {/* 右：试用 + 安装 + 评测信息（粘性侧栏） */}
        <aside className="lg:col-span-1">
          <div className="space-y-6 lg:sticky lg:top-20">
            {/* 6. 试用区 */}
            {skill.trial_enabled ? (
              <TrialBox skillId={skill.id} skillName={skill.name} />
            ) : (
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-center">
                <span className="text-2xl">🔒</span>
                <p className="text-sm text-gray-500 mt-2">
                  该 Skill 暂不支持在线试用，请直接安装体验。
                </p>
              </div>
            )}

            {/* 7. 安装区 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>📦</span> 安装
              </h3>
              <a
                href={skill.install_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 active:scale-[0.98] transition"
              >
                去 {skill.platform_name} 安装 →
              </a>
              {skill.version && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  当前版本 v{skill.version}
                </p>
              )}
            </div>

            {/* 8. 评测信息 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 text-xs text-gray-500 space-y-2">
              <h3 className="font-bold text-gray-700 text-sm mb-2">评测信息</h3>
              {skill.evaluation_method && (
                <div>
                  <span className="text-gray-400">方法：</span>
                  {skill.evaluation_method}
                </div>
              )}
              {evaluatedDate && (
                <div>
                  <span className="text-gray-400">时间：</span>
                  {evaluatedDate}
                </div>
              )}
              {skill.version_at_eval && (
                <div>
                  <span className="text-gray-400">评测版本：</span>
                  v{skill.version_at_eval}
                </div>
              )}
              {skill.test_cases && (
                <div>
                  <a
                    href={skill.test_cases}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    查看测试用例 ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* 9. 相关 Skill 推荐 */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🔗</span> 相关推荐
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.map((s) => (
              <SkillCardComponent key={s.slug} skill={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ===== 子组件 =====

function QuestionRow({
  index,
  title,
  body,
}: {
  index: number
  title: string
  body: React.ReactNode
}) {
  return (
    <div className="flex gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-200 transition">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
        Q{index}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>
        <div className="text-sm text-gray-600">{body}</div>
      </div>
    </div>
  )
}

function ScoreQuestionRow({
  index,
  title,
  score,
  notes,
  scoreLabel,
}: {
  index: number
  title: string
  score: number | null
  notes: string | null
  scoreLabel: string
}) {
  return (
    <QuestionRow
      index={index}
      title={title}
      body={
        <div className="space-y-1">
          {score != null ? (
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-sm">
                {scoreToStars(score)}
              </span>
              <span className="font-medium text-gray-800">
                {scoreLabel} {score}/5
              </span>
            </div>
          ) : (
            <span className="text-gray-400">暂无评分</span>
          )}
          {notes && <p className="text-gray-500">{notes}</p>}
        </div>
      }
    />
  )
}

// ===== 辅助：获取相关 Skill =====

async function getRelatedSkills(skill: SkillDetail): Promise<SkillCard[]> {
  // 优先按场景取同类，其次用同类替代兜底
  // ScenarioDetail 没有 scenario_slugs，从 skill 对象取
  const scenarioSlug = (skill as any).scenario_slugs?.[0] || ''
  if (scenarioSlug) {
    const byScenario = await getSkillsByScenario(scenarioSlug)
    const filtered = byScenario.filter(
      (s) => s.slug !== skill.slug
    )
    if (filtered.length > 0) return filtered.slice(0, 6)
  }
  // 兜底：用同类替代（去重、排除自身），映射成 SkillCard 形态供卡片组件渲染
  const alts = (skill.alternatives || []).filter((s) => s.slug !== skill.slug)
  if (alts.length > 0) {
    return alts.slice(0, 6).map((a) => ({
      id: a.skill_id,
      name: a.name,
      slug: a.slug,
      tagline: a.tagline,
      icon_url: null,
      category: 'scene' as const,
      platform_name: a.platform_name,
      platform_slug: '',
      api_supported: false,
      overall_score: a.overall_score,
      difficulty_score: null,
      stability_score: null,
      evaluated_at: null,
      free_quota: null,
      trial_enabled: false,
      install_url: '',
      scenario_slugs: [],
    }))
  }

  // 最后兜底：首页精选
  const { getFeaturedSkills } = await import('@/lib/supabase')
  const featured = await getFeaturedSkills(6)
  return featured.filter((s) => s.slug !== skill.slug).slice(0, 6)
}
