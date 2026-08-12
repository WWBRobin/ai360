# 怎么让 AI 能上网？3 款搜索方案对比（Tavily / Firecrawl / Brave Search MCP）

> 📅 更新：2026-08-13
> 🏷️ 标签：AI搜索 · 联网搜索 · MCP · 横评
> 🔍 SEO关键词：AI 联网搜索 / AI 搜索引擎 / Tavily / Firecrawl / Brave Search MCP / MCP 搜索工具 / AI 搜索 API / RAG 搜索 / Agent 联网 / 大模型 搜索增强
> 评测框架：Q1 场景（定性）· Q2 上手难度（1-5）· Q3 稳定性（1-5）· Q4 免费额度 · Q5 Token 成本 + 同类替代。所有价格与数字均来自官方页面 / GitHub API 实测（2026-08-13），详见各节来源。

---

## 写在前面：AI 的信息，还停在 2024 年

> "AI 给我的数据是 2024 年的，早就过时了。"
> "我让 AI 帮我查竞品信息，它说它不能联网。"
> "AI 给我编了一个不存在的 API 文档。"
> "AI 一本正经地回答了一个已经被辟谣的谣言。"

大模型的知识有**截止日期**——它只会"背"训练时见过的内容。今天的新闻、昨天的价格、你刚发布的网页，它一概不知。不知道就会**编**（这就是 AI 幻觉的根源之一）。

解决办法就是给 AI 装**联网搜索**。但"联网搜索"和"联网搜索"差别很大：有的是 AI 专用搜索引擎、有的是网页抓取工具、有的是传统搜索引擎的 MCP 封装。我们实测了目前最主流的 3 款：**Tavily / Firecrawl / Brave Search MCP**，直接给你结论。

---

## 一、Tavily：专为 AI Agent 设计的搜索引擎

### 功能
Tavily 是**为 AI Agent / RAG 而生**的搜索 API：返回**结构化、带评分**的结果（title/url/content/score），支持 `include_answer`（AI 生成摘要）、news/finance 话题、时间过滤，甚至内置 prompt-injection 过滤。典型场景：RAG 知识库 grounding、实时问答 Agent、深度研究（Research API）、新闻/金融监测。

**MCP 双形态**：远程 `mcp.tavily.com`（免安装，URL 拼 API key 即用）+ 本地 `npx tavily-mcp`（GitHub 2.3K★，MIT），Claude Code / Cursor 一键接入；LangChain / LlamaIndex / Portkey 生态全覆盖。

### 安装
```bash
# 远程 MCP（最省事）：在 MCP 配置里填
# https://mcp.tavily.com/mcp?tavilyApiKey=你的key

# 本地 MCP
npx -y @smithery/cli install @tavily-ai/tavily-mcp
```

### 优点
- ✅ **上手最简单**：注册即拿 key，**1,000 credits/月免费且无需信用卡**；远程 MCP 零本地安装
- ✅ 结果自带提炼和评分，AI 拿到就能用，不用自己从网页扒
- ✅ 生态最广（LangChain/LlamaIndex/Portkey 都有官方集成）

### 缺点
- ❌ 返回链接偶发 404/失效（社区集中反馈，官方建议加 status-code 过滤）
- ❌ 结果质量随 query 类型波动、排名可控性弱
- ❌ 免费层无 SLA；开启 `includeRawContent` 会把 token 烧爆（第三方实测 8 条结果 ≈ 30 万字符）

### 实测评分（Q2 上手 5/5 ｜ Q3 稳定 4/5）
- 上手：**5/5**——三款中门槛最低
- 稳定：**4/5**——基础设施成熟（基准延迟 998ms），扣分在链接失效与排名波动
- 免费：**1,000 credits/月**（≈1,000 次 basic search 或 500 次 advanced），每月 1 日重置、不滚动、无信用卡；另有学生免费计划
- Token 成本：单次搜索约 **1–2K token** 入上下文（返回片段而非全文，默认 5 条结果）
- 价格：basic search **$8/1K 次**（PAYG），月付低至 $0.005/credit（Growth 档 $500/10 万 credits）

来源：tavily.com/pricing ｜ docs.tavily.com/documentation/api-credits ｜ github.com/tavily-ai/tavily-mcp

---

## 二、Firecrawl：网页抓取 + 搜索 + 浏览器自动化三合一

### 功能
Firecrawl 是网页数据**全栈平台**：Scrape / Crawl / Map / Search / Interact（浏览器交互：点击、填表）/ Monitor / Agent 七个端点，核心卖点是把网页转成 **LLM 就绪的 markdown / 结构化 JSON**。搜索只是它能力之一（2 credits/10 条结果）。

典型场景：**整站爬取建 RAG 索引**、电商/商品结构化抽取、JS 渲染页抓取、网页监控。开源版 **166,388★**（API 实测）、AGPL-3.0 可自托管；官方 MCP `firecrawl-mcp-server` 7,221★。定位：**抓取/深挖为主，搜索为辅**。

### 安装
```bash
npx -y firecrawl-mcp
```
约 3 分钟配好（官方自称）；playground 免 key 试玩。

### 优点
- ✅ **抓取能力独一档**：整站爬取、JS 渲染、结构化抽取，是 Tavily/Brave 给不了的
- ✅ 输出直接是 LLM 就绪 markdown / JSON，省掉自己解析 HTML
- ✅ 开源可自托管（AGPL-3.0），社区大（166K★ 主仓 + 7K★ MCP）

### 缺点
- ❌ **明确屏蔽 Reddit 等站点**；部分站点报 "This website is no longer supported"、需找客服手动开启
- ❌ Cloudflare / 重度 JS 站点抓取失败常见
- ❌ **输出 token 最重**：整页 markdown 单页可达数千 token，逐轮 grounding 不划算
- ❌ 7 个端点 + 动态 credit 计费，学习曲线比单一搜索 API 高；免费层并发仅 2

### 实测评分（Q2 上手 4/5 ｜ Q3 稳定 3.5/5）
- 上手：**4/5**——一条命令能跑，但多端点概念要学
- 稳定：**3.5/5**——基础设施稳（自称 99.9% uptime，Replit/OpenClaw 在用），扣分在站点屏蔽与反爬失败率
- 免费：**1,000 credits/月**（=1,000 页 scrape），无信用卡、2 并发；限速 10 scrapes/min、5 searches/min、1 crawl/min
- Token 成本：**三款中最重**——官方自称比 raw HTML 省 67% token（厂商自述，未独立验证），适合离线建索引而非逐轮搜索
- 价格：search ≈ **$1.66/1K 次**、scrape ≈ **$0.83/1K 页**（Standard 年付折算）；月付更贵（$99/月）

来源：firecrawl.dev/pricing ｜ github.com/firecrawl/firecrawl（星数 API 实测）｜ github.com/firecrawl/firecrawl-mcp-server

---

## 三、Brave Search MCP：隐私优先的独立搜索引擎

### 功能
Brave Search 是**自建索引的独立搜索引擎**（30B+ 页面、每日 100M+ 页更新），不依赖 Google/Bing。官方 MCP server（GitHub 1.4K★，MIT）工具齐全：`brave_web_search` / `local` / `video` / `image` / `news` / `place_search` + `brave_summarizer` + `brave_llm_context`。

典型场景：中立独立索引的 RAG、新闻监测、本地商家查询、隐私优先产品。**注意：它只给结果与摘要、不含全文**，Agent 需要深读时得自配抓取层（如 Firecrawl）。

### 安装
```bash
npx @brave/brave-search-mcp-server
```
注册即拿 key，一条命令接入。

### 优点
- ✅ **质量第一**：2026 AI Multiple 基准（8 家对比）**Agent Score 第一（14.89/20）、延迟最低（669ms）**，是唯一稳定跑赢 Tavily 的 API
- ✅ **token 最省**：web search 只回标题/URL/摘要；`brave_llm_context` 端点可**精确设定 token 预算**（总量 1,024–32,768，单 URL 512–8,192，snippets 1–256）
- ✅ **最便宜**：纯搜索 $5/1K 次，三家最低
- ✅ 隐私优先、不追踪；官方 MCP 维护活跃

### 缺点
- ❌ **没有全文**：Agent 深读需另配抓取层
- ❌ Answers 计划仅 2 QPS；local search 与 extra_snippets 需 Pro 计划
- ❌ 长尾查询质量与 Google 仍有差距（用户反馈）
- ❌ 1.x→2.x 迁移把默认传输从 HTTP 改为 STDIO，老配置需加环境变量

### 实测评分（Q2 上手 4.5/5 ｜ Q3 稳定 4.5/5）
- 上手：**4.5/5**——一条命令 + 工具命名清晰（freshness/goggles/result_filter 参数丰富），扣半分给迁移坑
- 稳定：**4.5/5**——基准质量第一 + 延迟最低 + 50 QPS 容量，三家中最稳
- 免费：**$5 免费信用/月 ≈ 1,000 次 Search 请求**，自动到账、无需信用卡；⚠️ 评估期烧量快（Reddit 用户反馈旧 5,000 查询/月的免费层已被 $5 信用取代）
- Token 成本：**三款中最省**——snippet 模式 + LLM Context 端点可设 1K–32K token 上限
- 价格：Search **$5/1K 次**；Answers $4/1K + $5/M input/output token

来源：brave.com/search/api ｜ github.com/brave/brave-search-mcp-server ｜ aimultiple.com/agentic-search

---

## 横向对比总表

| 维度 | Tavily | Firecrawl | Brave Search MCP |
|---|---|---|---|
| 定位 | Agent 搜索 API（搜+提炼） | 网页数据全栈（抓为主） | 中立独立搜索引擎（纯搜索） |
| Q2 上手 | **5/5** | 4/5 | 4.5/5 |
| Q3 稳定性 | 4/5 | 3.5/5 | **4.5/5** |
| Q4 免费额度 | 1,000 credits/月（≈1K 次搜索） | 1,000 credits/月（=1K 页） | $5/月（≈1K 次搜索） |
| 纯搜索单价/1K 次 | $5–8（视档位） | ~$1.66（Standard 折算，但无全文） | **$5** |
| 基准质量（2026 AI Multiple） | 落后 Brave ~1 分 | 14.58（Top4 并列） | **14.89 第一** |
| 延迟 | 998ms | — | **669ms 最低** |
| 单次入上下文 token | ~1–2K（片段，raw_content 慎开） | 数千+（整页 markdown） | **最少**（snippet；LLM Context 可设 1K–32K 上限） |
| 已知最大坑 | 结果链接偶发 404、排名可控性弱 | 屏蔽 Reddit、部分站点需客服开启 | 无全文、Answers 2 QPS、长尾质量弱 |
| MCP 生态 | 2.3K★ + 远程托管 | 7.2K★（另主仓 166K★） | 1.4K★ 官方 |

---

## 选购建议：你的情况选哪个

| 你的情况 | 推荐方案 | 理由 |
|---|---|---|
| 只想让 AI 能搜最新信息、快速原型 | **Tavily** | 免费层最慷慨（1,000 次/月）、远程 MCP 免安装、结果自带提炼 |
| 追求搜索结果质量和性价比 | **Brave Search MCP** | 基准第一、延迟最低、$5/1K 最便宜、token 最省 |
| 要爬网站 / 建 RAG 知识库 / 抓 JS 页面 | **Firecrawl** | 抓取是护城河（166K★ 开源），搜索只是附带 |
| 在意隐私、不想被追踪 | **Brave Search** | 独立索引 + 隐私优先，不依赖 Google/Bing |
| 我在用扣子 | 扣子内置联网搜索插件 | 零配置，积分制计费 |

**一句话总结**：
- **轻量 Agent 联网首选 Brave**：质量第一、延迟最低、最便宜、最省 token，缺点是只给摘要，深读需自配抓取（可以和 Firecrawl 搭配：Brave 搜 + Firecrawl 抓）。
- **生态最顺、上手最爽选 Tavily**：免费层最慷慨、远程 MCP 免安装，适合快速验证；规模化后单价与质量不占优。
- **要抓网页/建 RAG 库选 Firecrawl**：搜索是副业，整站爬取 + 结构化抽取才是它的强项；token 重、有站点屏蔽，不适合逐轮搜索。

**常见替代**：Exa（语义搜索，$20 开户 + $10/月免费，MCP 4.9K★）、Perplexity（$5/1K 固定价）、Kagi（高质量独立索引）、Crawl4AI（开源免费抓取）、Serper/SerpApi（Google SERP 镜像）。

---

## 常见问题

**Q：装搜索 MCP 会影响 AI 正常回答吗？**
A：不会。搜索是"按需调用"——AI 觉得信息可能过时才触发搜索，日常对话不受影响。

**Q：三个都装会冲突吗？**
A：不会，反而推荐组合用。典型架构：Brave（搜）→ Firecrawl（抓全文）→ 你的 Agent（总结）。Tavily 和 Brave 二选一即可，功能重叠。

**Q：免费额度够用吗？**
A：个人日常完全够。三个的免费层都是每月约 1,000 次搜索，一天 30 次查询绰绰有余。重度 RAG / 生产环境再考虑付费档。

**Q：怎么知道 AI 是不是在"联网搜"还是"瞎编"？**
A：装好 MCP 后，AI 的回答会带搜索结果来源。如果它引用了不存在的链接，多半是没配好搜索、在走幻觉路径——对照本文重新配一次即可。

---

*本文由 [vokki.cn] 独立评测出品。我们不收上架费，不卖排名。评测基于官方定价页、GitHub API 实测与公开基准（2026-08-13），价格以官网最新为准。*

*更新时间：2026-08-13 | 下次更新：2026-09-13*
