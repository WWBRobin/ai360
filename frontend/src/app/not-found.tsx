import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-7xl font-extrabold text-indigo-100 mb-4" aria-hidden>
          404
        </div>
        <div className="text-5xl mb-6" aria-hidden>
          🔍
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          找不到这个页面
        </h1>
        <p className="text-gray-500 mb-8">
          你访问的页面不存在，可能已被移除或链接有误。试试回到首页，发现好工具。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            返回首页
          </Link>
          <Link
            href="/essential"
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            装机必备
          </Link>
        </div>
      </div>
    </div>
  )
}
