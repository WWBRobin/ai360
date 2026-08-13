import { registerSections, PageBuilder } from '@/config/PageBuilder'
import { homepageSections } from '@/config/homepage'

// 注册 Section 组件
registerSections({
  HeroSection: require('@/sections/HeroSection').default,
  CategoryGrid: require('@/sections/CategoryGrid').default,
  EditorPicks: require('@/sections/EditorPicks').default,
  ArticleList: require('@/sections/ArticleList').default,
  CTABanner: require('@/sections/CTABanner').default,
  PlatformNav: require('@/sections/PlatformNav').default,
  SubscribeSection: require('@/sections/SubscribeSection').default,
})

// ISR
export const revalidate = 300

export default function HomePage() {
  return <PageBuilder sections={homepageSections} />
}
