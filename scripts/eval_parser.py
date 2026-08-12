#!/usr/bin/env python3
"""
eval_parser.py — 评测 Markdown 文件解析器

把 ~/ 下的评测 md 文件解析为结构化的 skill + evaluation 记录，
供 import_to_supabase.py 批量导入。

支持的文件格式（4 种变体，共享 5Q 框架）：
  1. 效率工具类评测.md          — H2 工具标题，Q 内联在 bullet 列表
  2. 场景应用类AI工具评测.md     — H3 工具标题，Q 内联在 bullet 列表
  3. 工具评测_文件代码连接类.md  — H2 工具标题，Q 作为 H3 子标题
  4. eval-hermes-skills-mcp.md  — H4 工具标题，Q 内联在 bullet 列表

输出：List[EvalEntry] 每个 entry 包含 skill 字段 + evaluation 字段
"""

import re
import os
import json
from dataclasses import dataclass, field, asdict
from typing import Optional


@dataclass
class EvalEntry:
    """一条评测记录 = skill 元数据 + evaluation 评分"""
    # --- skill 字段 ---
    name: str = ""
    slug: str = ""
    tagline: str = ""
    description: str = ""
    category: str = "efficiency"  # infrastructure | scene | efficiency
    platform_hint: str = ""       # 从文件名/内容推断的平台 slug
    install_url: str = ""
    developer_name: str = ""
    version: str = "2026-08"

    # --- evaluation 字段 ---
    scenario_summary: str = ""
    difficulty_score: int = 0     # 1-5
    difficulty_notes: str = ""
    stability_score: int = 0      # 1-5
    stability_notes: str = ""
    free_quota: str = ""
    free_quota_score: int = 0     # 1-5
    token_cost: str = ""
    token_efficiency_score: int = 0  # 1-5

    # --- 元信息 ---
    alternatives: str = ""        # 同类替代文本
    source_file: str = ""
    raw_title: str = ""

    @property
    def overall_score(self) -> float:
        """加权：0.2*难度 + 0.4*稳定 + 0.2*免费 + 0.2*token"""
        scores = [self.difficulty_score, self.stability_score,
                  self.free_quota_score, self.token_efficiency_score]
        if any(s == 0 for s in scores):
            return 0.0
        return round(
            0.2 * self.difficulty_score +
            0.4 * self.stability_score +
            0.2 * self.free_quota_score +
            0.2 * self.token_efficiency_score, 1
        )


def slugify(text: str) -> str:
    """中文/英文混合 → kebab-case slug"""
    # 移除括号内容、特殊字符
    text = re.sub(r'[（(].*?[）)]', '', text)
    text = re.sub(r'[^\w\s\u4e00-\u9fff-]', '', text)
    text = text.strip().lower().replace(' ', '-')
    # 中文保留原样（slug 列是 VARCHAR(200)，中文 slug 可用）
    text = re.sub(r'-+', '-', text).strip('-')
    return text


def extract_score(text: str, q_label: str) -> int:
    """从文本中提取 N/5 格式的评分"""
    # 匹配 3/5, 4/5, 5/5 等（含 ** 包裹）
    m = re.search(r'(\d)\s*/\s*5', text)
    if m:
        return int(m.group(1))
    # 有些写 "4分" 或 "评分4"
    m = re.search(r'(?<!\d)([1-5])(?:分|星)', text)
    if m:
        return int(m.group(1))
    return 0


def infer_free_quota_score(text: str) -> int:
    """从免费额度描述推断 1-5 分"""
    t = text.lower()
    if any(kw in t for kw in ['完全免费', '100%免费', '完全免费开源', '100% 免费']):
        return 5
    if any(kw in t for kw in ['免费开源', '开源免费', '免费，纯本地', 'n/a', '内部方法论']):
        return 5
    if any(kw in t for kw in ['免费 tier', '有免费', '免费版', '免费计划', '免费层']):
        return 3
    if any(kw in t for kw in ['付费', '无免费', '试用', 'trial']):
        return 2
    if '免费' in t or '免费' in text:
        return 4
    return 3  # 默认中等


def infer_token_efficiency_score(text: str) -> int:
    """从 token 成本描述推断 1-5 分"""
    t = text.lower()
    if any(kw in t for kw in ['零', '极低', '几乎为零', '零 api']):
        return 5
    if any(kw in t for kw in ['低', '免费', '省 token', '省钱']):
        return 4
    if any(kw in t for kw in ['低-中', '中。', '中等']):
        return 3
    if any(kw in t for kw in ['中高', '较高', '按量', '按次']):
        return 2
    if any(kw in t for kw in ['高', '大量', '昂贵', '$15', '$20']):
        return 1
    return 3


def parse_bullet_format(content: str, file_category: str) -> list[EvalEntry]:
    """
    解析 Q 内联在 bullet 列表的格式（文件 1, 2, 4）
    格式：**Q1 场景**：xxx **Q2 上手难度：N/5** xxx ...
    """
    entries = []

    # 按工具标题分割（H2/H3/H4 后跟工具名）
    # 匹配 ## N. / ### N. / #### N. 开头的行
    tool_splits = re.split(
        r'\n(?=#{2,4}\s+\d+\.)', content
    )

    for chunk in tool_splits:
        if not chunk.strip():
            continue

        # 提取标题行
        header_match = re.match(r'#{2,4}\s+\d+\.\s*(.+)', chunk)
        if not header_match:
            continue

        raw_title = header_match.group(1).strip()
        # 跳过"横向对比总表"等非工具标题
        if any(kw in raw_title for kw in ['横向对比', '横向结论', '对比总表', '结论']):
            continue
        # 跳过分类标题（"方向 A"、"类别 1"等）
        if re.match(r'^(方向|类别|第[一二三四五六]部分)', raw_title):
            continue

        entry = EvalEntry()
        entry.raw_title = raw_title
        entry.source_file = file_category

        # 从标题提取工具名（去掉括号注释）
        name = re.sub(r'[（(].*?[）)]', '', raw_title).strip()
        # 去掉 "—" 后的副标题
        name = name.split('—')[0].split('·')[0].strip()
        entry.name = name
        entry.slug = slugify(name)

        # 提取 "一句话" 定位（> 引用块或 **一句话** 行）
        oneline_match = re.search(
            r'(?:>\s*一句话[：:]\s*|>\s*)(.+?)(?:\n|$)', chunk
        )
        if oneline_match:
            entry.tagline = oneline_match.group(1).strip().strip('"').strip('"')[:200]

        # 提取各 Q 字段（支持多种标签写法）
        # Q1 场景 / Q1 适用场景
        q1 = re.search(
            r'\*\*Q1[^*]*\*\*[：:]\s*(.+?)(?=\n-\s*\*\*Q2|\n-\s*\*\*Q\d|\n###|\n---|\Z)',
            chunk, re.DOTALL
        )
        if q1:
            entry.scenario_summary = clean_text(q1.group(1))[:500]
            if not entry.tagline:
                entry.tagline = entry.scenario_summary[:150]

        # Q2 上手难度 / Q2 上手
        q2 = re.search(
            r'\*\*Q2[^*]*\*\*[：:]\s*(.+?)(?=\n-\s*\*\*Q3|\n-\s*\*\*Q\d|\n###|\n---|\Z)',
            chunk, re.DOTALL
        )
        if q2:
            q2_text = q2.group(1)
            entry.difficulty_score = extract_score(q2_text, 'Q2')
            entry.difficulty_notes = clean_text(q2_text)[:500]

        # Q3 稳定性 / Q3 稳定
        q3 = re.search(
            r'\*\*Q3[^*]*\*\*[：:]\s*(.+?)(?=\n-\s*\*\*Q4|\n-\s*\*\*Q\d|\n###|\n---|\Z)',
            chunk, re.DOTALL
        )
        if q3:
            q3_text = q3.group(1)
            entry.stability_score = extract_score(q3_text, 'Q3')
            entry.stability_notes = clean_text(q3_text)[:500]

        # Q4 免费额度
        q4 = re.search(
            r'\*\*Q4[^*]*\*\*[：:]\s*(.+?)(?=\n-\s*\*\*Q5|\n-\s*\*\*Q\d|\n-\s*\*\*同类|\n###|\n---|\Z)',
            chunk, re.DOTALL
        )
        if q4:
            q4_text = q4.group(1)
            entry.free_quota = clean_text(q4_text)[:500]
            entry.free_quota_score = infer_free_quota_score(q4_text)

        # Q5 Token成本 / Q5 成本
        q5 = re.search(
            r'\*\*Q5[^*]*\*\*[：:]\s*(.+?)(?=\n-\s*\*\*同类|\n-\s*\*\*Q\d|\n-\s*\*\*亮点|\n-\s*\*\*推荐|\n###|\n---|\Z)',
            chunk, re.DOTALL
        )
        if q5:
            q5_text = q5.group(1)
            entry.token_cost = clean_text(q5_text)[:500]
            entry.token_efficiency_score = infer_token_efficiency_score(q5_text)

        # 同类替代
        alt = re.search(
            r'\*\*同类替代\*\*[：:]\s*(.+?)(?=\n-\s*\*\*|\n###|\n---|\n\*\*来源|\Z)',
            chunk, re.DOTALL
        )
        if alt:
            entry.alternatives = clean_text(alt.group(1))[:500]
            # Q5 里有时也内嵌同类替代
            if not entry.token_cost and '**同类替代**' in q5_text if q5 else '':
                pass

        # URL（install_url）
        url_match = re.search(
            r'\*\*URL\*\*[：:]\s*(https?://[^\s|]+)', chunk
        )
        if url_match:
            entry.install_url = url_match.group(1)
        else:
            # 尝试从来源行提取
            src_match = re.search(r'\*\*来源\*\*[：:]\s*(https?://[^\s|]+)', chunk)
            if src_match:
                entry.install_url = src_match.group(1)

        # developer_name 从标题括号提取
        dev_match = re.search(r'[（(](?:作者[：:])?\s*([^）)]+)[）)]', raw_title)
        if dev_match:
            entry.developer_name = dev_match.group(1).strip()

        # 只保留有评分的条目
        if entry.difficulty_score or entry.stability_score:
            entries.append(entry)

    return entries


def parse_h3_q_format(content: str, file_category: str) -> list[EvalEntry]:
    """
    解析 Q 作为 H3 子标题的格式（文件 3: 工具评测_文件代码连接类）
    格式：### Q1 适用场景 / ### Q2 上手难度：**3/5** / ...
    """
    entries = []

    tool_splits = re.split(r'\n(?=##\s+\d+\.)', content)

    for chunk in tool_splits:
        if not chunk.strip():
            continue

        header_match = re.match(r'##\s+\d+\.\s*(.+)', chunk)
        if not header_match:
            continue

        raw_title = header_match.group(1).strip()
        if any(kw in raw_title for kw in ['横向对比', '结论']):
            continue

        entry = EvalEntry()
        entry.raw_title = raw_title
        entry.source_file = file_category

        name = re.sub(r'[（(].*?[）)]', '', raw_title).strip()
        name = name.split('—')[0].split('·')[0].strip()
        entry.name = name
        entry.slug = slugify(name)

        # 一句话定位
        oneline_match = re.search(
            r'\*\*一句话定位\*\*[：:]\s*(.+?)(?:\n|$)', chunk
        )
        if oneline_match:
            entry.tagline = oneline_match.group(1).strip().strip('"').strip('"')[:200]

        # Q1 适用场景（H3 标题下的内容）
        q1 = re.search(r'###\s*Q1[^#]*?[\n。](.+?)(?=###\s*Q2)', chunk, re.DOTALL)
        if q1:
            entry.scenario_summary = clean_text(q1.group(1))[:500]
            if not entry.tagline:
                entry.tagline = entry.scenario_summary[:150]

        # Q2 上手难度（分数在 H3 标题里）
        q2_header = re.search(r'###\s*Q2[^#]*?(\d)\s*/\s*5', chunk)
        q2_body = re.search(r'###\s*Q2.*?\n(.+?)(?=###\s*Q3)', chunk, re.DOTALL)
        if q2_header:
            entry.difficulty_score = int(q2_header.group(1))
        if q2_body:
            entry.difficulty_notes = clean_text(q2_body.group(1))[:500]

        # Q3 稳定性
        q3_header = re.search(r'###\s*Q3[^#]*?(\d)\s*/\s*5', chunk)
        q3_body = re.search(r'###\s*Q3.*?\n(.+?)(?=###\s*Q4)', chunk, re.DOTALL)
        if q3_header:
            entry.stability_score = int(q3_header.group(1))
        if q3_body:
            entry.stability_notes = clean_text(q3_body.group(1))[:500]

        # Q4 免费额度
        q4_body = re.search(r'###\s*Q4.*?\n(.+?)(?=###\s*Q5)', chunk, re.DOTALL)
        if q4_body:
            entry.free_quota = clean_text(q4_body.group(1))[:500]
            entry.free_quota_score = infer_free_quota_score(entry.free_quota)

        # Q5 Token成本 + 替代
        q5_body = re.search(r'###\s*Q5.*?\n(.+?)(?=###|---|\*\*来源|\Z)', chunk, re.DOTALL)
        if q5_body:
            q5_text = q5_body.group(1)
            # 分离替代部分
            alt_split = re.split(r'替代[：:]', q5_text, maxsplit=1)
            entry.token_cost = clean_text(alt_split[0])[:500]
            if len(alt_split) > 1:
                entry.alternatives = clean_text(alt_split[1])[:500]
            entry.token_efficiency_score = infer_token_efficiency_score(entry.token_cost)

        # 来源 URL
        src_match = re.search(r'\*\*来源\*\*[：:]\s*(https?://[^\s|]+)', chunk)
        if src_match:
            entry.install_url = src_match.group(1)
        else:
            url_match = re.search(r'(https?://[^\s|]+)', chunk)
            if url_match:
                entry.install_url = url_match.group(1)

        if entry.difficulty_score or entry.stability_score:
            entries.append(entry)

    return entries


def clean_text(text: str) -> str:
    """清理提取的文本：去 markdown 标记、多余空白"""
    text = re.sub(r'\*\*', '', text)
    text = re.sub(r'`', '', text)
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)  # 链接保留文字
    text = re.sub(r'\n+', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def infer_platform(entry: EvalEntry, filename: str) -> str:
    """根据文件名和内容推断平台 slug"""
    name_lower = entry.name.lower()
    title_lower = entry.raw_title.lower()

    # 从文件名推断大类
    if 'hermes' in filename.lower():
        if any(kw in name_lower for kw in ['context7', 'firecrawl', 'playwright',
              'github mcp', 'filesystem mcp', 'supabase mcp', 'notion mcp',
              'slack mcp', 'sentry mcp', 'browserbase', 'pipedream', 'lancedb',
              'exa mcp', 'kubernetes']):
            return 'mcp'
        return 'hermes'

    if '场景应用' in filename:
        if any(kw in title_lower for kw in ['gpt', 'chatgpt']):
            return 'gpts'
        if any(kw in title_lower for kw in ['扣子', 'coze']):
            return 'coze'
        return 'coze'

    if '文件代码连接' in filename or '效率工具' in filename:
        if any(kw in name_lower for kw in ['claude', 'frontend design', 'caveman',
              'trail of bits']):
            return 'claude'
        if any(kw in name_lower for kw in ['openrouter']):
            return 'openrouter' if 'openrouter' in name_lower else 'efficiency'
        if any(kw in name_lower for kw in ['zapier']):
            return 'efficiency'
        if any(kw in name_lower for kw in ['e2b', 'composio', 'filesystem mcp']):
            return 'mcp'
        if any(kw in name_lower for kw in ['ernie', '文心']):
            return 'ernie'

    return 'efficiency'


def infer_category(entry: EvalEntry, filename: str) -> str:
    """推断分类：infrastructure | scene | efficiency"""
    if '效率工具' in filename or '文件代码连接' in filename:
        return 'efficiency'
    if '场景应用' in filename:
        return 'scene'
    if 'hermes' in filename.lower() or 'mcp' in filename.lower():
        return 'infrastructure'
    return 'efficiency'


def parse_eval_file(filepath: str) -> list[EvalEntry]:
    """解析单个评测文件，自动检测格式"""
    with open(filepath, encoding='utf-8') as f:
        content = f.read()

    filename = os.path.basename(filepath)
    file_category = filename.replace('.md', '')

    # 检测格式：如果 Q 作为 H3 标题出现（### Q1/Q2/Q3...），用 h3 格式
    if re.search(r'###\s*Q[1-5]\s', content):
        entries = parse_h3_q_format(content, file_category)
    else:
        entries = parse_bullet_format(content, file_category)

    # 补充推断字段
    for entry in entries:
        if not entry.platform_hint:
            entry.platform_hint = infer_platform(entry, filename)
        if entry.category == 'efficiency':  # 默认值时才覆盖
            entry.category = infer_category(entry, filename)
        if not entry.developer_name:
            entry.developer_name = '未知'
        if not entry.install_url:
            entry.install_url = f"https://www.google.com/search?q={entry.name}"

    return entries


def main():
    """解析所有评测文件，输出 JSON 供导入脚本使用"""
    home = os.path.expanduser("~")
    eval_files = [
        "效率工具类评测.md",
        "场景应用类AI工具评测.md",
        "工具评测_文件代码连接类_5工具.md",
        "eval-hermes-skills-mcp-2026-08-13.md",
    ]

    all_entries = []
    for ef in eval_files:
        filepath = os.path.join(home, ef)
        if not os.path.exists(filepath):
            print(f"  ⚠ 文件不存在: {ef}")
            continue
        entries = parse_eval_file(filepath)
        print(f"  {ef}: {len(entries)} 条")
        all_entries.extend(entries)

    print(f"\n总计: {len(all_entries)} 条评测记录")

    # 去重（同名取第一个）
    seen_slugs = set()
    deduped = []
    for e in all_entries:
        if e.slug not in seen_slugs:
            seen_slugs.add(e.slug)
            deduped.append(e)
        else:
            print(f"  ⚠ 跳过重复 slug: {e.slug} ({e.name})")
    print(f"去重后: {len(deduped)} 条")

    # 输出 JSON
    output_path = os.path.join(os.path.dirname(__file__), "parsed_evaluations.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump([asdict(e) for e in deduped], f, ensure_ascii=False, indent=2)

    print(f"\n已输出: {output_path}")

    # 打印预览
    print("\n=== 预览（前 5 条）===")
    for e in deduped[:5]:
        print(f"  {e.name} [{e.platform_hint}] "
              f"难度={e.difficulty_score} 稳定={e.stability_score} "
              f"免费={e.free_quota_score} token={e.token_efficiency_score} "
              f"综合={e.overall_score}")

    return deduped


if __name__ == "__main__":
    main()
