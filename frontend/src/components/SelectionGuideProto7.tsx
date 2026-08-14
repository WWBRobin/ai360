import Link from 'next/link'
import type { SkillCard } from '@/types'

/**
 * proto7 选型建议区（场景页）
 * 对齐 proto7-scenario.html 的 .suggest + .suggest-grid + .suggest-card
 * 外层 content-card，内层 4 个分类卡片（综合最佳/新手友好/免费额度/最稳定）
 */
interface Badge {
  text: string
  cls: string
}

const BADGES: Record<string, Badge> = {
  best: { text: '综合最佳', cls: 'bg-[rgba(var(--dim-rgb),0.10)] text-[var(--primary)]' },
  newbie: { text: '零基础友好', cls: 'bg-[var(--green-bg)] text-[var(--green)]' },
  free: { text: '免费额度', cls: 'bg-[rgba(var(--dim-rgb),0.10)] text-[var(--primary)]' },
  stable: { text: '最稳定', cls: 'bg-[rgba(var(--dim-rgb),0.10)] text-[var(--primary)]' },
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

  // 去重：每个维度选不同的工具
  const usedSlugs = new Set<string>()

  function pickUnique(skill: SkillCard | null): SkillCard | null {
    if (!skill) return null
    // 如果已被选过，找下一个
    if (usedSlugs.has(skill.slug)) {
      const alt = evaluated
        .filter(s => !usedSlugs.has(s.slug))
        .sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0))[0]
      if (alt) {
        usedSlugs.add(alt.slug)
        return alt
      }
      return null
    }
    usedSlugs.add(skill.slug)
    return skill
  }

  const bestOverallP = pickUnique(bestOverall)
  const beginnerFriendlyP = pickUnique(beginnerFriendly)
  const freeQuotaSkillP = pickUnique(freeQuotaSkill)
  const mostStableP = pickUnique(mostStable)

  const recs = [
    {
      badge: BADGES.best,
      skill: bestOverallP,
      why: bestOverallP ? `综合评分 ${bestOverallP.overall_score!.toFixed(1)}，整体表现最优` : '暂无评测数据',
    },
    {
      badge: BADGES.newbie,
      skill: beginnerFriendlyP,
      why: beginnerFriendlyP?.difficulty_score
        ? `上手难度 L${Math.max(1, Math.min(5, Math.round(6 - beginnerFriendlyP.difficulty_score)))}，一看就会`
        : '优先选择有试用功能的',
    },
    {
      badge: BADGES.free,
      skill: freeQuotaSkillP,
      why: freeQuotaSkillP?.free_quota ? `${freeQuotaSkillP.free_quota}，零成本体验` : '关注有试用功能的工具',
    },
    {
      badge: BADGES.stable,
      skill: mostStableP,
      why: mostStableP?.stability_score
        ? `稳定性 ${mostStableP.stability_score.toFixed(1)}/5，长期使用最可靠`
        : '选择评分较高的更稳妥',
    },
  ]

  return (
    <section className="content-card mt-10 p-7">
      <h2 className="text-[18px] font-bold text-[var(--fg)] mb-1.5">{scenarioName}场景 · 选型建议</h2>
      <p className="text-[13px] text-[var(--fg3)] mb-5">基于 ArcDock 三维实测评分，按典型需求给出推荐</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {recs.map((rec) => (
          <div
            key={rec.badge.text}
            className="rounded-xl p-4 bg-[var(--card)] border border-[var(--border)] transition hover:border-[var(--border)]"
          >
            <span
              className={`inline-block text-[11px] font-bold uppercase tracking-[0.4px] px-2.5 py-[3px] rounded-md mb-2 ${rec.badge.cls}`}
            >
              {rec.badge.text}
            </span>
            {rec.skill ? (
              <Link href={`/skill/${rec.skill.slug}`} className="block group">
                <div className="text-[14px] font-semibold text-[var(--fg)] group-hover:text-[var(--primary)] transition mb-1.5">
                  {rec.skill.name}
                </div>
                <p className="text-[12px] text-[var(--fg2)] leading-[1.6]">{rec.why}</p>
              </Link>
            ) : (
              <div>
                <div className="text-[14px] font-semibold text-[var(--fg3)] mb-1.5">暂无推荐</div>
                <p className="text-[12px] text-[var(--fg2)] leading-[1.6]">{rec.why}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
