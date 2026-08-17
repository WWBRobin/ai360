import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getInstallPlan, INSTALL_SCENARIOS } from '@/lib/install-seed'

/**
 * /api/install/plan —— 装机单接口（P0）
 *
 * GET  ?scenario=content-creation  返回 seed 装机单（5 工具 install_steps，静态）
 * POST  记录装机状态（install_records 表）
 *   body: { skill_id?, skill_slug, install_plan_id?, status, anon_id?, stuck_log? }
 *   - 登录用户：service_role 直写 install_records（表在 05-equipment.sql 草案，主线未执行 → 降级 202）
 *   - 匿名用户：前端 localStorage 已持久化，本端点只在登录补报时用
 *   降级写法照抄 /api/learn/choice（表未建返回 202 queued，不炸前端）
 */

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const scenario = searchParams.get('scenario') || INSTALL_SCENARIOS[0].slug
  const plan = getInstallPlan(scenario)
  return NextResponse.json({ plan })
}

interface InstallRecordBody {
  skill_id?: number | null
  skill_slug?: string
  install_plan_id?: string | null
  status?: string
  anon_id?: string | null
  stuck_log?: unknown[]
}

export async function POST(req: Request) {
  let body: InstallRecordBody | null = null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const status = body?.status
  const valid = ['not_started', 'in_progress', 'stuck', 'done', 'skipped']
  if (!status || !valid.includes(status)) {
    return NextResponse.json({ error: 'status required (not_started|in_progress|stuck|done|skipped)' }, { status: 400 })
  }

  // 登录态（有 session 才落库；匿名由前端 localStorage 持久化，不依赖此端点）
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ queued: true, stored: false, reason: 'anonymous' }, { status: 202 })
  }

  const admin = adminClient()
  const row = {
    user_id: user.id,
    anon_id: body?.anon_id ?? null,
    // seed 阶段无 DB skill_id（主线映射后补），skill_slug 供后续回填
    skill_id: body?.skill_id ?? null,
    install_plan_id: body?.install_plan_id ?? null,
    status,
    stuck_log: body?.stuck_log ?? [],
    started_at: status === 'in_progress' ? new Date().toISOString() : null,
    completed_at: status === 'done' ? new Date().toISOString() : null,
  }

  const { error } = await admin.from('install_records').insert(row)
  if (error) {
    // 表未建（42P01）/RLS 等：不炸前端，标记 queued
    console.error('install_records insert error:', error.message)
    return NextResponse.json({ queued: true, stored: false, reason: error.message }, { status: 202 })
  }

  return NextResponse.json({ stored: true, skill_slug: body?.skill_slug ?? null })
}
