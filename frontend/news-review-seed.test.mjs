// 测试脚本：向 content_items 造一条 human_reviewing 测试数据（含 3 个 L 版本 + AI 审核记录）
// 用法：node /tmp/news-review-seed.mjs seed | cleanup
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = readFileSync('/Users/wuwenbing/ai-skill-platform/frontend/.env.local', 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]?.trim()

const url = get('NEXT_PUBLIC_SUPABASE_URL')
const key = get('SUPABASE_SERVICE_ROLE_KEY')
const sb = createClient(url, key, { auth: { persistSession: false } })

const SLUG = 'test-news-review-mvp-23b'
const cmd = process.argv[2] || 'seed'

if (cmd === 'cleanup') {
  const { data } = await sb.from('content_items').select('id').eq('slug', SLUG)
  for (const r of data || []) {
    await sb.from('review_records').delete().eq('content_id', r.id)
    await sb.from('content_versions').delete().eq('content_id', r.id)
    await sb.from('content_items').delete().eq('id', r.id)
  }
  console.log('cleanup done, removed', (data || []).length, 'items')
  process.exit(0)
}

// seed
const { data: item, error: e1 } = await sb
  .from('content_items')
  .insert({
    pipeline_id: 'news',
    content_type: 'news',
    title: '[测试] #23B 审核工作台验收条目',
    slug: SLUG,
    category: 'test',
    source_url: 'https://example.com/test-23b',
    status: 'human_reviewing',
    revision_count: 2,
    ai_confidence_score: 8.5,
    discovered_at: new Date().toISOString(),
  })
  .select('id')
  .single()
if (e1) { console.error('insert item fail:', e1.message); process.exit(1) }
const id = item.id
console.log('content_items id:', id)

const levels = [
  ['beginner', '入门版：一句话看懂 AI Agent', '这是入门（beginner）级别的测试内容。'],
  ['intermediate', '进阶版：AI Agent 工作流拆解', '这是进阶（intermediate）级别的测试内容。'],
  ['advanced', '深度版：多 Agent 系统设计权衡', '这是深度（advanced）级别的测试内容。'],
]
const { error: e2 } = await sb.from('content_versions').insert(
  levels.map(([lv, title, content], i) => ({
    content_id: id,
    pipeline_id: 'news',
    version_type: 'L',
    target_levels: [lv],
    title,
    content,
    version_number: 3,
    meta_title: title,
    meta_description: '测试 meta',
    keywords: ['ai-agent'],
  })),
)
if (e2) { console.error('insert versions fail:', e2.message); process.exit(1) }

const { error: e3 } = await sb.from('review_records').insert({
  content_id: id,
  pipeline_id: 'news',
  reviewer: 'ai',
  action: 'approve',
  revision_round: 2,
  review_report: { summary: 'AI-B 审核通过，建议人工复核' },
  dimension_scores: { 准确性: 9.0, 深度: 8.0, 可读性: 8.5, 实用性: 7.5 },
  overall_score: 8.3,
  passed: true,
})
if (e3) { console.error('insert review fail:', e3.message); process.exit(1) }

console.log('seed OK, id =', id)
