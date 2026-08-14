-- 索引 + RLS + 触发器（管线表）

-- 索引
CREATE INDEX IF NOT EXISTS idx_content_items_pipeline_status ON content_items(pipeline_id, status);
CREATE INDEX IF NOT EXISTS idx_content_items_slug ON content_items(slug);
CREATE INDEX IF NOT EXISTS idx_content_versions_content ON content_versions(content_id);
CREATE INDEX IF NOT EXISTS idx_review_records_content ON review_records(content_id);
CREATE INDEX IF NOT EXISTS idx_revision_records_content ON revision_records(content_id);
CREATE INDEX IF NOT EXISTS idx_verification_records_content ON verification_records(content_id);
CREATE INDEX IF NOT EXISTS idx_raw_crawl_url_hash ON raw_crawl_data(url_hash);
CREATE INDEX IF NOT EXISTS idx_raw_crawl_source ON raw_crawl_data(source_id, fetched_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_crawl_url_hash_uniq ON raw_crawl_data(url_hash);
CREATE INDEX IF NOT EXISTS idx_user_learning_events_user ON user_learning_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_sources_enabled ON tracking_sources(enabled) WHERE enabled;

-- RLS：管线表全部 service_role only（anon/authenticated 无权读写）
ALTER TABLE pipeline_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_crawl_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_sources ENABLE ROW LEVEL SECURITY;

-- 已发布内容对匿名可见（前端读）
CREATE POLICY "published content readable" ON content_items
  FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "published versions readable" ON content_versions
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM content_items WHERE content_items.id = content_versions.content_id AND content_items.status = 'published'));

-- 学习事件：用户只能读写自己的
ALTER TABLE user_learning_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own learning events select" ON user_learning_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own learning events insert" ON user_learning_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- updated_at 触发器
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_content_items_updated_at BEFORE UPDATE ON content_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_content_versions_updated_at BEFORE UPDATE ON content_versions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pipeline_configs_updated_at BEFORE UPDATE ON pipeline_configs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
