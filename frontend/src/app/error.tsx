'use client' // 错误边界必须是客户端组件（Next.js 16: 使用 retry prop）

import { useEffect } from 'react'

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    // 上报错误到监控服务
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
        <p className="text-gray-500 mb-8">
          抱歉，页面加载时遇到了问题。请稍后重试，或返回首页继续浏览。
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-6 break-all">
            错误编号：{error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => retry()}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            重试
          </button>
          <a
            href="/"
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            返回首页
          </a>
        </div>
      </div>
    </div>
  )
}
