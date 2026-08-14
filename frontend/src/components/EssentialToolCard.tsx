'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { SkillCard } from '@/types'

/**
 * proto7 装机工具卡片（装机必备页）
 * 对齐 proto7-essential.html 的 .tool-card + .btn-install
 * 玻璃态卡片 + btn-primary [安装] 按钮 + 星级评分
 */
function StarRating({ score }: { score: number | null }) {
  if (!score) return null
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-[var(--primary)] font-semibold whitespace-nowrap bg-[rgba(var(--dim-rgb),0.12)] px-2 py-[3px] rounded-lg">
      <span aria-hidden>★</span>
      {score.toFixed(1)}
    </span>
  )
}

export default function EssentialToolCard({
  skill,
  categoryLabel,
  onInstallToggle,
}: {
  skill: SkillCard
  categoryLabel: string
  onInstallToggle: (id: number, installed: boolean) => void
}) {
  const [installed, setInstalled] = useState(false)

  const toggle = () => {
    if (installed) return
    setInstalled(true)
    onInstallToggle(skill.id, true)
  }

  return (
    <div className="content-card p-4.5 flex flex-col gap-2.5" style={{ padding: '18px' }}>
      {/* 顶部：名称 + 评分 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-[var(--fg)] mb-[3px] truncate">
            {skill.name}
          </div>
          <div className="text-[11px] text-[var(--fg3)]">by {skill.platform_name}</div>
        </div>
        <StarRating score={skill.overall_score} />
      </div>

      {/* 标签 */}
      <div className="flex gap-1.5 flex-wrap">
        {skill.api_supported && <span className="tag tag-official">Official</span>}
        {skill.overall_score != null && <span className="tag tag-tested">实测</span>}
        {skill.free_quota && <span className="tag tag-free">免费</span>}
      </div>

      {/* 描述 */}
      {skill.tagline && (
        <p className="text-[13px] text-[var(--fg2)] leading-[1.6] line-clamp-2">{skill.tagline}</p>
      )}

      {/* 底部：分类 + 安装按钮 */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-[11px] text-[var(--fg3)] bg-[var(--bg2)] px-2.5 py-1 rounded-md">
          {categoryLabel}
        </span>
        {installed ? (
          <span className="text-[12px] font-semibold text-[var(--primary)] px-4 py-1.5" style={{ background: 'rgba(var(--dim-rgb),0.12)', borderRadius: '8px' }}>
            ✓ 已安装
          </span>
        ) : (
          <Link
            href={`/skill/${skill.slug}`}
            className="btn-primary px-4 py-1.5 text-[12px] font-semibold inline-block"
          >
            去安装
          </Link>
        )}
      </div>
    </div>
  )
}
