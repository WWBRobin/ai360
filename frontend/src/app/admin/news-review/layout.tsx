import NewsReviewPage from './page'

// 禁止收录（client 页面无法直接导出 metadata，包一层 server layout）
export const metadata = { robots: { index: false, follow: false } }

export default function NewsReviewLayout() {
  return <NewsReviewPage />
}
