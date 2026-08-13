/**
 * Section Block 渲染器
 * 
 * 页面 = 配置数组 → 逐个渲染 Section 组件
 * 改布局 = 改配置数组，不碰组件代码
 */

import { ComponentType } from 'react'

// Section 组件统一接口
export interface SectionProps {
  [key: string]: any
}

export interface SectionConfig {
  component: string
  props?: SectionProps
  enabled?: boolean
}

// 组件注册表（在 page.tsx 里填充，避免循环依赖）
type SectionRegistry = Record<string, ComponentType<SectionProps>>

let registry: SectionRegistry = {}

export function registerSections(reg: SectionRegistry) {
  registry = { ...registry, ...reg }
}

export function PageBuilder({ sections }: { sections: SectionConfig[] }) {
  return (
    <>
      {sections
        .filter(s => s.enabled !== false)
        .map((section, i) => {
          const Component = registry[section.component]
          if (!Component) return null
          return <Component key={`${section.component}-${i}`} {...(section.props || {})} />
        })}
    </>
  )
}
