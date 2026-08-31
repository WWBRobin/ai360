'use client'

import { useEffect, useRef, useState } from 'react'
import './skillcheck.css'

/* Scroll Reveal（与 assessment 同款） */
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

/* 演示面板行 */
const DEMO_ROWS: { name: string; score: string; cls: string }[] = [
  { name: 'email-optimizer', score: '82 分 · 数据外传', cls: 'bad' },
  { name: 'deep-trans', score: '34 分 · 剪贴板访问', cls: 'warn' },
  { name: 'web-search', score: '0 分 · 通过', cls: 'ok' },
  { name: 'skill-vetter', score: '0 分 · 通过', cls: 'ok' },
  { name: '其余 17 个…', score: '全部通过', cls: 'ok' },
]

export default function SkillCheckLanding() {
  return (
    <main className="skc-wrap">
      {/* ── Hero ── */}
      <section className="skc-hero">
        <div className="skc-hero-l">
          <span className="skc-kicker">NVIDIA 研究数据 · 每 4 个公开 Skill 就有 1 个带漏洞</span>
          <h1>
            你随手装的 Skill，<br />
            可能正在<span className="em-bad">偷你的钥匙</span>。
          </h1>
          <p className="skc-lede">
            AI Skill 以<b>完整系统权限</b>运行——读环境变量、执行命令、访问文件，全凭信任。ArcDock
            给每个 Skill 过 <b>71 项风险安检</b>（17 类风险）：装前拦截、装完复查、货架全检，全程<b>本地运行</b>
            ，你的内容不上传。
          </p>
          <div className="skc-hstats">
            <div className="skc-hstat">
              <b className="bad">26.1%</b>
              <span>公开 Skill 存在漏洞</span>
            </div>
            <div className="skc-hstat">
              <b className="bad">5.2%</b>
              <span>明确恶意</span>
            </div>
            <div className="skc-hstat">
              <b className="good">71 项</b>
              <span>检测逐项全查</span>
            </div>
          </div>
          <div className="skc-hsrc">数据来源：NVIDIA 对 42,447 个公开 Agent Skill 的安全研究（2026）</div>
          <div className="skc-hacts">
            <a className="skc-pcta" href="/subscribe">下载桌面端 · 开始 Skill 安检 ▸</a>
            <span className="skc-scta">先看看安检报告长什么样</span>
          </div>
          <div className="skc-hnote">Web 版为演示 · 真实扫描需要读取本地容器，在桌面端完成 · macOS / Windows</div>
        </div>

        {/* 演示面板（桌面端截图位，与AI体检页 ScanPanel 同家族语法） */}
        <div className="skc-hero-r">
          <div className="skc-panel">
            <div className="skc-cap">
              <span>Skill 安检 · Hermes</span>
              <span>21 个 Skill</span>
            </div>
            {DEMO_ROWS.map((r) => (
              <div className="skc-pline" key={r.name}>
                <span>{r.name}</span>
                <span className={r.cls}>{r.score}</span>
              </div>
            ))}
            <div className="skc-pbar">
              <i />
            </div>
            <div className="skc-pline last">
              <span>安检进度 14/21</span>
              <span>预计 26 秒</span>
            </div>
            <span className="skc-demo-tag">桌面端演示画面</span>
          </div>
        </div>
      </section>

      {/* ── 三特性 ── */}
      <SR className="skc-feats">
        <div className="skc-feat">
          <b>装前拦截</b>
          <p>
            从装机必备或 Skill 中心装任何 Skill，安装流程里<b>自动过安检</b>
            ——风险分 0-100，高危直接拦，可疑项人工确认后才继续。
          </p>
        </div>
        <div className="skc-feat">
          <b>存量全检</b>
          <p>
            已经在用的 Skill 也能全查：一键全量安检，<b>提示注入 / 数据外传 / 供应链投毒 / 记忆投毒</b>
            …17 类风险逐一排查，出报告给处置建议。
          </p>
        </div>
        <div className="skc-feat">
          <b>全程本地</b>
          <p>
            扫描在你电脑上完成，AI 语义复核也可走<b>本地模型</b>。Skill 内容、环境信息、密钥——
            <b>一个字节都不出你的机器</b>。
          </p>
        </div>
      </SR>

      {/* ── 流程带 ── */}
      <SR>
        <section className="skc-flow">
          <h3>安检怎么跑</h3>
          <div className="skc-frow">
            <div className="skc-fstep">
              <div className="no">STEP 1</div>
              <b>静态扫描</b>
              <span>71 项检测 · 17 类风险：正则 + 语法树 + 病毒签名 + 实时 CVE 库，秒级出结果</span>
            </div>
            <div className="skc-fstep">
              <div className="no">STEP 2</div>
              <b>AI 语义复核</b>
              <span>本地大模型读懂自然语言里藏的意图——静态规则看不见的那部分</span>
            </div>
            <div className="skc-fstep">
              <div className="no">STEP 3</div>
              <b>风险分 + 报告</b>
              <span>0-100 分四级建议；高危项看明细：它想干什么、动你什么、怎么处置</span>
            </div>
            <div className="skc-fstep">
              <div className="no">STEP 4</div>
              <b>一键处置</b>
              <span>卸载 / 隔离 / 保留待观察，处置完复扫验证，全程可回滚</span>
            </div>
          </div>
        </section>
      </SR>

      {/* ── CTA 尾 ── */}
      <SR>
        <section className="skc-tail">
          <div>
            <b>货架 307 条，42 条已带安检分，全量推进中。</b>
            <br />
            <span>逛 Skill 中心时，先看安检分再看评分——别人不敢保证的事，我们先做到。</span>
          </div>
          <a className="skc-tcta" href="/subscribe">下载桌面端 ▸</a>
        </section>
      </SR>
    </main>
  )
}
