'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { SkillCard } from '@/types'

/**
 * ArcDock 装机向导 — 三步聚焦版
 * Step 1: 选 Agent（唯一主路径，大标题 + 卡片居中）
 * Step 2: 同页装机清单（顶部进度条 + 打勾计数 + 验证引导）
 * 收底：体检 / 完整指南 / 浏览全部工具 收进底部一行小链接
 */

interface Agent {
  id: string
  name: string
  logo: string
  desc: string
  needs: string[]
}

const AGENTS: Agent[] = [
  { id: 'claude-code', name: 'Claude Code', logo: '/platform-logos/claude-code.png', desc: 'Anthropic 的编程 Agent', needs: ['memory', 'search', 'github', 'filesystem'] },
  { id: 'hermes', name: 'Hermes', logo: '/platform-logos/hermes.png', desc: 'Nous Research 全能 Agent', needs: ['search', 'memory', 'browser', 'code'] },
  { id: 'coze', name: '扣子 Coze', logo: '/platform-logos/coze.png', desc: '字节跳动的 Bot 平台', needs: ['memory', 'search', 'files', 'automation'] },
  { id: 'cursor', name: 'Cursor', logo: '/platform-logos/codex.png', desc: 'AI 编程编辑器', needs: ['memory', 'search', 'github'] },
  { id: 'general', name: '通用 / 其他', logo: '', desc: '不确定？选这个看全部推荐', needs: ['memory', 'search', 'files', 'code', 'connect'] },
]

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

// === 核心新增：每个能力的"装完第一件事"验证引导 ===
const VERIFY_GUIDE: Record<string, {
  tryIt: string       // 试什么
  expectSuccess: string  // 成功长什么样
  expectFail: string     // 失败长什么样（怎么排查）
  pitfall: string        // 踩坑预警
}> = {
  memory: {
    tryIt: '打开新对话，输入：\"记住我叫小王，我是做电商的\"',
    expectSuccess: 'AI 回复类似\"好的，已记住\" → 再开一个新对话问\"我叫什么\"，如果它答得出来，说明记忆生效了',
    expectFail: '如果新对话不记得 → 检查是否配置了 API Key，免费版可能只有当前会话记忆',
    pitfall: '⚠️ 大部分记忆工具免费版有存储条数限制（如 Mem0 免费版 1000 条），超出后旧记忆会被覆盖',
  },
  search: {
    tryIt: '打开新对话，输入：\"搜一下今天的新闻\"',
    expectSuccess: 'AI 返回带有来源链接的最新新闻 → 说明联网搜索生效了',
    expectFail: '如果 AI 说\"我无法联网\"→ 检查 API Key 是否配置正确，或免费额度是否用完',
    pitfall: '⚠️ 搜索工具按次计费，Tavily 免费 1000 次/月，Brave 免费 2000 次/月，高频使用会产生费用',
  },
  github: {
    tryIt: '在项目目录下，输入：\"帮我看看最近的 PR 列表\"',
    expectSuccess: 'AI 列出你仓库的 PR → 说明 GitHub 集成生效了',
    expectFail: '如果报权限错误 → 检查 GitHub Token 是否有 repo 权限',
    pitfall: '⚠️ Token 要用 Fine-grained，不要用 Classic，否则权限过大不安全',
  },
  filesystem: {
    tryIt: '输入：\"列出当前目录下的文件\"',
    expectSuccess: 'AI 正确列出文件 → 说明文件系统访问生效了',
    expectFail: '如果报权限错误 → 检查工具的工作目录配置',
    pitfall: '⚠️ 文件系统工具默认只能访问指定目录，不要配置成根目录',
  },
  browser: {
    tryIt: '输入：帮我打开百度搜索"人工智能"',
    expectSuccess: 'AI 自动打开浏览器并搜索 → 说明浏览器控制生效了',
    expectFail: '如果浏览器没反应 → 检查 Playwright/Puppeteer 是否正确安装',
    pitfall: '⚠️ 浏览器自动化容易被网站反爬检测，遇到验证码会卡住',
  },
  code: {
    tryIt: '输入：\"帮我写一个 Python 函数计算斐波那契数列\"',
    expectSuccess: 'AI 不仅写代码还能直接运行并返回结果 → 说明代码执行生效了',
    expectFail: '如果只写代码不运行 → 检查沙箱/执行环境是否配置',
    pitfall: '⚠️ 代码执行工具有安全风险，不要在无沙箱环境下运行未知代码',
  },
  files: {
    tryIt: '上传一个 PDF 或 Excel 文件，输入：\"帮我总结这个文件的内容\"',
    expectSuccess: 'AI 正确解析并总结文件 → 说明文件处理生效了',
    expectFail: '如果无法解析 → 检查文件格式是否受支持',
    pitfall: '⚠️ 大文件处理可能超时，建议先压缩或截取关键页面',
  },
  automation: {
    tryIt: '输入：\"创建一个每天早上8点发邮件提醒的工作流\"',
    expectSuccess: 'AI 帮你创建定时任务 → 说明自动化生效了',
    expectFail: '如果任务创建失败 → 检查 n8n/自动化工具的服务是否在运行',
    pitfall: '⚠️ 自动化工作流调试复杂，建议先从简单任务开始',
  },
  connect: {
    tryIt: '输入：\"帮我连接 Google Sheets，读取我的表格\"',
    expectSuccess: 'AI 成功读取你的表格数据 → 说明外部连接生效了',
    expectFail: '如果连接失败 → 检查 OAuth 授权是否完成',
    pitfall: '⚠️ 连接类工具（如 Composio）免费版有连接数限制',
  },
}

export default function InstallWizard({ categories }: { categories: { label: string; skills: SkillCard[] }[] }) {
  const [step, setStep] = useState(0)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [installedIds, setInstalledIds] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('arcdock-installed') ?? localStorage.getItem('ai360-installed')
      if (saved) return new Set(JSON.parse(saved))
    } catch {}
    return new Set()
  })
  const [copiedSlug, setCopiedSlug] = useState('')
  const [expandedVerify, setExpandedVerify] = useState<number | null>(null) // 展开验证引导

  // 选中 Agent 后隐藏侧栏筛选（向导态不需要分类/难度筛选）
  useEffect(() => {
    document.body.classList.toggle('arcdock-wizard-active', step === 1)
    return () => document.body.classList.remove('arcdock-wizard-active')
  }, [step])

  const recommendedSkills = (() => {
    if (!selectedAgent) return []
    const allSkills = categories.flatMap(c => c.skills)
    const seen = new Set<number>()
    const result: { skill: SkillCard; capability: string }[] = []

    for (const need of selectedAgent.needs) {
      const cap = CAPABILITIES[need]
      if (!cap) continue
      const matched = allSkills.find(s => {
        if (seen.has(s.id)) return false
        const name = s.name.toLowerCase()
        const tagline = (s.tagline || '').toLowerCase()
        if (need === 'memory') return name.includes('mem') || name.includes('记忆') || tagline.includes('记忆') || tagline.includes('memory')
        if (need === 'search') return name.includes('search') || name.includes('tavily') || name.includes('brave') || name.includes('firecrawl') || (tagline.includes('搜索') && !tagline.includes('知识库') && !tagline.includes('向量'))
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
  })() as { skill: SkillCard; capability: string }[]

  const totalToInstall = recommendedSkills.length
  const installedCount = recommendedSkills.filter(r => installedIds.has(r.skill.id)).length
  const progress = totalToInstall > 0 ? Math.round((installedCount / totalToInstall) * 100) : 0

  const handleInstall = (skillId: number) => {
    setInstalledIds(prev => {
      const next = new Set(prev)
      next.add(skillId)
      try { localStorage.setItem('arcdock-installed', JSON.stringify([...next])) } catch {}
      return next
    })
    setExpandedVerify(skillId) // 装完自动展开验证引导
  }

  const copyInstallCmd = (slug: string) => {
    navigator.clipboard.writeText(`npx ai-tool add ${slug}`).then(() => {
      setCopiedSlug(slug)
      setTimeout(() => setCopiedSlug(''), 2000)
    })
  }

  // === 底部收底链接：体检 / 完整指南 / 浏览全部工具（降为一行小链接，不占主视觉） ===
  const FooterLinks = () => (
    <div className="mt-10 pt-6 border-t border-[var(--border)] flex items-center justify-center gap-3 text-[13px] text-[var(--fg3)] flex-wrap">
      <Link href="/skill/agent-health-check" className="hover:text-[var(--primary)] transition">🏥 体检</Link>
      <span aria-hidden className="text-[var(--fg4)]">·</span>
      <Link href="/guide/install-guide" className="hover:text-[var(--primary)] transition">📖 完整指南</Link>
      <span aria-hidden className="text-[var(--fg4)]">·</span>
      <Link href="/essential?mode=list" className="hover:text-[var(--primary)] transition">📋 浏览全部工具</Link>
    </div>
  )

  // === Step 1: 选择 Agent（初始态，唯一主路径） ===
  if (step === 0) {
    return (
      <div className="pt-4 pb-6">
        <div className="text-center mb-8">
          <h2 className="text-[24px] font-bold text-[var(--fg)] leading-tight" style={{ letterSpacing: '-0.01em' }}>
            你平时用哪个 AI Agent？
          </h2>
          <p className="text-[14px] text-[var(--fg3)] mt-2">选中后给你一份专属装机清单，3 分钟配齐核心能力</p>
        </div>

        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENTS.map(agent => (
            <button key={agent.id} onClick={() => { setSelectedAgent(agent); setStep(1) }}
              className="content-card p-6 text-left group hover:border-[var(--primary)] transition">
              <div className="flex items-center gap-3 mb-3">
                {agent.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={agent.logo} alt={agent.name} className="w-11 h-11 rounded-lg object-cover" />
                ) : (
                  <span className="w-11 h-11 rounded-lg bg-[var(--primary)] flex items-center justify-center text-[var(--on-primary)] text-[16px] font-bold">?</span>
                )}
                <div>
                  <div className="text-[16px] font-semibold text-[var(--fg)] group-hover:text-[var(--primary)]">{agent.name}</div>
                  <div className="text-[12px] text-[var(--fg3)]">{agent.desc}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {agent.needs.map(n => (
                  <span key={n} className="text-[11px] px-2 py-0.5 rounded bg-[var(--bg2)] text-[var(--fg2)]">
                    {CAPABILITIES[n]?.icon} {CAPABILITIES[n]?.label}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        <FooterLinks />
      </div>
    )
  }

  // === Step 2: 装机清单 + 装完验证 ===
  return (
    <div className="pt-2 pb-6">
      {/* 清单头部：步骤标识 + 换 Agent */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          {selectedAgent?.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedAgent.logo} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
          )}
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold text-[var(--fg)] leading-tight truncate" style={{ letterSpacing: '-0.01em' }}>
              📋 {selectedAgent?.name} 装机清单
            </h2>
            <div className="text-[12px] text-[var(--fg3)] mt-0.5">第 2 步 / 共 2 步 · 装一个勾一个</div>
          </div>
        </div>
        <button onClick={() => setStep(0)}
          className="text-[13px] px-3.5 py-2 rounded-lg border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition whitespace-nowrap shrink-0">
          换个 Agent
        </button>
      </div>

      {/* 顶部进度条（显著展示） */}
      {totalToInstall > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--bg2)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-medium text-[var(--fg)]">
              装机进度 <span className="text-[var(--primary)] font-semibold">{installedCount} / {totalToInstall}</span>
              <span className="text-[var(--fg3)] font-normal">（{progress}%）</span>
            </span>
            <span className="text-[13px] text-[var(--fg3)]">
              {progress === 100 ? '🎉 全部搞定' : '每装一个，回来点「装好了」'}
            </span>
          </div>
          <div className="h-2.5 bg-[var(--card)] rounded-full overflow-hidden border border-[var(--border)]">
            <div className="h-full bg-[var(--primary)] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* 工具列表 */}
      {recommendedSkills.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[14px] text-[var(--fg3)] mb-4">暂未找到匹配工具</p>
          <Link href="/essential?mode=list" className="btn-primary inline-block px-5 py-2 text-[14px]">浏览全部工具</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendedSkills.map(({ skill, capability }) => {
            const cap = CAPABILITIES[capability]
            const guide = VERIFY_GUIDE[capability]
            const installed = installedIds.has(skill.id)
            const isExpanded = expandedVerify === skill.id
            return (
              <div key={skill.id}>
                <div className={`content-card p-5 ${installed ? 'opacity-80' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {installed ? (
                        /* 打勾计数：已装项用主色对勾替代能力图标 */
                        <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(var(--dim-rgb),0.12)' }}>
                          <svg width="16" height="16" viewBox="0 0 14 14"><polyline points="3 7 6 10 11 4" stroke="var(--primary)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </span>
                      ) : (
                        <span className="w-10 h-10 rounded-lg bg-[var(--bg2)] flex items-center justify-center text-[18px] shrink-0">{cap?.icon}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[15px] font-semibold text-[var(--fg)]">{skill.name}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-[rgba(var(--dim-rgb),0.08)] text-[var(--fg)]">{cap?.label}</span>
                        </div>
                        <p className="text-[13px] text-[var(--fg2)] leading-relaxed">{skill.tagline || cap?.desc}</p>

                        {/* 未安装：显示安装命令 */}
                        {!installed && (
                          <div className="flex items-center gap-2 mt-3">
                            <code className="text-[12px] bg-[var(--fg)] text-[#e5e7eb] px-3 py-1.5 rounded font-mono flex-1 overflow-x-auto">
                              npx ai-tool add {skill.slug}
                            </code>
                            <button onClick={() => copyInstallCmd(skill.slug)}
                              className="text-[12px] px-3 py-1.5 rounded border border-[var(--border)] text-[var(--fg2)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition shrink-0">
                              {copiedSlug === skill.slug ? '✓ 已复制' : '复制'}
                            </button>
                          </div>
                        )}

                        {/* 已安装：显示"装完第一件事"验证引导 */}
                        {installed && guide && (
                          <div className="mt-3">
                            <button
                              onClick={() => setExpandedVerify(isExpanded ? null : skill.id)}
                              className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--primary)]"
                            >
                              <span>{isExpanded ? '▼' : '▶'}</span>
                              装好了？试这个验证是否生效
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {installed ? (
                        <span className="text-[13px] font-semibold text-[var(--primary)] px-4 py-2" style={{ background: 'rgba(var(--dim-rgb),0.12)', borderRadius: '8px' }}>
                          ✓ 已装
                        </span>
                      ) : (
                        <div className="flex flex-col gap-2 items-end">
                          <button onClick={() => handleInstall(skill.id)}
                            className="btn-primary px-4 py-2 text-[13px] whitespace-nowrap">
                            装好了
                          </button>
                          <Link href={`/skill/${skill.slug}`}
                            className="text-[12px] text-[var(--fg3)] hover:text-[var(--primary)] transition">
                            详情 →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 装完验证引导（展开面板） */}
                {installed && guide && isExpanded && (
                  <div className="ml-4 mr-4 mb-2 p-4 bg-[var(--sidebar)] rounded-lg border border-[var(--border)]">
                    {/* 试什么 */}
                    <div className="mb-3">
                      <div className="text-[11px] font-bold text-[var(--fg3)] uppercase tracking-wide mb-1">🎯 试这个</div>
                      <div className="text-[14px] text-[var(--fg)] font-medium bg-[var(--card)] rounded-lg p-3 border border-[var(--border)]">
                        {guide.tryIt}
                      </div>
                    </div>

                    {/* 成功长什么样 */}
                    <div className="mb-3 flex items-start gap-2">
                      <span className="text-[14px] shrink-0">✅</span>
                      <div>
                        <div className="text-[11px] font-bold text-[var(--green)] mb-0.5">成功长这样</div>
                        <p className="text-[13px] text-[var(--fg2)] leading-relaxed">{guide.expectSuccess}</p>
                      </div>
                    </div>

                    {/* 失败怎么排查 */}
                    <div className="mb-3 flex items-start gap-2">
                      <span className="text-[14px] shrink-0">❌</span>
                      <div>
                        <div className="text-[11px] font-bold text-[#ef4444] mb-0.5">不生效怎么办</div>
                        <p className="text-[13px] text-[var(--fg2)] leading-relaxed">{guide.expectFail}</p>
                      </div>
                    </div>

                    {/* 踩坑预警 */}
                    <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.04)' }}>
                      <span className="text-[14px] shrink-0">⚠️</span>
                      <div>
                        <div className="text-[11px] font-bold text-[#ef4444] mb-0.5">踩坑预警</div>
                        <p className="text-[13px] text-[var(--fg2)] leading-relaxed">{guide.pitfall}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 完成态：全部装完后出现 */}
      {totalToInstall > 0 && progress === 100 && (
        <div className="mt-5 p-5 rounded-xl bg-[rgba(var(--dim-rgb),0.06)] border border-[rgba(var(--dim-rgb),0.2)]">
          <div className="text-[15px] text-[var(--primary)] font-bold mb-1">🎉 全部装完！</div>
          <p className="text-[13px] text-[var(--fg2)] leading-relaxed">
            你的 {selectedAgent?.name} 现在具备所有核心能力了。建议先试一个真实任务感受效果。
          </p>
          <Link href="/learn" className="inline-block mt-2 text-[13px] text-[var(--primary)] font-medium hover:underline">
            查看学习路径，从真实任务开始 →
          </Link>
        </div>
      )}

      <FooterLinks />
    </div>
  )
}
