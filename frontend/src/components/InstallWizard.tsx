'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { SkillCard } from '@/types'

/**
 * 交互式装机向导
 * 核心流程：选择Agent → 检测缺失能力 → 生成个性化清单 → 一键安装命令
 */

interface Agent {
  id: string
  name: string
  logo: string
  desc: string
  // 该Agent缺失的能力（需要补齐的）
  needs: string[]
}

const AGENTS: Agent[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    logo: '/platform-logos/claude-code.png',
    desc: 'Anthropic 的编程 Agent',
    needs: ['memory', 'search', 'github', 'filesystem'],
  },
  {
    id: 'hermes',
    name: 'Hermes',
    logo: '/platform-logos/hermes.png',
    desc: 'Nous Research 全能 Agent',
    needs: ['search', 'memory', 'browser', 'code'],
  },
  {
    id: 'coze',
    name: '扣子 Coze',
    logo: '/platform-logos/coze.png',
    desc: '字节跳动的 Bot 平台',
    needs: ['memory', 'search', 'files', 'automation'],
  },
  {
    id: 'cursor',
    name: 'Cursor',
    logo: '/platform-logos/codex.png',
    desc: 'AI 编程编辑器',
    needs: ['memory', 'search', 'github'],
  },
  {
    id: 'general',
    name: '通用 / 其他',
    logo: '',
    desc: '不确定？选这个看全部推荐',
    needs: ['memory', 'search', 'files', 'code', 'connect'],
  },
]

// 能力分类
const CAPABILITIES: Record<string, { label: string; icon: string; desc: string }> = {
  memory: { label: '记忆增强', icon: '🧠', desc: '让 AI 记住你的偏好和历史' },
  search: { label: '联网搜索', icon: '🔍', desc: '让 AI 能上网查最新信息' },
  github: { label: '代码协作', icon: '🐙', desc: 'GitHub PR/Issue 自动处理' },
  filesystem: { label: '文件系统', icon: '📁', desc: '读写本地文件' },
  browser: { label: '浏览器控制', icon: '🌐', desc: '自动化网页操作' },
  code: { label: '代码执行', icon: '💻', desc: '运行代码和脚本' },
  files: { label: '文件处理', icon: '📄', desc: '文档/表格/图片处理' },
  automation: { label: '自动化', icon: '⚙️', desc: '工作流和定时任务' },
  connect: { label: '外部连接', icon: '🔌', desc: '连接 1000+ 外部应用' },
}

export default function InstallWizard({ categories }: { categories: { label: string; skills: SkillCard[] }[] }) {
  const [step, setStep] = useState(0) // 0=选Agent, 1=生成清单, 2=安装中
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [installedIds, setInstalledIds] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('ai360-installed')
      if (saved) return new Set(JSON.parse(saved))
    } catch {}
    return new Set()
  })
  const [copiedSlug, setCopiedSlug] = useState('')

  // 找到Agent需要的工具（从categories里匹配）
  const recommendedSkills = (() => {
    if (!selectedAgent) return []
    const allSkills = categories.flatMap(c => c.skills)
    const seen = new Set<number>()
    const result: { skill: SkillCard; capability: string }[] = []

    // 按能力匹配工具
    for (const need of selectedAgent.needs) {
      const cap = CAPABILITIES[need]
      if (!cap) continue
      // 从分类标签或工具名匹配
      const matched = allSkills.find(s => {
        if (seen.has(s.id)) return false
        const name = s.name.toLowerCase()
        const tagline = (s.tagline || '').toLowerCase()
        const cat = (s.category || '').toLowerCase()
        
        if (need === 'memory') return name.includes('mem') || name.includes('记忆') || tagline.includes('记忆') || tagline.includes('memory')
        if (need === 'search') return name.includes('search') || name.includes('tavily') || name.includes('brave') || tagline.includes('搜索') || tagline.includes('search')
        if (need === 'github') return name.includes('github') || name.includes('git') || tagline.includes('git')
        if (need === 'filesystem' || need === 'files') return name.includes('file') || name.includes('文件') || tagline.includes('文件')
        if (need === 'browser') return name.includes('browser') || name.includes('playwright') || tagline.includes('浏览器')
        if (need === 'code') return name.includes('code') || name.includes('编程') || tagline.includes('代码')
        if (need === 'automation') return name.includes('automat') || name.includes('n8n') || tagline.includes('自动化')
        if (need === 'connect') return name.includes('composio') || name.includes('connect') || tagline.includes('连接')
        return false
      })
      if (matched) {
        seen.add(matched.id)
        result.push({ skill: matched, capability: need })
      }
    }
    return result
  })()

  const totalToInstall = recommendedSkills.length
  const installedCount = recommendedSkills.filter(r => installedIds.has(r.skill.id)).length
  const progress = totalToInstall > 0 ? Math.round((installedCount / totalToInstall) * 100) : 0

  const handleInstall = (skillId: number) => {
    setInstalledIds(prev => {
      const next = new Set(prev)
      next.add(skillId)
      try { localStorage.setItem('ai360-installed', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const copyInstallCmd = (slug: string) => {
    const cmd = `npx @anthropic-ai/claude-code skill add ${slug}`
    navigator.clipboard.writeText(cmd).then(() => {
      setCopiedSlug(slug)
      setTimeout(() => setCopiedSlug(''), 2000)
    })
  }

  // === Step 0: 选择你的 Agent ===
  if (step === 0) {
    return (
      <div className="px-6 md:px-10 py-8">
        <h1 className="text-[18px] font-bold text-[#1F2937] mb-1">AI Agent 装机向导</h1>
        <p className="text-[13px] text-[#9CA3AF] mb-6">选择你在用的 AI Agent，3 分钟配齐核心能力</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {AGENTS.map(agent => (
            <button
              key={agent.id}
              onClick={() => { setSelectedAgent(agent); setStep(1) }}
              className="content-card p-5 text-left group hover:border-[#FF8C00] transition"
            >
              <div className="flex items-center gap-3 mb-2">
                {agent.logo ? (
                  <img src={agent.logo} alt={agent.name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <span className="w-10 h-10 rounded-lg bg-[#FF8C00] flex items-center justify-center text-white text-[15px] font-bold">?</span>
                )}
                <div>
                  <div className="text-[15px] font-semibold text-[#1F2937] group-hover:text-[#FF8C00]">{agent.name}</div>
                  <div className="text-[11px] text-[#9CA3AF]">{agent.desc}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {agent.needs.map(n => (
                  <span key={n} className="text-[11px] px-2 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280]">
                    {CAPABILITIES[n]?.icon} {CAPABILITIES[n]?.label}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* 传统列表入口 */}
        <div className="border-t border-[#F0F0F0] pt-6">
          <Link href="/essential?mode=list" className="text-[14px] text-[#FF8C00] hover:underline">
            或者直接浏览全部工具 →
          </Link>
        </div>
      </div>
    )
  }

  // === Step 1: 个性化装机清单 ===
  return (
    <div className="px-6 md:px-10 py-8">
      {/* 头部：返回 + Agent信息 + 进度 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep(0)} className="text-[14px] text-[#9CA3AF] hover:text-[#1F2937] transition">
            ← 重新选择
          </button>
        </div>
        <div className="flex items-center gap-3">
          {selectedAgent?.logo && <img src={selectedAgent.logo} alt="" className="w-6 h-6 rounded object-cover" />}
          <span className="text-[14px] font-medium text-[#1F2937]">{selectedAgent?.name} 装机清单</span>
        </div>
      </div>

      {/* 进度条 */}
      {totalToInstall > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-medium text-[#1F2937]">装机进度</span>
            <span className="text-[14px] text-[#FF8C00] font-semibold">{installedCount} / {totalToInstall}</span>
          </div>
          <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
            <div className="h-full bg-[#FF8C00] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          {progress === 100 && (
            <div className="mt-3 p-3 rounded-lg bg-[rgba(255,140,0,0.08)] text-[14px] text-[#FF8C00] font-medium">
              🎉 全部装完！你的 {selectedAgent?.name} 现在具备所有核心能力了。
            </div>
          )}
        </div>
      )}

      {/* 推荐工具列表 */}
      {recommendedSkills.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[14px] text-[#9CA3AF] mb-4">暂未找到匹配工具，试试直接浏览全部</p>
          <Link href="/essential?mode=list" className="btn-primary inline-block px-5 py-2 text-[14px]">浏览全部工具</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendedSkills.map(({ skill, capability }) => {
            const cap = CAPABILITIES[capability]
            const installed = installedIds.has(skill.id)
            return (
              <div key={skill.id} className={`content-card p-5 ${installed ? 'opacity-70' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* 能力图标 */}
                    <span className="w-10 h-10 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[18px] shrink-0">
                      {cap?.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[15px] font-semibold text-[#1F2937]">{skill.name}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[rgba(255,140,0,0.08)] text-[#E67300]">{cap?.label}</span>
                      </div>
                      <p className="text-[13px] text-[#6B7280] mb-2 leading-relaxed">{skill.tagline || cap?.desc}</p>
                      
                      {/* 安装命令 */}
                      {!installed && (
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-[12px] bg-[#1F2937] text-[#e5e7eb] px-3 py-1.5 rounded font-mono flex-1 overflow-x-auto">
                            npx ai-tool add {skill.slug}
                          </code>
                          <button
                            onClick={() => copyInstallCmd(skill.slug)}
                            className="text-[12px] px-3 py-1.5 rounded border border-[#E5E7EB] text-[#4B5563] hover:border-[#FF8C00] hover:text-[#FF8C00] transition shrink-0"
                          >
                            {copiedSlug === skill.slug ? '✓ 已复制' : '复制'}
                          </button>
                        </div>
                      )}

                      {/* 验证方式 */}
                      {!installed && skill.free_quota && (
                        <p className="text-[11px] text-[#9CA3AF] mt-2">
                          ✓ {skill.free_quota}（免费试用）
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="shrink-0">
                    {installed ? (
                      <span className="text-[13px] font-semibold text-[#FF8C00] px-4 py-2" style={{ background: 'rgba(255,140,0,0.12)', borderRadius: '8px' }}>
                        ✓ 已安装
                      </span>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleInstall(skill.id)}
                          className="btn-primary px-4 py-2 text-[13px] whitespace-nowrap"
                        >
                          标记已装
                        </button>
                        <Link
                          href={`/skill/${skill.slug}`}
                          className="text-[12px] text-[#9CA3AF] hover:text-[#FF8C00] text-center transition"
                        >
                          查看详情 →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 底部：完成CTA */}
      {progress > 0 && progress < 100 && (
        <div className="mt-8 p-4 rounded-lg border border-[#F0F0F0] text-center">
          <p className="text-[14px] text-[#4B5563] mb-2">装完后不知道怎么用？</p>
          <Link href="/learn" className="text-[14px] text-[#FF8C00] font-medium hover:underline">
            查看学习路径，手把手教你怎么用 →
          </Link>
        </div>
      )}
    </div>
  )
}
