/**
 * 新闻正文渲染 — 零依赖轻量方案。
 *
 * 项目没有 markdown 渲染器，也不为此新增重依赖：
 * 1. 优先按 markdown 结构化解析：##/### 标题、- 列表、1. 有序列表、> 引用、普通段落；
 * 2. 解析结果为空时回退为纯段落 split('\n\n') 渲染；
 * 3. 行内 **bold** 转换为 <strong>（唯一做转义的行内语法，够用且安全）。
 */

type Block =
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'quote'; text: string }
  | { kind: 'p'; text: string }

/** 单行文本 → 安全 HTML：先 HTML 转义，再把 **xx** 转成 <strong> */
function inlineHtml(raw: string): string {
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

function parseBlocks(content: string): Block[] {
  const lines = content.split('\n')
  const blocks: Block[] = []
  let ul: string[] = []
  let ol: string[] = []
  let para: string[] = []

  const flushAll = () => {
    if (ul.length) {
      blocks.push({ kind: 'ul', items: ul })
      ul = []
    }
    if (ol.length) {
      blocks.push({ kind: 'ol', items: ol })
      ol = []
    }
    if (para.length) {
      blocks.push({ kind: 'p', text: para.join(' ') })
      para = []
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      // 空行：收束当前段落/列表
      flushAll()
      continue
    }
    if (/^#{2}\s+/.test(line) || /^#{1}\s+/.test(line)) {
      flushAll()
      blocks.push({ kind: 'h2', text: line.replace(/^#+\s+/, '') })
      continue
    }
    if (/^#{3,}\s+/.test(line)) {
      flushAll()
      blocks.push({ kind: 'h3', text: line.replace(/^#+\s+/, '') })
      continue
    }
    if (/^>\s?/.test(line)) {
      flushAll()
      blocks.push({ kind: 'quote', text: line.replace(/^>\s?/, '') })
      continue
    }
    if (/^[-*]\s+/.test(line)) {
      if (para.length || ol.length) flushAll()
      ul.push(line.replace(/^[-*]\s+/, ''))
      continue
    }
    if (/^\d+[.、]\s+/.test(line)) {
      if (para.length || ul.length) flushAll()
      ol.push(line.replace(/^\d+[.、]\s+/, ''))
      continue
    }
    // 普通文本行：连续列表被打断时收束列表
    if (ul.length || ol.length) flushAll()
    para.push(line)
  }
  flushAll()
  return blocks
}

export default function NewsContent({ content }: { content: string }) {
  const blocks = parseBlocks(content)

  // 兜底：解析不到任何块（如整段无换行的长文本）→ 按空行 split 渲染段落
  if (blocks.length === 0) {
    const paras = content.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean)
    if (paras.length === 0) return null
    return (
      <div className="news-content">
        {paras.map((p, i) => (
          <p key={i} dangerouslySetInnerHTML={{ __html: inlineHtml(p) }} />
        ))}
      </div>
    )
  }

  return (
    <div className="news-content">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'h2':
            return <h2 key={i} dangerouslySetInnerHTML={{ __html: inlineHtml(b.text) }} />
          case 'h3':
            return <h3 key={i} dangerouslySetInnerHTML={{ __html: inlineHtml(b.text) }} />
          case 'ul':
            return (
              <ul key={i}>
                {b.items.map((it, j) => (
                  <li key={j} dangerouslySetInnerHTML={{ __html: inlineHtml(it) }} />
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={i}>
                {b.items.map((it, j) => (
                  <li key={j} dangerouslySetInnerHTML={{ __html: inlineHtml(it) }} />
                ))}
              </ol>
            )
          case 'quote':
            return <blockquote key={i} dangerouslySetInnerHTML={{ __html: inlineHtml(b.text) }} />
          case 'p':
            return <p key={i} dangerouslySetInnerHTML={{ __html: inlineHtml(b.text) }} />
        }
      })}
    </div>
  )
}
