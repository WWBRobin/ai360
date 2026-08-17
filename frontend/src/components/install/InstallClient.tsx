'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  INSTALL_ITEMS,
  INSTALL_SCENARIOS,
  getInstallPlan,
  type InstallItem,
  type VerifyMode,
} from '@/lib/install-seed'
import StepCard, { type CardStatus } from '@/components/install/StepCard'
import { BulbIcon } from '@/components/learn/lamp/LampIcons'

/**
 * 装机单客户端（P0）：场景选择 → 装机单（三态陪跑卡）→ 完成页。
 * SSR 默认渲染「内容创作」装机单（P0 单场景默认选中，保证爬虫/curl 可见内容），
 * mounted 后读 localStorage 断点续装。
 * 断点续装：localStorage `arcdock-install-plan`（匿名）；登录接 DB 后续补。
 * 卡点队列：localStorage `arcdock-install-stuck`（数据飞轮起点）。
 */

const PLAN_KEY = 'arcdock-install-plan'
const STUCK_KEY = 'arcdock-install-stuck'

type ItemStatus = 'not_started' | 'in_progress' | 'done' | 'skipped'

interface ItemProgress {
  status: ItemStatus
  currentStep: number
}

interface PlanState {
  scenario: string
  items: Record<string, ItemProgress>
  order: string[]
  removed: string[]
}

interface StuckEvent {
  tool_slug: string
  step_index: number
  symptom: string
  created_at: string
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key: string, val: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(val))
  } catch {
    // ignore quota
  }
}

function emptyState(): PlanState {
  return { scenario: '', items: {}, order: [], removed: [] }
}

/** 由场景 slug 生成初始装机单状态（全 not_started） */
function makePlanState(scenario: string): PlanState {
  const p = getInstallPlan(scenario)
  const items: Record<string, ItemProgress> = {}
  const order: string[] = []
  for (const it of p.items) {
    items[it.slug] = { status: 'not_started', currentStep: -1 }
    order.push(it.slug)
  }
  return { scenario, items, order, removed: [] }
}

// SSR + 客户端首次渲染统一用的默认装机单（P0 单场景默认选中，保证 SSR 有内容）
const DEFAULT_PLAN = makePlanState('content-creation')

export default function InstallClient() {
  const [mounted, setMounted] = useState(false)
  const [state, setState] = useState<PlanState>(DEFAULT_PLAN)
  const [stuckNotice, setStuckNotice] = useState<{ message: string; suggestion?: string } | null>(null)

  useEffect(() => {
    const saved = readJSON<PlanState | null>(PLAN_KEY, null)
    if (saved && saved.scenario && saved.order && saved.order.length > 0) {
      setState(saved)
    }
    setMounted(true)
  }, [])

  const persist = useCallback((next: PlanState) => {
    setState(next)
    writeJSON(PLAN_KEY, next)
  }, [])

  const plan = useMemo(() => getInstallPlan(state.scenario), [state.scenario])
  const itemBySlug = useMemo(() => {
    const m = new Map<string, InstallItem>()
    for (const it of INSTALL_ITEMS) m.set(it.slug, it)
    return m
  }, [])

  /* ---------- 场景选择（清空装机单后回到这里） ---------- */
  if (!state.scenario || state.order.length === 0) {
    return <ScenarioSelect onPick={(slug) => persist(makePlanState(slug))} />
  }

  /* ---------- 进度 ---------- */
  const doneCount = state.order.filter(
    (s) => state.items[s]?.status === 'done' || state.items[s]?.status === 'skipped'
  ).length
  const total = state.order.length
  const allDone = total > 0 && doneCount === total

  /* ---------- 完成页 ---------- */
  if (allDone) {
    return (
      <InstallComplete
        items={state.order.map((s) => itemBySlug.get(s)).filter(Boolean) as InstallItem[]}
        onReset={() => persist(emptyState())}
      />
    )
  }

  /* ---------- 装机单视图 ---------- */
  function updateItem(slug: string, patch: Partial<ItemProgress>) {
    const cur = state.items[slug]
    if (!cur) return
    persist({ ...state, items: { ...state.items, [slug]: { ...cur, ...patch } } })
  }

  function startItem(slug: string) {
    updateItem(slug, { status: 'in_progress', currentStep: 0 })
  }

  function stepDone(slug: string, stepIndex: number, _verify: VerifyMode) {
    const item = itemBySlug.get(slug)
    const cur = state.items[slug]
    if (!item || !cur) return
    const isLast = stepIndex >= item.steps.length - 1
    if (isLast) {
      updateItem(slug, { status: 'done', currentStep: stepIndex })
    } else {
      updateItem(slug, { status: 'in_progress', currentStep: stepIndex + 1 })
    }
  }

  function skipItem(slug: string) {
    updateItem(slug, { status: 'skipped' })
  }

  function unlitItem(slug: string) {
    updateItem(slug, { status: 'in_progress', currentStep: state.items[slug]?.currentStep ?? 0 })
  }

  function removeItem(slug: string) {
    persist({
      ...state,
      order: state.order.filter((s) => s !== slug),
      removed: [...state.removed, slug],
    })
  }

  function restoreItem(slug: string) {
    persist({
      ...state,
      order: [...state.order, slug],
      removed: state.removed.filter((s) => s !== slug),
    })
  }

  async function stuck(slug: string, stepIndex: number, stepTitle: string) {
    const item = itemBySlug.get(slug)
    if (!item) return
    // 卡点队列（数据飞轮起点）照旧记录
    const queue = readJSON<StuckEvent[]>(STUCK_KEY, [])
    queue.push({
      tool_slug: slug,
      step_index: stepIndex,
      symptom: stepTitle,
      created_at: new Date().toISOString(),
    })
    writeJSON(STUCK_KEY, queue)

    setStuckNotice({ message: `正在诊断「${stepTitle}」…` })
    let final: { message: string; suggestion?: string }
    try {
      const res = await fetch('/api/learn/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pack: 'install',
          tool_name: item.name,
          step_title: stepTitle,
          user_input: '',
        }),
      })
      const j = (await res.json()) as { diagnosis_type?: string; message?: string; suggestion?: string; error?: string }
      if (res.ok && j.diagnosis_type && j.message) {
        final = { message: j.message, suggestion: j.suggestion }
      } else {
        final = {
          message: `卡点已记录：「${stepTitle}」。教练稍后分析，先试试：开梯子重试、看官方文档、或先跳过装下一个。`,
        }
      }
    } catch {
      final = {
        message: `卡点已记录：「${stepTitle}」。教练稍后分析，先试试：开梯子重试、看官方文档、或先跳过装下一个。`,
      }
    }
    setStuckNotice(final)
    setTimeout(() => setStuckNotice(null), 8000)
  }

  return (
    <div className="install-wrap">
      <div className="install-head">
        <div className="install-scene-row">
          {INSTALL_SCENARIOS.map((s) => (
            <span key={s.slug} className={`install-scene-chip${s.slug === plan.scenario ? ' on' : ''}`}>
              {s.label}
            </span>
          ))}
          <button type="button" className="install-rescene" onClick={() => persist(emptyState())}>
            重新选场景
          </button>
        </div>
        <h1 className="install-title">{plan.scenarioLabel}装机单</h1>
        <p className="install-sub">
          一次配齐 {total} 件装备，装完即点亮对应能力。可删可跳过，反悔不惩罚，进度永久保留。
        </p>
      </div>

      {/* 整单进度 + 里程碑 */}
      <div className="install-progress">
        <div className="install-progress-label">
          <span>装机进度</span>
          <span className="num">
            {doneCount} / {total}
          </span>
        </div>
        <div
          className="install-progress-track"
          role="progressbar"
          aria-label="装机进度条"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={doneCount}
        >
          <div
            className="install-progress-fill"
            style={{ width: `${total > 0 ? (doneCount / total) * 100 : 0}%` }}
          />
        </div>
        <p className="install-milestone">{milestone(doneCount, total)}</p>
      </div>

      {stuckNotice && (
        <div className="install-stuck-notice">
          <p className="install-stuck-msg">{stuckNotice.message}</p>
          {stuckNotice.suggestion && <p className="install-stuck-suggest">{stuckNotice.suggestion}</p>}
        </div>
      )}

      {/* 装机项列表 */}
      <div className="install-list">
        {state.order.map((slug) => {
          const item = itemBySlug.get(slug)
          if (!item) return null
          const prog = state.items[slug]
          const status: CardStatus =
            prog?.status === 'done' ? 'done' : prog?.status === 'in_progress' ? 'in_progress' : 'not_started'
          return (
            <div key={slug} className="install-item">
              {prog?.status === 'skipped' ? (
                <div className="install-skipped">
                  <span className="install-skipped-name">{item.name} — 已跳过</span>
                  <button type="button" className="install-restore" onClick={() => restoreItem(slug)}>
                    重新装
                  </button>
                </div>
              ) : (
                <>
                  {status !== 'done' && (
                    <button
                      type="button"
                      className="install-remove"
                      aria-label={`移除 ${item.name}`}
                      onClick={() => removeItem(slug)}
                    >
                      ✕
                    </button>
                  )}
                  <StepCard
                    item={item}
                    status={status}
                    currentStep={prog?.currentStep ?? -1}
                    onStart={() => startItem(slug)}
                    onStepDone={(i, v) => stepDone(slug, i, v)}
                    onSkip={() => skipItem(slug)}
                    onStuck={(i, symptom) => stuck(slug, i, symptom)}
                    onUnlit={() => unlitItem(slug)}
                  />
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* 已移除（可加回，反悔不惩罚） */}
      {state.removed.length > 0 && (
        <div className="install-removed">
          <span className="install-removed-label">已移除：</span>
          {state.removed.map((slug) => {
            const it = itemBySlug.get(slug)
            if (!it) return null
            return (
              <button key={slug} type="button" className="install-restore" onClick={() => restoreItem(slug)}>
                {it.name} 加回
              </button>
            )
          })}
        </div>
      )}

      <button type="button" className="install-reset" onClick={() => persist(emptyState())}>
        清空装机单，重新开始
      </button>
    </div>
  )
}

/* ================= 场景选择 ================= */

function ScenarioSelect({ onPick }: { onPick: (slug: string) => void }) {
  return (
    <div className="install-wrap">
      <div className="install-head">
        <h1 className="install-title">装机陪跑</h1>
        <p className="install-sub">选一个场景，生成你的专属装机单——每一步有人陪，卡住有人管。</p>
      </div>
      <div className="install-scenarios">
        {INSTALL_SCENARIOS.map((s) => (
          <button key={s.slug} type="button" className="install-scenario" onClick={() => onPick(s.slug)}>
            <span className="install-scenario-label">{s.label}</span>
            <span className="install-scenario-desc">{s.desc}</span>
            <span className="install-scenario-cta">开始装机 →</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ================= 完成页 ================= */

function InstallComplete({ items, onReset }: { items: InstallItem[]; onReset: () => void }) {
  const [flash, setFlash] = useState(false)
  useEffect(() => {
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 2600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="install-wrap">
      <div className={`install-complete${flash ? ' flash' : ''}`}>
        <div className="install-complete-icon">
          <BulbIcon lit size={40} />
        </div>
        <h1 className="install-complete-title">装机完成，能力已点亮</h1>
        <p className="install-complete-sub">这是你装好的第一批装备，从它们开始进入 AI 世界。</p>

        {/* 首次产出展示位（产出物是主角，不是抽象灯泡） */}
        <div className="install-outputs">
          <div className="install-outputs-h">你刚得到的第一批产出</div>
          {items.map((it) => (
            <div key={it.slug} className="install-output">
              <span className="install-output-name">{it.name}</span>
              <span className="install-output-desc">{it.firstOutput}</span>
            </div>
          ))}
        </div>

        {/* 学习钩子（只在完成页出现） */}
        <div className="install-hook">
          <span>你的「写文案」能力已点亮，下一盏：生图 →</span>
          <Link href="/learn/star/xhs-note" className="install-hook-link">
            去点亮下一盏
          </Link>
        </div>

        <button type="button" className="install-reset" onClick={onReset}>
          重新装一份
        </button>
      </div>
    </div>
  )
}

/* ================= 里程碑文案 ================= */

function milestone(done: number, total: number): string {
  if (total === 0) return ''
  const r = done / total
  if (done === 0) return '开始装配，第一件装备就位'
  if (r >= 1) return '全部就位，装备成型'
  if (r >= 0.8) return '最后冲刺，快装完了'
  if (r >= 0.5) return '快一半了，装备在成型'
  return '稳步推进，一件一件来'
}
