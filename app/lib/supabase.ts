import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// 匿名只读客户端（RLS 已配置：内容表公开读，trial_logs 不可读）
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
  : null;

// ECS 中转试用 API 地址（POST /api/trial）
export const trialApiBaseUrl = (process.env.NEXT_PUBLIC_TRIAL_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
