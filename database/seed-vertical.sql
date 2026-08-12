-- ============================================================
-- AI Skill 评测聚合平台 — 垂直领域 AI 工具 (seed-vertical.sql)
-- 版本: v1.0 (2026-08-13)
-- 用法: 在 init.sql + seed-extended.sql 之后执行
-- 内容: 7 大垂直领域 25 个真实 AI 工具
--       健身 × 4 + 旅行 × 4 + 烹饪 × 4 + 心理健康 × 3 + 语言学习 × 4 + 艺术创作 × 3 + 音乐创作 × 3
-- 数据来源: 2026 AI 工具市场调研（web search 实证，名称/URL/开发者均已核实）
-- 幂等设计: ON CONFLICT DO NOTHING
-- ============================================================

-- ============================================================
-- 1. 新增 7 个垂直领域场景（挂载在「场景应用」能力层级下）
-- ============================================================

INSERT INTO scenarios (name, slug, icon, parent_id, sort_order) VALUES
  ('健身运动',   'fitness',          '💪', (SELECT id FROM scenarios WHERE slug='scene'), 10),
  ('旅行规划',   'travel',           '✈️', (SELECT id FROM scenarios WHERE slug='scene'), 11),
  ('烹饪美食',   'cooking',          '🍳', (SELECT id FROM scenarios WHERE slug='scene'), 12),
  ('心理健康',   'mental-health',    '🧘', (SELECT id FROM scenarios WHERE slug='scene'), 13),
  ('语言学习',   'language-learning','🗣️', (SELECT id FROM scenarios WHERE slug='scene'), 14),
  ('艺术创作',   'art-creation',     '🖼️', (SELECT id FROM scenarios WHERE slug='scene'), 15),
  ('音乐创作',   'music-creation',   '🎵', (SELECT id FROM scenarios WHERE slug='scene'), 16)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 2. 新增 25 个垂直领域 AI 工具 Skill
-- ============================================================

INSERT INTO skills (name, slug, tagline, category, platform_id, install_url, icon_url,
                    developer_name, version, status, trial_enabled, trial_config, source, last_updated) VALUES
-- ---------- 健身运动 (4) ----------
('Fitbod', 'fitbod', 'AI 健身教练：根据训练历史/恢复状态/可用器械自动生成个性化力量训练计划', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://fitbod.me', NULL, 'Fitbod', NULL, 'published', FALSE, NULL, 'listed', NOW()),
('Freeletics', 'freeletics', 'AI 高强度训练：自适应体能训练计划 + AI 虚拟教练，无器械/居家训练', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://www.freeletics.com', NULL, 'Freeletics', NULL, 'published', FALSE, NULL, 'listed', NOW()),
('Zing Coach', 'zing-coach', 'AI 私人教练：基于用户每日反馈动态调整训练强度，运动数据全程追踪', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://zing.app', NULL, 'Zing', NULL, 'published', FALSE, NULL, 'listed', NOW()),
('FitnessAI', 'fitnessai', 'AI 健身 App：机器学习优化组数/次数/重量，渐进超负荷算法驱动', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://www.fitnessai.app', NULL, 'FitnessAI', NULL, 'published', FALSE, NULL, 'listed', NOW()),
-- ---------- 旅行规划 (4) ----------
('TripPlanner AI', 'tripplanner-ai', 'AI 旅行规划：输入目的地/天数自动生成日程，景点/餐厅/路线智能优化', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://tripplanner.ai', NULL, 'Trip Planner AI', NULL, 'published', FALSE, NULL, 'listed', NOW()),
('Mindtrip', 'mindtrip', 'AI 旅行助手：对话式行程规划，航班/酒店/活动预订 + 地图可视化', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://mindtrip.ai', NULL, 'Mindtrip', NULL, 'published', FALSE, NULL, 'listed', NOW()),
('Layla', 'layla-travel', 'AI 旅行规划器：发现目的地 + 生成行程 + 一键预订，社交媒体风格推荐', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://layla.ai', NULL, 'Layla', NULL, 'published', FALSE, NULL, 'listed', NOW()),
('Wanderlog', 'wanderlog', 'AI 旅行计划：自动行程优化 + 费用分摊 + 离线地图，支持家庭/多人协作', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://wanderlog.com', NULL, 'Wanderlog', NULL, 'published', FALSE, NULL, 'listed', NOW()),
-- ---------- 烹饪美食 (4) ----------
('ChefGPT', 'chefgpt', 'AI 菜谱生成：列出冰箱食材 → 生成菜谱，支持口味/饮食限制/宏量营养控制', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://www.chefgpt.xyz', NULL, 'ChefGPT', NULL, 'published', FALSE, NULL, 'listed', NOW()),
('DishGen', 'dishgen', 'AI 菜谱生成器：输入食材/想法 → 生成完整菜谱 + 步骤 + 营养分析', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://www.dishgen.com', NULL, 'DishGen', NULL, 'published', FALSE, NULL, 'listed', NOW()),
('FoodiePrep', 'foodieprep', 'AI 备餐助手：周计划 + 菜谱生成 + 购物清单，健康饮食追踪', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://www.foodieprep.ai', NULL, 'FoodiePrep', NULL, 'published', FALSE, NULL, 'listed', NOW()),
('Mr Cook', 'mr-cook', 'AI 菜谱 App：保存/分享/AI 生成菜谱，智能食材替换建议', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://mrcook.app', NULL, 'MrCook', NULL, 'published', FALSE, NULL, 'listed', NOW()),
-- ---------- 心理健康 (3) ----------
('Wysa', 'wysa', 'AI 心理健康聊天机器人：CBT/正念引导 + 情绪日记，临床验证的匿名支持', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://wysa.com', NULL, 'Wysa', NULL, 'published', FALSE, NULL, 'listed', NOW()),
('Woebot', 'woebot', 'AI 心理教练：基于 CBT 的对话式心理健康支持，情绪追踪 + 技能训练', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://woebothealth.com', NULL, 'Woebot Health', NULL, 'published', FALSE, NULL, 'listed', NOW()),
('Headspace Ebb', 'headspace-ebb', 'AI 冥想伙伴：Headspace 2026 版 AI 陪伴对话，冥想/睡眠/情绪调节', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://www.headspace.com', NULL, 'Headspace', NULL, 'published', FALSE, NULL, 'listed', NOW()),
-- ---------- 语言学习 (4) ----------
('TalkPal AI', 'talkpal', 'AI 语言家教：130+ 语言实时对话练习，角色扮演场景 + 发音纠错', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://talkpal.ai', NULL, 'TalkPal', NULL, 'published', FALSE, NULL, 'listed', NOW()),
('Speak', 'speak-language', 'AI 口语练习：短视频课程 + AI 对话评估发音流利度，主打开口说', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://www.speak.com', NULL, 'Speak', NULL, 'published', FALSE, NULL, 'listed', NOW()),
('Praktika', 'praktika', 'AI 语言学习：AI 虚拟人形象对话练习，沉浸式口语 + 实时反馈', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://www.praktika.ai', NULL, 'Praktika', NULL, 'published', FALSE, NULL, 'listed', NOW()),
('Langua', 'langua', 'AI 语言学习：超个性化对话练习，实时纠错 + 语法解释，自然交流', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://languatalk.com/langua', NULL, 'Langua', NULL, 'published', FALSE, NULL, 'listed', NOW()),
-- ---------- 艺术创作 (3) ----------
('NightCafe Studio', 'nightcafe', 'AI 艺术创作社区：多种模型生成艺术画 + 社区风格库 + 每日创作挑战', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://creator.nightcafe.studio', NULL, 'NightCafe', NULL, 'published', FALSE, NULL, 'listed', NOW()),
('Tensor.Art', 'tensor-art', 'AI 图像生成平台：海量开源模型在线运行 + LoRA/ControlNet + 图生视频', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://tensor.art', NULL, 'TensorArt', NULL, 'published', FALSE, NULL, 'listed', NOW()),
('Artbreeder', 'artbreeder', 'AI 图像混合进化：基因混合生成肖像/风景/插画，协作式创作', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://www.artbreeder.com', NULL, 'Artbreeder', NULL, 'published', FALSE, NULL, 'listed', NOW()),
-- ---------- 音乐创作 (3) ----------
('AIVA', 'aiva-music', 'AI 作曲引擎：交响乐/影视配乐/游戏音乐，MIDI 导出 + 版权清晰可商用', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://www.aiva.ai', NULL, 'AIVA', NULL, 'published', FALSE, NULL, 'listed', NOW()),
('Soundraw', 'soundraw-music', 'AI 音乐生成：自定义时长/情绪/流派，免版权 BGM，视频/播客配乐首选', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://soundraw.io', NULL, 'Soundraw', NULL, 'published', FALSE, NULL, 'listed', NOW()),
('BandLab Songstarter', 'bandlab-songstarter', 'AI 音乐创作：生成多轨节拍起点 + AI 母带处理，免费在线 DAW 工作流', 'scene', (SELECT id FROM platforms WHERE slug='gpts'),
  'https://www.bandlab.com', NULL, 'BandLab', NULL, 'published', FALSE, NULL, 'listed', NOW())
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Skill × 场景关联
-- ============================================================

INSERT INTO skill_scenarios (skill_id, scenario_id) VALUES
  -- 健身运动
  ((SELECT id FROM skills WHERE slug='fitbod'), (SELECT id FROM scenarios WHERE slug='fitness')),
  ((SELECT id FROM skills WHERE slug='freeletics'), (SELECT id FROM scenarios WHERE slug='fitness')),
  ((SELECT id FROM skills WHERE slug='zing-coach'), (SELECT id FROM scenarios WHERE slug='fitness')),
  ((SELECT id FROM skills WHERE slug='fitnessai'), (SELECT id FROM scenarios WHERE slug='fitness')),
  -- 旅行规划
  ((SELECT id FROM skills WHERE slug='tripplanner-ai'), (SELECT id FROM scenarios WHERE slug='travel')),
  ((SELECT id FROM skills WHERE slug='mindtrip'), (SELECT id FROM scenarios WHERE slug='travel')),
  ((SELECT id FROM skills WHERE slug='layla-travel'), (SELECT id FROM scenarios WHERE slug='travel')),
  ((SELECT id FROM skills WHERE slug='wanderlog'), (SELECT id FROM scenarios WHERE slug='travel')),
  -- 烹饪美食
  ((SELECT id FROM skills WHERE slug='chefgpt'), (SELECT id FROM scenarios WHERE slug='cooking')),
  ((SELECT id FROM skills WHERE slug='dishgen'), (SELECT id FROM scenarios WHERE slug='cooking')),
  ((SELECT id FROM skills WHERE slug='foodieprep'), (SELECT id FROM scenarios WHERE slug='cooking')),
  ((SELECT id FROM skills WHERE slug='mr-cook'), (SELECT id FROM scenarios WHERE slug='cooking')),
  -- 心理健康
  ((SELECT id FROM skills WHERE slug='wysa'), (SELECT id FROM scenarios WHERE slug='mental-health')),
  ((SELECT id FROM skills WHERE slug='woebot'), (SELECT id FROM scenarios WHERE slug='mental-health')),
  ((SELECT id FROM skills WHERE slug='headspace-ebb'), (SELECT id FROM scenarios WHERE slug='mental-health')),
  -- 语言学习
  ((SELECT id FROM skills WHERE slug='talkpal'), (SELECT id FROM scenarios WHERE slug='language-learning')),
  ((SELECT id FROM skills WHERE slug='speak-language'), (SELECT id FROM scenarios WHERE slug='language-learning')),
  ((SELECT id FROM skills WHERE slug='praktika'), (SELECT id FROM scenarios WHERE slug='language-learning')),
  ((SELECT id FROM skills WHERE slug='langua'), (SELECT id FROM scenarios WHERE slug='language-learning')),
  -- 艺术创作
  ((SELECT id FROM skills WHERE slug='nightcafe'), (SELECT id FROM scenarios WHERE slug='art-creation')),
  ((SELECT id FROM skills WHERE slug='nightcafe'), (SELECT id FROM scenarios WHERE slug='design')),
  ((SELECT id FROM skills WHERE slug='tensor-art'), (SELECT id FROM scenarios WHERE slug='art-creation')),
  ((SELECT id FROM skills WHERE slug='tensor-art'), (SELECT id FROM scenarios WHERE slug='design')),
  ((SELECT id FROM skills WHERE slug='artbreeder'), (SELECT id FROM scenarios WHERE slug='art-creation')),
  -- 音乐创作
  ((SELECT id FROM skills WHERE slug='aiva-music'), (SELECT id FROM scenarios WHERE slug='music-creation')),
  ((SELECT id FROM skills WHERE slug='soundraw-music'), (SELECT id FROM scenarios WHERE slug='music-creation')),
  ((SELECT id FROM skills WHERE slug='bandlab-songstarter'), (SELECT id FROM scenarios WHERE slug='music-creation'))
ON CONFLICT DO NOTHING;
