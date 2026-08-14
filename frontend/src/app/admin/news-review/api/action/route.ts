import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * 审核 action API：通过 / 打回 / 丢弃（支持批量）。
 *
 * 与现有 admin 模式一致：service_role 写入，MVP 无认证靠路由隐藏。
 *
 * POST body:
 * {
 *   "action": "approve" | "reject" | "discard",
 *   "ids": number[],            // content_items.id，批量
 *   "issues"?: [                // 打回必填，可多条
 *     { "issue_type": string, "description": string, "severity": "low"|"medium"|"high" }
 *   ],
 *   "reviewer"?: string         // 人工审核人标识，默认 "human"
 * }
 *
 * 状态机：
 * - approve → content_items.status='published', published_at=now()
 *             + review_records(reviewer='human', action='approve', passed=true)
 * - reject  → status='ai_revising', revision_count+1
 *             + review_records(action='reject', passed=false, revision_instructions=issues,
 *               revision_round=旧 revision_count+1)
 * - discard → status='shelved'
 *             + review_records(action='discard', passed=false)
 */

export const dynamic = 'force-dynamic'

type Issue = {
  issue_type: string
  description: string
  severity: 'low' | 'medium' | 'high'
}

type Body = {
  action: 'approve' | 'reject' | 'discard'
  ids: number[]
  issues?: Issue[]
  reviewer?: string
}

const ALLOWED_ACTIONS = ['approve', 'reject', 'discard'] as const

function validate(body: Body): string | null {
  if (!ALLOWED_ACTIONS.includes(body.action)) {
    return `action 必须是 ${ALLOWED_ACTIONS.join(' / ')}`
  }
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return 'ids 不能为空'
  }
  if (body.ids.length > 50) return '单次最多操作 50 条'
  if (!body.ids.every((n) => Number.isInteger(n) && n > 0)) {
    return 'ids 含非法值'
  }
  if (body.action === 'reject') {
    const issues = body.issues || []
    if (issues.length === 0) return '打回必须填写至少一条修改意见'
    for (const it of issues) {
      if (!it.issue_type || !it.description) {
        return '修改意见需包含 issue_type 和 description'
      }
      if (!['low', 'medium', 'high'].includes(it.severity)) {
        return 'severity 必须是 low / medium / high'
      }
    }
  }
  return null
}

export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON 解析失败' }, { status: 400 })
  }

  const invalid = validate(body)
  if (invalid) {
    return NextResponse.json({ ok: false, error: invalid }, { status: 400 })
  }

  const ids = body.ids as number[]
  const action = body.action
  const now = new Date().toISOString()

  try {
    // 取当前条目（拿 pipeline_id / revision_count）
    const { data: items, error: fetchErr } = await supabaseAdmin
      .from('content_items')
      .select('id, pipeline_id, revision_count')
      .in('id', ids)
    if (fetchErr) throw new Error(fetchErr.message)
    if (!items || items.length === 0) {
      return NextResponse.json({ ok: false, error: '条目不存在' }, { status: 404 })
    }

    // 1. 更新 content_items
    let update: Record<string, unknown>
    if (action === 'approve') {
      update = { status: 'published', published_at: now, updated_at: now }
    } else if (action === 'discard') {
      update = { status: 'shelved', updated_at: now }
    } else {
      update = { status: 'ai_revising', updated_at: now }
    }
    const { error: updateErr } = await supabaseAdmin
      .from('content_items')
      .update(update)
      .in('id', ids)
    if (updateErr) throw new Error(updateErr.message)

    // reject 时 revision_count+1（逐条 read-modify-write，MVP 够用）
    if (action === 'reject') {
      for (const it of items) {
        await supabaseAdmin
          .from('content_items')
          .update({ revision_count: (it.revision_count || 0) + 1 })
          .eq('id', it.id)
      }
    }

    // 2. 写 review_records
    const records = items.map((it) => ({
      content_id: it.id,
      pipeline_id: it.pipeline_id,
      reviewer: 'human',
      action: action === 'approve' ? 'approve' : action === 'reject' ? 'reject' : 'discard',
      revision_round: (it.revision_count || 0) + (action === 'reject' ? 1 : 0),
      passed: action === 'approve',
      human_reviewer: body.reviewer || 'human',
      human_notes: null,
      // 打回时把修改意见存入 revision_instructions（管线 AI 修改阶段读取）
      ...(action === 'reject' ? { revision_instructions: { issues: body.issues } } : {}),
    }))
    const { error: recErr } = await supabaseAdmin.from('review_records').insert(records)
    if (recErr) throw new Error(recErr.message)

    return NextResponse.json({
      ok: true,
      action,
      updated: ids,
      new_status: update.status as string,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
