'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { SkillCard } from '@/types'
import { scoreToStars } from '@/lib/supabase'

export interface EssentialTab {
  id: string
  label: string
  icon: string
  desc: string
  skills: SkillCard[]
}

/**
 * 把 1-5 的评分渲染成圆点（实心=得分，空心=剩余）
 */
function ScoreDots({ score, total = 5 }: { score: number | null; total?: number }) {
  if (!score) {
    return <span className="text-gray-300 text-sm">暂无评分</span>
  }
  const filled = Math.round(score)
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`评分 ${score} / ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`inline-block h-2 w-2 rounded-full ${
            i < filled ? 'bg-[#FF8C00]' : 'bg-[#E5E7EB]'
          }`}
        />
      ))}
      <span className="ml-1.5 text-xs font-medium text-gray-500">{score.toFixed(1)}</span>
    </span>
  )
}

/**
 * 装机专属卡片 —— 比普通 SkillCard 更大、更详细，像一个工具信息面板
 */
function EssentialCard({ skill, accent }: { skill: SkillCard; accent: string }) {
  return (
    <div className="group relative flex flex-col content-card p-6 transition-all duration-200 hover:border-[#FF8C00]">
      {/* 顶部：图标 + 名称 + 评分 */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${accent}`}
          >
            <span aria-hidden>{skill.name.charAt(0)}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1A1A1A] group-hover:text-[#FF8C00]">
              <Link href={`/skill/${skill.slug}`} className="hover:underline">
                {skill.name}
              </Link>
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
              {skill.platform_name && (
                <span className="rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-500">
                  {skill.platform_name}
                </span>
              )}
            </div>
          </div>
        </div>
        {skill.overall_score ? (
          <div className="shrink-0 text-right">
            <div className="text-2xl font-bold leading-none text-[#FF8C00]">
              {skill.overall_score.toFixed(1)}
            </div>
            <div className="mt-1 text-xs text-gray-400">综合评分</div>
          </div>
        ) : null}
      </div>

      {/* 一句话描述 */}
      <p className="mt-4 text-sm leading-relaxed text-gray-600">{skill.tagline}</p>

      {/* 指标网格 */}
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
        <div>
          <div className="text-xs text-gray-400">上手难度</div>
          <div className="mt-1">
            <ScoreDots score={skill.difficulty_score} />
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400">稳定性</div>
          <div className="mt-1">
            <ScoreDots score={skill.stability_score} />
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400">免费额度</div>
          <div className="mt-1 text-sm font-medium text-gray-700">
            {skill.free_quota || '未提供'}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Token 成本</div>
          <div className="mt-1 text-sm font-medium text-gray-700">—</div>
        </div>
      </div>

      {/* 底部：安装 + 评测 */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <a
          href={skill.install_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold"
        >
          前往安装
          <span aria-hidden>↗</span>
        </a>
        <Link
          href={`/skill/${skill.slug}`}
          className="text-sm font-medium text-[#FF8C00] hover:underline"
        >
          查看完整评测 →
        </Link>
      </div>
    </div>
  )
}

export default function EssentialTabs({ tabs }: { tabs: EssentialTab[] }) {
  // 默认选中第一个有数据的 tab，否则第一个
  const firstWithSkills = tabs.find((t) => t.skills.length > 0) || tabs[0]
  const [activeId, setActiveId] = useState(firstWithSkills?.id ?? '')

  const active = tabs.find((t) => t.id === activeId) || tabs[0]

  if (!active) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-gray-400">
        暂无装机数据
      </div>
    )
  }

  return (
    <div>
      {/* Tab 栏 */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-200 bg-white p-2">
        {tabs.map((tab) => {
          const isActive = tab.id === active.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveId(tab.id)}
              aria-pressed={isActive}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[#FF8C00] text-white shadow-sm'
                  : 'text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#1F2937]'
              }`}
            >
              <span className="text-base" aria-hidden>
                {tab.icon}
              </span>
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-[#F3F4F6] text-[#9CA3AF]'
                }`}
              >
                {tab.skills.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* 当前分类说明 */}
      <div className="mt-5 flex items-center gap-3 text-gray-500">
        <span className="text-2xl" aria-hidden>
          {active.icon}
        </span>
        <p className="text-sm leading-relaxed">{active.desc}</p>
      </div>

      {/* 工具列表 */}
      {active.skills.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <div className="text-3xl">🚧</div>
          <p className="mt-2 text-sm text-gray-400">
            「{active.label}」分类下的工具正在评测中，敬请期待。
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {active.skills.map((skill) => (
            <EssentialCard key={skill.id} skill={skill} accent="bg-[rgba(255,140,0,0.08)]" />
          ))}
        </div>
      )}
    </div>
  )
}
