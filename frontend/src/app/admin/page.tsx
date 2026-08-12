import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import DeleteButton from '@/components/admin/DeleteButton'

// 禁止收录到搜索引擎
export const metadata = {
  title: '管理后台',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type AdminRow = {
  id: number
  name: string
  slug: string
  category: string
  status: string
  trial_enabled: boolean
  platforms: unknown
  evaluations: Array<{ overall_score: number | null; evaluated_at: string | null }>
}

function platformName(p: unknown): string {
  if (!p) return '—'
  if (Array.isArray(p)) return p[0]?.name || '—'
  return (p as { name?: string })?.name || '—'
}

export default async function AdminHomePage() {
  // 取全部 Skill（含 draft/archived）+ 平台 + 最新评测
  const { data: skills } = await supabase
    .from('skills')
    .select(
      `
      id, name, slug, category, status, trial_enabled,
      platforms (name),
      evaluations (overall_score, evaluated_at)
    `,
    )
    .order('id', { ascending: false })

  const { count: evalCount } = await supabase
    .from('evaluations')
    .select('id', { count: 'exact', head: true })

  const { count: platformCount } = await supabase
    .from('platforms')
    .select('id', { count: 'exact', head: true })

  const list = (skills || []) as unknown as AdminRow[]

  const stats = {
    total: list.length,
    published: list.filter((s) => s.status === 'published').length,
    draft: list.filter((s) => s.status === 'draft').length,
    evaluated: list.filter((s) => (s.evaluations || []).length > 0).length,
    evalCount: evalCount || 0,
    platforms: platformCount || 0,
  }

  const CATEGORY_LABEL: Record<string, string> = {
    infrastructure: '基础设施',
    scene: '场景应用',
    efficiency: '效率工具',
  }
  const STATUS_COLOR: Record<string, string> = {
    published: 'bg-green-100 text-green-700',
    draft: 'bg-amber-100 text-amber-700',
    archived: 'bg-gray-200 text-gray-600',
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">管理后台</h1>
          <p className="text-sm text-gray-500 mt-1">
            Skill CRUD + 评测数据编辑 · MVP（无认证，靠路由隐藏）
          </p>
        </div>
        <Link
          href="/admin/skill/new"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          + 添加 Skill
        </Link>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        <Stat label="总数" value={stats.total} />
        <Stat label="已发布" value={stats.published} />
        <Stat label="草稿" value={stats.draft} />
        <Stat label="已评测" value={stats.evaluated} />
        <Stat label="评测记录" value={stats.evalCount} />
        <Stat label="平台数" value={stats.platforms} />
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-3 font-medium">名称</th>
              <th className="text-left px-4 py-3 font-medium">平台</th>
              <th className="text-left px-4 py-3 font-medium">分类</th>
              <th className="text-left px-4 py-3 font-medium">状态</th>
              <th className="text-left px-4 py-3 font-medium">综合分</th>
              <th className="text-left px-4 py-3 font-medium">试用</th>
              <th className="text-right px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  暂无数据。点右上角「添加 Skill」开始。
                </td>
              </tr>
            )}
            {list.map((s) => {
              const ev = (s.evaluations || [])[0]
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{platformName(s.platforms)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {CATEGORY_LABEL[s.category] || s.category}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${STATUS_COLOR[s.status] || ''}`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {ev?.overall_score ? `⭐ ${ev.overall_score}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.trial_enabled ? '✅' : '—'}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/skill/${s.id}/edit`}
                      className="text-xs text-indigo-600 hover:underline mr-3"
                    >
                      编辑
                    </Link>
                    <Link
                      href={`/admin/skill/${s.id}/evaluation`}
                      className="text-xs text-emerald-600 hover:underline mr-3"
                    >
                      评测
                    </Link>
                    <DeleteButton id={s.id} name={s.name} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  )
}
