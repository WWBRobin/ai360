// 提示词库共享类型与常量（client/server 两端安全，禁 import node:fs）
export type PromptItem = {
  id: string
  title: string
  content: string
  summary: string
  tags: string[]
  language: string
  applyType: 'chat' | 'config' | 'configuration'
  smoke: string
  sourceName: string
  sourceUrl: string
  credibility: string
  collectedAt: string
}

export type PromptGroupMeta = {
  slug: string
  name: string
  desc: string
}

/** 冒烟通过的状态值（已实测✓徽章判据） */
export const SMOKE_OK = new Set(['machine_pass', 'human_pass'])

/** 冒烟未通过（9/8 用户裁定保留在库带徽章——诚实纪律：实测未通过≠条目无用） */
export const SMOKE_FAIL = new Set(['machine_fail'])

/** 五组静态元数据（组名/描述——与 split_web_json.py 的 SLUG/DESC 同源） */
export const GROUPS: PromptGroupMeta[] = [
  { slug: 'roles', name: '让AI变成某个人', desc: '角色扮演：让 AI 以特定身份为你工作' },
  { slug: 'commands', name: '任务指令', desc: '直接下指令，完成具体任务' },
  { slug: 'templates', name: '填空即用的框架', desc: '留空填词的模板框架，占位符一换就是你的' },
  { slug: 'fixes', name: '治AI的毛病', desc: '治 AI 的坏毛病：胡编、跑题、格式乱' },
  { slug: 'styles', name: '写作风格', desc: '治 AI 八股腔，让输出像人话' },
]
