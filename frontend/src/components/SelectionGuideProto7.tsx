import Link from 'next/link'
import type { SkillCard } from '@/types'

/**
 * proto7 选型建议区（场景页）
 * 对齐 proto7-scenario.html 的 .suggest + .suggest-grid + .suggest-card
 * 外层 glass-card，内层 4 个分类卡片（综合最佳/新手友好/免费额度/最稳定）
 */
interface Badge {
  text: string
  cls: string
}

const BADGES: Record<string, Badge> = {
  best: { text: '综合最佳', cls: 'bg-[#EEF2FF] text-[#6366F1]' },
  newbie: { text: '新手友好', cls: 'bg-[#f0fdf4] text-[#059669]' },
  free: { text: '免费额度', cls: 'bg-[#EDE9FE] text-[#7C3AED]' },
  stable: { text: '最稳定', cls: 'bg-[#EDE9FE] text-[#7C3AED]' },
}

export default function SelectionGuideProto7({
  skills,
  scenarioName,
}: {
  skills: SkillCard[]
  scenarioName: string
}) {
  if (skills.length === 0) return null

  const evaluated = skills.filter((s) => s.overall_score != null)
  const bestOverall =
    evaluated.length > 0
      ? evaluated.reduce((best, s) => ((s.overall_score ?? 0) > (best.overall_score ?? 0) ? s : best))
      : null
  const beginnerFriendly =
    evaluated.length > 0
      ? evaluated
          .filter((s) => s.difficulty_score != null)
          .reduce((best, s) => ((s.difficulty_score ?? 0) > (best.difficulty_score ?? 0) ? s : best), evaluated[0])
      : null
  const freeQuotaSkill = skills.find((s) => s.free_quota && s.free_quota.trim() !== '') ?? null
  const mostStable =
    evaluated.length > 0
      ? evaluated
          .filter((s) => s.stability_score != null)
          .reduce((best, s) => ((s.stability_score ?? 0) > (best.stability_score ?? 0) ? s : best), evaluated[0])
      : null

  const recs = [
    {
      badge: BADGES.best,
      skill: bestOverall,
      why: bestOverall ? `综合评分 ${bestOverall.overall_score!.toFixed(1)}，整体表现最优` : '暂无评测数据',
    },
    {
      badge: BADGES.newbie,
      skill: beginnerFriendly,
      why: beginnerFriendly?.difficulty_score
        ? `上手难度 ${beginnerFriendly.difficulty_score.toFixed(1)}/5，最容易入门`
        : '优先选择有试用功能的',
    },
    {
      badge: BADGES.free,
      skill: freeQuotaSkill,
      why: freeQuotaSkill?.free_quota ? `${freeQuotaSkill.free_quota}，零成本体验` : '关注有试用功能的工具',
    },
    {
      badge: BADGES.stable,
      skill: mostStable,
      why: mostStable?.stability_score
        ? `稳定性 ${mostStable.stability_score.toFixed(1)}/5，长期使用最可靠`
        : '选择评分较高的更稳妥',
    },
  ]

  return (
    <section className="glass-card mt-10 p-7">
      <h2 className="text-[18px] font-bold text-[#1A1A1A] mb-1.5">{scenarioName}场景 · 选型建议</h2>
      <p className="text-[13px] text-[#9CA3AF] mb-5">基于 AI360 三维实测评分，按典型需求给出推荐</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {recs.map((rec) => (
          <div
            key={rec.badge.text}
            className="rounded-xl p-4 bg-[rgba(255,255,255,0.6)] backdrop-blur border border-[rgba(255,255,255,0.4)] transition hover:-translate-y-[3px] hover:shadow-lg"
          >
            <span
              className={`inline-block text-[11px] font-bold uppercase tracking-[0.4px] px-2.5 py-[3px] rounded-md mb-2 ${rec.badge.cls}`}
            >
              {rec.badge.text}
            </span>
            {rec.skill ? (
              <Link href={`/skill/${rec.skill.slug}`} className="block group">
                <div className="text-[14px] font-semibold text-[#1A1A1A] group-hover:text-[#7C3AED] transition mb-1.5">
                  {rec.skill.name}
                </div>
                <p className="text-[12px] text-[#6B7280] leading-[1.6]">{rec.why}</p>
              </Link>
            ) : (
              <div>
                <div className="text-[14px] font-semibold text-[#9CA3AF] mb-1.5">暂无推荐</div>
                <p className="text-[12px] text-[#6B7280] leading-[1.6]">{rec.why}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
