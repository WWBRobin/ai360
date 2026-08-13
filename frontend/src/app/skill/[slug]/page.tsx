import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { SkillDetail, AlternativeSkill, SkillCard, CompareRow } from '@/types'
import {
  getSkillDetail,
  getSkillsByScenario,
  getSkillCardsBySlugs,
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

  // 构建同类对比表：当前 skill + 替代品，统一从 skill_cards_view 取全字段
  const altSlugs = alternatives.map((a) => a.slug).filter(Boolean)
  const altCards = altSlugs.length
    ? await getSkillCardsBySlugs(altSlugs).catch(() => [])
    : []
  const altBySlug = new Map(altCards.map((c) => [c.slug, c]))

  // 当前 skill 行
  const currentRow: CompareRow = {
    slug: skill.slug,
    name: skill.name,
    platform_name: skill.platform_name,
    overall_score: skill.overall_score,
    difficulty_score: skill.difficulty_score,
    stability_score: skill.stability_score,
    free_quota: skill.free_quota,
    icon_url: skill.icon_url,
    category: skill.category,
    tagline: skill.tagline,
    is_current: true,
  }
  // 替代品行（用全字段卡片数据补齐 difficulty/stability/free_quota）
  const altRows: CompareRow[] = alternatives
    .map((a) => {
      const card = altBySlug.get(a.slug)
      return {
        slug: a.slug,
        name: a.name,
        platform_name: a.platform_name || card?.platform_name || '',
        overall_score: a.overall_score ?? card?.overall_score ?? null,
        difficulty_score: card?.difficulty_score ?? null,
        stability_score: card?.stability_score ?? null,
        free_quota: card?.free_quota ?? null,
        icon_url: card?.icon_url ?? null,
        category: card?.category ?? skill.category,
        tagline: a.tagline ?? card?.tagline ?? null,
      } as CompareRow
    })
    // 把自身排除（避免重复）并按综合分降序
    .filter((r) => r.slug !== skill.slug)
    .sort(
      (x, y) =>
        (y.overall_score ?? -1) - (x.overall_score ?? -1)
    )

  const compareRows: CompareRow[] = [currentRow, ...altRows]
  const hasEvaluated = skill.evaluated_at != null || skill.overall_score != null

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
              {/* AI360 实测标签 */}
              {hasEvaluated && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden className="inline-block">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  AI360 实测
                </span>
              )}
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
                  skill.category === 'infrastructure'
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
              <ScoreQuestionRow
                index={4}
                title="免费额度够用吗？"
                score={skill.free_quota_score}
                scoreLabel="免费额度"
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
              <ScoreQuestionRow
                index={5}
                title="Token 成本高吗？"
                score={skill.token_efficiency_score}
                scoreLabel="Token 成本"
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
          {compareRows.length > 1 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>⚖️</span> 同类对比
                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  {compareRows.length} 款
                </span>
              </h2>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden min-w-[480px]">
                  <thead className="bg-gray-50 text-gray-500 text-xs">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">工具</th>
                      <th className="text-left px-3 py-2 font-medium">平台</th>
                      <th className="text-center px-3 py-2 font-medium">综合</th>
                      <th className="text-center px-3 py-2 font-medium">上手</th>
                      <th className="text-center px-3 py-2 font-medium">稳定</th>
                      <th className="text-left px-3 py-2 font-medium">免费额度</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {compareRows.map((row) => (
                      <CompareRowView key={row.slug} row={row} />
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                综合分满分 5 分；上手 / 稳定满分 5 分，越高越易用 / 越稳定。
              </p>
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

      {/* 9. 替代品推荐（明确可替换当前 skill 的同类工具） */}
      {altRows.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
            <span>🔁</span> 替代品推荐
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            如果「{skill.name}」不完全合适，以下同类工具可能更适合你。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {altRows.slice(0, 6).map((row) => (
              <AlternativeCard key={row.slug} row={row} />
            ))}
          </div>
        </section>
      )}

      {/* 10. 相关 Skill 推荐 */}
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
  body,
}: {
  index: number
  title: string
  score: number | null
  notes?: string | null
  scoreLabel: string
  body?: React.ReactNode
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
          {body ? (
            <div className="text-gray-600">{body}</div>
          ) : (
            notes && <p className="text-gray-500">{notes}</p>
          )}
        </div>
      }
    />
  )
}

// ===== 同类对比表行 =====

function ScoreCell({ score, suffix = '/5' }: { score: number | null; suffix?: string }) {
  if (score == null) return <span className="text-gray-300">—</span>
  const color =
    score >= 4 ? 'text-green-600' : score >= 3 ? 'text-amber-600' : 'text-gray-500'
  return <span className={`font-medium ${color}`}>{score}{suffix}</span>
}

function CompareRowView({ row }: { row: CompareRow }) {
  const isCurrent = row.is_current
  return (
    <tr className={isCurrent ? 'bg-indigo-50/60' : 'hover:bg-gray-50 transition'}>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          {row.icon_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.icon_url}
              alt=""
              loading="lazy"
              className="w-5 h-5 rounded object-cover flex-shrink-0"
            />
          ) : (
            <span className="text-base flex-shrink-0" aria-hidden>
              {CATEGORY_ICONS[row.category] || '🧩'}
            </span>
          )}
          {isCurrent ? (
            <span className="font-semibold text-indigo-700 truncate">
              {row.name}
              <span className="ml-1 text-[10px] align-middle bg-indigo-100 text-indigo-500 px-1 py-px rounded">
                当前
              </span>
            </span>
          ) : (
            <Link
              href={`/skill/${row.slug}`}
              className="text-gray-800 hover:text-indigo-600 hover:underline truncate"
            >
              {row.name}
            </Link>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{row.platform_name || '—'}</td>
      <td className="px-3 py-2 text-center">
        {row.overall_score != null ? (
          <span className="font-semibold text-gray-800">{row.overall_score.toFixed(1)}</span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
      <td className="px-3 py-2 text-center"><ScoreCell score={row.difficulty_score} /></td>
      <td className="px-3 py-2 text-center"><ScoreCell score={row.stability_score} /></td>
      <td className="px-3 py-2 text-gray-500">
        {row.free_quota ? (
          <span className="text-green-600 text-xs font-medium">{row.free_quota}</span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
    </tr>
  )
}

// ===== 替代品卡片 =====

function AlternativeCard({ row }: { row: CompareRow }) {
  return (
    <Link href={`/skill/${row.slug}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-lg hover:border-indigo-300 transition-all duration-200 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          {row.icon_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.icon_url}
              alt=""
              loading="lazy"
              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <span className="text-xl flex-shrink-0" aria-hidden>
              {CATEGORY_ICONS[row.category] || '🧩'}
            </span>
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition truncate">
              {row.name}
            </h3>
            <span className="text-xs text-gray-400">{row.platform_name}</span>
          </div>
        </div>
        {row.tagline && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2 flex-1">{row.tagline}</p>
        )}
        <div className="flex items-center justify-between text-xs">
          {row.overall_score != null ? (
            <span className="flex items-center gap-1">
              <span className="text-amber-400">⭐</span>
              <span className="font-semibold text-gray-800">{row.overall_score.toFixed(1)}</span>
            </span>
          ) : (
            <span className="text-gray-400">暂无评分</span>
          )}
          <span className="text-indigo-600 font-medium group-hover:underline">查看评测 →</span>
        </div>
      </div>
    </Link>
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
