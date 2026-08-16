'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Session, PostgrestError } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

/**
 * 灯盏点亮状态 + 选择记录（v3）
 * - 匿名：localStorage（点亮集合 + 选择队列）
 * - 登录：点亮写 learning_progress（path_id=star, unit_id=lamp, completed），
 *         队列经 /api/learn/choice 补报；新选择直报
 */

const LIT_KEY = 'arcdock_lamp_lit'
const QUEUE_KEY = 'arcdock_choice_queue'
const ANON_KEY = 'arcdock_anon_id'

export interface ChoiceEvent {
  lamp_slug: string
  tool_key: string
  tool_name: string
  session_star?: string
  choice_order?: number
  switched_from?: string | null
  created_at?: string
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

export function getAnonId(): string {
  if (typeof window === 'undefined') return ''
  let id = window.localStorage.getItem(ANON_KEY)
  if (!id) {
    id = crypto.randomUUID()
    window.localStorage.setItem(ANON_KEY, id)
  }
  return id
}

export function useLampState(starSlug: string) {
  const [litSet, setLitSet] = useState<Set<string>>(new Set())
  const [queue, setQueue] = useState<ChoiceEvent[]>([])
  const [loggedIn, setLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setLitSet(new Set(readJSON<string[]>(LIT_KEY, [])))
    setQueue(readJSON<ChoiceEvent[]>(QUEUE_KEY, []))
    setMounted(true)
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) =>
      setLoggedIn(Boolean(data.session))
    )
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_e: string, session: Session | null) => setLoggedIn(Boolean(session))
    )
    return () => sub.subscription.unsubscribe()
  }, [])

  /** 登录瞬间补报队列 */
  useEffect(() => {
    if (!mounted || !loggedIn || queue.length === 0) return
    const events = queue
    fetch('/api/learn/choice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events, anon_id: getAnonId() }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.stored || j.queued === false) {
          writeJSON(QUEUE_KEY, [])
          setQueue([])
        }
        // queued:true = 表未建/服务端拒收，队列保留下次再试
      })
      .catch(() => {/* 网络失败保留队列 */})
  }, [mounted, loggedIn, queue.length])

  const persistLit = useCallback((next: Set<string>) => {
    setLitSet(next)
    writeJSON(LIT_KEY, Array.from(next))
  }, [])

  /** 满意 → 点亮（最后盏时由页面调） */
  const lightLamp = useCallback(
    (lampSlug: string) => {
      const next = new Set([...Array.from(litSet), lampSlug])
      persistLit(next)
      // 登录用户同步 learning_progress
      if (loggedIn) {
        getSupabaseBrowserClient()
          .from('learning_progress')
          .upsert(
            { path_id: starSlug, unit_id: lampSlug, status: 'completed', completed_at: new Date().toISOString() },
            { onConflict: 'user_id,path_id,unit_id' }
          )
          .then(({ error }: { error: PostgrestError | null }) => {
            if (error) console.warn('learning_progress upsert:', error.message)
          })
      }
    },
    [litSet, loggedIn, persistLit, starSlug]
  )

  const unlightLamp = useCallback(
    (lampSlug: string) => {
      const next = new Set(Array.from(litSet).filter((s) => s !== lampSlug))
      persistLit(next)
      if (loggedIn) {
        getSupabaseBrowserClient()
          .from('learning_progress')
          .delete()
          .eq('path_id', starSlug)
          .eq('unit_id', lampSlug)
          .then(({ error }: { error: PostgrestError | null }) => {
            if (error) console.warn('learning_progress delete:', error.message)
          })
      }
    },
    [litSet, loggedIn, starSlug]
  )

  /** 记录工具选择（矩阵点击）。previousTool 存在 = 切换 */
  const recordChoice = useCallback(
    (ev: ChoiceEvent) => {
      if (!loggedIn) {
        const next = [...readJSON<ChoiceEvent[]>(QUEUE_KEY, []), { ...ev, created_at: ev.created_at || new Date().toISOString() }]
        writeJSON(QUEUE_KEY, next)
        setQueue(next)
        return
      }
      fetch('/api/learn/choice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ev, anon_id: getAnonId() }),
      }).catch(() => {
        // 失败落本地队列
        const next = [...readJSON<ChoiceEvent[]>(QUEUE_KEY, []), ev]
        writeJSON(QUEUE_KEY, next)
        setQueue(next)
      })
    },
    [loggedIn]
  )

  return {
    mounted,
    litSet,
    litCount: litSet.size,
    isLit: (slug: string) => litSet.has(slug),
    lightLamp,
    unlightLamp,
    recordChoice,
    queueLen: queue.length,
    loggedIn,
  }
}
