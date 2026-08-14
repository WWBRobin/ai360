'use client'

import { useEffect, useState } from 'react'

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    console.error('页面渲染错误:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6" aria-hidden>
          😵
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          页面出错了
        </h1>
        <p className="text-gray-500 mb-4">
          抱歉，页面加载时遇到了问题。
        </p>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-gray-400 underline mb-4"
        >
          {showDetails ? '隐藏详情' : '查看错误详情'}
        </button>
        
        {showDetails && (
          <div className="text-left bg-gray-50 rounded-lg p-4 mb-4 overflow-auto">
            <p className="text-xs text-red-600 font-mono break-all mb-2">
              {error.message}
            </p>
            <p className="text-xs text-gray-500 font-mono break-all">
              {error.stack?.substring(0, 500)}
            </p>
          </div>
        )}
        
        {error.digest && (
          <p className="text-xs text-gray-400 mb-6 break-all">
            错误编号：{error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => retry()}
            className="
              px-6 py-2.5
              bg-[var(--primary)] text-[var(--on-primary)]
              font-medium text-sm
              rounded-lg
              hover:bg-[var(--fg)]
              transition-colors
            "
          >
            重试
          </button>
          <a
            href="/"
            className="
              px-6 py-2.5
              bg-[var(--card)] text-gray-700
              font-medium text-sm
              rounded-lg
              border border-gray-300
              hover:bg-gray-50
              transition-colors
            "
          >
            返回首页
          </a>
        </div>
      </div>
    </div>
  )
}
