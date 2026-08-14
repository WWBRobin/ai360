-- ArcDock 管线核心表 v1（v4.0 §1.9 + Hermes 补充）
-- 执行方式：Management API 逐条执行

-- 1. 管线配置表
CREATE TABLE IF NOT EXISTS pipeline_configs (
    id SERIAL PRIMARY KEY,
    pipeline_id VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    config JSONB NOT NULL,
    production_prompt_version VARCHAR(20),
    review_prompt_version VARCHAR(20),
    revision_prompt_version VARCHAR(20),
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 内容条目表
CREATE TABLE IF NOT EXISTS content_items (
    id BIGSERIAL PRIMARY KEY,
    pipeline_id VARCHAR(50) NOT NULL,
    content_type VARCHAR(30) NOT NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    category VARCHAR(50),
    tags TEXT[] DEFAULT '{}',
    source_type VARCHAR(50),
    source_url TEXT,
    raw_source_data JSONB,
    status VARCHAR(30) NOT NULL DEFAULT 'discovered',
    sub_status VARCHAR(50),
    revision_count INTEGER DEFAULT 0,
    max_revisions INTEGER DEFAULT 5,
    ai_confidence_score DECIMAL(3,2),
    related_skill_ids BIGINT[] DEFAULT '{}',
    discovered_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 内容版本表
CREATE TABLE IF NOT EXISTS content_versions (
    id BIGSERIAL PRIMARY KEY,
    content_id BIGINT REFERENCES content_items(id) ON DELETE CASCADE,
    pipeline_id VARCHAR(50) NOT NULL,
    version_type VARCHAR(20) NOT NULL,
    target_levels TEXT[] NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    version_number INTEGER DEFAULT 1,
    meta_title TEXT,
    meta_description TEXT,
    keywords TEXT[],
    skill_links JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 审核记录表
CREATE TABLE IF NOT EXISTS review_records (
    id BIGSERIAL PRIMARY KEY,
    content_id BIGINT REFERENCES content_items(id) ON DELETE CASCADE,
    pipeline_id VARCHAR(50) NOT NULL,
    reviewer VARCHAR(10) NOT NULL,
    action VARCHAR(20) NOT NULL,
    revision_round INTEGER DEFAULT 1,
    review_report JSONB,
    revision_instructions JSONB,
    dimension_scores JSONB,
    overall_score DECIMAL(3,2),
    passed BOOLEAN,
    human_reviewer VARCHAR(100),
    human_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 修改记录表
CREATE TABLE IF NOT EXISTS revision_records (
    id BIGSERIAL PRIMARY KEY,
    content_id BIGINT REFERENCES content_items(id) ON DELETE CASCADE,
    pipeline_id VARCHAR(50) NOT NULL,
    revision_round INTEGER NOT NULL,
    revision_type VARCHAR(20),
    trigger_source VARCHAR(10),
    instructions JSONB,
    changes JSONB,
    revision_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 验证记录表
CREATE TABLE IF NOT EXISTS verification_records (
    id BIGSERIAL PRIMARY KEY,
    content_id BIGINT REFERENCES content_items(id) ON DELETE CASCADE,
    pipeline_id VARCHAR(50) NOT NULL,
    verification_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    input_params JSONB,
    output_result JSONB,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 内容关联表
CREATE TABLE IF NOT EXISTS content_relations (
    id BIGSERIAL PRIMARY KEY,
    source_content_id BIGINT REFERENCES content_items(id) ON DELETE CASCADE,
    target_content_id BIGINT REFERENCES content_items(id) ON DELETE CASCADE,
    relation_type VARCHAR(20) NOT NULL,
    auto_generated BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AI Prompt 模板表
CREATE TABLE IF NOT EXISTS prompt_templates (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(50) NOT NULL,
    pipeline_id VARCHAR(50) NOT NULL,
    role VARCHAR(10) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    prompt_text TEXT NOT NULL,
    times_used INTEGER DEFAULT 0,
    avg_pass_rate DECIMAL(3,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 原始采集数据表（Hermes 补充）
CREATE TABLE IF NOT EXISTS raw_crawl_data (
    id BIGSERIAL PRIMARY KEY,
    source_id INTEGER,
    source_url TEXT NOT NULL,
    url_hash VARCHAR(64) NOT NULL,
    title TEXT,
    content_text TEXT,
    raw_payload JSONB,
    content_hash VARCHAR(64),
    relevance_score DECIMAL(3,2),
    relevance_reason TEXT,
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. 追踪源配置表（Hermes 补充）
CREATE TABLE IF NOT EXISTS tracking_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    source_type VARCHAR(30) NOT NULL,
    url TEXT NOT NULL,
    feed_to_pipeline VARCHAR(50)[] DEFAULT '{}',
    fetch_interval_minutes INTEGER DEFAULT 60,
    priority INTEGER DEFAULT 5,
    enabled BOOLEAN DEFAULT true,
    last_fetched_at TIMESTAMPTZ,
    last_status VARCHAR(20),
    consecutive_failures INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. 学习行为事件表（Hermes 补充，credential streak 计算依据）
CREATE TABLE IF NOT EXISTS user_learning_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    event_type VARCHAR(30) NOT NULL,
    path_id VARCHAR(50),
    unit_id VARCHAR(50),
    skill_id BIGINT,
    duration_seconds INTEGER,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
