/**
 * 首页布局配置 v2
 * 
 * 用户心智：平台选择 → 场景需求 → 精选评测 → 新手入门
 * 搜索在导航栏，不占首屏
 */

import type { SectionConfig } from './PageBuilder'

export const homepageSections: SectionConfig[] = [
  { component: 'HeroSection', props: {} },        // 精简Hero（一句话）
  { component: 'PlatformEntry', props: {} },       // 首屏核心：选平台
  { component: 'ScenarioEntry', props: {} },       // 第二屏：选场景
  { component: 'EditorPicks', props: { totalSkills: 528 } },  // 编辑精选
  { component: 'ArticleList', props: { count: 4 } },          // 深度评测
  { component: 'CTABanner', props: {} },           // 新手CTA
  { component: 'PlatformNav', props: {} },          // 平台标签（精简版）
  { component: 'SubscribeSection', props: {} },     // 订阅
]
