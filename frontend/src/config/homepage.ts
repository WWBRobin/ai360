/**
 * 首页布局配置
 * 
 * 改首页布局 = 改这个数组。不碰组件代码。
 * 
 * 示例：
 * - 调换顺序：把 EditorPicks 移到 CategoryGrid 前面
 * - 隐藏区块：加 enabled: false
 * - 加新区块：在 sections/ 下创建组件 + 加到这里
 */

import type { SectionConfig } from './PageBuilder'

export const homepageSections: SectionConfig[] = [
  { component: 'HeroSection', props: {} },
  { component: 'CategoryGrid', props: { columns: 3 } },
  { component: 'EditorPicks', props: { totalSkills: 528 } },
  { component: 'ArticleList', props: { count: 4 } },
  { component: 'CTABanner', props: {} },
  { component: 'PlatformNav', props: {} },
  { component: 'SubscribeSection', props: {} },
]
