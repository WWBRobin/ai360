/**
 * AI360 Skill 试用中转 API（极简版）
 * 
 * 功能：接收前端试用请求 → 调用扣子 Chat API → 返回结果
 * 安全：CORS 限制 + IP 限流 + 每用户每天 5 次
 * 
 * 部署：ECS /app/skill-trial/，PM2 管理，端口 3072
 */

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { createClient: createSupabaseClient } = require('@supabase/supabase-js')

const app = express()
const PORT = process.env.PORT || 3072

// ===== Supabase（service_role，仅后端） =====
const supabase = createSupabaseClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ===== 中间件 =====
app.use(cors({
  origin: [
    'https://vokki.cn',
    'https://www.vokki.cn',
    'http://localhost:3000',
  ],
  methods: ['POST', 'GET'],
}))
app.use(express.json({ limit: '256kb' }))

// ===== IP 限流（内存，MVP 够用） =====
const ipRequests = new Map() // ip -> { count, date }
const IP_DAILY_LIMIT = 50

function checkIpLimit(ip) {
  const today = new Date().toISOString().slice(0, 10)
  const record = ipRequests.get(ip)
  if (!record || record.date !== today) {
    ipRequests.set(ip, { count: 1, date: today })
    return true
  }
  if (record.count >= IP_DAILY_LIMIT) return false
  record.count++
  return true
}

// ===== 健康检查 =====
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ===== 配额检查 =====
async function checkQuota(sessionToken) {
  const today = new Date().toISOString().slice(0, 10)
  const { count } = await supabase
    .from('trial_logs')
    .select('id', { count: 'exact', head: true })
    .eq('session_token', sessionToken)
    .gte('created_at', today)

  return {
    allowed: count < 5,
    remaining: Math.max(0, 5 - count),
    used: count,
  }
}

// ===== 试用接口 =====
app.post('/api/trial', async (req, res) => {
  try {
    const { skill_id, input_text, session_token } = req.body

    // 参数校验
    if (!skill_id || !input_text) {
      return res.status(400).json({ success: false, error: '参数缺失', remaining_quota: 0 })
    }
    if (input_text.length > 2000) {
      return res.status(400).json({ success: false, error: '输入过长（限2000字）', remaining_quota: 0 })
    }

    // IP 限流
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress
    if (!checkIpLimit(ip)) {
      return res.status(429).json({ success: false, error: '今日请求过多，明天再来', remaining_quota: 0 })
    }

    // 查 Skill 配置
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('name, trial_config, trial_enabled')
      .eq('id', skill_id)
      .eq('status', 'published')
      .single()

    if (skillError || !skill) {
      return res.status(404).json({ success: false, error: 'Skill 不存在', remaining_quota: 0 })
    }

    if (!skill.trial_enabled) {
      return res.status(403).json({ success: false, error: '该 Skill 不支持试用', remaining_quota: 0 })
    }

    const config = skill.trial_config || {}
    const token = session_token || `${ip}-${new Date().toISOString().slice(0, 10)}`

    // 配额检查
    const quota = await checkQuota(token)
    if (!quota.allowed) {
      return res.status(429).json({
        success: false,
        error: '今日试用次数已用完（5次/天）',
        remaining_quota: 0,
      })
    }

    // 调用扣子 Chat API（非流式 + 轮询）
    let output = ''
    let tokensUsed = 0

    if (config.provider === 'coze') {
      const result = await callCozeAPI(config, input_text)
      output = result.answer
      tokensUsed = result.tokens || 0
    } else {
      // 其他 provider 可扩展
      output = `试用功能正在开发中。请直接安装 ${skill.name} 体验完整功能。`
    }

    // 记录试用日志
    await supabase.from('trial_logs').insert({
      skill_id,
      session_token: token,
      input_text: input_text.slice(0, 500),
      output_text: output.slice(0, 2000),
      tokens_used: tokensUsed,
    })

    // 返回结果
    res.json({
      success: true,
      output,
      tokens_used: tokensUsed,
      remaining_quota: quota.remaining - 1,
    })
  } catch (err) {
    console.error('Trial error:', err)
    res.status(500).json({
      success: false,
      error: '服务暂时不可用，请稍后重试',
      remaining_quota: 0,
    })
  }
})

// ===== 扣子 Chat API 调用 =====
async function callCozeAPI(config, userInput) {
  const { api_base, bot_id, prompt_template, coze_pat } = config

  const systemPrompt = prompt_template
    ? prompt_template.replace('{{input}}', userInput)
    : userInput

  // Step 1: 发起对话
  const chatRes = await fetch(`${api_base}/v3/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${coze_pat || process.env.COZE_PAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bot_id,
      user_id: 'ai360_trial_user',
      stream: false,
      auto_save_history: false,
      additional_messages: [{
        role: 'user',
        content: systemPrompt,
        content_type: 'text',
      }],
    }),
  })

  if (!chatRes.ok) {
    throw new Error(`Coze API error: ${chatRes.status}`)
  }

  const chatData = await chatRes.json()

  // Step 2: 轮询获取结果（非流式）
  const chatId = chatData.data?.id
  const conversationId = chatData.data?.conversation_id

  if (!chatId) {
    throw new Error('No chat ID returned')
  }

  // 轮询（最多 90 秒）
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 3000))

    const pollRes = await fetch(
      `${api_base}/v3/chat/retrieve?chat_id=${chatId}&conversation_id=${conversationId}`,
      {
        headers: { 'Authorization': `Bearer ${coze_pat || process.env.COZE_PAT}` },
      }
    )
    const pollData = await pollRes.json()

    if (pollData.data?.status === 'completed') {
      // 获取消息列表
      const msgRes = await fetch(
        `${api_base}/v3/chat/message/list?chat_id=${chatId}&conversation_id=${conversationId}`,
        {
          headers: { 'Authorization': `Bearer ${coze_pat || process.env.COZE_PAT}` },
        }
      )
      const msgData = await msgRes.json()

      const assistantMsg = msgData.data?.find(m => m.role === 'assistant' && m.type === 'answer')
      return {
        answer: assistantMsg?.content || '（无输出）',
        tokens: assistantMsg?.usage?.total_tokens || 0,
      }
    }

    if (pollData.data?.status === 'failed' || pollData.data?.status === 'error') {
      throw new Error('Coze task failed')
    }
  }

  throw new Error('Coze API timeout (90s)')
}

// ===== 启动 =====
app.listen(PORT, () => {
  console.log(`AI360 Trial API running on port ${PORT}`)
})
