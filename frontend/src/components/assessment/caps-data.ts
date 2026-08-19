/* 170 项检测能力数据（七维 28 子类，来自设计需求文档全量清单）
 * checks=卡面摘要 4 条；full=完整检测项（编号为维度内序号，页面渲染时补零到 3 位）
 */
export interface CapCheck { n: number; x: string }
export interface Cap {
  dim: string
  name: string
  count: number
  desc: string
  subs: { name: string; n: number }[]
  checks: CapCheck[]
  full: CapCheck[]
}

const list = (xs: string[]): CapCheck[] => xs.map((x, i) => ({ n: i + 1, x }))

export const CAPS: Cap[] = [
  {
    dim: 'security', name: '安全', count: 32,
    desc: '检查你的账号、密钥和权限——看它们是不是真的安全。',
    subs: [
      { name: '身份认证', n: 7 }, { name: '数据隐私', n: 6 }, { name: '权限控制', n: 6 }, { name: 'Skill安全', n: 7 }, { name: '网络安全', n: 6 },
    ],
    checks: list(['API密钥是否明文暴露', '插件是否拥有过度文件权限', '未签名Skill是否被安装', 'HTTPS与证书是否有效']),
    full: list([
      'API Key明文暴露', 'API Key轮换周期', 'OAuth Token过期管理', '多因素认证状态', '弱密码检测', 'Session超时配置', 'Token权限范围',
      '敏感数据明文传输', '本地数据加密状态', '用户数据残留清理', '日志中的敏感信息', 'PII数据暴露风险', '数据备份加密',
      '过度权限分配', '未授权API端点', 'CORS配置错误', 'IP白名单缺失', 'Rate Limit缺失', '管理员权限滥用',
      '未签名Skill安装', 'Skill权限越界', '第三方Skill来源验证', 'Skill自动更新风险', '恶意Skill行为检测', 'Skill数据隔离', 'Skill供应链安全',
      'HTTPS配置', '证书有效性', 'DNS劫持风险', '中间人攻击防护', 'WebSocket安全', 'API网关安全',
    ]),
  },
  {
    dim: 'performance', name: '性能', count: 28,
    desc: '你的AI工具响应快不快？Token用得好不好？',
    subs: [
      { name: '响应速度', n: 6 }, { name: 'Token效率', n: 6 }, { name: '并发吞吐', n: 5 }, { name: '缓存加速', n: 5 }, { name: '模型性能', n: 6 },
    ],
    checks: list(['平均响应时间与P95延迟', '输入Token冗余率', '缓存命中率', '并发请求处理能力']),
    full: list([
      '平均响应时间', 'P95响应时间', 'P99响应时间', '冷启动时间', 'Skill加载时间', '首次Token时间',
      '输入Token冗余率', '输出Token利用率', 'Prompt压缩率', '上下文窗口利用率', '缓存命中率', 'Token成本/次',
      '并发请求处理能力', '请求队列深度', '吞吐量(QPS)', '请求失败率', '重试成功率',
      '语义缓存命中率', '结果缓存有效性', 'CDN配置状态', '边缘计算覆盖率', '预加载策略',
      '模型推理延迟', '模型吞吐量', '批处理效率', '量化性能损失', '长上下文性能衰减', '多模态处理延迟',
    ]),
  },
  {
    dim: 'resource', name: '资源', count: 26,
    desc: '你的Skill、模型配置和存储空间，有没有浪费或隐患。',
    subs: [
      { name: 'Skill生态', n: 7 }, { name: '模型配置', n: 6 }, { name: '存储内存', n: 7 }, { name: '工具链', n: 6 },
    ],
    checks: list(['已装Skill是否重复或闲置', '模型版本是否过旧', '向量库容量与磁盘占用', '工具链是否完整连通']),
    full: list([
      '已安装Skill数量', 'Skill更新状态', 'Skill使用频率', 'Skill重复检测', 'Skill依赖完整性', 'Skill兼容性', 'Skill评分',
      '模型版本过旧', '模型参数配置', '多模型负载均衡', '模型Fallback配置', '模型能力覆盖度', '模型资源占用',
      '向量数据库容量', '知识库大小', '缓存占用空间', '临时文件清理', '内存使用率', '磁盘I/O性能', '数据库索引效率',
      '必需工具安装状态', '工具版本兼容性', '工具链连通性', '工具配置正确性', '工具许可证状态', '工具更新状态',
    ]),
  },
  {
    dim: 'connection', name: '连接', count: 22,
    desc: 'API通不通、网络稳不稳、各服务是否正常协作。',
    subs: [
      { name: '网络质量', n: 6 }, { name: 'API可达', n: 5 }, { name: '集成对接', n: 6 }, { name: '同步一致', n: 5 },
    ],
    checks: list(['核心API在线状态', 'Webhook连通性', 'OAuth连接是否有效', '多端数据同步延迟']),
    full: list([
      'API端点延迟', '网络抖动', '丢包率', '带宽利用率', 'DNS解析速度', '代理配置',
      '核心API在线状态', 'API版本兼容性', 'API配额使用率', 'API错误率', 'API限流状态',
      'Webhook连通性', 'OAuth连接状态', '数据库连接池', '消息队列状态', '第三方服务集成', 'API Gateway配置',
      '数据同步延迟', '配置同步状态', '多端一致性', '版本同步', '缓存一致性',
    ]),
  },
  {
    dim: 'asset', name: '资产', count: 24,
    desc: '你的Skill资产、工作流、Prompt和知识库值多少钱。',
    subs: [
      { name: 'Skill资产', n: 6 }, { name: '工作流', n: 6 }, { name: '知识资产', n: 6 }, { name: '数据资产', n: 6 },
    ],
    checks: list(['自研Skill代码质量', '工作流执行成功率', '知识库去重与覆盖', '数据备份完整性']),
    full: list([
      '自研Skill数量', 'Skill代码质量', 'Skill文档完整度', 'Skill测试覆盖率', 'Skill复用率', 'Skill版本管理',
      '工作流数量', '工作流执行次数', '工作流成功率', '工作流复杂度', '工作流文档化', '工作流版本控制',
      '知识库条目数', '知识更新频率', '知识覆盖率', '知识质量评分', '知识去重率', '知识引用频次',
      '数据备份完整性', '数据版本管理', '数据字典完整度', '数据血缘追踪', '数据生命周期管理', '数据归档策略',
    ]),
  },
  {
    dim: 'cost', name: '成本', count: 18,
    desc: '你的订阅和Token，有没有在悄悄浪费钱。',
    subs: [
      { name: 'Token成本', n: 6 }, { name: '订阅资源', n: 6 }, { name: '优化空间', n: 6 },
    ],
    checks: list(['月度Token消耗与趋势', '闲置订阅与重复功能', '无效Token浪费占比', '可节省金额估算']),
    full: list([
      '月度Token消耗', 'Token成本趋势', '无效Token占比', '重复请求Token浪费', 'Prompt优化空间', '模型选择成本差异',
      '闲置订阅检测', '重复功能订阅', '资源利用率', '峰谷定价利用', '预留实例使用', '按需vs包月优化',
      '缓存可节省金额', '压缩可节省金额', '去重可节省金额', '模型降级可行项', '批量处理优惠', '长期承诺折扣',
    ]),
  },
  {
    dim: 'intelligence', name: '智能度', count: 20,
    desc: '你的Agent成熟度、自动化水平和记忆系统。',
    subs: [
      { name: 'Agent成熟', n: 7 }, { name: '自动化', n: 7 }, { name: '记忆学习', n: 6 },
    ],
    checks: list(['Agent专业化与协作水平', '自动化覆盖率', '长期记忆持久化', '跨会话学习能力']),
    full: list([
      'Agent数量', 'Agent专业化程度', 'Agent协作水平', 'Agent自主决策能力', 'Agent学习能力', 'Agent异常处理', 'Agent自我优化',
      '手动操作占比', '自动化覆盖率', '触发器配置数', '定时任务数', '条件自动化数', '异常自动恢复率', '自动化成功率',
      '短期记忆使用', '长期记忆持久化', '记忆检索准确率', '经验积累量', '遗忘曲线合理性', '跨会话学习能力',
    ]),
  },
]

export const TOTAL_CHECKS = CAPS.reduce((s, c) => s + c.count, 0) // = 170
