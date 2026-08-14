import Link from 'next/link'
import type { SkillCard } from '@/types'

interface SelectionGuideProps {
  skills: SkillCard[]
}

interface Recommendation {
  icon: string
  title: string
  reason: string
  skill: SkillCard | null
}

export default function SelectionGuide({ skills }: SelectionGuideProps) {
  if (skills.length === 0) return null

  const evaluated = skills.filter((s) => s.overall_score != null)

  // 1. 综合最佳：overall_score 最高（需有评测）
  const bestOverall =
    evaluated.length > 0
      ? evaluated.reduce((best, s) => ((s.overall_score ?? 0) > (best.overall_score ?? 0) ? s : best))
      : null

  // 2. 新手友好：difficulty_score 最高（上手最容易）
  const beginnerFriendly =
    evaluated.length > 0
      ? evaluated
          .filter((s) => s.difficulty_score != null)
          .reduce((best, s) => ((s.difficulty_score ?? 0) > (best.difficulty_score ?? 0) ? s : best), evaluated[0])
      : null

  // 3. 免费额度：有 free_quota 的优先（字符串非空即视为有免费额度）
  const freeQuotaSkill =
    skills.find((s) => s.free_quota && s.free_quota.trim() !== '') ?? null

  // 4. 最稳定：stability_score 最高
  const mostStable =
    evaluated.length > 0
      ? evaluated
          .filter((s) => s.stability_score != null)
          .reduce((best, s) => ((s.stability_score ?? 0) > (best.stability_score ?? 0) ? s : best), evaluated[0])
      : null

  const recommendations: Recommendation[] = [
    {
      icon: '🏆',
      title: '综合最佳',
      reason: bestOverall ? `评分 ${bestOverall.overall_score!.toFixed(1)}，整体表现最优` : '暂无评测数据',
      skill: bestOverall,
    },
    {
      icon: '🌱',
      title: '新手友好',
      reason: beginnerFriendly?.difficulty_score
        ? `上手难度 ${beginnerFriendly.difficulty_score}/5，最容易入门`
        : '优先选择有试用功能的',
      skill: beginnerFriendly,
    },
    {
      icon: '🎁',
      title: '免费额度',
      reason: freeQuotaSkill?.free_quota
        ? `${freeQuotaSkill.free_quota}，零成本体验`
        : '关注有试用功能的 Skill',
      skill: freeQuotaSkill,
    },
    {
      icon: '🛡️',
      title: '最稳定',
      reason: mostStable?.stability_score
        ? `稳定性 ${mostStable.stability_score}/5，长期使用最可靠`
        : '选择评分较高的更稳妥',
      skill: mostStable,
    },
  ]

  return (
    <section className="mt-16">
      <div className="content-card p-6 md:p-8">
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#1A1A1A]">
            💡 不知道选哪个？看这里
          </h2>
          <p className="mt-1 text-sm text-[#656360]">
            基于实测数据，按不同需求帮你快速选出最适合的
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recommendations.map((rec) => (
            <div
              key={rec.title}
              className="bg-white rounded-xl border border-[#e3e0dd] p-4 hover:border-[#1c1a18] transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{rec.icon}</span>
                <span className="text-sm font-semibold text-[#1A1A1A]">{rec.title}</span>
              </div>
              {rec.skill ? (
                <Link href={`/skill/${rec.skill.slug}`} className="block group">
                  <div className="font-bold text-[#1A1A1A] group-hover:text-[#1c1a18] transition text-sm mb-1 line-clamp-1">
                    {rec.skill.name}
                  </div>
                  <p className="text-xs text-[#656360] line-clamp-2 leading-relaxed">{rec.reason}</p>
                  <div className="mt-2 text-xs text-[#1c1a18] font-medium group-hover:underline">
                    查看详情 →
                  </div>
                </Link>
              ) : (
                <div>
                  <div className="text-sm text-[#a1a1a1] mb-1">暂无推荐</div>
                  <p className="text-xs text-[#656360] line-clamp-2 leading-relaxed">{rec.reason}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 对比入口 */}
        {evaluated.length >= 2 && (
          <div className="mt-6 flex items-center justify-between rounded-xl bg-[#f4f1ed] px-4 py-3 border border-[#e3e0dd]">
            <span className="text-sm text-[#656360]">📋 还在纠结？把它们放在一起对比</span>
            <Link
              href={`/compare?slugs=${encodeURIComponent(
                evaluated
                  .slice(0, 3)
                  .map((s) => s.slug)
                  .join(',')
              )}`}
              className="text-sm font-medium text-[#1c1a18] hover:underline whitespace-nowrap"
            >
              开始对比 →
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
