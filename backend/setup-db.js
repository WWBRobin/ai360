
/**
 * AI360 数据库初始化脚本
 * 用法：node setup-db.js
 * 在能访问 Supabase 的机器上运行（ECS 或海外服务器）
 */
const fs = require('fs')
const { Client } = require('pg')

const SUPABASE_DB_URL = process.env.DATABASE_URL || 
  'postgresql://postgres.puqmyykxhwjvsuajfz:YOUR_DB_PASSWORD@aws-0-puqmyykxhwjvsuajfz.pooler.supabase.com:5432/postgres'

async function main() {
  const client = new Client({ connectionString: SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
  
  try {
    await client.connect()
    console.log('✅ 连接 Supabase 成功')
    
    // 执行 init.sql
    const initSql = fs.readFileSync(__dirname + '/../database/init.sql', 'utf8')
    console.log('执行 init.sql (717行)...')
    await client.query(initSql)
    console.log('✅ init.sql 执行完成')
    
    // 执行 rpc-functions.sql
    const rpcSql = fs.readFileSync(__dirname + '/../database/rpc-functions.sql', 'utf8')
    console.log('执行 rpc-functions.sql (156行)...')
    await client.query(rpcSql)
    console.log('✅ rpc-functions.sql 执行完成')
    
    // 验证
    const res = await client.query('SELECT count(*) as count FROM skills')
    console.log(`✅ 验证：skills 表有 ${res.rows[0].count} 条记录`)
    
    const platRes = await client.query('SELECT count(*) as count FROM platforms')
    console.log(`✅ 验证：platforms 表有 ${platRes.rows[0].count} 条记录`)
    
    const evalRes = await client.query('SELECT count(*) as count FROM evaluations')
    console.log(`✅ 验证：evaluations 表有 ${evalRes.rows[0].count} 条记录`)
    
    console.log('\n🎉 数据库初始化完成！')
  } catch (err) {
    console.error('❌ 错误:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
