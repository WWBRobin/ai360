'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Level } from '@/lib/assessment'

export interface UserLevelState {
  /** null = 未登录或未评测 */
  level: Level | null
  /** 是否已登录 */
  loggedIn: boolean
  /** 异步加载是否完成 */
  loaded: boolean
}

/**
 * 读取当前用户等级（user_profiles.level）。
 * 未登录 / 未评测 / 读取失败 → level=null（视为未评测，引导去 /assessment）。
 */
export function useUserLevel(): UserLevelState {
  const [state, setState] = useState<UserLevelState>({ level: null, loggedIn: false, loaded: false })

  useEffect(() => {
    let cancelled = false
    const supabase = getSupabaseBrowserClient()

    supabase.auth.getSession().then(async ({ data }: { data: { session: import('@supabase/supabase-js').Session | null } }) => {
      if (cancelled) return
      if (!data.session) {
        setState({ level: null, loggedIn: false, loaded: true })
        return
      }
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('level')
          .eq('id', data.session.user.id)
          .maybeSingle()
        if (cancelled) return
        const level = (profile?.level as Level | undefined) ?? null
        setState({ level, loggedIn: true, loaded: true })
      } catch {
        if (!cancelled) setState({ level: null, loggedIn: true, loaded: true })
      }
    }).catch(() => {
      if (!cancelled) setState({ level: null, loggedIn: false, loaded: true })
    })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
