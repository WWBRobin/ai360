'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * 扫描面板 — 体检过程演示（v10 原型收编）
 * 动画参数：TICK_MS=70 × TOTAL_TICKS=90 ≈ 6.3s 扫描至 47% 停止（演示性截断）
 * 完成序列：COMPLETE → 七维条填满 → fastLogRoll 刷 170 条 → 评分 73 → 指标轮播
 * 数据全为演示数据（面板是过程演示，真实扫描属桌面端）
 */

const CIRC = 2 * Math.PI * 56
const TARGET_PCT = 47
const TICK_MS = 70
const TOTAL_TICKS = 90
const MAX_LOG_LINES = 5

const PHASES: [number, string][] = [
  [0, '初始化'], [3, '扫描凭证'], [10, '检查权限'],
  [20, '扫描工具'], [32, '分析重叠'], [45, '评估性能'],
  [55, '检测缓存'], [68, '计算效率'], [80, '生成报告'],
  [90, '扫描完成'],
]

const LOG_POOL = [
  { t: 'pass', i: '', n: '#001', x: 'ChatGPT 会话加密已启用', c: 'security' },
  { t: 'fail', i: '', n: '#007', x: 'API密钥明文存储，存在风险', c: 'security' },
  { t: 'warn', i: '⚠', n: '#013', x: '笔记插件拥有过度文件权限', c: 'security' },
  { t: 'pass', i: '', n: '#021', x: 'Claude TLS传输加密正常', c: 'security' },
  { t: 'fail', i: '', n: '#029', x: 'Cursor配置发现未授权访问', c: 'security' },
  { t: 'pass', i: '', n: '#043', x: 'Cursor 版本最新 v0.47', c: 'tools' },
  { t: 'warn', i: '⚠', n: '#051', x: 'Windsurf 检测到旧版本 v0.38', c: 'tools' },
  { t: 'pass', i: '', n: '#062', x: 'Copilot 运行正常', c: 'tools' },
  { t: 'warn', i: '⚠', n: '#074', x: 'ChatGPT桌面版未启用自动更新', c: 'tools' },
  { t: 'pass', i: '', n: '#081', x: '内存使用率在正常范围', c: 'perf' },
  { t: 'warn', i: '⚠', n: '#093', x: 'AI缓存累计占用4.2GB', c: 'perf' },
  { t: 'pass', i: '', n: '#104', x: 'GPU加速已启用', c: 'perf' },
  { t: 'warn', i: '⚠', n: '#117', x: '检测到2个冗余AI后台进程', c: 'perf' },
  { t: 'pass', i: '', n: '#129', x: '工作流自动化覆盖率68%', c: 'efficiency' },
  { t: 'warn', i: '⚠', n: '#139', x: 'ChatGPT Plus 3个功能未使用', c: 'efficiency' },
  { t: 'pass', i: '', n: '#151', x: '快捷键配置完整', c: 'efficiency' },
  { t: 'warn', i: '⚠', n: '#163', x: '发现3项重复操作可优化', c: 'efficiency' },
  { t: 'pass', i: '', n: '#170', x: '多端数据同步一致', c: 'efficiency' },
]

/* 七维：dimRanges 键与 bars 键必须一致（历史崩溃教训） */
const DIMS = [
  { key: 'security', name: '安全', target: 60 },
  { key: 'performance', name: '性能', target: 45 },
  { key: 'resource', name: '资源', target: 48 },
  { key: 'connection', name: '连接', target: 42 },
  { key: 'asset', name: '资产', target: 55 },
  { key: 'cost', name: '成本', target: 52 },
  { key: 'intelligence', name: '智能度', target: 38 },
] as const

const DIM_RANGES = [
  { key: 'security', start: 0, end: 15 },
  { key: 'performance', start: 15, end: 30 },
  { key: 'resource', start: 30, end: 45 },
  { key: 'connection', start: 45, end: 60 },
  { key: 'asset', start: 60, end: 75 },
  { key: 'cost', start: 75, end: 90 },
  { key: 'intelligence', start: 90, end: 100 },
]

interface LogItem { id: number; t: string; i: string; n: string; x: string; c: string }

function fmtTime(sec: number) {
  return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0')
}

export default function ScanPanel() {
  const [pct, setPct] = useState(0)
  const [done, setDone] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [logs, setLogs] = useState<LogItem[]>([{ id: 0, t: 'pass', i: '', n: '', x: '系统初始化完成', c: 'security' }])
  const [metrics, setMetrics] = useState({ scanned: 0, issues: 0, phase: '初始化', timer: '00:00' })
  const [carousel, setCarousel] = useState({ label: ['已扫描', '发现问题', '当前阶段'], value: ['', '', ''] })
  const [dimPcts, setDimPcts] = useState<Record<string, number>>(() => Object.fromEntries(DIMS.map((d) => [d.key, 0])))
  const [activeDim, setActiveDim] = useState<string | null>(null)
  const [alertShown, setAlertShown] = useState(false)

  const logIdRef = useRef(1)
  const logIdxRef = useRef(0)
  const issueRef = useRef(0)
  const scoreCleanupRef = useRef<(() => void) | null>(null)
  const fastLogCleanupRef = useRef<(() => void) | null>(null)

  const pushLog = (elapsedSec: number, overrideNum?: string) => {
    const entry = LOG_POOL[logIdxRef.current % LOG_POOL.length]
    logIdxRef.current++
    if (entry.t === 'fail' || entry.t === 'warn') issueRef.current++
    const item: LogItem = {
      id: logIdRef.current++,
      t: entry.t, i: entry.i,
      n: overrideNum ?? entry.n,
      x: entry.x, c: entry.c,
    }
    setLogs((prev) => {
      const next = [...prev, item]
      return next.length > MAX_LOG_LINES ? next.slice(next.length - MAX_LOG_LINES) : next
    })
  }

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    let interval: ReturnType<typeof setInterval> | null = null
    let carouselTimer: ReturnType<typeof setInterval> | null = null

    const getPhase = (p: number) => {
      let r = PHASES[0][1]
      for (const [at, txt] of PHASES) if (p >= at) r = txt
      return r
    }
    const getActiveDim = (p: number) => {
      for (const d of DIM_RANGES) if (p >= d.start && p < d.end) return d.key
      return 'intelligence'
    }

    const countScore = () => {
      let v = 0
      const iv = setInterval(() => {
        v += Math.ceil((73 - v) / 6)
        if (v >= 73) { v = 73; clearInterval(iv) }
        setScore(v)
      }, 70)
      scoreCleanupRef.current = () => clearInterval(iv)
    }

    const startCarousel = () => {
      const datasets = [
        { label: ['已扫描', '发现风险', '预计节省'], value: ['170 / 170', '8 项', '¥287/月'] },
        { label: ['发现问题', '安全风险', '隐私泄漏'], value: ['8', '3 项', '2 项'] },
        { label: ['扫描完成', '生成建议', '优化空间'], value: ['查看报告 →', '12 条', '68%'] },
      ]
      let setIdx = 0
      carouselTimer = setInterval(() => {
        setIdx = (setIdx + 1) % datasets.length
        setCarousel(datasets[setIdx])
      }, 3500)
    }

    const fastLogRoll = () => {
      const BATCH = 4
      const TOTAL = 170
      const FRAME = 55
      let pushed = 0
      const iv2 = setInterval(() => {
        for (let k = 0; k < BATCH; k++) {
          pushLog(Math.floor((pushed * 90) / TOTAL), `#${String(pushed + 1).padStart(3, '0')}`)
          pushed++
          if (pushed >= TOTAL) {
            clearInterval(iv2)
            return
          }
        }
      }, FRAME)
      fastLogCleanupRef.current = () => clearInterval(iv2)
    }

    let tick = 0
    const startTimer = setTimeout(() => {
      interval = setInterval(() => {
        tick++
        const elapsed = Math.floor((tick * TICK_MS) / 1000)
        const p = Math.min(Math.round((tick / TOTAL_TICKS) * 100), TARGET_PCT)

        setPct(p)
        const scanned = Math.round((p / 100) * 170)
        setMetrics({
          scanned, issues: issueRef.current,
          phase: getPhase(p), timer: fmtTime(elapsed),
        })

        setDimPcts(() => {
          const next: Record<string, number> = {}
          for (const d of DIM_RANGES) {
            const t = DIMS.find((b) => b.key === d.key)!.target
            if (p >= d.end) next[d.key] = t
            else if (p > d.start) next[d.key] = Math.round(((p - d.start) / (d.end - d.start)) * t)
            else next[d.key] = 0
          }
          return next
        })
        setActiveDim(getActiveDim(p))

        if (tick % 14 === 0) pushLog(elapsed)
        if (p >= 35 && !alertShown) setAlertShown(true)

        if (tick >= TOTAL_TICKS) {
          if (interval) clearInterval(interval)
          setDone(true)

          setDimPcts(Object.fromEntries(DIMS.map((d) => [d.key, d.target])))
          setActiveDim(null)
          setMetrics((m) => ({ ...m, phase: '扫描完成' }))

          fastLogRoll()
          countScore()
          const ct = setTimeout(startCarousel, 2000)
          timers.push(ct)
        }
      }, TICK_MS)
    }, 300)
    timers.push(startTimer)

    return () => {
      if (interval) clearInterval(interval)
      if (carouselTimer) clearInterval(carouselTimer)
      timers.forEach(clearTimeout)
      if (scoreCleanupRef.current) scoreCleanupRef.current()
      if (fastLogCleanupRef.current) fastLogCleanupRef.current()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const offset = CIRC - (CIRC * pct) / 100
  const scannedNum = Math.round((pct / 100) * 170)

  return (
    <div className={`scan-panel ${done ? 'completing' : ''}`} id="scan-panel">
      <div className="panel-border-glow" />
      <div className={`scan-sweep ${done ? '' : 'active'}`} />

      {/* 状态栏 */}
      <div className="panel-status-bar">
        <div className="status-left">
          <span className="status-logo">ArcDock</span>
          <span className="status-label">ENVIRONMENT SCAN · 170 ITEMS</span>
        </div>
        <div className="status-right">
          <span className={`status-live ${done ? 'complete' : ''}`}>{done ? 'COMPLETE' : 'LIVE'}</span>
          <span className={`status-dot ${done ? 'complete' : ''}`} />
          <span className="status-time">{metrics.timer}</span>
        </div>
      </div>

      {/* 主检测区 */}
      <div className="panel-main">
        <div className="progress-ring-wrap">
          <div className={`pulse-ring ${done ? '' : 'active'}`} />
          <div className={`pulse-ring r2 ${done ? '' : 'active'}`} />
          <svg className="progress-ring" viewBox="0 0 140 140">
            <defs>
              <linearGradient id="scan-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--green)" />
                <stop offset="100%" stopColor="var(--blue)" />
              </linearGradient>
            </defs>
            <circle className="progress-ring-ticks" cx="70" cy="70" r="61.6" />
            <circle className="progress-ring-bg" cx="70" cy="70" r="56" />
            <circle className="progress-ring-inner" cx="70" cy="70" r="40" />
            <circle className="progress-ring-fill" cx="70" cy="70" r="56" style={{ strokeDashoffset: offset }} />
          </svg>
          <div className="progress-center">
            <span className="progress-pct">
              {done ? 170 : scannedNum}
              <span className="pct-unit">项</span>
            </span>
            <span className="progress-label">{done ? '已检测 / 170' : '已检测 / 170'}</span>
          </div>
        </div>

        <div className="metrics-cards">
          <div className="metric-card scanned">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
            </div>
            <div className="metric-body">
              <span className="metric-label">{carousel.label[0]}</span>
              <span className="metric-value">{carousel.value[0] || `${done ? 170 : scannedNum} / 170`}</span>
            </div>
          </div>
          <div className="metric-card issues">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            </div>
            <div className="metric-body">
              <span className="metric-label">{carousel.label[1]}</span>
              <span className="metric-value issues-val">{carousel.value[1] || metrics.issues}</span>
            </div>
          </div>
          <div className="metric-card phase">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <div className="metric-body">
              <span className="metric-label">{carousel.label[2]}</span>
              <span className="metric-value phase-val">{carousel.value[2] || metrics.phase}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 七维细线条 */}
      <div className="panel-dim-bars">
        {DIMS.map((d) => (
          <div key={d.key} className={`dim-bar-item ${activeDim === d.key ? 'active' : ''}`} data-dim={d.key}>
            <span className={`dim-bar-label ${d.key}`}>
              <span className="dim-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--fg2)" strokeWidth="2.5" strokeLinecap="round">
                  {d.key === 'security' && <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />}
                  {d.key === 'performance' && <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />}
                  {d.key === 'resource' && <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>}
                  {d.key === 'connection' && <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>}
                  {d.key === 'asset' && <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>}
                  {d.key === 'cost' && <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>}
                  {d.key === 'intelligence' && <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z" />}
                </svg>
              </span>
              {d.name}
            </span>
            <div className="dim-bar-track">
              <div className={`dim-line-fill ${d.key} ${dimPcts[d.key] > 20 || done ? 'has-glow' : ''}`} style={{ width: `${dimPcts[d.key]}%` }} />
            </div>
            <span className="dim-bar-pct">{dimPcts[d.key]}%</span>
          </div>
        ))}
      </div>

      {/* 终端日志 */}
      <div className="panel-log-section">
        <div className="log-section-header">
          <span className="log-section-dot" />
          <span className="log-section-title">Scan Log</span>
        </div>
        <div className="scan-log">
          {logs.map((l) => (
            <div key={l.id} className={`log-item ${l.t} log-enter`}>
              <span className="log-time">{metrics.timer}</span>
              <span className="log-icon">{l.i}</span>
              <span className="log-num">{l.n}</span>
              <span className="log-text">{l.x}</span>
              <span className={`log-tag ${l.c}`}>{l.c.toUpperCase()}</span>
            </div>
          ))}
        </div>
        <span className={`terminal-cursor ${done ? '' : 'visible'}`} />
      </div>

      {/* 关键发现告警 */}
      <div className={`panel-alert ${alertShown ? 'visible' : ''}`}>
        <div className="alert-row">
          <span className="alert-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01" /></svg>
          </span>
          <span className="alert-label">关键发现</span>
          <span className="alert-text">
            检测到 <strong>2 个 API 密钥明文存储</strong>，存在泄露风险
          </span>
        </div>
      </div>

      {/* 评分区 */}
      <div className={`panel-footer ${done ? 'visible score-reveal' : ''}`}>
        <div className="score-wrap">
          <span className="score-num">{score ?? '--'}</span>
          <span className="score-unit">分</span>
          <span className="score-of">满分 100</span>
        </div>
        <div className="score-compare">
          <span className="score-avg">行业平均 61</span>
          <span className="score-diff">高出12分 <span className="arrow">↑</span></span>
        </div>
      </div>
    </div>
  )
}
