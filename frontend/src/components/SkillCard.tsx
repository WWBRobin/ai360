import Link from 'next/link'
import type { SkillCard } from '@/types'
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/supabase'

/**
 * 统一极简线条 #FF8C00 风格卡片
 * 与 SkillCardProto7 风格一致：content-card + #FF8C00 + tag 样式
 */
export default function SkillCardComponent({ skill }: { skill: SkillCard }) {
  const hasEval = !!skill.overall_score
  const isRecommended = hasEval && (skill.overall_score ?? 0) >= 4

  return (
    <Link href={`/skill/${skill.slug}`} className="content-card p-5 block group">
      {/* 头部：图标 + 标题 + 评分 */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {skill.icon_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={skill.icon_url}
              alt={skill.name}
              loading="lazy"
              className="w-9 h-9 rounded-[10px] object-cover flex-shrink-0"
            />
          ) : (
            <span className="w-9 h-9 rounded-[10px] bg-[#FF8C00] flex items-center justify-center text-[13px] font-bold text-white shrink-0">
              {skill.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-[#1A1A1A] group-hover:text-[#FF8C00] transition truncate">
              {skill.name}
            </div>
            <div className="text-[11px] text-[#9CA3AF] truncate">
              {CATEGORY_ICONS[skill.category]} {skill.platform_name}
            </div>
          </div>
        </div>
        {hasEval && (
          <span className="score-text text-base shrink-0 ml-2">
            {skill.overall_score!.toFixed(1)}
          </span>
        )}
      </div>

      {/* 描述 */}
      {skill.tagline && (
        <p className="text-[13px] text-[#6B7280] leading-[1.6] mb-3 line-clamp-2">
          {skill.tagline}
        </p>
      )}

      {/* 标签 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {isRecommended && <span className="tag tag-tested">⭐ 实测推荐</span>}
        {skill.category === 'infrastructure' && <span className="tag tag-mcp">装机必备</span>}
        {skill.api_supported && <span className="tag tag-official">官方 API</span>}
        {hasEval && <span className="tag tag-tested">AI360 实测</span>}
        {skill.free_quota && <span className="tag tag-free">免费</span>}
      </div>

      {/* 评分 + 维度徽章 */}
      {hasEval && (
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-[#EEF0F3]">
          <DimBadge label={`上手 ${dimLabel(skill.difficulty_score)}`} score={skill.difficulty_score} />
          <DimBadge label={`稳定 ${dimLabel(skill.stability_score)}`} score={skill.stability_score} />
          {skill.free_quota && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium text-[#16a34a] bg-[#f0fdf4]">
              🎁 {skill.free_quota}
            </span>
          )}
        </div>
      )}

      {/* 底部操作 */}
      <div className="mt-3 pt-3 border-t border-[#EEF0F3] flex items-center justify-between">
        <span className="text-[12px] text-[#FF8C00] font-medium group-hover:underline">
          查看评测 →
        </span>
        {skill.trial_enabled ? (
          <span className="text-[11px] bg-[rgba(255,140,0,0.06)] text-[#FF8C00] px-2.5 py-1 rounded-lg font-medium">
            免费试用
          </span>
        ) : (
          <span className="text-[11px] bg-[#FAFAFA] text-[#6B7280] px-2.5 py-1 rounded-lg font-medium border border-[#F0F0F0]">
            去安装
          </span>
        )}
      </div>
    </Link>
  )
}

function dimLabel(score: number | null | undefined): string {
  if (!score) return '—'
  if (score >= 4.5) return '优秀'
  if (score >= 3.5) return '良好'
  if (score >= 2.5) return '一般'
  return '较弱'
}

function DimBadge({ label, score }: { label: string; score: number | null | undefined }) {
  if (!score) return null
  const isHigh = score >= 4
  return (
    <span
      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
        isHigh
          ? 'text-[#FF8C00] bg-[rgba(255,140,0,0.08)]'
          : 'text-[#6B7280] bg-[#F3F4F6]'
      }`}
    >
      {label}
    </span>
  )
}
