'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { trialApiBaseUrl } from '../lib/supabase';

interface TrialBoxProps {
  skillSlug: string;
  placeholder?: string;
  maxInputChars?: number;
}

interface TrialResponse {
  code: number;
  message: string;
  data: { output?: string } | null;
}

const SESSION_TOKEN_KEY = 'ai-skill-trial-session-token';

function getOrCreateSessionToken(): string {
  if (typeof window === 'undefined') return 'server-side';
  let token = window.localStorage.getItem(SESSION_TOKEN_KEY);
  if (!token) {
    token = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    window.localStorage.setItem(SESSION_TOKEN_KEY, token);
  }
  return token;
}

export default function TrialBox({ skillSlug, placeholder = '输入你的需求...', maxInputChars = 500 }: TrialBoxProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const outputRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  const runTrial = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    setError('');
    setOutput('');

    try {
      const response = await fetch(`${trialApiBaseUrl}/api/trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillSlug,
          input: text,
          sessionToken: getOrCreateSessionToken(),
          stream: false,
        }),
      });
      const result = (await response.json()) as TrialResponse;
      if (result.code !== 0 || !result.data) {
        setError(result.message || '试用失败，请稍后再试');
      } else {
        setOutput(result.data.output || '（无输出）');
      }
    } catch (err) {
      setError('无法连接试用服务，请确认 ECS 中转 API 已启动（NEXT_PUBLIC_TRIAL_API_URL）');
    } finally {
      setLoading(false);
    }
  }, [input, loading, skillSlug]);

  return (
    <div className="rounded-card border border-gray-200 bg-white p-4">
      <p className="mb-2 text-sm font-medium text-gray-800">💬 试试看：输入你的需求</p>
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={placeholder}
        maxLength={maxInputChars}
        rows={3}
        className="w-full resize-none rounded-btn border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <div className="mt-2 flex items-center justify-between">
        <button type="button" onClick={runTrial} disabled={loading || !input.trim()} className="button-primary">
          {loading ? '生成中...' : '试用'}
        </button>
        <span className="text-xs text-gray-400">免费试用 · 每日 5 次</span>
      </div>

      {error && <p className="mt-3 rounded-btn bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {output && (
        <pre
          ref={outputRef}
          className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-btn bg-gray-50 px-3 py-2 text-sm text-gray-800"
        >
          {output}
        </pre>
      )}
    </div>
  );
}
