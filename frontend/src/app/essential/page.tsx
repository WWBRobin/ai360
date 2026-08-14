import type { Metadata } from 'next'
import Link from 'next/link'
import { getSkillsByCategory } from '@/lib/supabase'
import AppSidebar from '@/components/AppSidebar'
import EssentialBoard, { type EssentialCategory } from '@/components/EssentialBoard'
import InstallWizard from '@/components/InstallWizard'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'AI Agent 装机必备',
  description:
    '选择你的 AI Agent，3 分钟配齐核心能力。交互式装机向导，个性化推荐，一键安装命令。',
  keywords: ['AI Agent', '装机必备', 'MCP', '记忆增强', '联网搜索', '装机向导', 'ArcDock'],
  alternates: { canonical: '/essential' },
  openGraph: {
    title: 'AI Agent 装机向导 · ArcDock',
    description: '选择你的 AI Agent，3 分钟配齐核心能力。',
    type: 'website',
  },
}

const TAB_CONFIG: Array<{
  id: string
  label: string
  icon: string
  desc: string
  slugs: string[]
}> = [
  { id: 'memory', label: '记忆知识', icon: '🧠', desc: '让 Agent 拥有长期记忆', slugs: ['memory'] },
  { id: 'search', label: '搜索检索', icon: '🔍', desc: '实时获取互联网信息', slugs: ['search'] },
  { id: 'file', label: '文件处理', icon: '📁', desc: '读写本地文件和文档', slugs: ['file', 'document'] },
  { id: 'connect', label: '外部连接', icon: '🔗', desc: '对接 API 和 SaaS 服务', slugs: ['connect'] },
  { id: 'code', label: '代码开发', icon: '💻', desc: '工程级代码能力', slugs: ['code'] },
]

export default async function EssentialPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const sp = await searchParams
  const isListMode = sp.mode === 'list'

  const allSkills = await getSkillsByCategory('infrastructure')

  const categories: EssentialCategory[] = TAB_CONFIG.map((cfg) => ({
    id: cfg.id,
    label: cfg.label,
    icon: cfg.icon,
    desc: cfg.desc,
    skills: allSkills.filter((s) => s.scenario_slugs.some((slug) => cfg.slugs.includes(slug))),
  })).filter((c) => c.skills.length > 0)

  return (
    <div className="page-wrapper px-4 sm:px-6 lg:px-8 min-h-screen">
      {/* 标题板块 — 横跨全宽，对齐首页 */}
      <div className="pt-10 pb-8">
        <h1 className="text-[28px] font-bold text-[var(--fg)] leading-tight">AI Agent 装机向导</h1>
        <p className="text-[15px] text-[var(--fg3)] mt-1.5">选择你在用的 AI Agent，3 分钟配齐核心能力，附手把手验证</p>
      </div>

      {/* 双栏 */}
      <div className="flex gap-8">
      <AppSidebar />

      <main className="flex-1 min-w-0 relative pb-10">
        {isListMode ? (
          <div>
            <div className="mb-6">
              <h1 className="text-[18px] font-bold text-[var(--fg)] mb-1">装机必备工具</h1>
              <Link href="/essential" className="text-[13px] text-[var(--primary)] hover:underline">← 返回装机向导</Link>
            </div>
            <EssentialBoard categories={categories} />
          </div>
        ) : (
          <InstallWizard categories={categories} />
        )}

        {/* 装机指南 CTA */}
        <section className="content-card mt-8 mb-8 p-6 text-center">
          <h2 className="text-[18px] font-bold text-[var(--fg)] mb-2">📖 装机不知道从何下手？</h2>
          <p className="mx-auto mt-2 max-w-xl text-[13px] text-[var(--fg2)] leading-[1.7]">
            我们准备了一份从零开始的完整装机指南，手把手带你完成第一次配置。
          </p>
          <Link
            href="/guide/install-guide"
            className="btn-primary inline-flex items-center gap-2 mt-4 px-6 py-2.5 text-[14px] font-bold"
          >
            查看完整装机指南 →
          </Link>
        </section>
      </main>
      </div>
    </div>
  )
}
