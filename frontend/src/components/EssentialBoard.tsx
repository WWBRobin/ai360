'use client'

import { useState, useMemo } from 'react'
import type { SkillCard } from '@/types'
import EssentialToolCard from './EssentialToolCard'

export interface EssentialCategory {
  id: string
  label: string
  icon: string
  desc: string
  skills: SkillCard[]
}

// 平台 Tab（与原型对齐：Claude / 扣子 / Hermes / GPTs / MCP）
const PLATFORM_TABS = ['Claude', '扣子', 'Hermes', 'GPTs', 'MCP']

/**
 * proto7 装机必备页主体（客户端交互）
 * - 平台 Tab 切换
 * - 按功能分类展示工具卡片（content-card）
 * - 每个工具卡片 [安装] btn-primary 按钮
 * - 底部进度条（score-bar 样式）
 */
export default function EssentialBoard({ categories }: { categories: EssentialCategory[] }) {
  const [activeTab, setActiveTab] = useState(0)
  const [installedIds, setInstalledIds] = useState<Set<number>>(new Set())

  // 全部工具总数（跨分类去重）
  const allSkills = useMemo(() => {
    const seen = new Map<number, SkillCard>()
    for (const cat of categories) {
      for (const s of cat.skills) seen.set(s.id, s)
    }
    return [...seen.values()]
  }, [categories])

  const totalTools = allSkills.length

  const handleInstallToggle = (id: number, installed: boolean) => {
    setInstalledIds((prev) => {
      const next = new Set(prev)
      if (installed) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const installedCount = installedIds.size
  const progressPct = totalTools > 0 ? Math.round((installedCount / totalTools) * 100) : 0

  return (
    <div>
      {/* H1 */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-[#1A1A1A] mb-2.5" style={{ letterSpacing: '-0.5px' }}>
          装机必备
        </h1>
        <p className="text-[15px] text-[#6B7280] leading-[1.7] max-w-[620px]">
          精选 AI 平台高频必备工具，覆盖记忆、搜索、文件、连接、代码五大核心场景。经过实测验证，开箱即用。
        </p>
      </div>

      {/* 平台 Tab（5 个） */}
      <div className="flex gap-0 border-b border-[#EEF0F3] mb-7 overflow-x-auto scrollbar-hide">
        {PLATFORM_TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`relative px-4 py-3 text-sm whitespace-nowrap transition ${
              activeTab === i ? 'tab-active' : 'tab-inactive'
            }`}
            style={{ marginBottom: '-1px' }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 按功能分类展示 */}
      {categories.map((cat) => (
        <section key={cat.id} className="mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <h2 className="text-[17px] font-bold text-[#1A1A1A]">{cat.label}</h2>
            <span className="text-[11px] font-semibold text-[#FF8C00] bg-[rgba(255,140,0,0.10)] px-2.5 py-1 rounded-[10px]">
              {cat.skills.length} 个工具
            </span>
          </div>

          {cat.skills.length === 0 ? (
            <div className="content-card p-10 text-center text-[13px] text-[#9CA3AF]">
              「{cat.label}」分类下的工具正在评测中，敬请期待。
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.skills.map((skill) => (
                <EssentialToolCard
                  key={skill.id}
                  skill={skill}
                  categoryLabel={cat.label}
                  onInstallToggle={handleInstallToggle}
                />
              ))}
            </div>
          )}
        </section>
      ))}

      {/* 底部进度条（score-bar 样式） */}
      <div className="content-card p-6 mt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[14px] font-bold text-[#1A1A1A]">装机进度</span>
          <span className="text-[13px] text-[#6B7280]">
            已安装 {installedCount} / {totalTools} 个必备工具
          </span>
        </div>
        <div className="h-2.5 bg-[#F0F0F0] rounded-[5px] overflow-hidden">
          <div
            className="score-bar h-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-[12px] text-[#9CA3AF] mt-2.5">
          装完全部工具即可覆盖日常 90% 的 AI 使用场景
        </p>
      </div>
    </div>
  )
}
