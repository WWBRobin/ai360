'use client'

import Link from 'next/link'
import { useLearnProgress } from '@/hooks/useLearnProgress'
import { type LearningStep } from '@/lib/learn-paths'
import StepCard from './StepCard'

interface PathDetailClientProps {
  steps: LearningStep[]
  backHref: string
  backLabel: string
  /** 'tool' | 'scene' */
  kind: 'tool' | 'scene'
}

export default function PathDetailClient({
  steps,
  backHref,
  backLabel,
  kind,
}: PathDetailClientProps) {
  const {
    mounted,
    isCompleted,
    isUnlocked,
    completeStep,
    uncompleteStep,
    pathProgress,
    isPathCompleted,
  } = useLearnProgress()

  const stepIds = steps.map((s) => s.id)

  // SSR-safe 默认值
  const pct = mounted ? pathProgress(stepIds) : 0
  const allDone = mounted ? isPathCompleted(stepIds) : false

  // 找到当前应该学的步骤（第一个未完成的已解锁步骤）
  const currentIdx = steps.findIndex(
    (_, i) => !isCompleted(stepIds[i])
  )

  return (
    <main className="flex-1 min-w-0 pb-10">
        {/* 进度概览 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-[300px]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] text-[var(--fg3)]">学习进度</span>
              <span className="text-[12px] font-medium text-[var(--fg)] tabular-nums">{pct}%</span>
            </div>
            <div className="h-[8px] rounded-full overflow-hidden" style={{ background: 'var(--bg2)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: allDone ? 'var(--green)' : 'var(--primary)',
                }}
              />
            </div>
          </div>
          {allDone && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold"
              style={{ background: 'var(--green-bg)', color: 'var(--green)' }}
            >
              🏅 路径已完成
            </div>
          )}
        </div>

        {/* 闯关提示 */}
        {!allDone && (
          <div
            className="mb-6 p-3.5 rounded-[10px] text-[13px] flex items-center gap-2"
            style={{ background: 'rgba(var(--dim-rgb),0.06)', color: 'var(--fg2)' }}
          >
            <span className="text-[15px]">💡</span>
            <span>闯关模式：完成当前步骤后，下一步自动解锁。</span>
          </div>
        )}

        {/* 步骤列表 */}
        <div className="space-y-4">
          {steps.map((step, idx) => {
            const unlocked = mounted ? isUnlocked(step.id, stepIds) : idx === 0
            const done = mounted ? isCompleted(step.id) : false
            const isCurrent = !done && unlocked && idx === currentIdx

            return (
              <StepCard
                key={step.id}
                step={step}
                index={idx}
                isUnlocked={unlocked}
                isCompleted={done}
                isCurrent={Boolean(isCurrent)}
                onComplete={() => completeStep(step.id)}
                onUncomplete={() => uncompleteStep(step.id)}
              />
            )
          })}
        </div>

        {/* 完成徽章区 */}
        {allDone && (
          <div
            className="mt-8 p-6 rounded-[12px] text-center"
            style={{ border: '1px solid var(--green)', background: 'var(--green-bg)' }}
          >
            <div className="text-[40px] mb-2">🏅</div>
            <h3 className="text-[18px] font-bold text-[var(--green)] mb-1">恭喜！路径已完成</h3>
            <p className="text-[13px] text-[var(--fg2)] mb-4">
              你已完成该路径全部 {steps.length} 个步骤。
            </p>
            <Link
              href="/learn"
              className="inline-block text-[14px] px-5 py-2 rounded-[8px] font-medium transition"
              style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
            >
              探索更多路径 →
            </Link>
          </div>
        )}

        {/* 底部导航 */}
        <div className="mt-10 pt-6 border-t border-[var(--border)] flex items-center justify-between">
          <Link
            href={backHref}
            className="text-[13px] text-[var(--fg2)] hover:text-[var(--primary)] transition"
          >
            ← {backLabel}
          </Link>
          <Link
            href="/learn"
            className="text-[13px] text-[var(--fg2)] hover:text-[var(--primary)] transition"
          >
            返回学习中心 →
          </Link>
        </div>
    </main>
  )
}
