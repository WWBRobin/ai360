'use client'

import Link from 'next/link'
import { DIFFICULTY_META, type Difficulty, type LearningStep } from '@/lib/learn-paths'

/**
 * 学习步骤卡片 — 闯关式
 *
 * 状态：
 * - locked: 🔒 灰色，不可点击
 * - unlocked: 可学习，橙色边框
 * - completed: ✓ 绿色已完成
 * - current: 当前可学的步骤（高亮）
 */
interface StepCardProps {
  step: LearningStep
  index: number
  isUnlocked: boolean
  isCompleted: boolean
  isCurrent: boolean
  onComplete: () => void
  onUncomplete: () => void
}

export default function StepCard({
  step,
  index,
  isUnlocked,
  isCompleted,
  isCurrent,
  onComplete,
  onUncomplete,
}: StepCardProps) {
  const diff = DIFFICULTY_META[step.difficulty as Difficulty]

  const stateClass = isCompleted
    ? 'border-[#10B981] bg-[#F0FDF4]'
    : isCurrent
      ? 'border-[#1c1a18] bg-[rgba(28, 26, 24,0.04)]'
      : isUnlocked
        ? 'border-[#e3e0dd] bg-white hover:border-[#e3e0dd]'
        : 'border-[#e3e0dd] bg-[#f4f1ed] opacity-60'

  return (
    <div
      className={`relative rounded-[12px] border p-5 transition-all duration-200 ${stateClass}`}
    >
      {/* 步骤编号 */}
      <div className="flex items-start gap-4">
        <div
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-bold"
          style={{
            background: isCompleted
              ? '#10B981'
              : isCurrent
                ? '#1c1a18'
                : '#f0ede9',
            color: isCompleted || isCurrent ? '#FFFFFF' : '#a1a1a1',
          }}
        >
          {isCompleted ? '✓' : isUnlocked ? index + 1 : '🔒'}
        </div>

        <div className="flex-1 min-w-0">
          {/* 标题行 */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3
              className="text-[15px] font-semibold"
              style={{
                color: isCompleted ? '#059669' : isUnlocked ? '#2a2724' : '#a1a1a1',
              }}
            >
              {step.title}
            </h3>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{
                background: isUnlocked ? 'rgba(28, 26, 24,0.10)' : '#f0ede9',
                color: isUnlocked ? '#1c1a18' : '#a1a1a1',
              }}
            >
              {diff.icon} {diff.label}
            </span>
          </div>

          {/* 描述 */}
          <p
            className="text-[13px] mb-3 leading-relaxed"
            style={{ color: isUnlocked ? '#656360' : '#a1a1a1' }}
          >
            {step.description}
          </p>

          {/* 底部信息行 */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 text-[12px]" style={{ color: '#a1a1a1' }}>
              <span className="flex items-center gap-1">
                <span>⏱</span> {step.estimatedTime}
              </span>
              {step.skillHref && isUnlocked && (
                <Link
                  href={step.skillHref}
                  className="hover:text-[#1c1a18] transition font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  查看教程 →
                </Link>
              )}
            </div>

            {/* 操作按钮 */}
            {isUnlocked && (
              <button
                onClick={isCompleted ? onUncomplete : onComplete}
                className="text-[13px] px-3.5 py-1.5 rounded-[6px] font-medium transition"
                style={
                  isCompleted
                    ? { border: '1px solid #c4c1bd', color: '#656360', background: 'transparent' }
                    : { background: '#1c1a18', color: '#FFFFFF' }
                }
                onMouseEnter={(e) => {
                  if (!isCompleted) e.currentTarget.style.background = '#000000'
                }}
                onMouseLeave={(e) => {
                  if (!isCompleted) e.currentTarget.style.background = '#1c1a18'
                }}
              >
                {isCompleted ? '↩ 重新学习' : '✓ 标记完成'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
