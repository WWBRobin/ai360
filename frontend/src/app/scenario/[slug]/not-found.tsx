import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4" aria-hidden>
        🎯
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">场景不存在</h1>
      <p className="text-gray-500 mb-8">
        你访问的场景可能已被移除或链接有误。
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
  )
}
