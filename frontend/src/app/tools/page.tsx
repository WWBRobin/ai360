import type { Metadata } from 'next'
import ToolsClient from '@/components/tools/ToolsClient'
import { TOOLS_DATA } from '@/lib/tools-data'

export const metadata: Metadata = {
  title: '软件管家',
  description:
    'AI 世界的导航：11 大类 235 款头部工具——大模型、AI 软件、内容生成、Skill、MCP、中转。认识 AI · 用好 AI · 玩透 AI。',
  alternates: { canonical: '/tools' },
}

/**
 * 软件管家（分层版 C）— /tools
 * 一层=看：三段分层门户（认识AI/用好AI/玩透AI），每类露头部 3-4 条；
 * 二级页 = A 形态（侧栏 + 高密度列表）。
 * 数据：src/data/tools-data.json（235 条 final：Codex 已合并、中转只留 ArcDock）。
 */

const CATS: { slug: string; name: string; desc: string }[] = [
  { slug: 'llm', name: '大模型', desc: 'GPT、Claude、DeepSeek……这些是 AI 世界的发动机' },
  { slug: 'apps', name: 'AI 软件 / 独立产品', desc: '装上就能用的完整 AI 产品' },
  { slug: 'search', name: 'AI 搜索', desc: '用 AI 的方式找答案' },
  { slug: 'gen', name: '内容生成', desc: '写、画、剪、配音——AI 替你生产内容' },
  { slug: 'office', name: '办公生产力', desc: '文档、表格、会议——日常工作的 AI 加速' },
  { slug: 'coding', name: '编程开发', desc: '写代码的 AI 同事' },
  { slug: 'agent', name: 'Agent 平台 / 框架', desc: '搭自己的 AI 机器人' },
  { slug: 'skill', name: 'Skill / 插件', desc: '给 AI 装上新能力' },
  { slug: 'mcp', name: 'MCP / 工具协议', desc: '让 AI 连接外部世界的标准协议' },
  { slug: 'data', name: '数据源 / 知识库', desc: '喂给 AI 的数据底座' },
  { slug: 'relay', name: '中转 / API 网关', desc: '一个密钥用所有模型' },
]

const LAYERS = [
  { id: 1, tag: 'L1', name: '认识 AI', sub: '第一次用 AI，从这里开始', cats: ['llm', 'apps', 'search', 'gen'], tint: 'green' },
  { id: 2, tag: 'L2', name: '用好 AI', sub: '让 AI 进入你的日常', cats: ['office', 'coding', 'agent'], tint: 'blue' },
  { id: 3, tag: 'L3', name: '玩透 AI', sub: '组装你自己的 AI 体系', cats: ['skill', 'mcp', 'data', 'relay'], tint: 'amber' },
]

export default function ToolsPage() {
  return (
    <div className="page-wrapper px-4 sm:px-6 lg:px-8 pb-16">
      <ToolsClient
        layers={LAYERS}
        cats={CATS}
        tools={TOOLS_DATA}
      />
    </div>
  )
}
