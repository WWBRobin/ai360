-- ============================================================
-- AI Skill 评测聚合平台 — Supabase 初始化脚本
-- 版本: v1.0 (2026-08-13)  依据: SPEC v2.0
-- 用法: 在 Supabase SQL Editor 中一次性执行（幂等，可重复执行）
-- 说明: RLS 全部启用；公共表匿名只读；trial_logs 仅 service_role 可写
--       （前端不直接读 trial_logs，试用配额由 ECS 中转 API 通过 service_role 查询）
-- ============================================================

-- ---------- 扩展 ----------
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- 搜索用三元组索引

-- ---------- 更新时间触发器 ----------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. 建表（SPEC 第七章数据模型，含 3 处增强）
--    增强1: skills.category 能力层级（基础设施增强/场景应用/效率工具）→ 装机必备页直接过滤
--    增强2: evaluations.free_quota_score / token_efficiency_score 数值化 → 综合评分可计算
--    增强3: skill_cards_view 聚合视图 → 列表页单查询出卡片数据
-- ============================================================

-- 平台
CREATE TABLE IF NOT EXISTS platforms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  base_url TEXT,                          -- 平台官方地址
  skill_count INTEGER DEFAULT 0,
  api_supported BOOLEAN DEFAULT FALSE,    -- 是否支持中转
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 场景（parent_id 实现两级：能力层级顶层 + 叶子场景）
CREATE TABLE IF NOT EXISTS scenarios (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50),
  parent_id INTEGER REFERENCES scenarios(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Skill
CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  tagline VARCHAR(500),
  description TEXT,
  category VARCHAR(20) DEFAULT 'scene'
    CHECK (category IN ('infrastructure', 'scene', 'efficiency')),
  platform_id INTEGER REFERENCES platforms(id),
  install_url TEXT NOT NULL,
  icon_url TEXT,
  developer_name VARCHAR(200),
  version VARCHAR(50),
  status VARCHAR(20) DEFAULT 'published', -- published | draft | archived
  trial_enabled BOOLEAN DEFAULT FALSE,    -- 是否支持中转试用
  trial_config JSONB,                     -- 中转配置（provider/bot_id/api_base/prompt_template 等）
  source VARCHAR(50) DEFAULT 'manual',    -- manual | listed（收录层）
  last_updated TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TRIGGER trg_skills_updated_at BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Skill × 场景
CREATE TABLE IF NOT EXISTS skill_scenarios (
  skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
  scenario_id INTEGER REFERENCES scenarios(id) ON DELETE CASCADE,
  PRIMARY KEY (skill_id, scenario_id)
);

-- 评测记录
CREATE TABLE IF NOT EXISTS evaluations (
  id SERIAL PRIMARY KEY,
  skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
  scenario_summary TEXT,                  -- Q1 解决什么场景
  difficulty_score INTEGER CHECK (difficulty_score BETWEEN 1 AND 5),  -- Q2
  difficulty_notes TEXT,
  stability_score INTEGER CHECK (stability_score BETWEEN 1 AND 5),    -- Q3
  stability_notes TEXT,
  free_quota TEXT,                        -- Q4
  free_quota_score INTEGER CHECK (free_quota_score BETWEEN 1 AND 5),  -- Q4 数值化
  token_cost TEXT,                        -- Q5
  token_efficiency_score INTEGER CHECK (token_efficiency_score BETWEEN 1 AND 5), -- Q5 数值化
  overall_score DECIMAL(2,1),             -- 0.2*difficulty + 0.4*stability + 0.2*free_quota + 0.2*token_eff
  evaluated_by VARCHAR(50),
  evaluation_method VARCHAR(20),          -- ai_first | manual
  test_cases TEXT,                        -- JSON 数组字符串
  version_at_eval VARCHAR(50),
  evaluated_at TIMESTAMP DEFAULT NOW()
);

-- 同类替代
CREATE TABLE IF NOT EXISTS skill_alternatives (
  skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
  alternative_skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
  note TEXT,
  PRIMARY KEY (skill_id, alternative_skill_id)
);

-- 使用指南
CREATE TABLE IF NOT EXISTS guides (
  id SERIAL PRIMARY KEY,
  skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  difficulty_level VARCHAR(20),
  video_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TRIGGER trg_guides_updated_at BEFORE UPDATE ON guides
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 横评文章
CREATE TABLE IF NOT EXISTS comparison_articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  scenario_id INTEGER REFERENCES scenarios(id),
  content TEXT NOT NULL,
  skills_included INT[] DEFAULT '{}',
  published_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'draft'
);

-- 场景教程
CREATE TABLE IF NOT EXISTS tutorials (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  scenario_id INTEGER REFERENCES scenarios(id),
  content TEXT NOT NULL,
  published_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'draft'
);

-- 场景方案（轻量工作流）
CREATE TABLE IF NOT EXISTS scenario_solutions (
  id SERIAL PRIMARY KEY,
  scenario_id INTEGER REFERENCES scenarios(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  steps JSONB NOT NULL,                   -- [{step, skill_id, action, params}]
  created_at TIMESTAMP DEFAULT NOW()
);

-- 配置（导航/Tab/推荐位等全部配置化）
CREATE TABLE IF NOT EXISTS site_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TRIGGER trg_site_config_updated_at BEFORE UPDATE ON site_config
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 试用记录（配额限流 + 后期分析，无用户系统，用 session_token 标识）
CREATE TABLE IF NOT EXISTS trial_logs (
  id SERIAL PRIMARY KEY,
  skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
  session_token VARCHAR(100) NOT NULL,    -- 浏览器指纹或随机 token
  input_text TEXT,
  output_text TEXT,
  tokens_used INTEGER,
  status VARCHAR(20) DEFAULT 'success',   -- success | failed | limited
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 2. 索引（查询路径全覆盖）
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_skills_platform ON skills(platform_id) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_skills_trial ON skills(trial_enabled) WHERE trial_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_skills_name_trgm ON skills USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_skills_slug ON skills(slug);
CREATE INDEX IF NOT EXISTS idx_skill_scenarios_scenario ON skill_scenarios(scenario_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_skill_latest ON evaluations(skill_id, evaluated_at DESC);
CREATE INDEX IF NOT EXISTS idx_alternatives_target ON skill_alternatives(alternative_skill_id);
CREATE INDEX IF NOT EXISTS idx_trial_logs_quota ON trial_logs(skill_id, session_token, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_status ON comparison_articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_tutorials_status ON tutorials(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenarios_parent ON scenarios(parent_id);

-- ============================================================
-- 3. 聚合视图：Skill 卡片（列表页单查询）
-- ============================================================
CREATE OR REPLACE VIEW skill_cards_view
WITH (security_invoker = true) AS
SELECT
  s.id, s.name, s.slug, s.tagline, s.icon_url, s.category,
  p.name AS platform_name, p.slug AS platform_slug, p.api_supported,
  e.overall_score, e.difficulty_score, e.stability_score,
  e.evaluated_at, e.free_quota,
  s.trial_enabled, s.install_url,
  COALESCE(array_agg(sc.slug ORDER BY sc.slug) FILTER (WHERE sc.slug IS NOT NULL), '{}') AS scenario_slugs
FROM skills s
JOIN platforms p ON p.id = s.platform_id
LEFT JOIN LATERAL (
  SELECT overall_score, difficulty_score, stability_score, evaluated_at, free_quota
  FROM evaluations
  WHERE skill_id = s.id AND overall_score IS NOT NULL
  ORDER BY evaluated_at DESC
  LIMIT 1
) e ON true
LEFT JOIN skill_scenarios ss ON ss.skill_id = s.id
LEFT JOIN scenarios sc ON sc.id = ss.scenario_id
WHERE s.status = 'published'
GROUP BY s.id, p.name, p.slug, p.api_supported,
         e.overall_score, e.difficulty_score, e.stability_score,
         e.evaluated_at, e.free_quota;

GRANT SELECT ON skill_cards_view TO anon, authenticated;

-- ============================================================
-- 4. RLS 策略（匿名只读；trial_logs 无匿名策略 → 仅 service_role 可访问）
-- ============================================================
ALTER TABLE platforms           ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios           ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills              ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_scenarios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_alternatives  ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides              ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials           ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_solutions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config         ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_logs          ENABLE ROW LEVEL SECURITY;   -- 无 policy = 匿名拒绝

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'platforms','scenarios','skills','skill_scenarios','evaluations',
    'skill_alternatives','guides','comparison_articles','tutorials',
    'scenario_solutions','site_config'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY public_read_%s ON %I FOR SELECT USING (true);', t, t);
  END LOOP;
END $$;

-- 4.1 显式授权（anon/authenticated 读内容表；trial_logs 故意不授 → 仅 service_role 可访问）
GRANT SELECT ON platforms, scenarios, skills, skill_scenarios, evaluations,
  skill_alternatives, guides, comparison_articles, tutorials,
  scenario_solutions, site_config TO anon, authenticated;

-- ============================================================
-- 5. 真实评测种子数据（30 Skill + 30 评测 + 场景/替代关联）
--     数据来源：2026-08-13 五轮 5 问评测（搜索/文件代码连接/效率/场景应用/记忆增强）
-- ============================================================

-- 清理旧示例种子（幂等：重复执行也能收敛到真实数据）
DELETE FROM skills WHERE slug IN ('ecommerce-copy-master','ppt-one-shot','weekly-report-gen',
  'memory-boost','web-search-assistant','ecommerce-data-analyst','batch-translate-workflow',
  'short-video-script','product-image-gen');
DELETE FROM comparison_articles WHERE slug IN ('ecommerce-copy-showdown');
DELETE FROM tutorials WHERE slug IN ('newbie-essential-skills');
DELETE FROM scenario_solutions WHERE title = '做电商主图完整方案';
DELETE FROM scenarios WHERE slug IN ('batch-translate','workflow-automation','weekly-report',
  'customer-service-bot','poster','coding','short-video','ppt','web-search','knowledge-base',
  'tool-connect','file-processing','memory','ecommerce-copy','data-analysis');
DELETE FROM scenarios WHERE slug IN ('infrastructure','scene-apps','efficiency-tools');

-- 5.1 平台（10 个平台不变，skill_count 已按真实收录数更新）
INSERT INTO platforms (name, slug, description, base_url, api_supported, sort_order, skill_count) VALUES
  ('扣子 Coze',   'coze',    '字节跳动 Agent 平台，国内生态最丰富', 'https://www.coze.cn',     TRUE,  1, 9),
  ('GPTs',        'gpts',    'OpenAI 官方 Skill 商店',            'https://chatgpt.com/gpts', TRUE,  2, 4),
  ('Claude Skills','claude', 'Anthropic Agent 技能',              'https://claude.ai',        FALSE, 3, 7),
  ('Dify',        'dify',    '开源 Agent 平台，可自部署',           'https://dify.ai',          TRUE,  4, 2),
  ('Hermes Skills','hermes', 'Hermes Agent 本地技能',              'https://hermes-agent.nousresearch.com', FALSE, 5, 3),
  ('Codex',       'codex',   'OpenAI 编程 Agent',                 'https://chatgpt.com/codex', FALSE, 6, 2),
  ('通义千问',      'qwen',    '阿里云 Agent 平台',                'https://tongyi.aliyun.com', TRUE,  7, 1),
  ('文心一言',      'ernie',   '百度 Agent 平台',                  'https://yiyan.baidu.com',   TRUE,  8, 1),
  ('WorkBuddy',   'workbuddy','企业级 Agent 平台',                 NULL, FALSE, 9, 0),
  ('LobeChat',    'lobechat','开源 AI 客户端',                    'https://lobehub.com',      FALSE, 10, 1)
ON CONFLICT (slug) DO NOTHING;
-- 幂等收敛：重复执行时修正 skill_count
UPDATE platforms p SET skill_count = v.cnt FROM (VALUES
  ('coze',9),('gpts',4),('claude',7),('dify',2),('hermes',3),
  ('codex',2),('qwen',1),('ernie',1),('workbuddy',0),('lobechat',1)) AS v(slug, cnt)
WHERE p.slug = v.slug;

-- 5.2 场景（能力层级 + 叶子场景）
INSERT INTO scenarios (name, slug, icon, sort_order) VALUES
  ('基础设施增强', 'infra', '🛡️', 1),
  ('场景应用',     'scene', '🎯', 2),
  ('效率工具',     'efficiency', '⚡', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO scenarios (name, slug, icon, parent_id, sort_order) VALUES
  ('记忆增强',   'memory',        '🧠', (SELECT id FROM scenarios WHERE slug='infra'), 1),
  ('联网搜索',   'search',        '🌐', (SELECT id FROM scenarios WHERE slug='infra'), 2),
  ('文件操作',   'file',          '📁', (SELECT id FROM scenarios WHERE slug='infra'), 3),
  ('代码执行',   'code',          '💻', (SELECT id FROM scenarios WHERE slug='infra'), 4),
  ('工具连接',   'connect',       '🔌', (SELECT id FROM scenarios WHERE slug='infra'), 5),
  ('文档处理',   'document',      '📄', (SELECT id FROM scenarios WHERE slug='infra'), 6),
  ('电商文案',   'ecommerce-copy','🛒', (SELECT id FROM scenarios WHERE slug='scene'), 1),
  ('内容创作',   'content-creation','✍️', (SELECT id FROM scenarios WHERE slug='scene'), 2),
  ('数据分析',   'data-analysis', '📈', (SELECT id FROM scenarios WHERE slug='scene'), 3),
  ('办公效率',   'office',        '💼', (SELECT id FROM scenarios WHERE slug='scene'), 4),
  ('设计海报',   'design',        '🎨', (SELECT id FROM scenarios WHERE slug='scene'), 5),
  ('视频创作',   'video',         '🎬', (SELECT id FROM scenarios WHERE slug='scene'), 6),
  ('人力资源',   'hr',            '👥', (SELECT id FROM scenarios WHERE slug='scene'), 7),
  ('法务审核',   'legal',         '⚖️', (SELECT id FROM scenarios WHERE slug='scene'), 8),
  ('行业调研',   'research',      '🔍', (SELECT id FROM scenarios WHERE slug='scene'), 9),
  ('模型路由',   'model-router',  '🚦', (SELECT id FROM scenarios WHERE slug='efficiency'), 1),
  ('自动化',     'automation',    '🔁', (SELECT id FROM scenarios WHERE slug='efficiency'), 2),
  ('UI设计',     'ui-design',     '🖥️', (SELECT id FROM scenarios WHERE slug='efficiency'), 3),
  ('省token',    'token-saving',  '💰', (SELECT id FROM scenarios WHERE slug='efficiency'), 4),
  ('安全审计',   'security',      '🛡️', (SELECT id FROM scenarios WHERE slug='efficiency'), 5)
ON CONFLICT (slug) DO NOTHING;
-- 5.3 Skill（30 个真实收录 Skill，覆盖 8 平台 + 3 能力层级）
-- 真实评测数据：trial_enabled 均暂为 FALSE（试用中转需接入真实 Bot ID 后开启）
INSERT INTO skills (name, slug, tagline, description, category, platform_id, install_url, icon_url,
                    developer_name, version, status, trial_enabled, trial_config, source, last_updated) VALUES
('Tavily 搜索 API', 'tavily', '为 AI Agent 设计的搜索 API，返回带评分的结构化结果', '专为 AI Agent / RAG 设计的搜索 API：返回 title/url/content/score 结构化结果，支持 include_answer 摘要、news/finance 话题、时间过滤与 prompt-injection 防护；MCP 双形态（远程 mcp.tavily.com 免安装 + 本地 npx tavily-mcp，GitHub 2.3K★），LangChain/LlamaIndex/Portkey 生态支持最广。', 'infrastructure', (SELECT id FROM platforms WHERE slug='hermes'),
 'https://tavily.com', NULL, 'Tavily AI', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('Firecrawl', 'firecrawl', '网页抓取+搜索+浏览器自动化全栈平台，网页一键转 LLM 就绪 Markdown', 'Scrape/Crawl/Map/Search/Interact/Monitor/Agent 七个端点，把网页转成 LLM 就绪 markdown 或结构化 JSON；GitHub 166,388★ 开源（AGPL-3.0）可自托管，官方 MCP firecrawl-mcp-server 7.2K★。定位：抓取/深挖为主，搜索为辅。', 'infrastructure', (SELECT id FROM platforms WHERE slug='dify'),
 'https://firecrawl.dev', NULL, 'Firecrawl', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('Brave Search MCP', 'brave-search-mcp', '中立独立搜索引擎官方 MCP，2026 基准 Agent Score 第一、延迟最低', '自建索引（30B+ 页面、每日 100M+ 页更新）的独立搜索引擎官方 MCP server（GitHub 1.4K★，MIT）：brave_web_search/local/video/image/news/place_search + brave_summarizer + brave_llm_context；只给结果与摘要不含全文。2026 AI Multiple 8 家基准 Agent Score 14.89/20 第一、延迟 669ms 最低。', 'infrastructure', (SELECT id FROM platforms WHERE slug='claude'),
 'https://brave.com/search/api/', NULL, 'Brave Software', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('E2B 代码沙箱', 'e2b-sandbox', 'AI 代码的云端虚拟机：Firecracker 微虚拟机安全执行，用完即焚', '给 AI Agent 的云端代码执行沙箱：AI 生成的代码在 Firecracker microVM 里安全隔离执行，无 LLM 绑定，可接任何模型；生产案例：Perplexity 高级数据分析、Manus 虚拟电脑、HuggingFace 复现 DeepSeek-R1、Groq、Lindy、Gumloop。附 MCP Gateway 与自定义沙箱模板。', 'infrastructure', (SELECT id FROM platforms WHERE slug='codex'),
 'https://e2b.dev', NULL, 'E2B', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('Filesystem MCP', 'filesystem-mcp', 'Anthropic 官方文件读写 MCP，安全访问你指定的目录', 'modelcontextprotocol 组织官方维护的本地文件系统 MCP 服务：创建/读取/编辑/搜索文件、建目录、移动、取元数据、读图片音频（base64）；Roots 白名单目录控制，只允许访问显式授权的路径，让 Claude/Cursor 等助手安全读写本地文件。', 'infrastructure', (SELECT id FROM platforms WHERE slug='claude'),
 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem', NULL, 'modelcontextprotocol (Anthropic)', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('Document Skills', 'document-skills', 'Claude 内置 docx/xlsx/pdf/pptx 四大文档技能，聊天框直接生成办公文件', 'Anthropic 官方技能：创建/编辑/解析 Word（含修订追踪）、Excel（公式真实可计算）、PPT（设计师级排版）、PDF（合并/拆分/填表/抽表格）；网页/桌面端 Customize→Skills 一键开启（Free/Pro 全档位可用），Claude Code 里 /docx /xlsx 等斜杠命令调用；源码开源 anthropics/skills（Apache-2.0）。', 'infrastructure', (SELECT id FROM platforms WHERE slug='claude'),
 'https://github.com/anthropics/skills', NULL, 'Anthropic', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('Composio', 'composio', '给 AI Agent 装手：托管 OAuth+MCP+SDK，一键接 1000+ 应用', 'Agent 跨应用集成平台：托管 OAuth + 托管 MCP + SDK，一键接 Gmail/Slack/GitHub/Jira/Notion 等 1000+ 应用；支持 Claude Code/Codex/Cursor/Hermes 等 harness，动态按需加载工具省上下文；企业向 SOC 2 Type 2、审计日志、人工审批、VPC 私有化部署。融资 $29M（Lightspeed 领投）。', 'infrastructure', (SELECT id FROM platforms WHERE slug='codex'),
 'https://composio.dev', NULL, 'Composio', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('OpenRouter', 'openrouter', '一个 API 接 500+ 模型的路由网关，自动故障转移', '统一 API 网关/模型聚合器：一个 key 调用 OpenAI/Anthropic/Google/Meta 等数百家模型，OpenAI 兼容端点 https://openrouter.ai/api/v1；自动路由、自动故障转移、模型对比选型、免费模型体验；$50M ARR（Sacra 估，2026-03），2026 年完成 $113M B 轮。', 'efficiency', (SELECT id FROM platforms WHERE slug='lobechat'),
 'https://openrouter.ai', NULL, 'OpenRouter', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('Zapier AI Actions', 'zapier-ai-actions', '无代码跨 8000+ 应用自动化，MCP 让 Agent 直接调动作', '老牌 no-code 自动化平台，AI 化后通过 MCP Server 让 Claude/ChatGPT 等 Agent 直接调用 8,000–9,000+ 应用的动作；Zapier Copilot 自然语言建流程、Chatbots。', 'efficiency', (SELECT id FROM platforms WHERE slug='gpts'),
 'https://zapier.com', NULL, 'Zapier', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('Frontend Design', 'frontend-design', 'Claude 官方前端技能，做出不像 AI 生成的高质感前端', 'Anthropic 官方 Claude 技能（2026 年安装量第一，约 113 万 installs）：教 Claude 生成有设计感的落地页/仪表盘/组件，杜绝 AI 味（紫色渐变、模板化布局、默认字体）；配合品牌 CLAUDE.md 可做定制化设计系统。', 'efficiency', (SELECT id FROM platforms WHERE slug='claude'),
 'https://claude.com/plugins/frontend-design', NULL, 'Anthropic', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('Caveman', 'caveman', '让 Agent 用很少的词说很多事，宣称削减 65% 输出 token', 'Claude Code 输出压缩技能（GitHub 97.8K stars，现象级网红技能）：/caveman 一键激活，让长回复变短、去客套话和填充词；JetBrains 官方 A/B 实测编码 Agent 场景仅省 ~8.5% 输出 token，MakeUseOf 实测对话场景省 52–70%，宣称的 65% 只对聊天 Q&A 成立。', 'efficiency', (SELECT id FROM platforms WHERE slug='claude'),
 'https://github.com/juliusbrussee/caveman', NULL, 'JuliusBrussee', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('Trail of Bits Security', 'trail-of-bits-security', '顶级安全公司开源的 Claude Code 安全审计技能集', 'Trail of Bits 开源的代码安全审计技能集合（GitHub 6.6K★，CC-BY-SA-4.0）：CodeQL/Semgrep 静态分析、跨库变体分析（找同类漏洞）、安全向差分代码审查、危险 API/配置识别（sharp-edges）、C/Rust 专项审查、YARA 规则编写、Burp Suite 项目解析；安全圈公认黄金标准。', 'efficiency', (SELECT id FROM platforms WHERE slug='claude'),
 'https://github.com/trailofbits/skills', NULL, 'Trail of Bits', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('文心一言 ERNIE 4.5', 'ernie-4-5', '百度原生多模态大模型，中文创作强，API 价约为 GPT-4.5 的 1%', '百度原生多模态大模型：中文内容创作（文案/小说/公文/营销话术）、中文知识问答、多模态理解（图片/图表/梗图）、智能客服、长文档摘要（128K 上下文）；2025-04-01 起 C 端免费，2025-06-30 开源，API 价格约 ¥4/M 输入、¥16/M 输出。', 'scene', (SELECT id FROM platforms WHERE slug='ernie'),
 'https://yiyan.baidu.com', NULL, '百度 (Baidu)', '4.5', 'published', FALSE, NULL, 'manual', NOW()),
('小红书图文神器Pro', 'xiaohongshu-copy-pro', '小红书图文笔记创作全流程，标题/正文/标签一键出', '扣子技能大赛三等奖（作者：马煜）：输入产品名/卖点/目标人群，基于小红书热门语料与搜索趋势生成带 Emoji 的场景化标题、正文、标签与号召性结尾，可配套批量出图与排版，输出直接可发。', 'scene', (SELECT id FROM platforms WHERE slug='coze'),
 'https://www.coze.cn/?skill_share_pid=7598522476846694409', NULL, '马煜', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('电商商品主图一键生成', 'ecommerce-main-image', '上传商品图一键生成白底图/场景图/多尺寸主图', '扣子技能大赛优秀奖（作者：杨胜益）：电商商家主图/场景图提效——上传商品图一键生成白底图、场景图、多尺寸主图；核心是背景替换、智能抠图、图像叠加节点组合。', 'scene', (SELECT id FROM platforms WHERE slug='coze'),
 'https://www.coze.cn/?skill_share_pid=7605869640991997958', NULL, '杨胜益', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('品牌朋友圈文案生成', 'brand-moments-copy', '按品牌调性批量生成种草型/人设型/活动型朋友圈文案', '扣子技能大赛优秀奖（作者：赵伊萱）：品牌/微商/私域运营的朋友圈文案批量生产——按品牌调性生成种草型、人设型、活动型文案，规避广告味，提升触达转化。', 'scene', (SELECT id FROM platforms WHERE slug='coze'),
 'https://www.coze.cn/?skill_share_pid=7598878884473651210', NULL, '赵伊萱', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('Canva GPT版', 'canva-gpt', 'ChatGPT 对话内自然语言生成/编辑 Canva 设计', '官方 Canva for ChatGPT：在 ChatGPT 对话内用自然语言生成/编辑 Canva 设计——简历模板、邀请函、演示文稿、Instagram 帖、品牌工具包、社媒轮播图、一键改尺寸；可搜索个人 Canva 素材库并产出可继续编辑的设计。注意：中国大陆与欧盟不可用。', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
 'https://chatgpt.com/apps/canva', NULL, 'Canva', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('热点雷达', 'trend-radar', '全网热点追踪与聚合，先人一步抓住时效话题', '扣子技能大赛一等奖（作者：张森）：自动采集微博/知乎等平台热点，输出热度趋势分析、情感倾向、摘要报告；开源版 TrendRadar 为 MCP 服务器（17 个工具），支持微信/飞书/钉钉/Telegram/邮件多端推送。', 'scene', (SELECT id FROM platforms WHERE slug='coze'),
 'https://www.coze.cn/?skill_share_pid=7597875515860451378', NULL, '张森', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('公众号自动配图并排版', 'wechat-article-layout', '公众号长文自动配图 + 排版，输出可直接用的排版 HTML', '扣子技能大赛优秀奖（作者：王甲刚）：输入文章/视频链接，AI 生成封面图与正文配图，输出带公众号头部样式、分段结构的排版 HTML，可对接草稿箱。', 'scene', (SELECT id FROM platforms WHERE slug='coze'),
 'https://www.coze.cn/?skill_share_pid=7599659149298991156', NULL, '王甲刚', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('Video Maker by invideo', 'video-maker', 'ChatGPT 对话内一句话生成可发布的短视频成片', 'invideo AI 官方 GPT：AI 写脚本→从 1600 万+ 正版素材库匹配画面→AI 配音+背景乐+转场→输出 TikTok/Reels/YouTube 可用视频；5000 万用户、月产 700 万支视频；免费版强制水印、中文内容支持弱。', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
 'https://invideo.io/ai/video-gpt', NULL, 'invideo AI', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('行业资深调研报告', 'industry-research-report', '输入行业关键词，输出结构化行业调研报告初稿', '扣子技能大赛优秀奖（作者：陈群）：输入行业/细分领域关键词，输出行业概览、市场规模、产业链、竞争格局、发展趋势、风险提示的结构化调研报告，适合立项与竞品调研初稿。', 'scene', (SELECT id FROM platforms WHERE slug='coze'),
 'https://www.coze.cn/?skill_share_pid=7597054828078153734', NULL, '陈群', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('投行级深度行业分析', 'ib-industry-analysis', '波特五力+产业链拆解+估值思路的投行研报风格分析', '扣子技能大赛优秀奖（作者：关原振）：投行研报风格的深度行业分析——波特五力、产业链拆解、市场规模测算框架、竞争格局与估值思路，面向投资/战略分析场景输出结构化长文。', 'scene', (SELECT id FROM platforms WHERE slug='coze'),
 'https://www.coze.cn/?skill_share_pid=7604466157126565929', NULL, '关原振', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('Consensus', 'consensus', '学术文献共识问答：覆盖 2.2 亿+ 篇同行评审论文', '学术搜索引擎（GPTs 热门）：覆盖 2.2 亿+ 篇同行评审论文，共识问答（X 是否有效）、论文摘要、Deep Search 深度研究、Scholar Agent 多智能体（GPT-5 驱动）自动完成文献综述；800 万+ 用户，含医疗模式。', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
 'https://consensus.app', NULL, 'Consensus', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('智能简历初审评估', 'resume-screening', '简历+JD 上传即出匹配评分与结构化评估意见', '扣子技能大赛优秀奖（作者：吴培丽）：HR/招聘初筛——上传简历 + 岗位 JD，AI 按匹配维度（学历、年限、技能、行业经验）打分并输出结构化评估意见与风险提示，批量初筛提效。', 'scene', (SELECT id FROM platforms WHERE slug='coze'),
 'https://www.coze.cn/?skill_share_pid=7597059123490095145', NULL, '吴培丽', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('3分钟采购合同快审', 'contract-fast-review', '上传合同 3 分钟输出风险条款识别与修改建议', '扣子技能大赛优秀奖（作者：赵伊萱）：采购/法务合同初审——上传合同文本，3 分钟输出风险条款识别、法律依据引用、修改建议清单，用于签前快速筛查。', 'scene', (SELECT id FROM platforms WHERE slug='coze'),
 'https://www.coze.cn/?skill_share_pid=7601458869742911529', NULL, '赵伊萱', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('千问办公助手', 'qianwen-office', '阿里企业级 AI 办公智能体：文档/PPT/表格/会议纪要/自动化', '阿里巴巴通义千问企业级 AI 办公智能体：整合 QoderWork（代码/数据处理）、悟空（文档/文案创作）、MuleRun（跨平台流程自动化）三大智能体，依托钉钉 2,000 万企业生态；PC 客户端为对话+任务工作台形态，支持定时任务、技能、连接器。', 'scene', (SELECT id FROM platforms WHERE slug='qwen'),
 'https://www.qianwen.com', NULL, '阿里巴巴（通义千问）', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('claude-mem', 'claude-mem', 'Claude Code 持久记忆插件：跨会话记住项目上下文', 'Claude Code 专用插件（GitHub 90,542★，Apache-2.0）：通过 5 个生命周期 hook 自动捕获会话中所有工具调用，用 Claude Agent SDK 做 AI 压缩观察，存入本地 SQLite + ChromaDB，新会话启动时自动注入相关上下文；一行 npx claude-mem install 零配置。', 'infrastructure', (SELECT id FROM platforms WHERE slug='claude'),
 'https://github.com/thedotmack/claude-mem', NULL, 'Alex Newman (thedotmack)', '13.4.0', 'published', FALSE, NULL, 'manual', NOW()),
('Supermemory', 'supermemory', '跨平台记忆引擎：一个 API 搞定存储/抽取/召回/矛盾消解', '记忆图（memory graph）架构的上下文引擎（GitHub 28,879★，MIT）：MCP server + Node/Python SDK + Claude Code/OpenClaw/Cursor/Hermes 插件；自称 3 个 benchmark 第一（85.4% LongMemEval-S、LoCoMo P@1 59.7% vs 竞品 34.4%、Recall@10 83.5%）、p50 召回延迟 <300ms；2025-10 融资 $3M。', 'infrastructure', (SELECT id FROM platforms WHERE slug='hermes'),
 'https://supermemory.ai', NULL, 'Dhravya Shah (Supermemory)', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('Mem0', 'mem0', '企业级 AI 记忆层：开源 + 托管，混合存储架构', '面向开发者的记忆基础设施（GitHub 63,131★，Apache-2.0，YC 孵化 + $24M Series A）：混合存储（图 + 向量 + key-value），托管平台 benchmark 亮眼（LoCoMo 92.5、LongMemEval 94.4）；客户含 AWS/Vercel/NVIDIA/Dify，9 万+开发者使用。', 'infrastructure', (SELECT id FROM platforms WHERE slug='dify'),
 'https://mem0.ai', NULL, 'Mem0 (YC)', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),
('Hermes Hindsight', 'hindsight', '会学习的记忆：知识图谱+反思沉淀，LongMemEval 94.6%', 'Vectorize 出品、Hermes 官方默认长期记忆 provider（GitHub 19,820★，MIT）：生物模拟结构 World + Experiences + Mental Models（反思沉淀），实体/关系/时序 + 稀疏/稠密双向量；Hermes 内 hindsight_retain/recall/reflect 三工具（reflect 跨记忆综合独有）；LongMemEval 94.6% 官方可复现最高分。', 'infrastructure', (SELECT id FROM platforms WHERE slug='hermes'),
 'https://vectorize.io', NULL, 'Vectorize', '2026-08', 'published', FALSE, NULL, 'manual', NOW())
ON CONFLICT (slug) DO NOTHING;

-- 5.4 Skill × 场景 关联（每个 Skill 1-3 个场景）
INSERT INTO skill_scenarios (skill_id, scenario_id) VALUES
  ((SELECT id FROM skills WHERE slug='tavily'), (SELECT id FROM scenarios WHERE slug='search')),
  ((SELECT id FROM skills WHERE slug='firecrawl'), (SELECT id FROM scenarios WHERE slug='search')),
  ((SELECT id FROM skills WHERE slug='firecrawl'), (SELECT id FROM scenarios WHERE slug='document')),
  ((SELECT id FROM skills WHERE slug='brave-search-mcp'), (SELECT id FROM scenarios WHERE slug='search')),
  ((SELECT id FROM skills WHERE slug='e2b-sandbox'), (SELECT id FROM scenarios WHERE slug='code')),
  ((SELECT id FROM skills WHERE slug='e2b-sandbox'), (SELECT id FROM scenarios WHERE slug='data-analysis')),
  ((SELECT id FROM skills WHERE slug='filesystem-mcp'), (SELECT id FROM scenarios WHERE slug='file')),
  ((SELECT id FROM skills WHERE slug='document-skills'), (SELECT id FROM scenarios WHERE slug='document')),
  ((SELECT id FROM skills WHERE slug='document-skills'), (SELECT id FROM scenarios WHERE slug='office')),
  ((SELECT id FROM skills WHERE slug='composio'), (SELECT id FROM scenarios WHERE slug='connect')),
  ((SELECT id FROM skills WHERE slug='composio'), (SELECT id FROM scenarios WHERE slug='automation')),
  ((SELECT id FROM skills WHERE slug='openrouter'), (SELECT id FROM scenarios WHERE slug='model-router')),
  ((SELECT id FROM skills WHERE slug='zapier-ai-actions'), (SELECT id FROM scenarios WHERE slug='automation')),
  ((SELECT id FROM skills WHERE slug='zapier-ai-actions'), (SELECT id FROM scenarios WHERE slug='connect')),
  ((SELECT id FROM skills WHERE slug='frontend-design'), (SELECT id FROM scenarios WHERE slug='ui-design')),
  ((SELECT id FROM skills WHERE slug='caveman'), (SELECT id FROM scenarios WHERE slug='token-saving')),
  ((SELECT id FROM skills WHERE slug='trail-of-bits-security'), (SELECT id FROM scenarios WHERE slug='security')),
  ((SELECT id FROM skills WHERE slug='ernie-4-5'), (SELECT id FROM scenarios WHERE slug='content-creation')),
  ((SELECT id FROM skills WHERE slug='ernie-4-5'), (SELECT id FROM scenarios WHERE slug='office')),
  ((SELECT id FROM skills WHERE slug='xiaohongshu-copy-pro'), (SELECT id FROM scenarios WHERE slug='content-creation')),
  ((SELECT id FROM skills WHERE slug='xiaohongshu-copy-pro'), (SELECT id FROM scenarios WHERE slug='ecommerce-copy')),
  ((SELECT id FROM skills WHERE slug='ecommerce-main-image'), (SELECT id FROM scenarios WHERE slug='ecommerce-copy')),
  ((SELECT id FROM skills WHERE slug='ecommerce-main-image'), (SELECT id FROM scenarios WHERE slug='design')),
  ((SELECT id FROM skills WHERE slug='brand-moments-copy'), (SELECT id FROM scenarios WHERE slug='content-creation')),
  ((SELECT id FROM skills WHERE slug='brand-moments-copy'), (SELECT id FROM scenarios WHERE slug='ecommerce-copy')),
  ((SELECT id FROM skills WHERE slug='canva-gpt'), (SELECT id FROM scenarios WHERE slug='design')),
  ((SELECT id FROM skills WHERE slug='canva-gpt'), (SELECT id FROM scenarios WHERE slug='office')),
  ((SELECT id FROM skills WHERE slug='canva-gpt'), (SELECT id FROM scenarios WHERE slug='content-creation')),
  ((SELECT id FROM skills WHERE slug='trend-radar'), (SELECT id FROM scenarios WHERE slug='research')),
  ((SELECT id FROM skills WHERE slug='trend-radar'), (SELECT id FROM scenarios WHERE slug='content-creation')),
  ((SELECT id FROM skills WHERE slug='wechat-article-layout'), (SELECT id FROM scenarios WHERE slug='content-creation')),
  ((SELECT id FROM skills WHERE slug='wechat-article-layout'), (SELECT id FROM scenarios WHERE slug='design')),
  ((SELECT id FROM skills WHERE slug='video-maker'), (SELECT id FROM scenarios WHERE slug='video')),
  ((SELECT id FROM skills WHERE slug='industry-research-report'), (SELECT id FROM scenarios WHERE slug='research')),
  ((SELECT id FROM skills WHERE slug='ib-industry-analysis'), (SELECT id FROM scenarios WHERE slug='research')),
  ((SELECT id FROM skills WHERE slug='ib-industry-analysis'), (SELECT id FROM scenarios WHERE slug='data-analysis')),
  ((SELECT id FROM skills WHERE slug='consensus'), (SELECT id FROM scenarios WHERE slug='research')),
  ((SELECT id FROM skills WHERE slug='resume-screening'), (SELECT id FROM scenarios WHERE slug='hr')),
  ((SELECT id FROM skills WHERE slug='contract-fast-review'), (SELECT id FROM scenarios WHERE slug='legal')),
  ((SELECT id FROM skills WHERE slug='qianwen-office'), (SELECT id FROM scenarios WHERE slug='office')),
  ((SELECT id FROM skills WHERE slug='qianwen-office'), (SELECT id FROM scenarios WHERE slug='data-analysis')),
  ((SELECT id FROM skills WHERE slug='qianwen-office'), (SELECT id FROM scenarios WHERE slug='document')),
  ((SELECT id FROM skills WHERE slug='claude-mem'), (SELECT id FROM scenarios WHERE slug='memory')),
  ((SELECT id FROM skills WHERE slug='supermemory'), (SELECT id FROM scenarios WHERE slug='memory')),
  ((SELECT id FROM skills WHERE slug='mem0'), (SELECT id FROM scenarios WHERE slug='memory')),
  ((SELECT id FROM skills WHERE slug='hindsight'), (SELECT id FROM scenarios WHERE slug='memory'))
ON CONFLICT DO NOTHING;

-- 5.5 评测记录（每 Skill 1 条，共 30 条；overall = 0.2*diff + 0.4*stab + 0.2*free + 0.2*token）
INSERT INTO evaluations (skill_id, scenario_summary, difficulty_score, difficulty_notes,
                         stability_score, stability_notes, free_quota, free_quota_score,
                         token_cost, token_efficiency_score, overall_score,
                         evaluated_by, evaluation_method, test_cases, version_at_eval, evaluated_at) VALUES
((SELECT id FROM skills WHERE slug='tavily'),
 '为 AI Agent 设计的搜索 API，返回带评分的结构化结果', 5, '注册即拿 key，1,000 credits/月免费且无需信用卡；Python/JS SDK 一行调用，远程 MCP 零本地安装，三工具中门槛最低', 4, '基础设施成熟（基准延迟 998ms）；结果链接偶发 404/失效、结果排名可控性弱、免费层无 SLA',
 '1,000 credits/月（≈1,000 次搜索），每月 1 日重置、不滚动、无信用卡', 5, '单次约 1–2K token（片段返回）；basic search $8/1K 次；开启 includeRawContent 会爆炸需慎用', 4, 4.4,
 '老吴评测组', 'ai_first',
 '[{"case":"include_answer 摘要查询","result":"结构化结果+AI 摘要"},{"case":"news/finance 话题","result":"支持时间过滤"}]', '2026-08', NOW() - INTERVAL '8 days'),
((SELECT id FROM skills WHERE slug='firecrawl'),
 '网页抓取+搜索+浏览器自动化全栈平台，网页一键转 LLM 就绪 Markdown', 4, '免费 1,000 credits/月，npx -y firecrawl-mcp 约 3 分钟配好；7 个端点+动态 credit 计费学习曲线偏高，免费层并发仅 2', 4, '基础设施稳（自称 99.9% uptime）；明确屏蔽 Reddit 等站点、部分站点需找客服手动开启、Cloudflare/重度 JS 站点抓取失败常见（实际 3.5/5）',
 '1,000 credits/月（=1,000 页 scrape），无信用卡，2 并发；另有 $5 一次性 PAYG 档', 5, '整页 markdown 输出三工具中最重（单页可达数千 token），适合离线建索引不适合逐轮 grounding；search ≈$1.66/1K 次', 2, 3.8,
 '老吴评测组', 'ai_first',
 '[{"case":"整站爬取转 Markdown","result":"LLM 就绪结构化输出"},{"case":"Reddit 站点抓取","result":"被明确屏蔽"}]', '2026-08', NOW() - INTERVAL '7 days'),
((SELECT id FROM skills WHERE slug='brave-search-mcp'),
 '中立独立搜索引擎官方 MCP，2026 基准 Agent Score 第一、延迟最低', 5, '注册即拿 key，npx @brave/brave-search-mcp-server 一条命令；工具命名清晰参数丰富；local search 需 Pro、1.x→2.x 迁移改 STDIO（实际 4.5/5）', 5, '2026 AI Multiple 基准 8 家中 Agent Score 第一（14.89/20）、延迟最低（669ms）；Answers 计划仅 2 QPS、长尾查询质量弱于 Google（实际 4.5/5）',
 '$5 免费信用/月 ≈ 1,000 次 Search，自动到账无需信用卡；旧免费层（5,000 查询/月）已被取代', 4, '原生最省：只回标题/URL/摘要；brave_llm_context 可精确设定 token 预算（1024–32,768）', 5, 4.8,
 '老吴评测组', 'ai_first',
 '[{"case":"AI Multiple 2026 基准","result":"14.89/20 第一、延迟 669ms"},{"case":"llm_context 预算","result":"1024-32768 可调"}]', '2026-08', NOW() - INTERVAL '6 days'),
((SELECT id FROM skills WHERE slug='e2b-sandbox'),
 'AI 代码的云端虚拟机：Firecracker 微虚拟机安全执行，用完即焚', 3, '必须写代码：Python/TS SDK（run_code/install_pkg/create_file）或 MCP 接入，开发者约 0.5-1 小时上手；无代码用户基本用不了', 4, '生产级验证充分（Perplexity/Manus/Gumloop）；沙箱冷启动有延迟、任何档位都没有 GPU（硬伤）、Pro 以上才有 24h 长会话',
 'Hobby 免费档 $100 一次性额度 + 1 小时最长会话 + 20 并发沙箱 + 10GiB 存储', 4, '无 Token 成本：只按算力秒计费（vCPU $0.000014/秒），LLM token 走自己的模型供应商', 5, 4.0,
 '老吴评测组', 'ai_first',
 '[{"case":"数据分析沙箱","result":"Perplexity 生产级验证"},{"case":"GPU 需求","result":"任何档位无 GPU"}]', '2026-08', NOW() - INTERVAL '5 days'),
((SELECT id FROM skills WHERE slug='filesystem-mcp'),
 'Anthropic 官方文件读写 MCP，安全访问你指定的目录', 4, '一条 npx 命令配置进 claude_desktop_config.json 即可（需 Node.js）；非技术用户改 JSON 稍有门槛、Windows 需 cmd /c 写法', 4, '官方 MIT 开源、GitHub ~8 万 star 极广泛使用；Node 版本兼容偶发、改配置必须重启客户端、授权过宽存在 prompt-injection 风险',
 '完全免费：开源软件本地运行，无订阅无调用限制', 5, '主要隐性成本在 token：MCP 工具描述+读入的文件内容会撑爆上下文窗口，建议只授权必要目录、针对性读取', 2, 3.8,
 '老吴评测组', 'ai_first',
 '[{"case":"Obsidian 笔记读写","result":"本地文件操作稳定"},{"case":"大文件读入","result":"上下文膨胀风险"}]', '2026-08', NOW() - INTERVAL '4 days'),
((SELECT id FROM skills WHERE slug='document-skills'),
 'Claude 内置 docx/xlsx/pdf/pptx 四大文档技能，聊天框直接生成办公文件', 5, '网页/桌面端零安装：设置里打开开关直接说一句即可；Claude Code 路径需装 pandoc/docx/LibreOffice/poppler 依赖（CLI 3/5）', 4, '官方维护用户量巨大；单文件上传/下载 30MB 上限、修订追踪转换有已知瑕疵（pandoc 合并段落问题）、部分高级操作依赖本地 LibreOffice',
 'Claude 免费账号也能用，无额外费用；开源版完全免费', 5, '成本=Claude 订阅/API token（文件内容+生成过程）；本地脚本（docx npm 包）不额外收费', 3, 4.2,
 '老吴评测组', 'ai_first',
 '[{"case":"DOCX 带修订追踪","result":"pandoc 合并段落有瑕疵"},{"case":"30MB 以上文件","result":"上传受限"}]', '2026-08', NOW() - INTERVAL '3 days'),
((SELECT id FROM skills WHERE slug='composio'),
 '给 AI Agent 装手：托管 OAuth+MCP+SDK，一键接 1000+ 应用', 3, 'SDK(Python/TS)+托管认证，声称 30 秒接入；本质是开发者工具，无代码能力弱于 Zapier', 4, '企业级背书（SOC 2、大客户）；部分常用应用缺失（Twilio/Netlify/Firebase）、个别动作偶发失败需重试、定价变更频繁（2026-08-15 又调整）',
 '完全免费档：20,000 次工具调用/月', 5, '无 LLM token 费用（按调用次数计费）；工具 schema 注入占上下文，靠动态加载缓解', 3, 3.8,
 '老吴评测组', 'ai_first',
 '[{"case":"Gmail 发信","result":"托管 OAuth 稳定"},{"case":"定价","result":"2026-08-15 调整频繁"}]', '2026-08', NOW() - INTERVAL '2 days'),
((SELECT id FROM skills WHERE slug='openrouter'),
 '一个 API 接 500+ 模型的路由网关，自动故障转移', 5, '注册→建 key→OpenAI 兼容端点，几行代码切换任意模型；文档/沙盒完善，无需信用卡即可用免费模型', 4, '平台有公开 status 页；底层依赖数百家第三方供应商，个别模型偶发 provider 故障/限流，需开启 fallback 路由',
 ':free 标记模型 $0/token（约 2–15 个轮换）；免费限流 20 req/min、50–200 req/day/模型，充值 $10 提至 1,000 req/day', 4, '按 token 付费 + 5.5% 起 markup，价格透明可对比；免费模型 $0；企业批量直连官方 API 更便宜', 4, 4.2,
 '老吴评测组', 'ai_first',
 '[{"case":"免费模型体验","result":"Llama 3.3 70B 等 $0"},{"case":"故障转移","result":"需开启 fallback"}]', '2026-08', NOW() - INTERVAL '1 days'),
((SELECT id FROM skills WHERE slug='zapier-ai-actions'),
 '无代码跨 8000+ 应用自动化，MCP 让 Agent 直接调动作', 4, '可视化搭建对非技术用户极友好（5/5）；AI Actions/MCP 需逐个授权应用账户，每个动作=1 task 的计费模型需学习', 4, '平台成熟稳定、8,000+ 集成可靠；轮询触发最低 15 分钟间隔（免费档）、复杂流程任务用量易超限',
 'Free 计划 100 tasks/月，Zap 限两步，表格 2,500 条记录；MCP 动作同样消耗 tasks（约 2 tasks/次）', 3, '非 token 计费，按 task 计费（每个动作=1 task）；Professional $19.99/月（年付）750 tasks，超额 1.25 倍费率', 3, 3.6,
 '老吴评测组', 'ai_first',
 '[{"case":"Slack 建工单","result":"MCP 动作约 2 tasks/次"},{"case":"免费档","result":"100 tasks/月限两步"}]', '2026-08', NOW() - INTERVAL '2 days'),
((SELECT id FROM skills WHERE slug='frontend-design'),
 'Claude 官方前端技能，做出不像 AI 生成的高质感前端', 4, 'npx skills add 或 claude.com 插件页一键装；出好效果需配置品牌 token/字体规则，默认开箱效果偏通用', 5, '静态技能文件（纯 prompt 规则）无运行时依赖、无服务可挂；Anthropic 官方维护，随 Claude Code 升级持续更新',
 '技能本身完全免费（anthropics/skills 仓库 MIT）；成本全在 Claude 侧订阅/API token', 5, '技能文件占少量输入上下文 token；一次说对、少迭代，实际节省大量生成/重写 token', 4, 4.6,
 '老吴评测组', 'ai_first',
 '[{"case":"落地页生成","result":"无 AI 味高质感"},{"case":"品牌定制","result":"需配置 CLAUDE.md"}]', '2026-08', NOW() - INTERVAL '1 days'),
((SELECT id FROM skills WHERE slug='caveman'),
 '让 Agent 用很少的词说很多事，宣称削减 65% 输出 token', 5, 'npx skills add JuliusBrussee/caveman，对话内 /caveman 一键激活；可自定义风格，也提供输入侧压缩', 3, '工具本身稳定但效果夸大：JetBrains 82 组任务实测编码场景仅省 ~8.5% 输出 token（代码/工具调用 token 被刻意保留）',
 '完全免费开源（MIT skill + BSL-1.1 engine）', 5, '省输出 token 即省钱（输入略增 180→600，净赚 1,000→300）；与 prompt caching 叠加效果最佳', 4, 4.0,
 '老吴评测组', 'ai_first',
 '[{"case":"JetBrains 82 组 A/B","result":"编码场景仅省 ~8.5%"},{"case":"对话场景","result":"省 52-70%"}]', '2026-08', NOW() - INTERVAL '3 days'),
((SELECT id FROM skills WHERE slug='trail-of-bits-security'),
 '顶级安全公司开源的 Claude Code 安全审计技能集', 3, '安装容易（marketplace/仓库直装），用好需安全背景：CodeQL 建库、规则集选择、SARIF 输出有学习曲线；部分技能依赖外部工具链', 5, '专业团队持续维护，每技能带 SKILL.md 文档与严格门控流程（fp-check 假阳性校验）；是审计工作流而非玩具',
 '完全免费开源', 5, '重 token 消耗型：多步骤审计会读大量代码进上下文；相对请安全审计公司（数万$/次）仍是几个数量级便宜', 2, 4.0,
 '老吴评测组', 'ai_first',
 '[{"case":"CodeQL 变体分析","result":"跨库同类漏洞"},{"case":"fp-check","result":"假阳性校验门控"}]', '2026-08', NOW() - INTERVAL '4 days'),
((SELECT id FROM skills WHERE slug='ernie-4-5'),
 '百度原生多模态大模型，中文创作强，API 价约为 GPT-4.5 的 1%', 4, 'C 端 App/网页免费登录即用（5/5）；API 需注册百度智能云千帆平台、实名/企业认证略繁琐（3/5）', 4, '百度成熟商用模型服务稳定；知识截止 2025-06 有滞后、超长上下文有注意力衰减、境外/API 合规需注意',
 'C 端完全免费（2025-04-01 起）；模型已开源可自部署（0 成本）', 5, 'API 约 ¥4/M 输入、¥16/M 输出（GPT-4.5 的 1%）；X1 更便宜 ¥2/¥8', 4, 4.2,
 '老吴评测组', 'ai_first',
 '[{"case":"中文文案生成","result":"中文创作质量高"},{"case":"API 价格","result":"约 GPT-4.5 的 1%"}]', '4.5', NOW() - INTERVAL '5 days'),
((SELECT id FROM skills WHERE slug='xiaohongshu-copy-pro'),
 '小红书图文笔记创作全流程，标题/正文/标签一键出', 4, '技能商店一键添加、对话即用；配图环节需在扣子空间/图像流调参，纯小白要试几次', 3, '依赖底层豆包模型与文生图质量，生图风格、商品主体还原存在随机性；个人创作者维护，迭代节奏不可控',
 '技能免费添加；调用消耗扣子免费版每日 1,500 积分（2026-01 套餐升级后）', 4, '中：图文生成含文生图/图像流调用，积分消耗显著高于纯文本；重度日更需进阶版 ¥39.9/月', 3, 3.4,
 '老吴评测组', 'ai_first',
 '[{"case":"产品种草笔记","result":"标题正文标签完整"},{"case":"批量出图","result":"需图像流调参"}]', '2026-08', NOW() - INTERVAL '6 days'),
((SELECT id FROM skills WHERE slug='ecommerce-main-image'),
 '上传商品图一键生成白底图/场景图/多尺寸主图', 4, '对话式上传即用；复杂商品（透明瓶、细线材）需多次抽卡', 3, '生图效果依赖模型对商品主体的识别与背景理解，透明/反光材质易出瑕疵，需人工筛选',
 '技能免费；消耗扣子积分（免费版每日 1,500 积分）', 3, '中高：图像流按模型计算量计费，批量出图积分消耗快；建议搭配进阶版套餐', 2, 3.0,
 '老吴评测组', 'ai_first',
 '[{"case":"白底图生成","result":"一键出图"},{"case":"透明瓶商品","result":"需多次抽卡"}]', '2026-08', NOW() - INTERVAL '5 days'),
((SELECT id FROM skills WHERE slug='brand-moments-copy'),
 '按品牌调性批量生成种草型/人设型/活动型朋友圈文案', 5, '纯文本对话，输入品牌与产品信息即出稿，无任何配置', 4, '纯文本生成任务大模型表现稳定；文案同质化、模板感是普遍短板',
 '技能免费；扣子免费版每日 1,500 积分', 4, '低：单条文案数百至数千 token，免费积分可支撑日常高频使用', 5, 4.4,
 '老吴评测组', 'ai_first',
 '[{"case":"私域种草文案","result":"三种调性批量出稿"},{"case":"模板感","result":"同质化需人工润色"}]', '2026-08', NOW() - INTERVAL '4 days'),
((SELECT id FROM skills WHERE slug='canva-gpt'),
 'ChatGPT 对话内自然语言生成/编辑 Canva 设计', 4, '需 ChatGPT + Canva 双账号授权绑定；国内与欧盟不可用（Canva 官方说明）', 4, '官方深度合作（OpenAI 官方案例背书），生成后可跳转 Canva 编辑；AI 出图有额度限制',
 'ChatGPT 免费版与付费版账户均可使用；Canva 免费版含 160 万+模板、5GB 存储、约 200 次标准 AI/20 次高级 AI 额度', 4, '对话 token 由 ChatGPT 订阅覆盖（Plus $20/月）；Canva 侧 AI 额度按套餐（Pro 约 $15-18/月，AI 额度为免费版 10 倍）', 3, 3.8,
 '老吴评测组', 'ai_first',
 '[{"case":"简历模板生成","result":"可跳转 Canva 继续编辑"},{"case":"地域限制","result":"中国大陆/欧盟不可用"}]', '2026-08', NOW() - INTERVAL '3 days'),
((SELECT id FROM skills WHERE slug='trend-radar'),
 '全网热点追踪与聚合，先人一步抓住时效话题', 4, '扣子版一键添加（4/5）；开源版需 Python/uv 环境部署并配置爬虫与通知渠道（2/5）', 3, '依赖数据源（爬虫/平台接口），平台改版或反爬会导致数据源失效；开源版需自行维护',
 '扣子技能免费 + 积分；开源版完全免费（GPL-3.0）', 5, '低中：热点聚合+报告生成单次约数千 token', 4, 3.8,
 '老吴评测组', 'ai_first',
 '[{"case":"微博热点采集","result":"趋势+情感摘要"},{"case":"数据源失效","result":"反爬导致需维护"}]', '2026-08', NOW() - INTERVAL '2 days'),
((SELECT id FROM skills WHERE slug='wechat-article-layout'),
 '公众号长文自动配图 + 排版，输出可直接用的排版 HTML', 4, '对话即用；对接公众号 API 自动发布需配置 AppID/Secret、IP 白名单，门槛上升', 3, 'HTML 排版输出时好时坏，移动端样式需抽查；个人技能维护',
 '技能免费 + 扣子每日 1,500 积分', 3, '中高：长文 + HTML 代码输出，单次轻松过万 token，免费积分撑不了几次深度排版', 2, 3.0,
 '老吴评测组', 'ai_first',
 '[{"case":"长文配图排版","result":"HTML 可发布"},{"case":"移动端样式","result":"需抽查"}]', '2026-08', NOW() - INTERVAL '3 days'),
((SELECT id FROM skills WHERE slug='video-maker'),
 'ChatGPT 对话内一句话生成可发布的短视频成片', 3, '对话即用，但导出需跳转 invideo 官网、界面英文；中文内容支持弱', 3, 'AI 命令执行精度不稳定、生成素材与主题偶发偏差；免费版强制水印',
 '免费版每周 2 分钟视频、1 AI 积分、4 次带水印导出', 2, '对话由 ChatGPT 订阅覆盖（Plus $20/月）；视频生成消耗 invideo 积分——Plus 约 $20-28/月', 2, 2.6,
 '老吴评测组', 'ai_first',
 '[{"case":"一句话成片","result":"脚本+素材+配音成片"},{"case":"中文支持","result":"差评集中"}]', '2026-08', NOW() - INTERVAL '2 days'),
((SELECT id FROM skills WHERE slug='industry-research-report'),
 '输入行业关键词，输出结构化行业调研报告初稿', 4, '对话式输入即出报告', 3, '通用模型无实时数据接入，市场规模等数字存在滞后与编造风险，必须人工核实；数据事实准确性是最大短板',
 '技能免费 + 扣子每日 1,500 积分', 3, '中高：长报告单次数万 token，免费额度约够每日 1-2 次深度报告', 2, 3.0,
 '老吴评测组', 'ai_first',
 '[{"case":"行业概览生成","result":"六段式报告"},{"case":"数字核实","result":"需人工核实规模数据"}]', '2026-08', NOW() - INTERVAL '5 days'),
((SELECT id FROM skills WHERE slug='ib-industry-analysis'),
 '波特五力+产业链拆解+估值思路的投行研报风格分析', 3, '输出框架专业，但需用户提供足够行业资料/数据，否则结论空洞；非一键出报告', 3, '框架稳定但数据与结论的可信度依赖输入资料质量；无实时财务数据接入',
 '技能免费 + 扣子积分', 3, '高：深度长文单次数万 token，建议进阶版套餐或增购积分', 2, 2.8,
 '老吴评测组', 'ai_first',
 '[{"case":"波特五力分析","result":"框架专业完整"},{"case":"数据依赖","result":"无实时财务数据"}]', '2026-08', NOW() - INTERVAL '4 days'),
((SELECT id FROM skills WHERE slug='consensus'),
 '学术文献共识问答：覆盖 2.2 亿+ 篇同行评审论文', 5, '对话式搜索，界面简洁；GPT 版无需额外学习', 4, '主流学术工具；免费档额度紧张、部分场景延迟；AI 摘要仍需对照原文核实',
 '免费版每月 25 次 Pro Search（各基于 20 篇论文）+ 3 次 Deep Search（深度 50 篇）；GPT 版随 ChatGPT 订阅', 3, 'Premium $10-11.99/月（教育邮箱约 40% 折扣）；GPT 版由 ChatGPT Plus $20/月覆盖', 3, 3.8,
 '老吴评测组', 'ai_first',
 '[{"case":"共识问答","result":"基于 2.2 亿论文"},{"case":"Deep Search","result":"每月仅 3 次"}]', '2026-08', NOW() - INTERVAL '3 days'),
((SELECT id FROM skills WHERE slug='resume-screening'),
 '简历+JD 上传即出匹配评分与结构化评估意见', 4, '上传即评；批量场景需配合表格/文件夹工作流', 4, '结构化文本任务大模型表现稳定；评估标准因人而异，需人工复核避免偏见',
 '技能免费 + 扣子积分', 4, '低中：单份简历数千 token，批量百份约数万', 4, 4.0,
 '老吴评测组', 'ai_first',
 '[{"case":"JD 匹配打分","result":"结构化评估意见"},{"case":"偏见风险","result":"需人工复核"}]', '2026-08', NOW() - INTERVAL '2 days'),
((SELECT id FROM skills WHERE slug='contract-fast-review'),
 '上传合同 3 分钟输出风险条款识别与修改建议', 4, '上传即审；长合同需分段粘贴（受上下文长度限制）', 3, '条款引用可能不准（法条幻觉风险），AI 初审结论不能替代律师意见，必须人工复核',
 '技能免费 + 扣子积分', 3, '中高：合同全文进入上下文，数万字合同单次消耗大', 2, 3.0,
 '老吴评测组', 'ai_first',
 '[{"case":"采购合同初审","result":"风险条款+修改建议"},{"case":"法条引用","result":"幻觉风险需复核"}]', '2026-08', NOW() - INTERVAL '1 days'),
((SELECT id FROM skills WHERE slug='qianwen-office'),
 '阿里企业级 AI 办公智能体：文档/PPT/表格/会议纪要/自动化', 3, '界面简洁，但任务型交互需明确交付格式（Word/Markdown/PDF）、篇幅与深度，学习成本高于普通对话 AI；公测阶段功能在演进', 3, '2026-07 刚整合公测；生成长报告耗时明显长于对话模型；整合前悟空曝出钉钉文档追加/覆盖混淆、图片被删等 bug',
 '公测免费；千问 App/网页端免费使用，Qwen 大模型 API 提供免费额度', 5, '个人免费；企业按百炼 API/订阅计费（Qwen-Flash 等轻量档极低价，Qwen-Long 曾降至 ¥0.0005/千 token）', 4, 3.6,
 '老吴评测组', 'ai_first',
 '[{"case":"文档+表格任务","result":"五环节任务拆解"},{"case":"生成速度","result":"长报告耗时长"}]', '2026-08', NOW() - INTERVAL '1 days'),
((SELECT id FROM skills WHERE slug='claude-mem'),
 'Claude Code 持久记忆插件：跨会话记住项目上下文', 2, '一行 npx claude-mem install 或 /plugin marketplace add + /plugin install，重启即用，零配置', 3, '功能设计成熟（3 层渐进式检索）但社区安全审计评为 HIGH 风险（本地 HTTP API 端口 37777 无认证）、v13.4.0 仍向 AGENTS.md 自动写记忆块无法关闭',
 '插件永久免费，数据全本地存储，无 API 配额', 5, '压缩观察调用自己的 Claude API；检索每结果仅 ~50–100 token、get_observations 全量 ~500–1,000 token/结果，官方宣称每会话省 ~2,250 token', 3, 3.2,
 '老吴评测组', 'ai_first',
 '[{"case":"跨会话项目记忆","result":"新会话自动注入"},{"case":"安全审计","result":"HIGH：本地 API 无认证"}]', '13.4.0', NOW() - INTERVAL '2 days'),
((SELECT id FROM skills WHERE slug='supermemory'),
 '跨平台记忆引擎：一个 API 搞定存储/抽取/召回/矛盾消解', 2, '一行装 MCP server + 免费注册拿 key 即可接入主流 IDE/agent；开发者有 SDK 一行集成', 4, '大客户背书（Razorpay 创始人公开称唯一稳定可靠）、延迟/精度行业第一梯队；但 benchmark 为自报数据未独立验证、社区相对新',
 '免费档 $0/月，内含约 $5/月用量（约 100 万 SM token），无信用卡即可开始', 4, '记忆存储 $0.005/1K SM token，搜索 $0.005/1K 查询，token 级去重；单次调用约 $0.00001–0.0001', 4, 3.6,
 '老吴评测组', 'ai_first',
 '[{"case":"跨模型记忆","result":"一个 API 统一召回"},{"case":"benchmark","result":"自报未独立验证"}]', '2026-08', NOW() - INTERVAL '1 days'),
((SELECT id FROM skills WHERE slug='mem0'),
 '企业级 AI 记忆层：开源 + 托管，混合存储架构', 3, 'pip install mem0ai + 两行代码就能跑（开发者体验好）；但本质是基础设施——自托管需自配 LLM API + 向量库 + 图数据库', 4, '托管产品成熟（SOC 2、HIPAA Ready、状态页）；托管与开源 benchmark 差距大（独立评测 LongMemEval 仅 49–67.6%）、低价档只有平面向量检索无图推理（自托管 3/5）',
 '云 Hobby 免费档：10,000 add 请求/月 + 1,000 检索/月（仅够测试）；开源自托管完全免费', 3, '云按请求配额计费：Starter $19/月（50K add + 5K retrieval）、Pro $249/月；每次 add 后台 LLM 抽取几百 token 开销', 3, 3.4,
 '老吴评测组', 'ai_first',
 '[{"case":"用户画像持久化","result":"省约 90% token"},{"case":"开源版差距","result":"独立评测 49-67.6%"}]', '2026-08', NOW() - INTERVAL '2 days'),
((SELECT id FROM skills WHERE slug='hindsight'),
 '会学习的记忆：知识图谱+反思沉淀，LongMemEval 94.6%', 2, 'Hermes 内 hermes memory setup 选 hindsight 一条命令（本地模式需装 hindsight-all 嵌入式 PostgreSQL + 配 LLM key，3/5）', 4, 'benchmark 官方可复现非自报；检索路径无 LLM 依赖（100–600ms）；但社区较小（~2 万星）生态年轻、每查询喂给答案 LLM 约 8,192 token 偏高',
 '自托管完全免费（MIT + Docker + 嵌入式 PostgreSQL，本地模式零订阅费）；云托管送免费 credits 起步、30 天存储免费', 5, '云按量：Retain $10/百万 token、Recall $0.75/百万、Reflect $0.05/次、存储 $0.25/百万/月；每查询注入约 8K 记忆 token 是隐性成本', 3, 3.6,
 '老吴评测组', 'ai_first',
 '[{"case":"LongMemEval","result":"94.6% 官方可复现"},{"case":"跨记忆反思","result":"reflect 独有"}]', '2026-08', NOW() - INTERVAL '1 days')
ON CONFLICT DO NOTHING;

-- 5.6 同类替代（23 对同类工具互相关联，双向插入 = 46 条）
INSERT INTO skill_alternatives (skill_id, alternative_skill_id, note) VALUES
  ((SELECT id FROM skills WHERE slug='tavily'), (SELECT id FROM skills WHERE slug='brave-search-mcp'), '同为轻量搜索 API：Brave 质量/延迟更优且更便宜'),
  ((SELECT id FROM skills WHERE slug='brave-search-mcp'), (SELECT id FROM skills WHERE slug='tavily'), '同为轻量搜索 API：Tavily 生态最广、自带 AI 提炼'),
  ((SELECT id FROM skills WHERE slug='tavily'), (SELECT id FROM skills WHERE slug='firecrawl'), 'Firecrawl 搜+抓一体，适合离线建 RAG 库'),
  ((SELECT id FROM skills WHERE slug='firecrawl'), (SELECT id FROM skills WHERE slug='tavily'), 'Tavily 轻量搜索，适合逐轮 grounding'),
  ((SELECT id FROM skills WHERE slug='brave-search-mcp'), (SELECT id FROM skills WHERE slug='firecrawl'), 'Firecrawl 可补 Brave 只给摘要无全文的短板'),
  ((SELECT id FROM skills WHERE slug='firecrawl'), (SELECT id FROM skills WHERE slug='brave-search-mcp'), 'Brave 纯搜索更省 token，Firecrawl 抓取更重'),
  ((SELECT id FROM skills WHERE slug='composio'), (SELECT id FROM skills WHERE slug='zapier-ai-actions'), 'Zapier 无代码弱化版，100 tasks/月免费'),
  ((SELECT id FROM skills WHERE slug='zapier-ai-actions'), (SELECT id FROM skills WHERE slug='composio'), 'Composio Agent 专用，免费 20K 次工具调用/月'),
  ((SELECT id FROM skills WHERE slug='supermemory'), (SELECT id FROM skills WHERE slug='mem0'), '同为记忆基础设施：Mem0 企业级开源可控、社区最大'),
  ((SELECT id FROM skills WHERE slug='mem0'), (SELECT id FROM skills WHERE slug='supermemory'), 'Supermemory 上手更快、召回延迟更低'),
  ((SELECT id FROM skills WHERE slug='supermemory'), (SELECT id FROM skills WHERE slug='hindsight'), '同为记忆引擎：Hindsight 记忆准确率更高（94.6%）'),
  ((SELECT id FROM skills WHERE slug='hindsight'), (SELECT id FROM skills WHERE slug='supermemory'), 'Supermemory 跨平台接入面更广'),
  ((SELECT id FROM skills WHERE slug='mem0'), (SELECT id FROM skills WHERE slug='hindsight'), 'Hindsight 开源自托管免费、benchmark 可复现'),
  ((SELECT id FROM skills WHERE slug='hindsight'), (SELECT id FROM skills WHERE slug='mem0'), 'Mem0 生态最全、托管平台有合规认证'),
  ((SELECT id FROM skills WHERE slug='claude-mem'), (SELECT id FROM skills WHERE slug='supermemory'), 'Supermemory 跨模型跨设备，claude-mem 仅限 Claude Code'),
  ((SELECT id FROM skills WHERE slug='supermemory'), (SELECT id FROM skills WHERE slug='claude-mem'), 'claude-mem 免费零门槛、编码场景专用'),
  ((SELECT id FROM skills WHERE slug='claude-mem'), (SELECT id FROM skills WHERE slug='mem0'), 'Mem0 生产级记忆层，claude-mem 编码场景专用'),
  ((SELECT id FROM skills WHERE slug='mem0'), (SELECT id FROM skills WHERE slug='claude-mem'), 'claude-mem 完全免费、数据全本地'),
  ((SELECT id FROM skills WHERE slug='claude-mem'), (SELECT id FROM skills WHERE slug='hindsight'), 'Hindsight 会学习的记忆+反思沉淀，claude-mem 纯检索注入'),
  ((SELECT id FROM skills WHERE slug='hindsight'), (SELECT id FROM skills WHERE slug='claude-mem'), 'claude-mem 零配置、装完即用'),
  ((SELECT id FROM skills WHERE slug='xiaohongshu-copy-pro'), (SELECT id FROM skills WHERE slug='brand-moments-copy'), '同为内容文案生成：小红书图文含排版出图'),
  ((SELECT id FROM skills WHERE slug='brand-moments-copy'), (SELECT id FROM skills WHERE slug='xiaohongshu-copy-pro'), '朋友圈文案纯文本更轻量、出稿更快'),
  ((SELECT id FROM skills WHERE slug='xiaohongshu-copy-pro'), (SELECT id FROM skills WHERE slug='ecommerce-main-image'), '电商内容生产组合：种草文案 + 商品主图'),
  ((SELECT id FROM skills WHERE slug='ecommerce-main-image'), (SELECT id FROM skills WHERE slug='xiaohongshu-copy-pro'), '主图生成专注图像，文案可另配'),
  ((SELECT id FROM skills WHERE slug='ecommerce-main-image'), (SELECT id FROM skills WHERE slug='canva-gpt'), '同为设计产出：Canva GPT 模板化编辑更可控'),
  ((SELECT id FROM skills WHERE slug='canva-gpt'), (SELECT id FROM skills WHERE slug='ecommerce-main-image'), '主图生成在电商场景更垂直'),
  ((SELECT id FROM skills WHERE slug='brand-moments-copy'), (SELECT id FROM skills WHERE slug='ernie-4-5'), '文心一言可直接写朋友圈文案'),
  ((SELECT id FROM skills WHERE slug='ernie-4-5'), (SELECT id FROM skills WHERE slug='brand-moments-copy'), '技能版按品牌调性批量出稿、规避广告味'),
  ((SELECT id FROM skills WHERE slug='ernie-4-5'), (SELECT id FROM skills WHERE slug='qianwen-office'), '同为国产大模型办公助手：千问办公任务型更强'),
  ((SELECT id FROM skills WHERE slug='qianwen-office'), (SELECT id FROM skills WHERE slug='ernie-4-5'), '文心 C 端免费、中文创作更强'),
  ((SELECT id FROM skills WHERE slug='trend-radar'), (SELECT id FROM skills WHERE slug='industry-research-report'), '同为资讯/调研：热点雷达追时效、调研报告出深度'),
  ((SELECT id FROM skills WHERE slug='industry-research-report'), (SELECT id FROM skills WHERE slug='trend-radar'), '行业调研结构化报告更完整'),
  ((SELECT id FROM skills WHERE slug='industry-research-report'), (SELECT id FROM skills WHERE slug='ib-industry-analysis'), '投行分析框架更深（波特五力/估值），调研报告更普适'),
  ((SELECT id FROM skills WHERE slug='ib-industry-analysis'), (SELECT id FROM skills WHERE slug='industry-research-report'), '调研报告上手更简单、覆盖面广'),
  ((SELECT id FROM skills WHERE slug='ib-industry-analysis'), (SELECT id FROM skills WHERE slug='consensus'), 'Consensus 有论文证据支撑，投行分析框架化输出'),
  ((SELECT id FROM skills WHERE slug='consensus'), (SELECT id FROM skills WHERE slug='ib-industry-analysis'), '投行分析面向投资决策场景'),
  ((SELECT id FROM skills WHERE slug='consensus'), (SELECT id FROM skills WHERE slug='industry-research-report'), '行业调研 AI 生成数字需人工核实，Consensus 有论文证据'),
  ((SELECT id FROM skills WHERE slug='industry-research-report'), (SELECT id FROM skills WHERE slug='consensus'), '调研报告覆盖产业链与竞争格局'),
  ((SELECT id FROM skills WHERE slug='wechat-article-layout'), (SELECT id FROM skills WHERE slug='xiaohongshu-copy-pro'), '同为中文内容创作：公众号排版含配图 HTML'),
  ((SELECT id FROM skills WHERE slug='xiaohongshu-copy-pro'), (SELECT id FROM skills WHERE slug='wechat-article-layout'), '小红书图文面向种草场景'),
  ((SELECT id FROM skills WHERE slug='qianwen-office'), (SELECT id FROM skills WHERE slug='document-skills'), '同为办公文档生成：Document Skills 文件格式更专业'),
  ((SELECT id FROM skills WHERE slug='document-skills'), (SELECT id FROM skills WHERE slug='qianwen-office'), '千问办公集成钉钉企业生态'),
  ((SELECT id FROM skills WHERE slug='document-skills'), (SELECT id FROM skills WHERE slug='canva-gpt'), '同为演示文稿/文档产出：Canva 模板化设计更强'),
  ((SELECT id FROM skills WHERE slug='canva-gpt'), (SELECT id FROM skills WHERE slug='document-skills'), 'Document Skills 支持修订追踪等深度编辑'),
  ((SELECT id FROM skills WHERE slug='filesystem-mcp'), (SELECT id FROM skills WHERE slug='document-skills'), '同为文件/文档基础设施：Filesystem 读写、Document 生成解析'),
  ((SELECT id FROM skills WHERE slug='document-skills'), (SELECT id FROM skills WHERE slug='filesystem-mcp'), 'Document Skills 专注办公文件格式')
ON CONFLICT DO NOTHING;

-- 5.7 使用指南
INSERT INTO guides (skill_id, content, difficulty_level) VALUES
((SELECT id FROM skills WHERE slug='xiaohongshu-copy-pro'),
 '## 快速上手\n1. 扣子技能商店搜索「小红书图文神器Pro」一键添加\n2. 输入产品名/卖点/目标人群\n3. 生成标题/正文/标签后到小红书发布\n\n## 技巧\n- 卖点写 3-5 个关键词，生成更精准\n- 配图需在扣子空间图像流调参，先跑通一次再批量\n- 重度日更建议进阶版套餐（¥39.9/月）',
 'beginner')
ON CONFLICT DO NOTHING;
-- 5.8 横评文章（联网搜索三工具实测横评）
INSERT INTO comparison_articles (title, slug, scenario_id, content, skills_included, published_at, status) VALUES
('联网搜索三工具实测：Brave / Tavily / Firecrawl 怎么选', 'search-tools-showdown',
 (SELECT id FROM scenarios WHERE slug='search'),
 '## 评测方法\n基于 2026-08 五问框架（场景/上手/稳定性/免费额度/Token成本）实测对比三款联网搜索工具，交叉验证官方定价与 GitHub/Reddit/HN 公开反馈。\n\n## 结论\n- 轻量 Agent 联网首选 Brave Search MCP（14.89/20 基准第一、延迟 669ms、$5/1K 最便宜、token 最省）\n- 生态最顺、免费层最慷慨选 Tavily（1,000 credits/月，远程 MCP 免安装）\n- 要抓网页/建 RAG 库选 Firecrawl（166K★ 开源，整站爬取+结构化抽取是护城河，但 token 重）',
 ARRAY[(SELECT id FROM skills WHERE slug='brave-search-mcp'),
       (SELECT id FROM skills WHERE slug='tavily'),
       (SELECT id FROM skills WHERE slug='firecrawl')],
 NOW() - INTERVAL '1 day', 'published')
ON CONFLICT (slug) DO NOTHING;
-- 5.9 场景教程
INSERT INTO tutorials (title, slug, scenario_id, content, published_at, status) VALUES
('新手必装：3 个基础设施技能一次配齐', 'newbie-essential-skills',
 (SELECT id FROM scenarios WHERE slug='infra'),
 '## 为什么先装基础设施类\nAI 记不住、不能联网、不能跑代码，是新手最常遇到的三个坑。\n\n## 清单\n1. 记忆增强：Hermes Hindsight（LongMemEval 94.6%，自托管零成本）或 claude-mem（Claude Code 零配置）\n2. 联网搜索：Brave Search MCP（质量第一+最省 token）或 Tavily（免费层最慷慨）\n3. 代码执行：E2B 沙箱（Firecracker 微 VM，安全执行 AI 生成代码）',
 NOW() - INTERVAL '2 days', 'published')
ON CONFLICT (slug) DO NOTHING;
-- 5.10 场景方案（轻量工作流：电商主图文案完整方案）
INSERT INTO scenario_solutions (scenario_id, title, description, steps) VALUES
((SELECT id FROM scenarios WHERE slug='ecommerce-copy'),
 '做电商主图文案完整方案', '商品图 → 场景图 → 种草文案的轻量三步工作流',
 jsonb_build_array(
   jsonb_build_object('step', 1,
     'skill_id', (SELECT id FROM skills WHERE slug='ecommerce-main-image'),
     'action', '生成商品白底主图', 'params', jsonb_build_object('style', '白底图')),
   jsonb_build_object('step', 2,
     'skill_id', (SELECT id FROM skills WHERE slug='ecommerce-main-image'),
     'action', '生成场景图', 'params', jsonb_build_object('style', '场景图')),
   jsonb_build_object('step', 3,
     'skill_id', (SELECT id FROM skills WHERE slug='xiaohongshu-copy-pro'),
     'action', '生成种草文案', 'params', jsonb_build_object('platform', '小红书'))
 ))
ON CONFLICT DO NOTHING;
-- 5.11 站点配置（首页入口全部配置化）
INSERT INTO site_config (config_key, config_value, description) VALUES
('home_scenario_tags',
 '[{"name":"电商文案","slug":"ecommerce-copy"},{"name":"内容创作","slug":"content-creation"},{"name":"数据分析","slug":"data-analysis"},{"name":"办公效率","slug":"office"},{"name":"设计海报","slug":"design"},{"name":"视频创作","slug":"video"},{"name":"行业调研","slug":"research"},{"name":"法务审核","slug":"legal"},{"name":"记忆增强","slug":"memory"},{"name":"联网搜索","slug":"search"}]'::jsonb,
 '首页场景标签入口（入口2）'),
('home_platforms',
 '["coze","gpts","claude","dify","hermes","qwen","ernie","codex","workbuddy","lobechat"]'::jsonb,
 '首页平台导航入口（入口3），按 platforms.sort_order 排序'),
('featured_comparison',
 '{"slug":"search-tools-showdown","title":"本周横评：联网搜索三工具"}'::jsonb,
 '首页横评推荐位（入口4）'),
('trial_default_limit', '{"per_skill_daily":5,"global_daily":200}'::jsonb,
 '试用配额默认值，ECS 中转 API 读取'),
('install_categories',
 '{"order":["infrastructure","scene","efficiency"]}'::jsonb,
 '装机必备页能力层级展示顺序')
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value,
                                       description = EXCLUDED.description;

-- ============================================================
-- 6. 完成检查（执行后应各返回 1 行）
-- ============================================================
SELECT 'platforms' AS table_name, count(*) FROM platforms
UNION ALL SELECT 'scenarios', count(*) FROM scenarios
UNION ALL SELECT 'skills', count(*) FROM skills
UNION ALL SELECT 'evaluations', count(*) FROM evaluations
UNION ALL SELECT 'site_config', count(*) FROM site_config
UNION ALL SELECT 'skill_cards_view', count(*) FROM skill_cards_view;
