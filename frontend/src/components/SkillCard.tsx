import Link from 'next/link'
import type { SkillCard } from '@/types'
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/supabase'

// 维度评分 → 颜色 + 标签
function dimMeta(score: number | null | undefined): { label: string; color: string } | null {
  if (!score) return null
  if (score >= 4.5) return { label: '优秀', color: 'text-green-600 bg-green-50' }
  if (score >= 3.5) return { label: '良好', color: 'text-indigo-600 bg-indigo-50' }
  if (score >= 2.5) return { label: '一般', color: 'text-amber-600 bg-amber-50' }
  return { label: '较弱', color: 'text-gray-500 bg-gray-100' }
}

export default function SkillCardComponent({ skill }: { skill: SkillCard }) {
  const hasEval = !!skill.overall_score
  const isRecommended = hasEval && (skill.overall_score ?? 0) >= 4
  const freeBadge = dimMeta(skill.free_quota ? 5 : null)
  const difficultyBadge = dimMeta(skill.difficulty_score)
  const stabilityBadge = dimMeta(skill.stability_score)

  return (
    <Link href={`/skill/${skill.slug}`} className="block">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-indigo-300 transition-all duration-200 group relative">
        {/* 实测推荐角标 */}
        {isRecommended && (
          <div className="absolute top-0 right-0 z-10">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-lg flex items-center gap-1 shadow-sm">
              ⭐ 实测推荐
            </div>
          </div>
        )}

        <div className="p-5">
          {/* 标签行 */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs px-2 py-0.5 rounded ${
              skill.category === 'infrastructure' ? 'bg-blue-50 text-blue-600' :
              skill.category === 'scene' ? 'bg-indigo-50 text-indigo-600' :
              'bg-amber-50 text-amber-600'
            }`}>
              {CATEGORY_ICONS[skill.category]} {CATEGORY_LABELS[skill.category]}
            </span>
            <span className="text-xs text-gray-400">{skill.platform_name}</span>
          </div>

          {/* 图标 + 标题 */}
          <div className="flex items-center gap-3 mb-1">
            {skill.icon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={skill.icon_url}
                alt=""
                loading="lazy"
                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <span className="text-xl flex-shrink-0" aria-hidden>
                {CATEGORY_ICONS[skill.category]}
              </span>
            )}
            <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition">
              {skill.name}
            </h3>
          </div>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{skill.tagline}</p>

          {/* 评分环 + 综合分（醒目） */}
          {hasEval ? (
            <div className="flex items-center gap-3 mb-3">
              <ScoreRing score={skill.overall_score!} />
              <div className="flex-1">
                <div className="text-xs text-gray-400 mb-1">综合评分</div>
                <div className="flex items-center gap-1">
                  <span className={`text-lg font-bold ${
                    (skill.overall_score ?? 0) >= 4 ? 'text-green-600' :
                    (skill.overall_score ?? 0) >= 3 ? 'text-amber-500' : 'text-gray-500'
                  }`}>
                    {skill.overall_score!.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">/ 5.0</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-3 text-xs text-gray-300">暂无评测</div>
          )}

          {/* 维度徽章 */}
          <div className="flex flex-wrap gap-1.5">
            {difficultyBadge && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${difficultyBadge.color}`}>
                上手 {difficultyBadge.label}
              </span>
            )}
            {stabilityBadge && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${stabilityBadge.color}`}>
                稳定 {stabilityBadge.label}
              </span>
            )}
            {skill.free_quota && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium text-emerald-700 bg-emerald-50">
                🎁 {skill.free_quota}
              </span>
            )}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50/50">
          <span className="text-xs text-indigo-600 font-medium group-hover:underline">
            查看评测 →
          </span>
          {skill.trial_enabled ? (
            <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-medium">
              免费试用
            </span>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-lg font-medium">
              去安装
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// 评分环 SVG 组件
function ScoreRing({ score }: { score: number }) {
  const pct = (score / 5) * 100
  const color = score >= 4 ? '#16a34a' : score >= 3 ? '#ff8c00' : '#6b7280'
  const r = 18
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c
  return (
    <div className="relative w-12 h-12 flex-shrink-0">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#f3f4f6" strokeWidth="3.5" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color }}>
        {score.toFixed(1)}
      </span>
    </div>
  )
}
