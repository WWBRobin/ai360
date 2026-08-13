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
import { getGitHubRepoData, formatStars, type GitHubRepoData } from '@/lib/github'
import { getRelatedArticles } from '@/lib/related-articles'
import type { ArticleMeta } from '@/lib/articles'
import SkillCardComponent from '@/components/SkillCard'
import TrialBox from '@/components/TrialBox'
import CodeBlock from '@/components/CodeBlock'

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

  // GitHub 仓库数据（从 install_url 解析，失败静默降级）
  const github = await getGitHubRepoData(skill.install_url).catch(() => null)

  // 相关文章（基于分类/平台/场景关键词匹配）
  const relatedArticles = getRelatedArticles(
    {
      name: skill.name,
      slug: skill.slug,
      category: skill.category,
      platform_name: skill.platform_name,
      platform_slug: skill.platform_slug,
      scenario_slugs: skill.scenario_slugs || [],
      tagline: skill.tagline,
      description: skill.description,
    },
    4
  )

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

          {/* 6. 安装方式 */}
          <div className="space-y-2">
                    <h3 className="font-bold text-gray-900 text-sm">📦 安装方式</h3>
                    {skill.install_url && (
                      <a href={skill.install_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                        🔗 前往安装 →
                      </a>
                    )}
                  </div>
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

              {/* GitHub Star 数据 */}
              {github && (
                <GitHubStats github={github} />
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

      {/* 11. 相关文章 */}
      {relatedArticles.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📰</span> 相关文章
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedArticles.map((a) => (
              <RelatedArticleCard key={a.slug} article={a} />
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

// ===== GitHub Star 数据卡片（侧栏用）=====

function GitHubStats({ github }: { github: GitHubRepoData }) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        {/* GitHub mark */}
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden className="text-gray-700">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        <a
          href={github.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-gray-700 hover:text-indigo-600 transition truncate"
        >
          {github.full_name}
        </a>
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="bg-amber-50 rounded-lg py-1.5">
          <div className="text-xs text-amber-500">★ Star</div>
          <div className="text-sm font-bold text-gray-800">
            {formatStars(github.stars)}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg py-1.5">
          <div className="text-xs text-gray-400">⑂ Fork</div>
          <div className="text-sm font-bold text-gray-800">
            {formatStars(github.forks)}
          </div>
        </div>
        <div className="bg-indigo-50 rounded-lg py-1.5">
          <div className="text-xs text-indigo-400">License</div>
          <div className="text-xs font-bold text-gray-800 truncate px-1">
            {github.license || '—'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
        {github.language && <span>语言：{github.language}</span>}
        {github.pushed_at && (
          <span>
            · 更新于{' '}
            {new Date(github.pushed_at).toLocaleDateString('zh-CN', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>
    </div>
  )
}

// ===== 安装方式区块（主内容区）=====

// 各平台的安装步骤模板（按 platform_slug 匹配）
interface InstallStep {
  title: string
  /** 命令行代码（可选，带复制按钮）。%INSTALL_URL% 占位符会被替换成实际安装链接 */
  code?: string
  desc?: string
}

const PLATFORM_INSTALL_STEPS: Record<string, InstallStep[]> = {
  // Claude：MCP / Skills 安装
  claude: [
    {
      title: '在 Claude 中开启',
      desc: '登录 Claude，进入设置 → Skills / Extensions，按平台提示搜索并安装。',
    },
    {
      title: '或用 Claude Code（MCP）',
      code: 'claude mcp add %NAME%',
      desc: '本地 Claude Code 用户可用命令行直接挂载 MCP server。',
    },
  ],
  // Codex：命令行安装
  codex: [
    {
      title: '安装 Codex CLI',
      code: 'npm install -g @openai/codex',
    },
    {
      title: '挂载 MCP / Skill',
      code: 'codex --mcp %NAME%',
      desc: '在 Codex 配置中添加本工具的 MCP server 或 Skill。',
    },
  ],
  // Cursor：设置面板
  cursor: [
    {
      title: '打开 Cursor 设置',
      desc: 'Cursor → Settings → MCP / Extensions，搜索工具名安装。',
    },
    {
      title: '或编辑配置文件',
      code: '~/.cursor/mcp.json',
      desc: '在 MCP 配置文件中手动添加 server 条目。',
    },
  ],
  // Coze（扣子）：网页搭建
  coze: [
    {
      title: '登录扣子平台',
      desc: '访问 coze.cn，创建智能体 → Bot 编排页。',
    },
    {
      title: '添加插件 / Skill',
      desc: '在 Bot 编辑页「插件」面板搜索并添加对应技能，配置后发布。',
    },
  ],
  // Dify：应用配置
  dify: [
    {
      title: '登录 Dify',
      desc: '访问 Dify 工作台，创建或进入应用。',
    },
    {
      title: '添加工具',
      desc: '在应用编排页「工具」节点添加本工具，配置 API Key 后调用。',
    },
  ],
}

function InstallSteps({
  installUrl,
  platformName,
  platformSlug,
  github,
}: {
  installUrl: string
  platformName: string
  platformSlug: string
  github: GitHubRepoData | null
}) {
  // 命中平台专属步骤模板
  const steps = PLATFORM_INSTALL_STEPS[platformSlug]

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>⚙️</span> 安装方式
        <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
          {platformName}
        </span>
      </h2>

      <div className="space-y-3">
        {/* 平台专属步骤 */}
        {steps ? (
          steps.map((step, i) => (
            <InstallStepItem
              key={i}
              index={i + 1}
              title={step.title}
              code={step.code}
              desc={step.desc}
              skillName={platformName}
            />
          ))
        ) : (
          // 通用：网页直接安装
          <InstallStepItem
            index={1}
            title={`前往 ${platformName} 安装`}
            desc={`点击下方按钮跳转到 ${platformName} 官方页面，按提示完成安装。`}
          />
        )}

        {/* 通用 CTA 按钮 */}
        <div className="pt-2">
          <a
            href={installUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 active:scale-[0.98] transition"
          >
            <span>🚀</span> 去 {platformName} 安装
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M7 17L17 7M17 7H8M17 7v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        {/* GitHub 仓库源码入口 */}
        {github && (
          <p className="text-xs text-gray-400 pt-1">
            🔧 开发者？{' '}
            <a
              href={github.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              查看 GitHub 源码
            </a>
            （{formatStars(github.stars)} ★ · {github.license || '协议未知'}）
          </p>
        )}
      </div>
    </section>
  )
}

function InstallStepItem({
  index,
  title,
  code,
  desc,
  skillName,
}: {
  index: number
  title: string
  code?: string
  desc?: string
  skillName?: string
}) {
  // 替换代码里的占位符
  const realCode = code
    ? code.replace('%NAME%', skillName || '').replace('%INSTALL_URL%', '')
    : undefined

  return (
    <div className="flex gap-3 p-4 bg-white rounded-xl border border-gray-200">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
        {index}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>
        {desc && <p className="text-sm text-gray-500">{desc}</p>}
        {realCode && (
          <CodeBlock code={realCode} />
        )}
      </div>
    </div>
  )
}

// ===== 相关文章卡片 =====

function RelatedArticleCard({ article }: { article: ArticleMeta }) {
  return (
    <Link
      href={`/guide/${article.slug}`}
      className="group block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-indigo-300 transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0">{article.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-indigo-100 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded font-medium">
              {article.tag}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition line-clamp-2 text-sm">
            {article.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
            {article.summary}
          </p>
          <div className="mt-2 text-xs text-indigo-600 font-medium">
            阅读 →
          </div>
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
