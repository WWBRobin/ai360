import Link from 'next/link'
import type { SkillCard } from '@/types'

/**
 * proto7 玻璃态工具卡片（场景页 / 平台页共用）
 * 使用全局样式：glass-card / score-bar / tag-tested / tag-free / score-text
 */
function ScoreBar({ label, value }: { label: string; value: number | null | undefined }) {
  const pct = value ? (value / 5) * 100 : 0
  return (
    <div className="flex-1">
      <div className="text-[10px] text-[#9CA3AF] uppercase tracking-[0.3px] mb-1">{label}</div>
      <div className="h-[5px] bg-[#F0F0F0] rounded-[3px] overflow-hidden">
        <div className="score-bar h-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[11px] text-[#7C3AED] font-semibold mt-[3px]">
        {value ? value.toFixed(1) : '—'}
      </div>
    </div>
  )
}

export default function SkillCardProto7({ skill }: { skill: SkillCard }) {
  const hasEval = !!skill.overall_score
  return (
    <Link href={`/skill/${skill.slug}`} className="glass-card p-5 block group">
      {/* 头部：图标 + 标题 + 评分 */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] flex items-center justify-center text-[13px] font-bold text-white shrink-0">
            {skill.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-[#1A1A1A] group-hover:text-[#7C3AED] transition truncate">
              {skill.name}
            </div>
            <div className="text-[11px] text-[#9CA3AF] truncate">{skill.platform_name}</div>
          </div>
        </div>
        {hasEval && (
          <span className="score-text text-base shrink-0 ml-2">{skill.overall_score!.toFixed(1)}</span>
        )}
      </div>

      {/* 描述 */}
      {skill.tagline && (
        <p className="text-[13px] text-[#6B7280] leading-[1.6] mb-3 line-clamp-2">{skill.tagline}</p>
      )}

      {/* 标签 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {skill.category === 'infrastructure' && <span className="tag tag-free">装机必备</span>}
        {skill.api_supported && <span className="tag tag-official">官方 API</span>}
        {hasEval && <span className="tag tag-tested">AI360 实测</span>}
        {skill.free_quota && <span className="tag tag-free">免费</span>}
      </div>

      {/* 三维评分 */}
      {hasEval && (
        <div className="flex gap-3.5 pt-3 border-t border-[#EEF0F3]">
          <ScoreBar label="实测" value={skill.overall_score} />
          <ScoreBar label="稳定" value={skill.stability_score} />
          <ScoreBar label="易用" value={skill.difficulty_score} />
        </div>
      )}
    </Link>
  )
}
