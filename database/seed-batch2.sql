-- ============================================================
-- AI Skill 评测聚合平台 — 第二批种子数据 (seed-batch2.sql)
-- 版本: v1.0 (2026-08-13)
-- 内容: 第二批 6 个深度评测 Skill（编号 23-28）
--       通义千问(阿里) × 3 + 扣子(字节) × 2 + OpenClaw × 1
-- 用法: 在 init.sql + seed-extended.sql 之后执行
-- 幂等设计: ON CONFLICT (slug) DO NOTHING
-- 评测框架: ai-tool-evaluation 5问（Q1场景/Q2上手1-5/Q3稳定1-5/Q4免费额度/Q5成本+替代）
-- 综合评分公式: 0.2*difficulty + 0.4*stability + 0.2*free_quota + 0.2*token_eff
-- ============================================================

-- ============================================================
-- 1. 更新平台 skill_count（千问 +3、扣子 +2、OpenClaw +1）
-- ============================================================
UPDATE platforms SET skill_count = skill_count + 3 WHERE slug = 'qwen';
UPDATE platforms SET skill_count = skill_count + 2 WHERE slug = 'coze';
UPDATE platforms SET skill_count = skill_count + 1 WHERE slug = 'openclaw';

-- ============================================================
-- 2. 第二批深度评测 Skill（6 个）
-- ============================================================
INSERT INTO skills (name, slug, tagline, description, category, platform_id, install_url, icon_url,
                    developer_name, version, status, trial_enabled, trial_config, source, last_updated) VALUES
-- 23. 千问 AI Skills 技能包
('千问 AI Skills 技能包', 'qwen-ai-skills', 'Agent 原生 8 合 1 多模态技能包：文本/图像/视频/语音/视觉/模型选择/认证/用量',
 '将千问全套多模态 AI 能力封装为 8 个 Agent Skills 模块。一行命令安装（npx skills add QianWen-AI/qianwen-ai），零配置，适配 20+ 种 Agent 工具（Claude Code/Cursor/Codex/Cline/OpenClaw/Qwen Code/Qoder/OpenHands/Devin 等）。qianwen-ops-auth 自动引导 API Key 配置。三层模型选择：默认兜底→智能推荐→用户指定。GitHub 68★ Apache-2.0。',
 'infrastructure', (SELECT id FROM platforms WHERE slug='qwen'),
  'https://platform.qianwenai.com/skills', NULL, '阿里云通义实验室', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),

-- 24. 千问上云部署技能
('千问上云部署技能', 'qwen-deploy', '一句话让 Agent 全程完成项目上云部署',
 '一句话让 Agent 全程完成项目上云部署。从项目分析→方案选择→资源编排→部署上线，无需手动配置云资源。一键自动部署阿里云官方解决方案（VPC/安全组/ECS/RDS）。GitHub 8★ Apache-2.0 Shell 项目。解决手动部署耗时长、配置易出错、重复操作多的痛点。',
 'efficiency', (SELECT id FROM platforms WHERE slug='qwen'),
  'https://www.qianwenai.com/skills/deploy-skill', NULL, '阿里云通义实验室', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),

-- 25. 阿里云 Agent Skills 门户
('阿里云 Agent Skills 门户', 'qwen-aliyun-skills-portal', '官方云资源管理技能：自然语言操作 ECS/OSS/RDS/SLB 等全量云产品',
 '阿里云官方 AI Agent 技能发现与安装平台，为 Agent 提供安全可靠的云资源操作能力。安装对应产品 Skill 后，Agent 通过自然语言完成云资源查询和管理。核心亮点：跨产品任务编排——一次对话组合调用多个 Skill。每个 Skill 通过业务测试和安全检测，关键操作引入人工确认机制。兼容 Cursor/Claude Code/Qwen Code 等主流客户端。',
 'infrastructure', (SELECT id FROM platforms WHERE slug='qwen'),
  'https://skills.aliyun.com', NULL, '阿里云', '2026-08', 'published', FALSE, NULL, 'manual', NOW()),

-- 26. 扣子热点雷达
('扣子热点雷达', 'coze-hot-radar', '自动追踪聚合全网行业热点，大赛一等奖追热点神器',
 '自动追踪聚合全网行业热点与趋势，帮助从业者快速捕捉时效性话题，先人一步产出高热度内容或调整运营策略。扣子技能大赛一等奖。一键添加后自然语言指令触发，技能自动判断是否与任务相关并加载。依赖外部数据源（网页爬取），存在反爬风险。',
 'scene', (SELECT id FROM platforms WHERE slug='coze'),
  'https://www.coze.cn/?skill_share_pid=7597875515860451378', NULL, '扣子技能大赛创作者', '2026-01', 'published', FALSE, NULL, 'manual', NOW()),

-- 27. 扣子投行级深度行业分析
('扣子投行级深度行业分析', 'coze-investment-research', '模拟投行分析师生成深度行业研究报告，大赛优秀奖',
 '模拟投行分析师视角，生成深度行业研究报告。覆盖行业概览、竞争格局、财务分析、趋势预测。扣子技能大赛优秀奖。太平洋证券已有 Coze 投研应用实践。需金融/行业分析专业知识，输出报告需专业人士审阅。AI 幻觉风险（编造市场规模数据），必须人工复核。',
 'scene', (SELECT id FROM platforms WHERE slug='coze'),
  'https://www.coze.cn/?skill_share_pid=7604466157126565929', NULL, '扣子技能大赛创作者', '2026-01', 'published', FALSE, NULL, 'manual', NOW()),

-- 28. OpenClaw Browser Control
('OpenClaw Browser Control', 'openclaw-browser-control', 'ClawHub #1 必装技能：自动化网页浏览/填表单/抓数据/截图',
 'ClawHub 10,700+ 技能中排名第一的必装技能。自动化网页浏览——填表单、抓数据、截图，是所有研究或数据收集工作流的骨干。openclaw skill install browser-control 一行安装，10 秒完成。典型用例：每天早上自动检查竞品定价并汇总变化到 Slack。通过安全扫描（ClawHub 7.6% 技能被标记恶意）。',
 'efficiency', (SELECT id FROM platforms WHERE slug='openclaw'),
  'https://clawhub.dev', NULL, 'OpenClaw 社区', '2026-08', 'published', FALSE, NULL, 'manual', NOW())
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. 深度评测记录（6 个）— evaluations
-- ============================================================
INSERT INTO evaluations (skill_id, scenario_summary, difficulty_score, difficulty_notes,
  stability_score, stability_notes, free_quota, free_quota_score, token_cost, token_efficiency_score,
  overall_score, evaluated_by, evaluation_method, version_at_eval, evaluated_at) VALUES
-- 23. 千问 AI Skills 技能包（上手3 稳定4 免费分4 成本分5 → 0.2*3+0.4*4+0.2*4+0.2*5=4.0）
((SELECT id FROM skills WHERE slug='qwen-ai-skills'),
  'Agent 原生 8 合 1 多模态技能包：文本/图像/视频/语音/视觉/模型选择/认证/用量。一行命令安装，适配 20+ 种 Agent 工具',
  3, '一行 npx 安装，但需 Node.js 18+ 和百炼 API Key 配置。qianwen-ops-auth 自动引导降低门槛', 4, '阿里官方出品，百炼平台支撑。GitHub 68★ 早期成长阶段。三层模型选择机制健壮',
  '千问个人版免费；百炼千万 Token 免费额度（每模型各 100 万 Token）', 4, '按量计费。Qwen-Turbo 0.3 元/百万 token 输入最低档；Batch 半价 + 缓存折扣', 5,
  4.0, 'AI-First 5问框架', 'ai_first', '2026-08', NOW()),

-- 24. 千问上云部署技能（上手3 稳定4 免费分4 成本分3 → 0.2*3+0.4*4+0.2*4+0.2*3=3.6）
((SELECT id FROM skills WHERE slug='qwen-deploy'),
  '一句话让 Agent 全程完成项目上云部署：项目分析→方案选择→资源编排→部署上线',
  3, '需 Node.js + 阿里云账号 + 百炼 API Key。需理解 ECS/安全组/VPC 基础概念', 4, '阿里官方出品，依赖成熟阿里云部署基础设施。GitHub 8★ 极早期但后端生产级',
  '技能免费；部署产生的云资源按标准计费', 4, '云资源费用。ECS t6 约 0.03 元/小时起；轻量服务器 24 元/月起', 3,
  3.6, 'AI-First 5问框架', 'ai_first', '2026-08', NOW()),

-- 25. 阿里云 Agent Skills 门户（上手2 稳定4 免费分4 成本分4 → 0.2*2+0.4*4+0.2*4+0.2*4=3.6）
((SELECT id FROM skills WHERE slug='qwen-aliyun-skills-portal'),
  '阿里云官方技能发现与安装平台：自然语言操作 ECS/OSS/RDS/SLB/云监控等全量云产品',
  2, '需云计算知识背景。需理解阿里云产品体系和权限模型', 4, '官方出品，每 Skill 通过业务测试和安全检测。关键操作人工确认机制。跨产品任务编排健壮',
  'Skills 门户免费使用；云资源按标准计费', 4, '云资源费用（非 AI token）。跨产品编排减少手动操作成本', 4,
  3.6, 'AI-First 5问框架', 'ai_first', '2026-08', NOW()),

-- 26. 扣子热点雷达（上手4 稳定3 免费分3 成本分4 → 0.2*4+0.4*3+0.2*3+0.2*4=3.4）
((SELECT id FROM skills WHERE slug='coze-hot-radar'),
  '自动追踪聚合全网行业热点与趋势，先人一步捕捉时效性话题。扣子技能大赛一等奖',
  4, '一键添加后自然语言指令触发，无需配置。需理解热点监控场景才能用好', 3, '个人维护第三方技能，迭代不可控，3 分档封顶。依赖外部数据源存在反爬风险',
  '免费技能；扣子每日 1500 积分可用', 3, '中等成本（聚合多源数据+摘要生成，万级 token）', 4,
  3.4, 'AI-First 5问框架', 'ai_first', '2026-01', NOW()),

-- 27. 扣子投行级深度行业分析（上手2 稳定3 免费分3 成本分3 → 0.2*2+0.4*3+0.2*3+0.2*3=2.8）
((SELECT id FROM skills WHERE slug='coze-investment-research'),
  '模拟投行分析师视角生成深度行业研究报告：行业概览/竞争格局/财务分析/趋势预测。扣子技能大赛优秀奖',
  2, '需金融/行业分析专业知识。输出报告需专业人士审阅', 3, '数据类工具通用风险：AI 幻觉编造市场规模数据，必须人工复核',
  '免费技能；扣子每日 1500 积分可用', 3, '高成本（长报告+数据分析+多轮推理，十万级 token）', 3,
  2.8, 'AI-First 5问框架', 'ai_first', '2026-01', NOW()),

-- 28. OpenClaw Browser Control（上手4 稳定4 免费分5 成本分4 → 0.2*4+0.4*4+0.2*5+0.2*4=4.2）
((SELECT id FROM skills WHERE slug='openclaw-browser-control'),
  'ClawHub 10,700+ 技能排名第一的必装技能：自动化网页浏览/填表单/抓数据/截图',
  4, 'openclaw skill install 一行安装，10 秒完成。复杂自动化需理解 CSS 选择器和页面结构', 4, 'ClawHub 排名第一，使用量最大，充分验证。浏览器自动化固有风险：页面结构变化导致选择器失效',
  'ClawHub 技能免费安装；通过安全扫描（7.6% 技能被标记恶意）', 5, '低-中。Agent 消耗 LLM token，浏览器操作本身无额外成本', 4,
  4.2, 'AI-First 5问框架', 'ai_first', '2026-08', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Skill × 场景关联（6 个 Skill 共 9 条关联）
-- ============================================================
INSERT INTO skill_scenarios (skill_id, scenario_id) VALUES
  -- 23. 千问 AI Skills 技能包 → 联网搜索 + 模型路由（多模态能力 + 模型选择）
  ((SELECT id FROM skills WHERE slug='qwen-ai-skills'), (SELECT id FROM scenarios WHERE slug='search')),
  ((SELECT id FROM skills WHERE slug='qwen-ai-skills'), (SELECT id FROM scenarios WHERE slug='model-router')),
  -- 24. 千问上云部署技能 → 自动化 + 代码执行
  ((SELECT id FROM skills WHERE slug='qwen-deploy'), (SELECT id FROM scenarios WHERE slug='automation')),
  ((SELECT id FROM skills WHERE slug='qwen-deploy'), (SELECT id FROM scenarios WHERE slug='code')),
  -- 25. 阿里云 Agent Skills 门户 → 自动化 + 工具连接
  ((SELECT id FROM skills WHERE slug='qwen-aliyun-skills-portal'), (SELECT id FROM scenarios WHERE slug='automation')),
  ((SELECT id FROM skills WHERE slug='qwen-aliyun-skills-portal'), (SELECT id FROM scenarios WHERE slug='connect')),
  -- 26. 扣子热点雷达 → 内容创作 + 行业调研
  ((SELECT id FROM skills WHERE slug='coze-hot-radar'), (SELECT id FROM scenarios WHERE slug='content-creation')),
  ((SELECT id FROM skills WHERE slug='coze-hot-radar'), (SELECT id FROM scenarios WHERE slug='research')),
  -- 27. 扣子投行级深度行业分析 → 行业调研 + 数据分析
  ((SELECT id FROM skills WHERE slug='coze-investment-research'), (SELECT id FROM scenarios WHERE slug='research')),
  ((SELECT id FROM skills WHERE slug='coze-investment-research'), (SELECT id FROM scenarios WHERE slug='data-analysis')),
  -- 28. OpenClaw Browser Control → 自动化 + 联网搜索
  ((SELECT id FROM skills WHERE slug='openclaw-browser-control'), (SELECT id FROM scenarios WHERE slug='automation')),
  ((SELECT id FROM skills WHERE slug='openclaw-browser-control'), (SELECT id FROM scenarios WHERE slug='search'))
ON CONFLICT DO NOTHING;
