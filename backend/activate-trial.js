/**
 * AI360 试用功能激活脚本
 * 
 * 功能：
 * 1. 从扣子获取 PAT（Personal Access Token）
 * 2. 配置 3-5 个热门 Skill 的中转试用
 * 3. 更新数据库 trial_enabled=true + trial_config
 * 
 * 用法：在 ECS 上执行 node activate-trial.js
 * 前提：需要在扣子官网申请 PAT
 */

const { Client } = require('pg')
const https = require('https')

// 扣子 PAT（需要在扣子官网申请）
const COZE_PAT = process.env.COZE_PAT || ''

// 需要激活试用的 Skill（扣子平台的热门 API 类 Skill）
const TRIAL_SKILLS = [
  {
    slug: 'xiaohongshu-image-pro',
    bot_id: 'REPLACE_WITH_REAL_BOT_ID',
    prompt_template: '你是小红书图文创作专家。请根据以下需求生成小红书图文内容：{{input}}'
  },
  {
    slug: 'ecommerce-main-image',
    bot_id: 'REPLACE_WITH_REAL_BOT_ID',
    prompt_template: '你是电商设计专家。请根据以下商品信息生成电商主图建议：{{input}}'
  },
  {
    slug: 'brand-moments-copy',
    bot_id: 'REPLACE_WITH_REAL_BOT_ID',
    prompt_template: '你是品牌营销专家。请根据以下品牌信息生成朋友圈文案：{{input}}'
  }
]

async function main() {
  if (!COZE_PAT) {
    console.log('❌ 请先设置 COZE_PAT 环境变量')
    console.log('   申请地址：https://www.coze.cn/open/oauth/pats')
    return
  }

  const client = new Client({
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.puqmyykxhvwjsvsuajfz',
    password: process.env.SUPA_DB_PASS,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✅ 连接数据库')

    for (const skill of TRIAL_SKILLS) {
      // 更新 trial_enabled + trial_config
      const config = {
        provider: 'coze',
        api_base: 'https://api.coze.cn',
        bot_id: skill.bot_id,
        coze_pat: COZE_PAT,
        prompt_template: skill.prompt_template
      }

      await client.query(
        `UPDATE skills 
         SET trial_enabled = true, 
             trial_config = $1::jsonb
         WHERE slug = $2`,
        [JSON.stringify(config), skill.slug]
      )

      console.log(`✅ 已激活试用: ${skill.slug}`)
    }

    // 验证
    const result = await client.query('SELECT name, slug, trial_enabled FROM skills WHERE trial_enabled = true')
    console.log(`\n🎉 已激活 ${result.rows.length} 个 Skill 的试用功能:`)
    result.rows.forEach(r => console.log(`  - ${r.name} (${r.slug})`))

  } catch (e) {
    console.error('❌', e.message)
  } finally {
    await client.end()
  }
}

main()
