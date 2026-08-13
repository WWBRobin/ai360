'use client'

/**
 * 代码块（带复制按钮）
 *
 * 客户端组件：依赖 navigator.clipboard + useState。
 * 在 Skill 详情页「安装方式」区块里渲染命令行安装代码。
 */

import { useState } from 'react'

export default function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 降级：浏览器不支持/非 HTTPS 时静默失败，用户可手动选中复制
    }
  }

  return (
    <div className="mt-2 relative group">
      <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg px-3 py-2 overflow-x-auto">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition px-2 py-1 text-[10px] bg-gray-700 hover:bg-gray-600 text-white rounded"
        aria-label="复制代码"
      >
        {copied ? '✓ 已复制' : '复制'}
      </button>
    </div>
  )
}
