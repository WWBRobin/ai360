'use client'

import { useState } from 'react'
import type { LampTable } from '@/lib/lamp-data'
import { starCount } from '@/lib/lamp-data'
import { findToolLink, stars } from '@/lib/star-meta'
import type { ChoiceEvent } from '@/hooks/useLampState'

/**
 * 评判矩阵（v3 新增）：工具方案表格 → 可交互卡片行。
 * 每行：工具名 / 效果星级 / 成本 / 难度 / 适合层级 / 直达(new tab) / 提示词复制。
 * 点击记录选择（choice_order + switched_from 切换链）。
 *
 * 视觉：沿用原型 .tool-table 的 mcp.so 克制风（10px 圆角卡片化）。
 * 表头兼容各灯不同列名（方案/工具/路线 | 上手难度 | 效果 | 成本 | 适合/一句话结论）。
 */

const LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5']

interface MatrixRowData {
  name: string
  nameCell: string
  difficulty: string
  effect: string
  cost: string
  fit: string
}

function parseRows(table: LampTable): MatrixRowData[] {
  const h = table.headers.map((x) => x.trim())
  const idx = (...names: string[]) => h.findIndex((x) => names.some((n) => x.includes(n)))
  const iName = Math.max(idx('方案', '工具', '路线'), 0)
  const iDiff = idx('上手难度', '难度')
  const iEffect = idx('效果')
  const iCost = idx('成本')
  const iFit = Math.max(idx('适合', '一句话结论', '结论'), h.length - 1)

  return table.rows.map((r) => {
    const nameCell = r[iName] || ''
    // 名称里常带括号链接（space.coze.cn/...），剥出来做直达
    const name = nameCell.replace(/[（(].*?[)）]/g, '').replace(/".*?"/g, '').trim()
    return {
      name,
      nameCell,
      difficulty: iDiff >= 0 ? r[iDiff] || '' : '',
      effect: iEffect >= 0 ? r[iEffect] || '' : '',
      cost: iCost >= 0 ? r[iCost] || '' : '',
      fit: iFit >= 0 ? r[iFit] || '' : '',
    }
  })
}

/** 从"适合"列提取 L1-L5 标签 */
function fitLevel(fit: string): string {
  const m = fit.match(/L[1-5]/)
  return m ? m[0] : '通用'
}

export default function MatrixTable({
  lampSlug,
  table,
  selectedTool,
  onSelect,
}: {
  lampSlug: string
  table: LampTable
  selectedTool: string | null
  onSelect: (ev: ChoiceEvent) => void
}) {
  const [copied, setCopied] = useState<string | null>(null)
  const rows = parseRows(table)

  async function copyPrompt(prompt: string, key: string) {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(key)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      // Safari 老版本降级
      const ta = document.createElement('textarea')
      ta.value = prompt
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
      setCopied(key)
      setTimeout(() => setCopied(null), 1600)
    }
  }

  return (
    <div className="lamp-matrix">
      <div className="lamp-matrix-hint">点击工具行记录你的选择——换工具时自动记切换链；诊断时会自动带出</div>
      <div className="lamp-matrix-list">
        {rows.map((row) => {
          const link = findToolLink(row.name)
          const key = link?.match || row.name.slice(0, 12)
          const active = selectedTool === key || (selectedTool && row.name.includes(selectedTool))
          const effN = starCount(row.effect)
          return (
            <div
              key={key}
              className={`lamp-tool-card${active ? ' active' : ''}`}
              data-active={active ? 'true' : 'false'}
              role="button"
              tabIndex={0}
              onClick={() =>
                onSelect({
                  lamp_slug: lampSlug,
                  tool_key: key,
                  tool_name: row.nameCell.slice(0, 120),
                  choice_order: selectedTool && !active ? 2 : 1,
                  switched_from: selectedTool && !active ? selectedTool : null,
                })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  ;(e.currentTarget as HTMLElement).click()
                }
              }}
            >
              <div className="lamp-tool-main">
                <div className="lamp-tool-name">
                  {row.name}
                  {active && <span className="lamp-tool-chosen">✓ 已选</span>}
                </div>
                <div className="lamp-tool-fit">{row.fit}</div>
              </div>
              <div className="lamp-tool-dims">
                <span className="dim">
                  <i>效果</i>
                  <b className="lamp-stars">{effN ? stars(effN) : row.effect}</b>
                </span>
                <span className="dim">
                  <i>难度</i>
                  <b className="lamp-stars">{starCount(row.difficulty) ? stars(starCount(row.difficulty)) : row.difficulty}</b>
                </span>
                <span className="dim">
                  <i>成本</i>
                  <b className="lamp-cost">{row.cost || '—'}</b>
                </span>
                <span className="dim">
                  <i>适合</i>
                  <b className="lamp-level">{fitLevel(row.fit)}</b>
                </span>
              </div>
              <div className="lamp-tool-acts" onClick={(e) => e.stopPropagation()}>
                {link && (
                  <a
                    className="lamp-act-btn go"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      onSelect({
                        lamp_slug: lampSlug,
                        tool_key: key,
                        tool_name: row.nameCell.slice(0, 120),
                        choice_order: selectedTool && !active ? 2 : 1,
                        switched_from: selectedTool && !active ? selectedTool : null,
                      })
                    }
                  >
                    直达 ↗
                  </a>
                )}
                {link?.prompt && (
                  <button
                    type="button"
                    className="lamp-act-btn copy"
                    onClick={() => copyPrompt(link.prompt!, key)}
                  >
                    {copied === key ? '已复制 ✓' : '复制提示词'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="lamp-matrix-note">
        矩阵口径：效果=横评实测水平 · 成本=官方价格核实 · 难度=上手上手门槛 · 适合=L1-L5 分层
        {LEVELS.length ? '' : ''}
      </div>
    </div>
  )
}
