'use client'

import { useEffect, useRef, useState } from 'react'
import ScanPanel from './ScanPanel'
import { CAPS } from './caps-data'
import './assessment.css'

/* Scroll Reveal 容器 */
function SR({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setVis(true)),
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={`sr ${vis ? 'vis' : ''} ${className}`}>
      {children}
    </div>
  )
}

/* 检测能力卡（同行展开/收起） */
function CapCard({ cap, expanded, onToggle }: { cap: (typeof CAPS)[0]; expanded: boolean; onToggle: () => void }) {
  return (
    <div className={`cap-item dim-${cap.dim} ${expanded ? 'expanded' : ''}`}>
      <div className="cap-name">
        {cap.name} <span className="cap-count">{cap.count}项</span>
      </div>
      <div className="cap-desc">{cap.desc}</div>
      <div className="cap-subs">
        {cap.subs.map((s) => (
          <span key={s.name} className="cap-sub-tag">
            {s.name}
            <span className="sub-count">{s.n}</span>
          </span>
        ))}
      </div>
      <ul className="cap-checks">
        {cap.checks.map((c) => (
          <li key={c.n + c.x}>
            <span className="check-num">#{c.n}</span>
            {c.x}
          </li>
        ))}
      </ul>
      <button type="button" className="cap-more-btn" onClick={onToggle}>
        {expanded ? <>收起 <span className="arrow">▴</span></> : <>查看全部 {cap.count} 项 <span className="arrow">▾</span></>}
      </button>
      <div className="cap-full">
        <ul>
          {cap.full.map((c) => (
            <li key={c.n}>
              <span className="check-num">#{String(c.n).padStart(3, '0')}</span>
              {c.x}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function AssessmentLanding() {
  const [expandedRows, setExpandedRows] = useState<boolean[]>(() => CAPS.map(() => true))

  const toggleRow = (idx: number) => {
    setExpandedRows((prev) => {
      const next = [...prev]
      const rowStart = Math.floor(idx / 3) * 3
      const rowEnd = Math.min(rowStart + 3, CAPS.length)
      const willExpand = !next[idx]
      for (let i = rowStart; i < rowEnd; i++) next[i] = willExpand
      return next
    })
  }

  return (
    <div className="assessment-landing">
      {/* ━━━━ Hero ━━━━ */}
      <section className="hero">
        <div className="hero-bg-num">170</div>
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-eyebrow">AI 环境体检</div>
            <h1 className="hero-h1">
              你的AI环境<br />
              有 <span className="num">170</span> 个<br />
              你不知道的隐患
            </h1>
            <p className="hero-sub">
              170项检测，3分钟完成。<br />
              看看你的AI环境能打多少分。
            </p>
            <div className="hero-actions">
              <a href="#download" className="btn-solid">下载桌面端体检 →</a>
              <span className="dev-badge">桌面端开发中 · 内测报名</span>
              <a href="#caps" className="btn-text">了解检测能力</a>
            </div>
            <div className="hero-footnote">
              参与内测 · <b>享终身免费</b>
              <br />
              桌面端开发中 · 完整 170 项扫描即将开放 · macOS &amp; Windows
            </div>
          </div>
          <div className="hero-visual">
            <ScanPanel />
          </div>
        </div>
      </section>

      {/* ━━━━ Gap 沉默的信息差 ━━━━ */}
      <div className="divider" />
      <section className="gap" id="gap">
        <SR className="gap-header">
          <div className="gap-eyebrow">沉默的信息差</div>
          <h2 className="gap-title">
            你每天在用AI。<br />但这些事，<em>大多数人不知道</em>。
          </h2>
          <p className="gap-sub">只要你用过ChatGPT、Cursor、Claude或任何AI工具——你就有AI环境。而这些隐藏的问题，你可能从未想过。</p>
        </SR>
        <div className="gap-list">
          {[
            { num: '01', tag: '成本', cls: 'money', main: ['你订阅的多个AI工具', '可能'], em: '60%的功能是重叠的', cons: '你在为同一件事付三次费。大多数人同时拥有2-3个功能高度重叠的付费订阅，每月多花几百元却浑然不觉。' },
            { num: '02', tag: '隐私', cls: 'privacy', main: ['一个笔记插件', '为什么要'], em: '读取你所有的文件', cons: '你安装的AI插件往往拥有远超需要的权限。你的私密对话、代码草稿、浏览器记录——它们都能看到。' },
            { num: '03', tag: '安全', cls: 'data', main: ['你的API密钥', '可能正在'], em: '明文存储', cons: '配置文件中的密钥没有任何加密。任何能访问你电脑的人，都能直接复制它，使用你的付费额度。损失不可逆。' },
            { num: '04', tag: '性能', cls: 'perf', main: ['你的AI工具', '正在悄悄'], em: '吃掉你的电脑资源', cons: '模型缓存、对话日志、临时文件——AI工具产生的数据不断堆积。你的电脑越来越慢，磁盘空间越来越少。' },
          ].map((g) => (
            <SR key={g.num} className="gap-item">
              <div className="gap-num">{g.num}</div>
              <div>
                <div className={`gap-tag ${g.cls}`}>{g.tag}</div>
                <div className="gap-main">
                  {g.main[0]}<br />{g.main[1]}<em className={g.cls}>{g.em}</em>？
                </div>
                <div className="gap-consequence">{g.cons}</div>
              </div>
            </SR>
          ))}
        </div>
      </section>

      {/* Bridge */}
      <SR className="gap-bridge">
        <div className="gap-bridge-text">
          以上只是4个。<br />你的AI环境中，还有<strong>166</strong>个这样的检查点。
        </div>
        <div className="bridge-actions">
          <a href="#download" className="bridge-btn">看看你的环境有几个 →</a>
          <span className="bridge-hint">桌面端开发中 · 先报名内测</span>
        </div>
      </SR>

      {/* ━━━━ Caps 检测能力 ━━━━ */}
      <div className="divider cap-divider" />
      <section className="caps" id="caps">
        <SR className="caps-header">
          <div className="caps-eyebrow">检测能力</div>
          <h2 className="caps-title">
            <span className="accent">170</span>项检测<br />
            <span className="accent">7</span>大维度 · 28个子类
          </h2>
          <p className="gap-sub caps-sub">
            首期上线 <b>40+ 项核心检测</b>，桌面端全量 170 项扫描开放中。
          </p>
        </SR>

        <SR className="cap-overview">
          <div className="cap-overview-num">
            <div className="num">170</div>
            <div className="label">项检测能力</div>
          </div>
          <div className="cap-overview-bars">
            <div className="cap-overview-track">
              {CAPS.map((c, i) => (
                <div key={c.dim} className={`cap-overview-seg dim-${i}`} style={{ width: `${(c.count / 170) * 100}%` }} title={`${c.name} ${c.count}项`}>
                  <span>{c.name} {c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </SR>

        <div className="cap-list">
          {CAPS.map((cap, i) => (
            <CapCard key={cap.dim} cap={cap} expanded={expandedRows[i]} onToggle={() => toggleRow(i)} />
          ))}
        </div>
      </section>

      {/* ━━━━ Compare ━━━━ */}
      <div className="divider" />
      <SR className="compare-wrap">
        <section className="compare">
          <div className="compare-header">
            <div className="compare-eyebrow">两种模式</div>
            <h2 className="compare-title">
              打开只是开始。<br />桌面端解锁全部。
            </h2>
          </div>
          <div className="compare-grid">
            <div className="compare-col">
              <div className="compare-label">网页端</div>
              <div className="compare-col-title">先看看，再决定</div>
              <div className="compare-col-desc">不采集你的任何环境数据，先了解体检是什么。</div>
              <ul className="compare-items">
                <li><span className="check" /> 观看真实扫描过程演示</li>
                <li><span className="check" /> 了解 7 大维度检测能力</li>
                <li><span className="check" /> 查看示例报告长什么样</li>
                <li><span className="check" /> 报名内测 · 享终身免费</li>
              </ul>
            </div>
            <div className="compare-col highlight">
              <div className="compare-label">桌面端</div>
              <div className="compare-col-title">完整170项深度评分</div>
              <div className="compare-col-desc">3分钟全量扫描，一份完整的评分报告。</div>
              <ul className="compare-items">
                <li><span className="check" /> 本地AI软件全量扫描</li>
                <li><span className="check" /> 账号/权限/加密深度检测</li>
                <li><span className="check" /> 性能基准与缓存分析</li>
                <li><span className="check" /> 成本浪费检测与优化建议</li>
                <li><span className="check" /> 完整报告与修复指引</li>
              </ul>
            </div>
          </div>
          <div className="compare-note">
            所有检测均在<em>本地完成</em>，数据不上传，隐私不离开你的电脑。网页端不采集任何环境数据。
          </div>
        </section>
      </SR>

      {/* ━━━━ Trust Bar ━━━━ */}
      <SR className="trust-bar">
        <div className="trust-inner">
          <div className="trust-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            <span><strong>数据不出本机</strong> · 检测全部本地完成</span>
          </div>
          <div className="trust-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            <span><strong>检测透明可查</strong> · 每一项都有明确判定</span>
          </div>
          <div className="trust-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            <span><strong>内测用户先行</strong> · 反馈驱动迭代</span>
          </div>
        </div>
      </SR>

      {/* ━━━━ 全站功能下载引导 ━━━━ */}
      <SR className="site-cta">
        <div className="site-cta-eyebrow">ArcDock 桌面端</div>
        <h2 className="site-cta-title">
          一个桌面端，<br />管好你的<em className="accent">整个 AI 世界</em>
        </h2>
        <p className="site-cta-sub">不只是体检。ArcDock 桌面端把站内所有能力装进一个应用——从发现工具到管理风险，一站式搞定。</p>
        <div className="site-cta-grid">
          {[
            { cls: 'green', stroke: 'var(--green)', title: 'AI 体检', desc: '170 项全量扫描，发现风险、给出修复方案', path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
            { cls: 'blue', stroke: 'var(--blue)', title: '软件管家', desc: 'AI 世界的导航，发现并管理你的每一件装备', path: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
            { cls: 'violet', stroke: 'var(--violet)', title: '学习中心', desc: '从会找到会用，一步步点亮你的 AI 技能', path: 'M22 10v6M2 10l10-5 10 5-10 5z' },
            { cls: 'amber', stroke: 'var(--amber)', title: '中转站', desc: '一个密钥，调用全部大模型，智能路由更省钱', path: 'M2 5h20v14H2z' },
          ].map((c) => (
            <div key={c.title} className="site-cta-card">
              <div className={`ico ${c.cls}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke={c.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={c.path} /></svg>
              </div>
              <h4>{c.title}</h4>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
        <div className="site-cta-actions">
          <a href="#download" className="site-cta-btn">下载桌面端 →</a>
          <span className="site-cta-hint">桌面端开发中 · 报名内测 <b>享终身免费</b></span>
        </div>
      </SR>
    </div>
  )
}
