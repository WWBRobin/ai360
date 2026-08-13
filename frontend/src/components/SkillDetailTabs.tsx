'use client'

/**
 * Skill 详情页 — Tab 切换（proto7 紫色玻璃态）
 *
 * 客户端组件：管理 5 个 Tab 的 active 状态。
 * 数据由父级 server component 传入（SSR）。
 */

import { useState } from 'react'
import Link from 'next/link'
import type {
  SkillDetail,
  CompareRow,
  SkillCard,
} from '@/types'
import type { GitHubRepoData } from '@/lib/github'
import type { ArticleMeta } from '@/lib/articles'
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  scoreToStars,
} from '@/lib/supabase'
import { formatStars } from '@/lib/github'
import SkillCardComponent from '@/components/SkillCard'
import TrialBox from '@/components/TrialBox'
import CodeBlock from '@/components/CodeBlock'

type TabKey = 'overview' | 'install' | 'tutorial' | 'reviews' | 'related'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: '概览' },
  { key: 'install', label: '安装指南' },
  { key: 'tutorial', label: '使用教程' },
  { key: 'reviews', label: '评价讨论' },
  { key: 'related', label: '相关推荐' },
]

export interface SkillDetailTabsProps {
  skill: SkillDetail
  compareRows: CompareRow[]
  altRows: CompareRow[]
  related: SkillCard[]
  relatedArticles: ArticleMeta[]
  github: GitHubRepoData | null
  evaluatedDate: string | null
}

export default function SkillDetailTabs({
  skill,
  compareRows,
  altRows,
  related,
  relatedArticles,
  github,
  evaluatedDate,
}: SkillDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  return (
    <>
      {/* Tab 栏 */}
      <div className="flex gap-1 border-b border-[#F0F0F0] mb-6 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`h-11 px-4 text-sm whitespace-nowrap border-b-2 transition ${
              activeTab === tab.key ? 'tab-active' : 'tab-inactive'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== 概览 ===== */}
      {activeTab === 'overview' && (
        <OverviewTab skill={skill} evaluatedDate={evaluatedDate} />
      )}

      {/* ===== 安装指南 ===== */}
      {activeTab === 'install' && (
        <InstallTab
          skill={skill}
          github={github}
        />
      )}

      {/* ===== 使用教程 ===== */}
      {activeTab === 'tutorial' && <TutorialTab skill={skill} />}

      {/* ===== 评价讨论 ===== */}
      {activeTab === 'reviews' && <ReviewsTab skill={skill} />}

      {/* ===== 相关推荐 ===== */}
      {activeTab === 'related' && (
        <RelatedTab
          skill={skill}
          compareRows={compareRows}
          altRows={altRows}
          related={related}
          relatedArticles={relatedArticles}
        />
      )}
    </>
  )
}

// ===== 概览 Tab =====

function OverviewTab({
  skill,
  evaluatedDate,
}: {
  skill: SkillDetail
  evaluatedDate: string | null
}) {
  return (
    <div className="space-y-8">
      {/* AI360 五问评测 */}
      <section id="overview">
        <h2 className="text-[17px] font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
          📋 AI360 五问评测
          <span className="text-xs font-normal text-[#9CA3AF]">
            {evaluatedDate ? `实测结论 · ${evaluatedDate} 更新` : '实测结论'}
          </span>
        </h2>
        <div className="space-y-3">
          {/* Q1 */}
          <EvalCard
            num={1}
            question="这是做什么的？什么场景用？"
            answer={
              skill.scenario_summary || '暂无场景说明'
            }
            scoreLabel={skill.overall_score != null ? `综合 ${skill.overall_score.toFixed(1)}` : undefined}
          />
          {/* Q2 */}
          <EvalCard
            num={2}
            question="上手多快？需要什么门槛？"
            answer={skill.difficulty_notes || '暂无上手难度说明'}
            scoreLabel={
              skill.difficulty_score != null
                ? `上手 ${skill.difficulty_score}/5`
                : undefined
            }
          />
          {/* Q3 */}
          <EvalCard
            num={3}
            question="稳定吗？限流严不严？"
            answer={skill.stability_notes || '暂无稳定性说明'}
            scoreLabel={
              skill.stability_score != null
                ? `稳定 ${skill.stability_score}/5`
                : undefined
            }
          />
          {/* Q4 */}
          <EvalCard
            num={4}
            question="免费额度够不够？真实成本多少？"
            answer={skill.free_quota || '暂无免费额度数据'}
            scoreLabel={
              skill.free_quota_score != null
                ? `免费额度 ${skill.free_quota_score}/5`
                : undefined
            }
          />
          {/* Q5 */}
          <EvalCard
            num={5}
            question="Token 消耗大吗？会拖慢 Agent 吗？"
            answer={skill.token_cost || '暂无 Token 成本数据'}
            scoreLabel={
              skill.token_efficiency_score != null
                ? `Token 效率 ${skill.token_efficiency_score}/5`
                : undefined
            }
          />
        </div>
      </section>

      {/* 功能亮点 + 基本信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section id="features">
          <h2 className="text-[17px] font-bold text-[#1A1A1A] mb-4">功能亮点</h2>
          <div className="content-card p-5">
            <ul className="space-y-0">
              {skill.tagline && (
                <FeatureItem text={skill.tagline} />
              )}
              {skill.description && (
                <FeatureItem text={skill.description.slice(0, 80) + (skill.description.length > 80 ? '…' : '')} />
              )}
              <FeatureItem text={`${CATEGORY_LABELS[skill.category] || skill.category} 分类工具`} />
              {skill.trial_enabled && <FeatureItem text="支持在线试用" />}
              {skill.platform_api_supported && <FeatureItem text="支持 API 接入" />}
            </ul>
          </div>
        </section>

        <section id="basic">
          <h2 className="text-[17px] font-bold text-[#1A1A1A] mb-4">基本信息</h2>
          <div className="content-card p-5">
            <dl className="divide-y divide-[#F5F5F5]">
              <MetaRow label="开发者" value={skill.developer_name || '—'} />
              <MetaRow
                label="版本"
                value={skill.version ? `v${skill.version}` : '—'}
              />
              <MetaRow label="平台" value={skill.platform_name} />
              <MetaRow label="分类" value={CATEGORY_LABELS[skill.category] || skill.category} />
              <MetaRow label="免费额度" value={skill.free_quota || '—'} />
              {evaluatedDate && <MetaRow label="评测时间" value={evaluatedDate} />}
            </dl>
          </div>
        </section>
      </div>
    </div>
  )
}

function EvalCard({
  num,
  question,
  answer,
  scoreLabel,
}: {
  num: number
  question: string
  answer: string
  scoreLabel?: string
}) {
  return (
    <div className="content-card p-5">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="w-6 h-6 rounded-full bg-[#FF8C00] text-white text-xs font-bold flex items-center justify-center shrink-0">
          {num}
        </span>
        <span className="text-[15px] font-semibold text-[#1A1A1A]">{question}</span>
      </div>
      <p className="text-sm text-[#6B7280] leading-[1.7] pl-8">{answer}</p>
      {scoreLabel && (
        <span className="inline-flex items-center mt-2 ml-8 text-xs font-semibold text-[#059669] bg-[#f0fdf4] px-2.5 py-1 rounded-md">
          {scoreLabel}
        </span>
      )}
    </div>
  )
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="text-sm text-[#374151] py-2.5 border-b border-[#F5F5F5] last:border-b-0 flex items-start gap-2">
      <span className="text-[#059669] font-bold shrink-0">✓</span>
      <span>{text}</span>
    </li>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 text-sm">
      <dt className="text-[#9CA3AF]">{label}</dt>
      <dd className="text-[#1A1A1A] font-medium">{value}</dd>
    </div>
  )
}

// ===== 安装指南 Tab =====

interface InstallStep {
  title: string
  code?: string
  desc?: string
}

const PLATFORM_INSTALL_STEPS: Record<string, InstallStep[]> = {
  claude: [
    {
      title: '在 Claude 中开启',
      desc: '登录 Claude，进入设置 → Skills / Extensions，按平台提示搜索并安装。',
    },
    {
      title: '或用 Claude Code（MCP）',
      code: 'claude mcp add %NAME%',
      desc: '本地 Claude Code 用户可用命令行直接挂载 MCP server。',
    },
  ],
  codex: [
    { title: '安装 Codex CLI', code: 'npm install -g @openai/codex' },
    {
      title: '挂载 MCP / Skill',
      code: 'codex --mcp %NAME%',
      desc: '在 Codex 配置中添加本工具的 MCP server 或 Skill。',
    },
  ],
  cursor: [
    {
      title: '打开 Cursor 设置',
      desc: 'Cursor → Settings → MCP / Extensions，搜索工具名安装。',
    },
    {
      title: '或编辑配置文件',
      code: '~/.cursor/mcp.json',
      desc: '在 MCP 配置文件中手动添加 server 条目。',
    },
  ],
  coze: [
    { title: '登录扣子平台', desc: '访问 coze.cn，创建智能体 → Bot 编排页。' },
    {
      title: '添加插件 / Skill',
      desc: '在 Bot 编辑页「插件」面板搜索并添加对应技能，配置后发布。',
    },
  ],
  dify: [
    { title: '登录 Dify', desc: '访问 Dify 工作台，创建或进入应用。' },
    {
      title: '添加工具',
      desc: '在应用编排页「工具」节点添加本工具，配置 API Key 后调用。',
    },
  ],
}

function InstallTab({
  skill,
  github,
}: {
  skill: SkillDetail
  github: GitHubRepoData | null
}) {
  const steps = PLATFORM_INSTALL_STEPS[skill.platform_slug]

  return (
    <div className="space-y-8">
      {/* 步骤式卡片 */}
      <section>
        <h2 className="text-[17px] font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
          ⚙️ 安装教程
          <span className="text-xs font-normal text-[#9CA3AF]">
            {steps ? `${steps.length} 步搞定` : '1 步搞定'}
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps ? (
            steps.map((step, i) => (
              <StepCard
                key={i}
                num={i + 1}
                title={step.title}
                desc={step.desc}
                code={step.code}
                platformName={skill.platform_name}
              />
            ))
          ) : (
            <StepCard
              num={1}
              title={`前往 ${skill.platform_name} 安装`}
              desc={`点击下方按钮跳转到 ${skill.platform_name} 官方页面，按提示完成安装。`}
            />
          )}
        </div>
      </section>

      {/* 安装命令 / CTA */}
      <section>
        <h2 className="text-[17px] font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
          📦 安装入口
        </h2>
        <div className="content-card p-6">
          <a
            href={skill.install_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm"
          >
            <span>🚀</span> 去 {skill.platform_name} 安装
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M7 17L17 7M17 7H8M17 7v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          {skill.version && (
            <p className="text-xs text-[#9CA3AF] mt-3">
              当前版本 v{skill.version}
            </p>
          )}
        </div>
      </section>

      {/* GitHub 数据 */}
      {github && (
        <section>
          <h2 className="text-[17px] font-bold text-[#1A1A1A] mb-4">🔧 开发者信息</h2>
          <div className="content-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden className="text-[#374151]">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <a
                href={github.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#374151] hover:text-[#FF8C00] transition truncate"
              >
                {github.full_name}
              </a>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#fef3c7] rounded-lg py-2">
                <div className="text-xs text-[#e67300]">★ Star</div>
                <div className="text-sm font-bold text-[#1A1A1A]">{formatStars(github.stars)}</div>
              </div>
              <div className="bg-[rgba(255,140,0,0.06)] rounded-lg py-2">
                <div className="text-xs text-[#9CA3AF]">⑂ Fork</div>
                <div className="text-sm font-bold text-[#1A1A1A]">{formatStars(github.forks)}</div>
              </div>
              <div className="bg-[rgba(255,140,0,0.06)] rounded-lg py-2">
                <div className="text-xs text-[#9CA3AF]">License</div>
                <div className="text-xs font-bold text-[#1A1A1A] truncate px-1">{github.license || '—'}</div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function StepCard({
  num,
  title,
  desc,
  code,
  platformName,
}: {
  num: number
  title: string
  desc?: string
  code?: string
  platformName?: string
}) {
  const realCode = code
    ? code.replace('%NAME%', platformName || '')
    : undefined

  return (
    <div className="content-card p-5">
      <div className="w-9 h-9 rounded-full bg-[#FF8C00] text-white text-base font-bold flex items-center justify-center mb-3.5 shadow-[0_4px_10px_rgba(255,140,0,0.28)]">
        {num}
      </div>
      <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-2">{title}</h3>
      {desc && <p className="text-[13px] text-[#6B7280] leading-[1.7] mb-2">{desc}</p>}
      {realCode && <CodeBlock code={realCode} />}
    </div>
  )
}

// ===== 使用教程 Tab =====

function TutorialTab({ skill }: { skill: SkillDetail }) {
  return (
    <div className="space-y-4">
      {/* 使用技巧 */}
      <div className="content-card p-5">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="w-6 h-6 rounded-full bg-[#FF8C00] text-white text-xs font-bold flex items-center justify-center shrink-0">
            ★
          </span>
          <span className="text-[15px] font-semibold text-[#1A1A1A]">使用技巧</span>
        </div>
        <p className="text-sm text-[#6B7280] leading-[1.7] pl-8">
          {skill.tagline || `${skill.name} 是一款${CATEGORY_LABELS[skill.category] || ''}类工具。`}
          {skill.description && ` ${skill.description}`}
        </p>
        <span className="inline-flex items-center mt-2 ml-8 text-xs font-semibold text-[#059669] bg-[#f0fdf4] px-2.5 py-1 rounded-md">
          AI360 实测推荐
        </span>
      </div>

      {/* 使用指南 */}
      {skill.guide_content && (
        <div className="content-card p-6">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-6 h-6 rounded-full bg-[#FF8C00] text-white text-xs font-bold flex items-center justify-center shrink-0">
              📖
            </span>
            <span className="text-[15px] font-semibold text-[#1A1A1A]">详细指南</span>
            {skill.guide_difficulty && (
              <span className="text-xs text-[#9CA3AF]">难度：{skill.guide_difficulty}</span>
            )}
          </div>
          <div className="prose-guide pl-8">
            <div className="whitespace-pre-wrap text-sm text-[#374151] leading-[1.7]">
              {skill.guide_content}
            </div>
          </div>
        </div>
      )}

      {/* 在线试用 */}
      {skill.trial_enabled ? (
        <div className="content-card p-6">
          <h3 className="text-[15px] font-semibold text-[#1A1A1A] mb-3">🧪 在线试用 {skill.name}</h3>
          <TrialBox skillId={skill.id} skillName={skill.name} />
        </div>
      ) : (
        <div className="content-card p-6 text-center">
          <span className="text-2xl">🔒</span>
          <p className="text-sm text-[#6B7280] mt-2">
            该 Skill 暂不支持在线试用，请直接安装体验。
          </p>
        </div>
      )}
    </div>
  )
}

// ===== 评价讨论 Tab =====

function ReviewsTab({ skill }: { skill: SkillDetail }) {
  return (
    <div>
      <section>
        <h2 className="text-[17px] font-bold text-[#1A1A1A] mb-4">
          💬 评价讨论
        </h2>

        {/* 评价列表（即将上线） */}
        <div className="content-card p-8 text-center">
          <span className="text-3xl">📝</span>
          <p className="text-sm text-[#6B7280] mt-3">
            评价系统即将上线。目前可通过 AI360 五问评测了解本工具的实测表现。
          </p>
          {skill.evaluation_method && (
            <p className="text-xs text-[#9CA3AF] mt-2">
              评测方法：{skill.evaluation_method}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

// ===== 相关推荐 Tab =====

function RelatedTab({
  skill,
  compareRows,
  altRows,
  related,
  relatedArticles,
}: {
  skill: SkillDetail
  compareRows: CompareRow[]
  altRows: CompareRow[]
  related: SkillCard[]
  relatedArticles: ArticleMeta[]
}) {
  return (
    <div className="space-y-8">
      {/* 同类对比表 */}
      {compareRows.length > 1 && (
        <section>
          <h2 className="text-[17px] font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
            ⚖️ 同类对比
            <span className="text-xs font-normal text-[#9CA3AF]">向上箭头为最优值</span>
          </h2>
          <div className="content-card overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[rgba(255,140,0,0.6)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">工具</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">综合</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">上手</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">稳定</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide">免费额度</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => {
                  const isCurrent = row.is_current
                  return (
                    <tr
                      key={row.slug}
                      className={`border-b border-[#F0F0F0] last:border-b-0 transition hover:bg-[rgba(255,140,0,0.04)] ${
                        isCurrent ? 'bg-[rgba(255,140,0,0.5)]' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {row.icon_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={row.icon_url} alt={row.name} loading="lazy" className="w-5 h-5 rounded object-cover shrink-0" />
                          ) : (
                            <span className="text-base shrink-0" aria-hidden>{CATEGORY_ICONS[row.category] || '🧩'}</span>
                          )}
                          {isCurrent ? (
                            <span className="font-semibold text-[#FF8C00]">
                              {row.name}
                              <span className="ml-1 text-[10px] align-middle bg-[rgba(255,140,0,0.06)] text-[#FF8C00] px-1 py-px rounded">当前</span>
                            </span>
                          ) : (
                            <Link href={`/skill/${row.slug}`} className="font-semibold text-[#1A1A1A] hover:text-[#FF8C00] transition">
                              {row.name}
                            </Link>
                          )}
                          <span className="text-[11px] text-[#9CA3AF] block">{row.platform_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.overall_score != null ? (
                          <span className="font-bold text-[#1A1A1A]">{row.overall_score.toFixed(1)}</span>
                        ) : (
                          <span className="text-[#D1D5DB]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CompareScoreCell score={row.difficulty_score} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CompareScoreCell score={row.stability_score} />
                      </td>
                      <td className="px-4 py-3">
                        {row.free_quota ? (
                          <span className="text-xs font-medium text-[#059669]">{row.free_quota}</span>
                        ) : (
                          <span className="text-[#D1D5DB]">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 替代品推荐 */}
      {altRows.length > 0 && (
        <section>
          <h2 className="text-[17px] font-bold text-[#1A1A1A] mb-1">🔁 替代品推荐</h2>
          <p className="text-sm text-[#6B7280] mb-4">
            如果「{skill.name}」不完全合适，以下同类工具可能更适合你。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {altRows.slice(0, 6).map((row) => (
              <AlternativeCard key={row.slug} row={row} />
            ))}
          </div>
        </section>
      )}

      {/* 相关 Skill */}
      {related.length > 0 && (
        <section>
          <h2 className="text-[17px] font-bold text-[#1A1A1A] mb-4">🔗 相关推荐</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.map((s) => (
              <SkillCardComponent key={s.slug} skill={s} />
            ))}
          </div>
        </section>
      )}

      {/* 相关文章 */}
      {relatedArticles.length > 0 && (
        <section>
          <h2 className="text-[17px] font-bold text-[#1A1A1A] mb-4">📰 相关文章</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedArticles.map((a) => (
              <RelatedArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function CompareScoreCell({ score }: { score: number | null }) {
  if (score == null) return <span className="text-[#D1D5DB]">—</span>
  const color = score >= 4 ? 'text-[#059669]' : score >= 3 ? 'text-[#e67300]' : 'text-[#6B7280]'
  return <span className={`font-medium ${color}`}>{score}/5</span>
}

function AlternativeCard({ row }: { row: CompareRow }) {
  return (
    <Link href={`/skill/${row.slug}`} className="block group">
      <div className="content-card p-5 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          {row.icon_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.icon_url} alt={row.name} loading="lazy" className="w-8 h-8 rounded-lg object-cover shrink-0" />
          ) : (
            <span className="text-xl shrink-0" aria-hidden>{CATEGORY_ICONS[row.category] || '🧩'}</span>
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-[#1A1A1A] group-hover:text-[#FF8C00] transition truncate">
              {row.name}
            </h3>
            <span className="text-xs text-[#9CA3AF]">{row.platform_name}</span>
          </div>
        </div>
        {row.tagline && (
          <p className="text-sm text-[#6B7280] mb-3 line-clamp-2 flex-1">{row.tagline}</p>
        )}
        <div className="flex items-center justify-between text-xs">
          {row.overall_score != null ? (
            <span className="flex items-center gap-1">
              <span className="text-[#FF8C00]">★</span>
              <span className="font-bold text-[#059669]">{row.overall_score.toFixed(1)}</span>
            </span>
          ) : (
            <span className="text-[#9CA3AF]">暂无评分</span>
          )}
          <span className="text-[#FF8C00] font-medium group-hover:underline">查看评测 →</span>
        </div>
      </div>
    </Link>
  )
}

function RelatedArticleCard({ article }: { article: ArticleMeta }) {
  return (
    <Link href={`/guide/${article.slug}`} className="group block">
      <div className="content-card p-5 h-full">
        <div className="flex items-start gap-3">
          <div className="text-2xl shrink-0">{article.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-[rgba(255,140,0,0.06)] text-[#FF8C00] text-[10px] px-1.5 py-0.5 rounded font-medium">
                {article.tag}
              </span>
            </div>
            <h3 className="font-semibold text-[#1A1A1A] group-hover:text-[#FF8C00] transition line-clamp-2 text-sm">
              {article.title}
            </h3>
            <p className="text-xs text-[#6B7280] mt-1.5 line-clamp-2">{article.summary}</p>
            <div className="mt-2 text-xs text-[#FF8C00] font-medium">阅读 →</div>
          </div>
        </div>
      </div>
    </Link>
  )
}
