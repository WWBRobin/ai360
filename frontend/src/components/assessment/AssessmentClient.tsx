'use client'

import { useState } from 'react'
import AppSidebar from '@/components/AppSidebar'
import AssessmentWizard from '@/components/assessment/AssessmentWizard'

/**
 * 评测页布局切换器：
 * answering/saving → 向导居中全屏（无侧栏）；result → 标准双栏（AppSidebar + main）。
 * AssessmentWizard 始终挂在同一个 DOM 位置（仅外层样式/兄弟节点变化），
 * 避免布局切换时重挂载导致答题状态丢失。
 */
export default function AssessmentClient() {
  const [phase, setPhase] = useState<'answering' | 'saving' | 'result'>('answering')
  const showChrome = phase === 'result'

  return (
    <>
      {showChrome && (
        <div className="pt-10 pb-8">
          <h1 className="text-[28px] font-bold text-[var(--fg)] leading-tight">🎯 能力评测</h1>
          <p className="text-[15px] text-[var(--fg3)] mt-1.5">
            你的等级将用于个性化推荐学习路径，随时可以重新测试。
          </p>
        </div>
      )}
      <div className={showChrome ? 'flex gap-8' : 'flex'}>
        {showChrome && <AppSidebar />}
        <main
          className={
            showChrome
              ? 'flex-1 min-w-0 pb-10'
              : 'w-full pt-16 pb-20 flex justify-center min-h-[70vh]'
          }
        >
          <AssessmentWizard onPhaseChange={setPhase} />
        </main>
      </div>
    </>
  )
}
