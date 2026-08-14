'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * 学习进度 Hook — localStorage 持久化
 *
 * 闯关式逻辑：
 * - 每条路径独立追踪已完成的步骤
 * - 前一步未完成不能解锁下一步
 * - 完成全部步骤获得"路径完成"徽章
 */

const STORAGE_KEY = 'arcdock-learn-progress'

// stepId -> completed boolean
type ProgressMap = Record<string, boolean>

function loadProgress(): ProgressMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ProgressMap) : {}
  } catch {
    return {}
  }
}

function saveProgress(map: ProgressMap) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore quota errors
  }
}

export function useLearnProgress() {
  const [progress, setProgress] = useState<ProgressMap>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setProgress(loadProgress())
    setMounted(true)
  }, [])

  const update = useCallback((next: ProgressMap) => {
    setProgress(next)
    saveProgress(next)
  }, [])

  /** 标记步骤完成 */
  const completeStep = useCallback(
    (stepId: string) => {
      update({ ...loadProgress(), [stepId]: true })
    },
    [update]
  )

  /** 取消标记（用于回退） */
  const uncompleteStep = useCallback(
    (stepId: string) => {
      const next = { ...loadProgress() }
      delete next[stepId]
      update(next)
    },
    [update]
  )

  /** 判断步骤是否已完成 */
  const isCompleted = useCallback(
    (stepId: string) => Boolean(progress[stepId]),
    [progress]
  )

  /** 判断步骤是否已解锁（第一步始终解锁，其余需前一步完成） */
  const isUnlocked = useCallback(
    (stepId: string, allStepIds: string[]) => {
      const idx = allStepIds.indexOf(stepId)
      if (idx <= 0) return true
      const prevId = allStepIds[idx - 1]
      return Boolean(progress[prevId])
    },
    [progress]
  )

  /** 计算路径完成率 0~100 */
  const pathProgress = useCallback(
    (allStepIds: string[]) => {
      if (allStepIds.length === 0) return 0
      const done = allStepIds.filter((id) => progress[id]).length
      return Math.round((done / allStepIds.length) * 100)
    },
    [progress]
  )

  /** 路径是否全部完成（获得徽章） */
  const isPathCompleted = useCallback(
    (allStepIds: string[]) => {
      return allStepIds.length > 0 && allStepIds.every((id) => progress[id])
    },
    [progress]
  )

  return {
    mounted,
    isCompleted,
    isUnlocked,
    completeStep,
    uncompleteStep,
    pathProgress,
    isPathCompleted,
  }
}
