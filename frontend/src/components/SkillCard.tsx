'use client'

import Link from 'next/link'
import type { SkillCard } from '@/types'
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/supabase'

/**
 * 统一极简线条 #1c1a18 风格卡片
 * 与 SkillCardProto7 风格一致：content-card + #1c1a18 + tag 样式
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
          ) : skill.platform_slug ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/platform-logos/${skill.platform_slug}.png`}
              alt={skill.name}
              loading="lazy"
              className="w-9 h-9 rounded-[10px] object-cover flex-shrink-0"
              onError={(e) => {
                const t = e.currentTarget;
                t.style.display = 'none';
                const fallback = t.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          {(!skill.icon_url && !skill.platform_slug) && (
            <span className="w-9 h-9 rounded-[10px] bg-[#1c1a18] flex items-center justify-center text-[13px] font-bold text-white shrink-0">
              {skill.name.charAt(0).toUpperCase()}
            </span>
          )}
          {/* fallback for platform logo error */}
          {!skill.icon_url && skill.platform_slug && (
            <span className="w-9 h-9 rounded-[10px] bg-[#1c1a18] flex items-center justify-center text-[13px] font-bold text-white shrink-0" style={{ display: 'none' }}>
              {skill.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-[#1A1A1A] group-hover:text-[#1c1a18] transition truncate">
              {skill.name}
            </div>
            <div className="text-[11px] text-[#a1a1a1] truncate">
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
        <p className="text-[13px] text-[#656360] leading-[1.6] mb-3 line-clamp-2">
          {skill.tagline}
        </p>
      )}

      {/* 标签 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {hasEval && <span className="tag tag-tested">AI360 实测</span>}
        {!hasEval && <span className="tag" style={{ background: '#f0ede9', color: '#a1a1a1' }}>收录未评测</span>}
        {skill.category === 'infrastructure' && <span className="tag tag-mcp">装机必备</span>}
        {skill.api_supported && <span className="tag tag-official">官方 API</span>}
        {skill.free_quota && <span className="tag tag-free">免费</span>}
      </div>

      {/* 评分 + 维度徽章（只有真实评测才显示） */}
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
        <span className="text-[12px] text-[#1c1a18] font-medium group-hover:underline">
          {hasEval ? '查看评测 →' : '查看详情 →'}
        </span>
        {skill.trial_enabled ? (
          <span className="text-[11px] bg-[rgba(28, 26, 24,0.06)] text-[#1c1a18] px-2.5 py-1 rounded-lg font-medium">
            免费试用
          </span>
        ) : (
          <span className="text-[11px] bg-[#f4f1ed] text-[#656360] px-2.5 py-1 rounded-lg font-medium border border-[#e3e0dd]">
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
          ? 'text-[#1c1a18] bg-[rgba(28, 26, 24,0.08)]'
          : 'text-[#656360] bg-[#f0ede9]'
      }`}
    >
      {label}
    </span>
  )
}
