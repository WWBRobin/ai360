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

// 平台 Tab（与原型对齐 + 首位「全部」）
const PLATFORM_TABS = ['全部', 'Claude', '扣子', 'Hermes', 'GPTs', 'MCP']

/**
 * proto7 装机必备页主体（客户端交互）
 * - 平台 Tab 切换（按 platform_name 过滤分类内工具）
 * - 按功能分类展示工具卡片（content-card）
 * - 每个工具卡片 [安装] btn-primary 按钮
 * - 底部进度条（score-bar 样式）
 */
export default function EssentialBoard({ categories }: { categories: EssentialCategory[] }) {
  const [activeTab, setActiveTab] = useState(0)
  const [installedIds, setInstalledIds] = useState<Set<number>>(() => {
    // 从 localStorage 恢复安装状态
    try {
      const saved = localStorage.getItem('ai360-installed')
      if (saved) return new Set(JSON.parse(saved))
    } catch {}
    return new Set()
  })

  // 全部工具总数（跨分类去重）— 装机进度基准，不随 Tab 变
  const allSkills = useMemo(() => {
    const seen = new Map<number, SkillCard>()
    for (const cat of categories) {
      for (const s of cat.skills) seen.set(s.id, s)
    }
    return [...seen.values()]
  }, [categories])

  // 按平台 Tab 过滤分类（「全部」显示所有）
  const filteredCategories = useMemo(() => {
    const tab = PLATFORM_TABS[activeTab]
    if (tab === '全部') return categories
    const tabLower = tab.toLowerCase()
    return categories
      .map((cat) => ({
        ...cat,
        skills: cat.skills.filter((s) => {
          const pn = (s.platform_name || '').toLowerCase()
          return pn === tabLower || pn.includes(tabLower) || tabLower.includes(pn)
        }),
      }))
      .filter((c) => c.skills.length > 0)
  }, [categories, activeTab])

  const totalTools = allSkills.length

  const handleInstallToggle = (id: number, installed: boolean) => {
    setInstalledIds((prev) => {
      const next = new Set(prev)
      if (installed) next.add(id)
      else next.delete(id)
      // 持久化到 localStorage
      try {
        localStorage.setItem('ai360-installed', JSON.stringify([...next]))
      } catch {}
      return next
    })
  }

  const installedCount = installedIds.size
  const progressPct = totalTools > 0 ? Math.round((installedCount / totalTools) * 100) : 0

  return (
    <div>
      {/* H1 */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-[#2a2724] mb-2.5" style={{ letterSpacing: '-0.5px' }}>
          装机必备
        </h1>
        <p className="text-[15px] text-[#656360] leading-[1.7] max-w-[620px]">
          精选 AI 平台高频必备工具，覆盖记忆、搜索、文件、连接、代码五大核心场景。经过实测验证，开箱即用。
        </p>
      </div>

      {/* 平台 Tab（6 个，首位「全部」） */}
      <div className="flex gap-0 border-b border-[#e3e0dd] mb-7 overflow-x-auto scrollbar-hide">
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

      {/* 按功能分类展示（已按平台 Tab 过滤） */}
      {filteredCategories.length === 0 ? (
        <div className="content-card p-10 text-center text-[13px] text-[#a1a1a1] mb-10">
          「{PLATFORM_TABS[activeTab]}」平台下的必备工具正在评测中，敬请期待。
        </div>
      ) : (
        filteredCategories.map((cat) => (
          <section key={cat.id} className="mb-10">
            <div className="flex items-center gap-2.5 mb-4">
              <h2 className="text-[17px] font-bold text-[#2a2724]">{cat.label}</h2>
              <span className="text-[11px] font-semibold text-[#1c1a18] bg-[rgba(28, 26, 24,0.12)] px-2.5 py-1 rounded-[10px]">
                {cat.skills.length} 个工具
              </span>
            </div>

            {cat.skills.length === 0 ? (
              <div className="content-card p-10 text-center text-[13px] text-[#a1a1a1]">
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
        ))
      )}

      {/* 底部进度条（score-bar 样式） */}
      <div className="content-card p-6 mt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[14px] font-bold text-[#2a2724]">装机进度</span>
          <span className="text-[13px] text-[#656360]">
            已安装 {installedCount} / {totalTools} 个必备工具
          </span>
        </div>
        <div className="h-2.5 bg-[#e3e0dd] rounded-[5px] overflow-hidden">
          <div
            className="score-bar h-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-[12px] text-[#a1a1a1] mt-2.5">
          装完全部工具即可覆盖日常 90% 的 AI 使用场景
        </p>
      </div>
    </div>
  )
}
