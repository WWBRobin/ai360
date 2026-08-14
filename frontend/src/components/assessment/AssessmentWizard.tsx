'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  QUESTIONS,
  LEVEL_META,
  SCENE_META,
  EMPTY_ANSWERS,
  MAX_SCENE_SELECT,
  computeLevel,
  computeScenes,
  toggleGoalSelection,
  type AssessmentAnswers,
  type Level,
  type SceneKey,
} from '@/lib/assessment'

type Phase = 'answering' | 'saving' | 'result'

interface AssessmentWizardProps {
  /** 结果出来后是否显示带侧栏布局的外壳由 page 控制，这里只管内容 */
  onPhaseChange?: (phase: Phase) => void
}

/**
 * 能力评测向导：一屏一题 → 结果页。
 * 未登录可做题看结果（提示登录保存）；登录则自动写库
 * （INSERT assessment_results + UPSERT user_profiles）。
 */
export default function AssessmentWizard({ onPhaseChange }: AssessmentWizardProps) {
  const [step, setStep] = useState(0) // 0..4
  const [answers, setAnswers] = useState<AssessmentAnswers>(EMPTY_ANSWERS)
  const [phase, setPhase] = useState<Phase>('answering')
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: import('@supabase/supabase-js').Session | null } }) => {
        setLoggedIn(!!data.session)
      })
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: string, session: import('@supabase/supabase-js').Session | null) => {
        setLoggedIn(!!session)
      },
    )
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    onPhaseChange?.(phase)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const question = QUESTIONS[step]
  const isLast = step === QUESTIONS.length - 1

  const selectedIds: (string | null) | string[] = question.multiple
    ? (answers[question.id] as string[])
    : (answers[question.id] as string | null)

  const canProceed = useMemo(() => {
    const v = answers[question.id]
    return question.multiple ? (v as string[]).length > 0 : !!v
  }, [answers, question])

  const result = useMemo(
    () => (phase === 'result' ? { ...computeLevel(answers), ...computeScenes(answers) } : null),
    [phase, answers],
  )

  // ---------- 交互 ----------

  function handleSelect(optionId: string) {
    setAnswers((prev) => {
      if (question.multiple) {
        if (question.id === 'q5_goals') {
          return { ...prev, q5_goals: toggleGoalSelection(prev.q5_goals, optionId) }
        }
        const cur = prev[question.id] as string[]
        const next = cur.includes(optionId)
          ? cur.filter((x) => x !== optionId)
          : [...cur, optionId]
        return { ...prev, [question.id]: next }
      }
      return { ...prev, [question.id]: optionId }
    })
  }

  async function handleFinish() {
    setPhase('saving')
    const { level, score } = computeLevel(answers)
    const { scenes, primaryScene } = computeScenes(answers)

    if (loggedIn) {
      const supabase = getSupabaseBrowserClient()
      setSaveError(null)
      const insertRes = await supabase.from('assessment_results').insert({
        level,
        scenes,
        primary_scene: primaryScene,
        answers,
      })
      const upsertRes = await supabase.from('user_profiles').upsert(
        {
          level,
          scenes,
          primary_scene: primaryScene,
          assessed_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      if (insertRes.error || upsertRes.error) {
        setSaveError(insertRes.error?.message ?? upsertRes.error?.message ?? '保存失败，请稍后重试')
      }
    }
    setPhase('result')
    void score
  }

  function handleRestart() {
    setAnswers(EMPTY_ANSWERS)
    setStep(0)
    setSaveError(null)
    setPhase('answering')
  }

  // ---------- 渲染 ----------

  if (phase === 'answering') {
    return (
      <div className="w-full max-w-[640px] mx-auto">
        {/* 进度 */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[13px] font-medium text-[var(--fg3)] tabular-nums">
            {step + 1} / {QUESTIONS.length}
          </span>
          <div className="flex-1 flex gap-1.5">
            {QUESTIONS.map((q, i) => (
              <div
                key={q.id}
                className="h-[4px] flex-1 rounded-full transition-colors duration-200"
                style={{ background: i <= step ? 'var(--primary)' : 'var(--bg2)' }}
              />
            ))}
          </div>
        </div>

        {/* 题目 */}
        <div className="mt-8 mb-2">
          <h2 className="text-[22px] font-bold text-[var(--fg)] leading-snug">
            {question.title}
          </h2>
          <p className="text-[13px] text-[var(--fg3)] mt-1.5">{question.hint}</p>
        </div>

        {/* 选项卡片 */}
        <div className="grid gap-2.5 mt-6">
          {question.options.map((opt) => {
            const selected = question.multiple
              ? (selectedIds as string[]).includes(opt.id)
              : selectedIds === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className="text-left px-4 py-3.5 rounded-[10px] border transition-colors duration-150 flex items-start gap-3"
                style={{
                  borderColor: selected ? 'var(--primary)' : 'var(--border)',
                  background: selected ? 'rgba(var(--dim-rgb),0.06)' : 'var(--card)',
                }}
              >
                <span
                  className="shrink-0 mt-0.5 w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center text-[11px] font-bold transition-colors"
                  style={{
                    borderColor: selected ? 'var(--primary)' : 'var(--border)',
                    background: selected ? 'var(--primary)' : 'transparent',
                    color: 'var(--on-primary)',
                  }}
                >
                  {selected ? '✓' : ''}
                </span>
                <span className="text-[14px] leading-relaxed" style={{ color: 'var(--fg)' }}>
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>

        {question.id === 'q5_goals' && answers.q5_goals.length >= MAX_SCENE_SELECT && (
          <p className="text-[12px] text-[var(--fg3)] mt-3">
            最多选 {MAX_SCENE_SELECT} 个，继续点选会替换最早选中的
          </p>
        )}

        {/* 按钮 */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="h-10 px-5 rounded-md text-[13px] font-medium border border-[var(--border)] text-[var(--fg2)] hover:bg-[var(--bg2)] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            上一题
          </button>
          {isLast ? (
            <button
              onClick={handleFinish}
              disabled={!canProceed}
              className="h-10 px-6 rounded-md bg-[var(--primary)] text-[var(--on-primary)] text-[13px] font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              查看结果
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => Math.min(QUESTIONS.length - 1, s + 1))}
              disabled={!canProceed}
              className="h-10 px-6 rounded-md bg-[var(--primary)] text-[var(--on-primary)] text-[13px] font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              下一题
            </button>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'saving') {
    return (
      <div className="w-full max-w-[640px] mx-auto text-center py-20">
        <div className="text-[15px] text-[var(--fg2)]">正在生成你的评测结果…</div>
      </div>
    )
  }

  // ---------- 结果页 ----------
  const level = result!.level as Level
  const meta = LEVEL_META[level]
  const { scenes, primaryScene } = result!

  return (
    <div className="w-full max-w-[640px]">
      <div
        className="rounded-xl border border-[var(--border)] p-8 text-center"
        style={{ background: 'var(--card)' }}
      >
        <p className="text-[13px] text-[var(--fg3)]">你的 AI 能力等级</p>
        <div
          className="text-[52px] font-extrabold leading-none mt-3"
          style={{ color: 'var(--primary)' }}
        >
          {level}
        </div>
        <div className="text-[20px] font-bold text-[var(--fg)] mt-2">{meta.name}</div>
        <p className="text-[14px] text-[var(--fg2)] mt-2.5 leading-relaxed">{meta.desc}</p>

        {scenes.length > 0 && (
          <div className="flex items-center justify-center flex-wrap gap-2 mt-6">
            {scenes.map((s) => (
              <span
                key={s}
                className="text-[12px] px-2.5 py-1 rounded-full"
                style={{
                  background:
                    s === primaryScene ? 'rgba(var(--dim-rgb),0.12)' : 'rgba(var(--dim-rgb),0.06)',
                  color: s === primaryScene ? 'var(--primary)' : 'var(--fg2)',
                  fontWeight: s === primaryScene ? 600 : 400,
                }}
                title={s === primaryScene ? '主场景' : undefined}
              >
                {SCENE_META[s as SceneKey]}
                {s === primaryScene ? ' · 主方向' : ''}
              </span>
            ))}
          </div>
        )}

        {saveError && (
          <p className="text-[13px] mt-5" style={{ color: 'var(--red, #dc2626)' }}>
            结果保存失败：{saveError}（等级已生成，可重新测试再保存）
          </p>
        )}

        {loggedIn ? (
          <p className="text-[12px] text-[var(--fg3)] mt-5">
            ✓ 已保存到你的账号，学习中心将按你的等级推荐内容
          </p>
        ) : (
          <p className="text-[13px] text-[var(--fg2)] mt-5">
            <Link
              href="/login"
              className="font-medium underline underline-offset-2"
              style={{ color: 'var(--primary)' }}
            >
              登录
            </Link>
            保存你的等级，获得个性化学习推荐
          </p>
        )}

        <div className="flex items-center justify-center gap-3 mt-7">
          <Link
            href="/learn"
            className="h-10 px-6 rounded-md bg-[var(--primary)] text-[var(--on-primary)] text-[13px] font-semibold hover:opacity-90 transition inline-flex items-center"
          >
            开始学习路径 →
          </Link>
          <button
            onClick={handleRestart}
            className="h-10 px-5 rounded-md text-[13px] font-medium border border-[var(--border)] text-[var(--fg2)] hover:bg-[var(--bg2)] transition"
          >
            重新测试
          </button>
        </div>
      </div>
    </div>
  )
}
