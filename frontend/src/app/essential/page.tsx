import type { Metadata } from 'next'
import Link from 'next/link'
import { getSkillsByCategory } from '@/lib/supabase'
import type { SkillCard } from '@/types'
import EssentialTabs, { type EssentialTab } from '@/components/EssentialTabs'

// ISR：装机必备页每 1 小时增量静态重新生成
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'AI Agent 装机必备',
  description:
    '刚接触 AI Agent？先装这些核心工具，一步到位。记忆增强、联网搜索、文件与代码、工具连接四大分类精选，附上手难度、稳定性与免费额度。',
  keywords: ['AI Agent', '装机必备', 'MCP', '记忆增强', '联网搜索', 'AI 工具推荐', 'AI360'],
  alternates: {
    canonical: '/essential',
  },
  openGraph: {
    title: 'AI Agent 装机必备 · AI360',
    description: '刚接触 AI Agent？先装这些核心工具，一步到位。',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Agent 装机必备 · AI360',
    description: '刚接触 AI Agent？先装这些核心工具，一步到位。',
  },
}

// 装机分类 Tab 配置：id 唯一，slugs 用于匹配 scenario_slug
const TAB_CONFIG: Array<{
  id: string
  label: string
  icon: string
  desc: string
  slugs: string[]
}> = [
  {
    id: 'memory',
    label: '记忆增强',
    icon: '🧠',
    desc: '让 Agent 拥有跨会话的长期记忆，记住你的偏好、项目与上下文，越用越懂你。',
    slugs: ['memory'],
  },
  {
    id: 'search',
    label: '联网搜索',
    icon: '🔍',
    desc: '实时获取互联网信息，突破模型知识截止日期限制，回答更准确、更新。',
    slugs: ['search'],
  },
  {
    id: 'file',
    label: '文件与代码',
    icon: '📁',
    desc: '读写本地文件、执行代码——这是 Agent 真正能「动手干活」的双手。',
    slugs: ['file', 'code'],
  },
  {
    id: 'connect',
    label: '工具连接',
    icon: '🔗',
    desc: '对接数据库、API 与各类 SaaS 服务，把 Agent 接入你已有的工作流。',
    slugs: ['connect'],
  },
]

// 选购建议：根据使用场景推荐组合（编辑精选，非自动生成）
interface Recommendation {
  scenario: string
  icon: string
  combo: string[]
  note: string
}

const RECOMMENDATIONS: Recommendation[] = [
  {
    scenario: '你在用 Claude Code / Cursor 这类编程 Agent？',
    icon: '💻',
    combo: ['记忆增强', '联网搜索', '文件与代码'],
    note: '编程场景最核心的三件套：长期记忆记住项目上下文，联网搜索查最新文档，文件读写让 Agent 直接改代码。',
  },
  {
    scenario: '你在用 ChatGPT / Claude 网页版聊天？',
    icon: '💬',
    combo: ['联网搜索', '记忆增强'],
    note: '网页版自带文件能力，补上「联网搜索」和「记忆增强」两项，就能突破知识截止与上下文遗忘两大短板。',
  },
  {
    scenario: '你在搭建自动化 / 多 Agent 工作流？',
    icon: '🤖',
    combo: ['工具连接', '记忆增强', '联网搜索', '文件与代码'],
    note: '自动化场景建议全装。工具连接是打通外部系统的关键，其余三项负责状态、信息与执行。',
  },
  {
    scenario: '预算有限，想先用免费的？',
    icon: '💰',
    combo: ['联网搜索', '记忆增强'],
    note: '优先挑「免费额度」充足的联网搜索与记忆工具，零成本获得最大体验提升，后续再按需补齐。',
  },
]

export default async function EssentialPage() {
  const allSkills: SkillCard[] = await getSkillsByCategory('infra')

  // 按 Tab 配置分组
  const tabs: EssentialTab[] = TAB_CONFIG.map((cfg) => ({
    id: cfg.id,
    label: cfg.label,
    icon: cfg.icon,
    desc: cfg.desc,
    skills: allSkills.filter((s) => s.scenario_slugs.some((slug) => cfg.slugs.includes(slug))),
  }))

  const totalTools = allSkills.length

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ===== Hero 区 ===== */}
      <section className="border-b border-gray-200 bg-gradient-to-b from-indigo-50 via-white to-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-20">
          <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-indigo-600">
              首页
            </Link>
            <span>/</span>
            <span className="text-gray-600">装机必备</span>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-5xl" aria-hidden>
              🔧
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              AI Agent 装机必备
            </h1>
          </div>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
            刚接触 AI Agent？先装这些，一步到位。我们按四大基础能力筛选出最值得装的核心工具，
            每个都经过实机评测，附上手难度、稳定性与免费额度。
          </p>

          {/* 数据徽章 */}
          <div className="mt-8 flex flex-wrap gap-6">
            <div>
              <div className="text-3xl font-bold text-indigo-600">{totalTools}</div>
              <div className="text-sm text-gray-400">款装机工具</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-600">4</div>
              <div className="text-sm text-gray-400">大基础能力</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-600">100%</div>
              <div className="text-sm text-gray-400">实机评测</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 分类 Tab + 工具列表 ===== */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <EssentialTabs tabs={tabs} />
      </section>

      {/* ===== 选购建议区 ===== */}
      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">💡 不知道装哪些？看选购建议</h2>
            <p className="mt-2 text-gray-500">
              根据你的使用场景，我们推荐了最划算的组合——不必全装，按需取用即可。
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {RECOMMENDATIONS.map((rec) => (
              <div
                key={rec.scenario}
                className="rounded-2xl border border-gray-200 bg-gray-50/60 p-6 transition hover:border-indigo-200 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden>
                    {rec.icon}
                  </span>
                  <h3 className="text-base font-bold text-gray-900">{rec.scenario}</h3>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {rec.combo.map((c) => (
                    <span
                      key={c}
                      className="rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-500">{rec.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 装机指南 CTA ===== */}
      <section className="border-t border-gray-200 bg-gradient-to-br from-indigo-600 to-violet-600">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">📖 装机不知道从何下手？</h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-100">
            我们准备了一份从零开始的完整装机指南，手把手带你完成第一次配置，
            含常见报错排查与环境准备清单。
          </p>
          <Link
            href="/guide/install-guide"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-base font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
          >
            查看完整装机指南
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </main>
  )
}
