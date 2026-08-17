'use client'

import { useState } from 'react'
import type { InstallItem, InstallStep, StepPitfall, VerifyMode } from '@/lib/install-seed'
import { BulbIcon } from '@/components/learn/lamp/LampIcons'

/**
 * StepCard —— 三态陪跑卡（装机/管家/体检/学习共用步骤卡片原语）
 * 对齐 StepCard 组件规范（OB 10-设计/StepCard组件规范.md）。
 *
 * 受控模式：状态机由父组件（InstallClient）管理并持久化（断点续装），
 * 本组件只负责三态渲染 + 触发回调。
 *
 * 三态：
 *   not_started → 折叠（工具名 + 推荐理由 + 开始安装）
 *   in_progress → 展开（步骤逐步展开，当前步高亮 + 卡点折叠区）
 *   done        → 点亮（整卡琥珀微光 + 反悔入口）
 */

export type CardStatus = 'not_started' | 'in_progress' | 'done'

const VERIFY_HINT: Record<VerifyMode, string> = {
  manual: '完成后勾选确认',
  visual: '完成后对照预期结果确认',
  auto: '按示例调通后确认（API 返回正常即点亮）',
}

interface StepCardProps {
  item: InstallItem
  status: CardStatus
  currentStep: number // -1 = 未开始；in_progress 时为当前进行中步骤下标
  onStart: () => void
  onStepDone: (stepIndex: number, verify: VerifyMode) => void
  onSkip: (stepIndex: number) => void
  onStuck: (stepIndex: number, symptom: string) => void
  onUnlit: () => void
}

export default function StepCard({
  item,
  status,
  currentStep,
  onStart,
  onStepDone,
  onSkip,
  onStuck,
  onUnlit,
}: StepCardProps) {
  const [openPitfall, setOpenPitfall] = useState<number | null>(null)

  /* ---------- 折叠态（未开始） ---------- */
  if (status === 'not_started') {
    return (
      <section className="step-card" role="group" aria-label={`装机步骤：${item.name}`}>
        <div className="step-head">
          <span className="step-logo" aria-hidden>
            {item.name[0]}
          </span>
          <div className="step-head-main">
            <div className="step-head-title">
              <span className="step-name">{item.name}</span>
              <span className="step-score">★ {item.score.toFixed(1)}</span>
              <span className="step-level">适合 {item.level}</span>
              <span className="step-minutes">~{item.minutes} 分钟</span>
            </div>
            <p className="step-why">为什么装：{item.why}</p>
          </div>
          <button type="button" className="step-start" onClick={onStart}>
            开始安装 →
          </button>
        </div>
      </section>
    )
  }

  /* ---------- 展开态 / 点亮态 ---------- */
  const done = status === 'done'
  const stepStates = item.steps.map((_, i) =>
    done ? 'lit' : i < currentStep ? 'lit' : i === currentStep ? 'executing' : 'locked'
  ) as ('locked' | 'executing' | 'lit')[]

  return (
    <section className={`step-card${done ? ' lit' : ''}`} role="group" aria-label={`装机步骤：${item.name}`}>
      <div className="step-head">
        <span className="step-logo" aria-hidden>
          {item.name[0]}
        </span>
        <div className="step-head-main">
          <div className="step-head-title">
            <span className="step-name">{item.name}</span>
            <span className="step-score">★ {item.score.toFixed(1)}</span>
            <span className="step-level">适合 {item.level}</span>
          </div>
          <p className="step-why">为什么装：{item.why}</p>
        </div>
        {done && (
          <button type="button" className="step-unlit" onClick={onUnlit}>
            ✓ 已点亮（点击取消）
          </button>
        )}
      </div>

      <ol className="step-list">
        {item.steps.map((s, i) => {
          const st = stepStates[i]
          const isLit = st === 'lit'
          const isCurrent = st === 'executing'
          return (
            <li key={i} className={`step-item${isLit ? ' lit' : ''}`} aria-current={isCurrent ? 'step' : undefined}>
              <span className="step-idx">{isLit ? '✓' : i + 1}</span>
              <div className="step-main">
                <div className="step-title">
                  {isLit && <BulbIcon lit size={16} />}
                  <span>{s.title}</span>
                  <span className="step-minutes">~{s.minutes}min</span>
                  {isLit && <span className="sr-only">已点亮</span>}
                </div>

                {isCurrent && (
                  <div className="step-body">
                    <div className="step-guide">{s.guide}</div>
                    <div className="step-expect">预期：{s.expect}</div>

                    {s.pitfalls && s.pitfalls.length > 0 && (
                      <div className="step-pitfalls">
                        <button
                          type="button"
                          className="step-pitfall-toggle"
                          aria-expanded={openPitfall === i}
                          aria-controls={`pitfall-${item.slug}-${i}`}
                          onClick={() => setOpenPitfall(openPitfall === i ? null : i)}
                        >
                          {openPitfall === i ? '▾ 收起卡点' : '卡住了？'}
                        </button>
                        {openPitfall === i && (
                          <div id={`pitfall-${item.slug}-${i}`} role="region" className="step-pitfall-list">
                            <PitfallList pitfalls={s.pitfalls!} />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="step-actions">
                      <button type="button" className="step-done" onClick={() => onStepDone(i, s.verify)}>
                        我做到了 ✓
                      </button>
                      <span className="step-verify-hint">{VERIFY_HINT[s.verify]}</span>
                      <button type="button" className="step-skip" onClick={() => onSkip(i)}>
                        先跳过
                      </button>
                    </div>

                    <button type="button" className="step-stuck-fallback" onClick={() => onStuck(i, s.title)}>
                      仍卡住？反馈给诊断教练 →
                    </button>
                  </div>
                )}

                {isLit && !isCurrent && (
                  <div className="step-done-note">{s.title} 已完成</div>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      <span aria-live="polite" className="sr-only">
        {done ? `${item.name} 已点亮` : `${item.name} 进行中`}
      </span>
    </section>
  )
}

function PitfallList({ pitfalls }: { pitfalls: StepPitfall[] }) {
  return (
    <div className="step-pitfall-items">
      {pitfalls.map((p, j) => (
        <details key={j} className="step-pitfall-item">
          <summary>症状：{p.symptom}</summary>
          <p className="step-pitfall-cause">原因：{p.cause}</p>
          <p className="step-pitfall-fix">解法：{p.fix}</p>
        </details>
      ))}
    </div>
  )
}
