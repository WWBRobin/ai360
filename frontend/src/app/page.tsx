'use client'

import { useState } from 'react'
import Link from 'next/link'
import AppSidebar from '@/components/AppSidebar'

const SCENES = [
  { slug: 'writing', name: '写作创作', count: 68 },
  { slug: 'office', name: '数据办公', count: 65 },
  { slug: 'research', name: '研究分析', count: 35 },
  { slug: 'coding', name: '开发编程', count: 106 },
  { slug: 'design', name: '设计媒体', count: 37 },
  { slug: 'automation', name: '自动化', count: 52 },
  { slug: 'ai-enhance', name: 'AI增强', count: 20 },
]

const TYPES = ['全部', 'Skill', '工具', 'MCP', '插件']

const CARDS = [
  { name: 'Tavily Search', platform: 'MCP', tags: ['AI360实测', '免费'], score: 4.9, desc: '让 AI 联网搜索最新信息，免费 1000 次/月', meta: { 上手: '4/5', 稳定: '5/5', 免费: '1000次/月' } },
  { name: 'claude-mem', platform: 'Claude', tags: ['AI360实测', '免费'], score: 4.8, desc: 'Claude Code 持久记忆插件，GitHub 90K★', meta: { 上手: '2/5', 稳定: '3/5', 免费: '完全免费' } },
  { name: 'Composio', platform: 'MCP', tags: ['AI360实测'], score: 4.7, desc: '一次连接 1000+ 外部应用', meta: { 上手: '3/5', 稳定: '4/5', 免费: '2万次/月' } },
  { name: 'Brave Search MCP', platform: 'MCP', tags: ['AI360实测', '免费'], score: 4.8, desc: '免费 AI 搜索，无需 API Key', meta: { 上手: '4/5', 稳定: '4/5', 免费: '2000次/月' } },
  { name: 'Frontend Design', platform: 'Claude', tags: ['AI360实测', 'Official'], score: 4.7, desc: 'Anthropic 官方 Skill，27.7 万次安装', meta: { 上手: '3/5', 稳定: '4/5', 免费: '免费' } },
  { name: 'Systematic Debugging', platform: 'Hermes', tags: ['AI360实测'], score: 4.5, desc: '4 阶段根因调试方法论', meta: { 上手: '4/5', 稳定: '5/5', 免费: '完全免费' } },
]

export default function HomePage() {
  const [activeScene, setActiveScene] = useState(0)
  const [activeType, setActiveType] = useState(0)

  return (
    <div className="flex min-h-screen" style={{ background: '#FFFFFF' }}>
      <AppSidebar />

      <main className="flex-1 min-w-0">
        <div className="max-w-[1280px] mx-auto px-10">
          {/* Hero 区 */}
          <div className="pt-8 pb-6">
            <h1 className="text-[26px] font-bold text-[#1F2937] mb-2" style={{ letterSpacing: '0.02em' }}>
              发现最适合你的 AI 工具
            </h1>
            <p className="text-[15px] text-[#9CA3AF]">
              528 个工具 · 19 个平台 · AI360 独立评测 · 每日更新
            </p>
          </div>

          {/* Tab 第一行：场景 */}
          <div className="border-b border-[#F0F0F0]">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {SCENES.map((s, i) => (
                <button key={s.slug} onClick={() => setActiveScene(i)}
                  className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition ${activeScene === i ? 'tab-active' : 'tab-inactive'}`}>
                  {s.name} <span className="text-[11px] text-[#9CA3AF]">{s.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab 第二行：类型 */}
          <div className="py-2 border-b border-[#F0F0F0]">
            <div className="flex gap-3">
              {TYPES.map((t, i) => (
                <button key={t} onClick={() => setActiveType(i)}
                  className={`text-[13px] py-1 px-2 rounded transition ${activeType === i ? 'text-[#FF8C00] font-medium' : 'text-[#9CA3AF] hover:text-[#1F2937]'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 排序栏 */}
          <div className="py-3 flex items-center justify-between">
            <span className="text-[13px] text-[#9CA3AF]">共 528 个工具</span>
            <select className="text-[13px] text-[#4B5563] border border-[#E5E7EB] rounded-lg px-3 py-1 bg-white cursor-pointer">
              <option>综合评分</option>
              <option>实测得分</option>
              <option>最新上架</option>
              <option>热度排序</option>
            </select>
          </div>

          {/* 卡片网格 */}
          <div className="pb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {CARDS.map((card, i) => (
              <Link key={i} href={`/skill/${card.name.toLowerCase().replace(/\s/g, '-')}`}
                className="content-card block group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    {/* Logo 占位 — 无背景 */}
                    <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-[#9CA3AF]"
                      style={{ border: '1px solid #F0F0F0' }}>
                      {card.name[0]}
                    </span>
                    <div>
                      <span className="text-[15px] font-semibold text-[#1F2937] group-hover:text-[#FF8C00] transition">{card.name}</span>
                      <span className="text-[11px] text-[#9CA3AF] ml-2">{card.platform}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {card.tags.map(t => (
                      <span key={t} className={`tag tag-${t === 'AI360实测' ? 'tested' : t === '免费' ? 'free' : 'official'}`}>{t}</span>
                    ))}
                    <span className="score-text">{card.score}</span>
                  </div>
                </div>
                <p className="text-[13px] text-[#4B5563] leading-[1.6] mb-3">{card.desc}</p>
                <div className="flex items-center gap-4 pt-3 border-t border-[#F0F0F0] text-[12px] text-[#9CA3AF]">
                  {Object.entries(card.meta).map(([k, v]) => (
                    <span key={k}>{k} {v}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
