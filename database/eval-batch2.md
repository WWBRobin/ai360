# 国内平台 Skill 第二批评测（编号 23-28，6 个）

> 评测日期：2026-08-13 | 评测框架：ai-tool-evaluation 5 问（Q1场景 / Q2上手1-5 / Q3稳定1-5 / Q4免费额度 / Q5成本+替代）
> 平台覆盖：通义千问(阿里) × 3 + 扣子(字节) × 2 + OpenClaw × 1
> 证据标注：[已验证]=本次工具输出核实 | [文档]=引用官方页/权威文章 | [推理]=基于公开信息推断

---

## 23. 千问 AI Skills 技能包（通义千问官方 8 合 1）

- **平台**：通义千问（qwen）
- **slug**：qwen-ai-skills
- **URL**：https://platform.qianwenai.com/skills [已验证] · GitHub: QianWen-AI/qianwen-ai (Python, 68★, 4 forks, Apache-2.0) [已验证]
- **Q1 场景**：将千问全套多模态 AI 能力（文本/图像/视频/语音/视觉/模型选择/认证/用量）封装为 8 个 Agent Skills 模块。一行命令安装，零配置，适配 20+ 种 Agent 工具（Claude Code/Cursor/Codex/Cline/OpenClaw/Qwen Code/Qoder/OpenHands/Devin 等）[已验证: platform.qianwenai.com/skills]
- **Q2 上手：3/5** — `npx skills add QianWen-AI/qianwen-ai` 一行安装，但需要 Node.js 18+ 和百炼 API Key 配置。qianwen-ops-auth 技能会自动引导完成 Key 配置，降低了门槛 [已验证]
- **Q3 稳定：4/5** — 阿里官方出品（QianWen-AI 组织），百炼平台支撑。三层模型选择机制：默认兜底→智能推荐→用户指定。GitHub 68★ 还在早期成长阶段 [文档: 53ai.com + 已验证 GitHub]
- **Q4 免费额度**：千问个人版免费；百炼千万 Token 免费额度（每个模型各 100 万 Token 免费额度）；Token Plan 订阅最低 6 折 [已验证: aliyun.com/product/bailian + qwen-pricing-analysis]
- **Q5 成本**：按量计费。Qwen3-Max 输入 2.5 元/百万 token、输出 10 元/百万 token；Qwen-Turbo 最便宜 0.3/0.6 元；Batch 调用半价；上下文缓存有额外折扣 [已验证: 百炼定价文档]。**替代**：直接调百炼 API、其他多模态 API（OpenAI/Google/Gemini）
- **亮点**：🔥 Agent 原生设计典范——把 150+ 模型能力折叠成 Agent 可直接调用的 Skill。"当云的主要消费者从人变成 Agent，界面需要被重写"是阿里对 Agent 时代的战略判断 [已验证]
- **综合评分**：4.0

---

## 24. 千问上云部署技能（qianwenai-deploy）

- **平台**：通义千问（qwen）
- **slug**：qwen-deploy
- **URL**：https://www.qianwenai.com/skills/deploy-skill [已验证] · GitHub: QianWen-AI/qianwenai-deploy (Shell, 8★, Apache-2.0) [已验证]
- **Q1 场景**：一句话让 Agent 全程完成项目上云部署。从项目分析→方案选择→资源编排→部署上线，无需手动配置云资源 [已验证: qianwenai.com/skills/deploy-skill]
- **Q2 上手：3/5** — 需要 Node.js 环境 + 阿里云账号 + 百炼 API Key。安装后通过自然语言指令触发部署流程，但需要理解阿里云基础概念（ECS/安全组/VPC 等）[推理]
- **Q3 稳定：4/5** — 阿里官方出品，依赖阿里云成熟的部署基础设施。GitHub 8★ 极早期项目，但背后的阿里云部署引擎是生产级的 [推理 + 已验证: GitHub]
- **Q4 免费额度**：技能本身免费；部署产生的云资源按阿里云标准计费（ECS 按量/包年包月等）[已验证: help.aliyun.com/skillsportal 计费说明]
- **Q5 成本**：云资源费用（非 AI token 费用）。ECS t6 突发性能实例约 0.03 元/小时起；轻量应用服务器 24 元/月起。**替代**：阿里云控制台手动部署、Terraform/Ansible 脚本、Serverless Devs（阿里开源）[推理]
- **亮点**：解决"手动部署耗时长、配置易出错、重复操作多"的核心痛点。一键自动部署阿里云官方解决方案（VPC/安全组/ECS/RDS）[已验证: skills.aliyun.com]
- **综合评分**：3.8

---

## 25. 阿里云 Agent Skills 门户（云资源管理）

- **平台**：通义千问（qwen）
- **slug**：qwen-aliyun-skills-portal
- **URL**：https://skills.aliyun.com [已验证] · 文档: help.aliyun.com/zh/skillsportal [已验证]
- **Q1 场景**：阿里云官方提供的 AI Agent 技能发现与安装平台，为 Agent 提供安全可靠的云资源操作能力。安装对应产品 Skill 后，Agent 通过自然语言完成云资源查询和管理（ECS/OSS/RDS/SLB/云监控等）[已验证: help.aliyun.com/zh/skillsportal]
- **Q2 上手：2/5** — 需要云计算知识背景。安装 Skill 后通过自然语言指令操作，如"查看杭州地域所有 Running 状态的 ECS 实例"→Agent 调用 Skill 返回格式化列表。但需理解阿里云产品体系和权限模型 [已验证: help.aliyun.com]
- **Q3 稳定：4/5** — 阿里云官方出品，每个 Skill 均通过业务测试和安全检测。关键操作引入人工确认机制。兼容 Cursor/Claude Code/Qwen Code/Qoder/Codex 等主流 Agent 客户端 [已验证: help.aliyun.com]
- **Q4 免费额度**：Skills 门户免费使用，但 Agent 通过 Skill 创建或使用的云资源仍按对应云产品的标准计费规则收费 [已验证: help.aliyun.com 计费说明]
- **Q5 成本**：云资源费用。**替代**：阿里云控制台手动操作、Terraform/Ansible/Pulumi 基础设施即代码、阿里云 CLI (aliyun-cli) [推理]
- **亮点**：🔥 跨产品任务编排是核心亮点——安装多个 Skill 后，Agent 可在一次对话中组合调用不同 Skill（如"查看所有地域的 ECS 实例及关联的安全组规则"）。企业级运维场景：告警规则配置→根因分析→问题修复全流程 [已验证: help.aliyun.com]
- **综合评分**：3.6

---

## 26. 扣子热点雷达（技能大赛一等奖）

- **平台**：扣子 Coze（coze）
- **slug**：coze-hot-radar
- **URL**：coze.cn/?skill_share_pid=7597875515860451378 [文档]
- **Q1 场景**：自动追踪聚合全网行业热点与趋势，帮助从业者快速捕捉时效性话题，先人一步产出高热度内容或调整运营策略。目标人群：自媒体运营、市场分析师、内容创作者 [文档: woshipm.com 大赛获奖描述]
- **Q2 上手：4/5** — 一键添加后自然语言指令触发，无需配置。技能自动判断是否与任务相关并加载 [已验证: docs.coze.cn 使用技能]。扣 1 分因需理解热点监控场景才能用好
- **Q3 稳定：3/5** — 个人维护的第三方技能，迭代不可控，稳定性 3 分档封顶 [推理]。依赖外部数据源（网页爬取），存在反爬风险。大赛一等奖背书提供一定质量信号
- **Q4 免费额度**：免费技能，扣子每日 1500 积分可用（2026-01 套餐升级后）[已验证: docs.coze.cn]
- **Q5 成本**：中等成本（聚合多源数据 + 摘要生成，万级 token）。**替代**：手动搜索微博热搜/知乎热榜/百度风云榜，或扣子自建工作流定时爬取 [推理]
- **亮点**：🔥 大赛一等奖，直击"追热点"刚需，但数据源稳定性是隐患 [文档: woshipm.com]
- **综合评分**：3.6

---

## 27. 扣子投行级深度行业分析（技能大赛优秀奖）

- **平台**：扣子 Coze（coze）
- **slug**：coze-investment-research
- **URL**：coze.cn/?skill_share_pid=7604466157126565929 [文档]
- **Q1 场景**：模拟投行分析师视角，生成深度行业研究报告。覆盖行业概览、竞争格局、财务分析、趋势预测。目标人群：投资分析师、企业战略、咨询顾问 [文档: woshipm.com 大赛获奖名单]
- **Q2 上手：2/5** — 需要金融/行业分析专业知识。输出报告需专业人士审阅 [推理]。太平洋证券已有 Coze 投研应用实践报告 [文档: fxbaogao.com]
- **Q3 稳定：3/5** — 数据类工具通用风险——AI 幻觉（编造市场规模数据、财务数据不准），必须人工复核 [推理]
- **Q4 免费额度**：免费技能 [文档: 大赛获奖名单]
- **Q5 成本**：高成本（长报告 + 数据分析 + 多轮推理，十万级 token）。**替代**：Wind/Bloomberg 终端、券商研报、传统咨询（麦肯锡/BCG）[推理]
- **亮点**：高 ARPU 场景（投行研报单份价值数千元），但专业性门槛高，AI 幻觉是核心风险。适合作为分析师的"初稿生成器"而非最终交付物 [推理 + 文档: woshipm.com]
- **综合评分**：3.0

---

## 28. OpenClaw Browser Control（ClawHub #1 技能）

- **平台**：OpenClaw（openclaw）
- **slug**：openclaw-browser-control
- **URL**：clawhub.dev / `openclaw skill install browser-control` [文档: aimakers.co 2026 指南]
- **Q1 场景**：自动化网页浏览——填表单、抓数据、截图。是所有研究或数据收集工作流的骨干。ClawHub 10,700+ 技能中排名第一的必装技能 [已验证: aimakers.co/blog/openclaw-skills-guide]
- **Q2 上手：4/5** — `openclaw skill install browser-control` 一行安装。安装器显示权限请求，确认后 10 秒内完成 [已验证: aimakers.co]。扣 1 分因复杂自动化场景需要理解 CSS 选择器和页面结构
- **Q3 稳定：4/5** — ClawHub 排名第一，使用量最大，经过大量用户验证。但浏览器自动化固有风险：页面结构变化导致选择器失效 [推理 + 已验证: aimakers.co]
- **Q4 免费额度**：ClawHub 技能免费安装。820+ 技能（7.6%）被标记为恶意，但 browser-control 通过了安全扫描 [已验证: aimakers.co]
- **Q5 成本**：低-中。Agent 消耗 LLM token，浏览器操作本身无额外成本。**替代**：MCP Playwright/Puppeteer（官方协议生态）、Playwright/Puppeteer 直接使用、Selenium、扣子 Web Browsing 技能 [推理]
- **亮点**：🔥 ClawHub 10,700+ 技能生态中被多个独立评测一致推荐为"必装 Top 1"。典型用例：每天早上自动检查竞品定价并汇总变化到 Slack [已验证: aimakers.co]。⚠️ 注意：ClawHub 有 7.6% 恶意技能率，安装前务必检查权限和源码可用性
- **综合评分**：4.2

---

## 横向对比总表

| # | Skill | 平台 | Q2上手 | Q3稳定 | Q4免费分 | Q5成本分 | 综合 | 适配人群 |
|---|-------|------|:------:|:------:|:--------:|:--------:|:----:|----------|
| 23 | 千问 AI Skills 技能包 | 千问 | 3 | 4 | 4 | 5 | 4.0 | Agent 开发者 |
| 24 | 千问上云部署技能 | 千问 | 3 | 4 | 4 | 3 | 3.8 | 全栈开发者 |
| 25 | 阿里云 Agent Skills 门户 | 千问 | 2 | 4 | 4 | 4 | 3.6 | 运维/DevOps |
| 26 | 扣子热点雷达 | 扣子 | 4 | 3 | 3 | 4 | 3.6 | 自媒体/运营 |
| 27 | 扣子投行级行业分析 | 扣子 | 2 | 3 | 3 | 3 | 3.0 | 投资分析师 |
| 28 | OpenClaw Browser Control | OpenClaw | 4 | 4 | 5 | 4 | 4.2 | 所有 Agent 用户 |

## 关键发现

1. **千问填补最大空缺**：第一批 0 个千问 Skill → 第二批补 3 个，覆盖 Agent 开发者(技能包)、全栈(部署)、运维(云资源)三类用户
2. **千问成本优势明显**：Qwen-Turbo 0.3 元/百万 token 输入，是同类大模型中最低档之一；Batch 半价 + 缓存折扣进一步降低成本
3. **扣子大赛技能的两面性**：热点雷达(一等奖)上手简单但稳定性存隐患；投行分析(优秀奖)专业价值高但 AI 幻觉风险大
4. **OpenClaw 安全警示**：ClawHub 10,700+ 技能中 7.6% 被标记恶意——browser-control 能排名第一正是因为它通过了安全扫描且使用量最大
5. **官方 vs 社区分水岭**：千问 3 个全是阿里官方出品(稳定 4 分档)；扣子 2 个全是个人创作者(稳定 3 分封顶)；OpenClaw browser-control 是社区第一但经过充分验证

## 数据类工具通用风险（必答项）

所有涉及数据/分析类 Skill（扣子投行分析、扣子热点雷达）均存在：
- **AI 幻觉风险**：编造市场规模数据、热点数据不准 → **必须人工复核**
- **数据源时效性**：依赖外部数据源的 Skill 可能因数据更新延迟或反爬机制失效
- **不构成专业建议**：投资建议/行业判断类 Skill 需明确标注免责声明
