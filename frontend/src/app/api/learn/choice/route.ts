import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/learn/choice — 工具选择埋点（v3 数据底座）
 *
 * body: { lamp_slug, tool_key, tool_name, session_star?, choice_order?, switched_from?, anon_id? }
 * - 登录用户：service_role 直写 learning_choices（表可能还没建，错误静默降级 202）
 * - 匿名用户：前端 localStorage 队列，本端点只在"登录补报"时批量接收（events 数组）
 *
 * 注意：learning_choices 表在 04-learning-v3.sql 草案里，主线执行前插入会失败 →
 * 返回 202 { queued: true }，前端把事件留在本地，不重试风暴。
 */

interface ChoiceEvent {
  lamp_slug: string
  tool_key: string
  tool_name: string
  session_star?: string
  choice_order?: number
  switched_from?: string | null
  anon_id?: string | null
  created_at?: string
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: Request) {
  let body: (ChoiceEvent & { events?: ChoiceEvent[] }) | null = null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const events: ChoiceEvent[] = body?.events?.length
    ? body.events
    : body?.lamp_slug && body?.tool_key
      ? [body as ChoiceEvent]
      : []

  if (!events.length || events.some((e) => !e.lamp_slug || !e.tool_key || !e.tool_name)) {
    return NextResponse.json({ error: 'lamp_slug/tool_key/tool_name required' }, { status: 400 })
  }

  // 登录态（有 session 才落库；匿名事件本来就由前端排队，不打这个端点）
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // 匿名直打（未走前端队列的兜底）：不落库，前端应继续本地排队
    return NextResponse.json({ queued: true, stored: false, reason: 'anonymous' }, { status: 202 })
  }

  const admin = adminClient()
  const rows = events.map((e) => ({
    user_id: user.id,
    anon_id: e.anon_id ?? null,
    lamp_slug: e.lamp_slug,
    tool_key: e.tool_key,
    tool_name: e.tool_name,
    session_star: e.session_star ?? 'xhs-note',
    choice_order: e.choice_order ?? 1,
    switched_from: e.switched_from ?? null,
    created_at: e.created_at || new Date().toISOString(),
  }))

  const { error } = await admin.from('learning_choices').insert(rows)
  if (error) {
    // 表未建（42P01）/RLS 等：不炸前端，标记 queued，登录后队列还在
    console.error('learning_choices insert error:', error.message)
    return NextResponse.json({ queued: true, stored: false, reason: error.message }, { status: 202 })
  }

  return NextResponse.json({ stored: true, count: rows.length })
}
