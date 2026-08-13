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
      ? 'border-[#FF8C00] bg-[rgba(255,140,0,0.04)]'
      : isUnlocked
        ? 'border-[#F0F0F0] bg-white hover:border-[#E5E7EB]'
        : 'border-[#F0F0F0] bg-[#FAFAFA] opacity-60'

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
                ? '#FF8C00'
                : '#F3F4F6',
            color: isCompleted || isCurrent ? '#FFFFFF' : '#9CA3AF',
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
                color: isCompleted ? '#059669' : isUnlocked ? '#1F2937' : '#9CA3AF',
              }}
            >
              {step.title}
            </h3>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{
                background: isUnlocked ? 'rgba(255,140,0,0.10)' : '#F3F4F6',
                color: isUnlocked ? '#FF8C00' : '#9CA3AF',
              }}
            >
              {diff.icon} {diff.label}
            </span>
          </div>

          {/* 描述 */}
          <p
            className="text-[13px] mb-3 leading-relaxed"
            style={{ color: isUnlocked ? '#4B5563' : '#9CA3AF' }}
          >
            {step.description}
          </p>

          {/* 底部信息行 */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 text-[12px]" style={{ color: '#9CA3AF' }}>
              <span className="flex items-center gap-1">
                <span>⏱</span> {step.estimatedTime}
              </span>
              {step.skillHref && isUnlocked && (
                <Link
                  href={step.skillHref}
                  className="hover:text-[#FF8C00] transition font-medium"
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
                    ? { border: '1px solid #D1D5DB', color: '#6B7280', background: 'transparent' }
                    : { background: '#FF8C00', color: '#FFFFFF' }
                }
                onMouseEnter={(e) => {
                  if (!isCompleted) e.currentTarget.style.background = '#E67300'
                }}
                onMouseLeave={(e) => {
                  if (!isCompleted) e.currentTarget.style.background = '#FF8C00'
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
