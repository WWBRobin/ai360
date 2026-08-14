'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LEVEL_FILTER_STORAGE_KEY } from '@/lib/levels'
import { useUserLevel } from '@/hooks/useUserLevel'

/**
 * 智能筛选开关（首页筛选区）
 * - 未登录 / 未评测：开关置灰，hover 提示"先完成 30 秒能力评测"，点击跳 /assessment
 * - 已评测：可开关，状态持久化 localStorage（arcdock-level-filter）
 */
export default function LevelFilterSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange: (next: boolean) => void
}) {
  const { level, loggedIn, loaded } = useUserLevel()
  const canUse = loaded && !!level

  const handleClick = () => {
    if (!canUse) {
      // 未评测 → 跳评测页（用 Link 行为由外层处理也行，这里直接 location 跳转）
      window.location.href = '/assessment'
      return
    }
    const next = !enabled
    onChange(next)
    try {
      localStorage.setItem(LEVEL_FILTER_STORAGE_KEY, next ? 'on' : 'off')
    } catch {}
  }

  // 已评测但 localStorage 尚未初始化时同步持久化
  useEffect(() => {
    if (canUse) {
      try {
        if (localStorage.getItem(LEVEL_FILTER_STORAGE_KEY) === null) {
          localStorage.setItem(LEVEL_FILTER_STORAGE_KEY, enabled ? 'on' : 'off')
        }
      } catch {}
    }
  }, [canUse, enabled])

  const title = canUse
    ? enabled
      ? '已按你的等级智能排序，点击关闭'
      : '开启后按你的等级推荐适合的工具'
    : '先完成 30 秒能力评测'

  return (
    <button
      onClick={handleClick}
      title={title}
      aria-pressed={canUse ? enabled : false}
      aria-label="按我的等级筛选"
      data-level-filter={canUse ? (enabled ? 'on' : 'off') : 'locked'}
      className={`flex items-center gap-2 text-[13px] px-3 py-1.5 rounded-full border transition-colors select-none ${
        canUse
          ? enabled
            ? 'text-[var(--primary)] border-[var(--primary)] bg-[rgba(var(--dim-rgb),0.08)]'
            : 'text-[var(--fg2)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
          : 'text-[var(--fg3)] border-[var(--border)] cursor-not-allowed'
      }`}
    >
      <span className="text-[13px]">🎯</span>
      <span className="font-medium">适合我的</span>
      {/* 开关轨道 */}
      <span
        className={`relative inline-block w-[30px] h-[16px] rounded-full transition-colors ${
          canUse && enabled ? 'bg-[var(--primary)]' : 'bg-[var(--bg2)]'
        }`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-[2px] w-[12px] h-[12px] rounded-full bg-white transition-all ${
            canUse && enabled ? 'left-[16px]' : 'left-[2px]'
          }`}
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }}
        />
      </span>
      {canUse && level && (
        <span className="text-[11px] text-[var(--fg3)]">我的等级 {level}</span>
      )}
      {!canUse && loaded && (
        <Link
          href="/assessment"
          onClick={(e) => e.stopPropagation()}
          className="text-[11px] text-[var(--primary)] hover:underline"
        >
          去评测 →
        </Link>
      )}
    </button>
  )
}
