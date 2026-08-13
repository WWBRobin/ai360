import type { Metadata } from 'next'
import Link from 'next/link'
import { getSkillsByCategory } from '@/lib/supabase'
import AppSidebar from '@/components/AppSidebar'
import EssentialBoard, { type EssentialCategory } from '@/components/EssentialBoard'

// ISR：装机必备页每 1 小时增量静态重新生成
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'AI Agent 装机必备',
  description:
    '刚接触 AI Agent？先装这些核心工具，一步到位。记忆增强、联网搜索、文件与代码、工具连接四大分类精选，附上手难度、稳定性与免费额度。',
  keywords: ['AI Agent', '装机必备', 'MCP', '记忆增强', '联网搜索', 'AI 工具推荐', 'AI360'],
  alternates: { canonical: '/essential' },
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

// 装机分类配置：id 唯一，slugs 用于匹配 scenario_slug
const TAB_CONFIG: Array<{
  id: string
  label: string
  icon: string
  desc: string
  slugs: string[]
}> = [
  {
    id: 'memory',
    label: '记忆知识',
    icon: '🧠',
    desc: '让 Agent 拥有跨会话的长期记忆，记住你的偏好、项目与上下文，越用越懂你。',
    slugs: ['memory'],
  },
  {
    id: 'search',
    label: '搜索检索',
    icon: '🔍',
    desc: '实时获取互联网信息，突破模型知识截止日期限制，回答更准确、更新。',
    slugs: ['search'],
  },
  {
    id: 'file',
    label: '文件处理',
    icon: '📁',
    desc: '读写本地文件、处理文档——这是 Agent 真正能「动手干活」的双手。',
    slugs: ['file', 'document'],
  },
  {
    id: 'connect',
    label: '外部连接',
    icon: '🔗',
    desc: '对接数据库、API 与各类 SaaS 服务，把 Agent 接入你已有的工作流。',
    slugs: ['connect'],
  },
  {
    id: 'code',
    label: '代码开发',
    icon: '💻',
    desc: '编码规范、测试驱动、调试流程——让 Agent 写出工程级代码。',
    slugs: ['code'],
  },
]

export default async function EssentialPage() {
  const allSkills = await getSkillsByCategory('infrastructure')

  // 按分类配置分组
  const categories: EssentialCategory[] = TAB_CONFIG.map((cfg) => ({
    id: cfg.id,
    label: cfg.label,
    icon: cfg.icon,
    desc: cfg.desc,
    skills: allSkills.filter((s) => s.scenario_slugs.some((slug) => cfg.slugs.includes(slug))),
  })).filter((c) => c.skills.length > 0)

  return (
    <div className="flex min-h-screen relative">
      <AppSidebar />

      <main className="flex-1 min-w-0 relative z-10 px-8 py-7 max-w-[1080px]">
        <EssentialBoard categories={categories} />

        {/* 装机指南 CTA */}
        <section className="glass-card mt-12 p-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(109,40,217,0.05))' }}>
          <h2 className="text-[20px] font-bold text-[#1A1A1A] mb-2">📖 装机不知道从何下手？</h2>
          <p className="mx-auto mt-2 max-w-xl text-[14px] text-[#6B7280] leading-[1.7]">
            我们准备了一份从零开始的完整装机指南，手把手带你完成第一次配置，含常见报错排查与环境准备清单。
          </p>
          <Link
            href="/guide/install-guide"
            className="btn-metal inline-flex items-center gap-2 mt-6 px-7 py-3 text-[15px] font-bold"
          >
            查看完整装机指南
            <span aria-hidden>→</span>
          </Link>
        </section>
      </main>
    </div>
  )
}
