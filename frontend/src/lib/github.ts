/**
 * GitHub 仓库数据获取（服务端，构建/ISR 时调用）
 *
 * 从 install_url 或任意 URL 中解析 GitHub owner/repo，
 * 调用 GitHub REST API 获取 stars / forks / 语言 / 开源协议。
 *
 * 设计要点：
 * - 纯服务端（fetch 在 Node runtime），绝不进客户端 bundle
 * - 进程内缓存（模块级 Map），一次构建只拉一次
 * - 失败静默降级，不阻塞详情页渲染
 * - GitHub 速率限制：未认证 60 次/小时/IP，足够 ISR 用
 *   如需更高配额可配 NEXT_PUBLIC_GITHUB_TOKEN + GITHUB_TOKEN
 */

export interface GitHubRepoData {
  /** 完整仓库标识 owner/repo */
  full_name: string
  /** star 数 */
  stars: number
  /** fork 数 */
  forks: number
  /** 打开 issue 数 */
  open_issues: number
  /** 主要编程语言 */
  language: string | null
  /** 开源协议 SPDX id（如 mit / apache-2.0） */
  license: string | null
  /** 最近一次推送时间（ISO） */
  pushed_at: string | null
  /** 仓库描述 */
  description: string | null
  /** 仓库主页 URL */
  html_url: string
}

const cache = new Map<string, GitHubRepoData | null>()

/**
 * 从一个 URL 字符串里解析 GitHub owner/repo。
 * 支持：
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   https://github.com/owner/repo/...
 *   git@github.com:owner/repo.git
 * 不匹配返回 null。
 */
export function parseGitHubRepo(url: string | null | undefined): string | null {
  if (!url) return null
  // 标准化：去空格
  const u = url.trim()
  if (!u) return null

  // SSH 形态 git@github.com:owner/repo(.git)
  const ssh = u.match(/github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#]|$)/i)
  if (ssh) {
    const owner = ssh[1]
    const repo = ssh[2]
    if (owner && repo && owner !== 'github') {
      return `${owner}/${repo}`
    }
  }
  return null
}

/** 格式化 star 数：1200 -> 1.2k */
export function formatStars(n: number): string {
  if (n >= 1000) {
    const v = n / 1000
    return `${v.toFixed(v >= 10 ? 0 : 1)}k`
  }
  return String(n)
}

/**
 * 获取 GitHub 仓库数据。传入 install_url 或任意 URL，
 * 若不是 GitHub 仓库或拉取失败，返回 null（调用方优雅降级）。
 *
 * 进程内缓存：同一次构建/请求生命周期内同 repo 只拉一次。
 */
export async function getGitHubRepoData(
  url: string | null | undefined
): Promise<GitHubRepoData | null> {
  const repo = parseGitHubRepo(url)
  if (!repo) return null

  if (cache.has(repo)) return cache.get(repo) ?? null

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'arcdock-tools.vokki.cn',
  }
  const token = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers,
      next: { revalidate: 86400 }, // 24h ISR 缓存
    })
    if (!res.ok) {
      // 404 / 403 速率限制等，静默降级
      cache.set(repo, null)
      return null
    }
    const j = await res.json()
    const data: GitHubRepoData = {
      full_name: j.full_name,
      stars: j.stargazers_count ?? 0,
      forks: j.forks_count ?? 0,
      open_issues: j.open_issues_count ?? 0,
      language: j.language ?? null,
      license: j.license?.spdx_id ? String(j.license.spdx_id) : null,
      pushed_at: j.pushed_at ?? null,
      description: j.description ?? null,
      html_url: j.html_url ?? `https://github.com/${repo}`,
    }
    cache.set(repo, data)
    return data
  } catch {
    cache.set(repo, null)
    return null
  }
}
