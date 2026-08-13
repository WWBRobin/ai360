# AI Agent开发完全指南：从Function Calling到MCP的实战教程

> **一句话定位：** 这是一篇从零开始的AI Agent开发教程。无论你是刚听说"AI Agent"概念的新手，还是想深入理解Function Calling和MCP协议的开发者，跟着本文一步步走，你将理解Agent的核心原理，并亲手写出第一个能调用外部工具的智能体。

## 目录

- [什么是AI Agent？和ChatGPT有什么区别？](#什么是ai-agent和chatgpt有什么区别)
- [AI Agent的四大核心组件](#ai-agent的四大核心组件)
- [Function Calling：让AI学会使用工具](#function-calling让ai学会使用工具)
- [MCP协议：工具调用的统一标准](#mcp协议工具调用的统一标准)
- [AI Agent开发框架怎么选？](#ai-agent开发框架怎么选)
- [实战：从零开发一个天气查询Agent](#实战从零开发一个天气查询agent)
- [常见问题FAQ](#常见问题faq)
- [总结](#总结)

---

## 什么是AI Agent？和ChatGPT有什么区别？

很多人第一次接触"AI Agent"时都会问：**它和ChatGPT有什么区别？**

> **核心区别**：ChatGPT是"参谋"——能告诉你怎么做，但不会替你做；AI Agent是"同事"——不仅能告诉你怎么做，还能直接把事情办了。

### 一张表看懂三种AI的区别

| 维度 | 聊天机器人 | AI助手（如ChatGPT） | AI Agent（智能体） |
|------|------------|---------------------|---------------------|
| **用途** | 简单对话自动化 | 协助用户完成任务 | 自主、主动地执行任务 |
| **工作方式** | 被动响应命令 | 被动响应用户请求 | 主动出击，目标明确 |
| **功能** | 遵循预定义规则 | 提供信息、推荐操作 | 执行复杂多步骤操作，独立决策 |
| **学习能力** | 有限 | 可对话学习 | 可学习适应，跨会话记忆 |
| **典型例子** | 客服自动回复 | ChatGPT问答 | 自主订机票、操作ERP系统 |

用一个具体场景来理解：

| 场景 | 聊天机器人 | AI助手 | AI Agent |
|------|------------|--------|----------|
| "帮我订明天的机票" | "很抱歉，我无法为您订票" | "以下是订票网站推荐……" | 自动查询航班、比价、填写信息、完成订票 |

> **Google的定义**：AI智能体是使用AI来实现目标并代表用户完成任务的软件系统，具有推理、规划和记忆能力，并具有一定自主性。（来源：Google Cloud官方文档）

### 为什么2026年是Agent元年？

AI行业正经历第三次关键技术范式切换：

1. **判别式AI**：聚焦识别与预测（图像识别、推荐算法）
2. **生成式AI**：主打内容创作（ChatGPT、Midjourney）
3. **Agentic AI（当前阶段）**：核心突破是**自主执行**

这一变革源于三大底层技术的共同成熟：
- 大模型深度推理能力持续精进（SWE-bench 80%+）
- 跨系统标准化工具调用体系成型（MCP协议普及）
- 长周期任务自主规划与自我纠错机制落地

## AI Agent的四大核心组件

要开发Agent，首先要理解它的架构。一个完整的AI Agent包含四个层次：

### 组件一：大脑——大语言模型（LLM）

Agent的认知核心，负责理解用户意图、推理决策、生成自然语言。2026年主流选择：

| 模型 | 特点 | 适合场景 |
|------|------|----------|
| Claude Opus系列 | 推理能力最强，200K上下文 | 复杂规划、代码任务 |
| GPT-5系列 | 通用能力强，工具调用稳定 | 通用Agent |
| Gemini 3 Pro | 1M超长上下文，多模态 | 大规模文档处理 |
| DeepSeek V4 | 高性价比，开源 | 成本敏感场景 |

> **关键区别**：通用聊天模型擅长语言理解与生成，但在工具调用、多步规划、自主决策等Agent核心能力上存在结构性短板。2026年上半年密集发布的Ornith、Laguna、Devstral等开源Agent模型，正是针对这一能力缺口设计的专用模型。

### 组件二：工具——Function Calling与MCP

让AI不只是"说"，而是"做"。这是Agent与聊天机器人的根本区别——后面会详细讲。

### 组件三：记忆——Memory

让Agent不只记得当前对话，还能记住历史交互和用户偏好。分为三层：

| 记忆类型 | 作用 | 实现方式 |
|----------|------|----------|
| **短期记忆** | 当前对话上下文 | 对话历史窗口 |
| **长期记忆** | 跨会话记住用户偏好 | 向量数据库（RAG） |
| **经验记忆** | 从过往任务中学习"技能" | 技能库（Skills） |

### 组件四：循环——Agent Loop

Agent不是一次性回答，而是一个持续循环：

```
用户查询 → 模型推理 → 选择工具 → 执行工具 → 读取结果 → 继续推理 → （可能更多工具调用）→ 最终答案
```

这个循环是Agent自主性的来源——它可以连续调用多个工具，中间根据结果调整策略，直到完成任务。

## Function Calling：让AI学会使用工具

Function Calling是Agent调用工具的基础能力。理解它的原理，是用好所有Agent框架的前提。

### 什么是Function Calling？

**核心概念**：Function Calling是让大模型根据用户问题，从给定的工具清单中选择合适的工具，并生成调用参数的能力。

> **关键澄清**：Function Calling只是"工具选择"，不包含"工具执行"。模型输出的是一个JSON格式的函数调用描述，真正执行函数需要开发者在自己的应用中对接。

### Function Calling的工作流程

```
步骤1：开发者定义工具（JSON Schema格式）
步骤2：用户提问
步骤3：模型判断需要用哪个工具 + 生成调用参数
步骤4：开发者执行函数
步骤5：把执行结果返回给模型
步骤6：模型基于结果生成最终回答
```

### 代码示例：一个完整的Function Calling

**步骤1：定义工具**

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取指定城市的天气信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名称，如北京、上海"
                    }
                },
                "required": ["city"]
            }
        }
    }
]
```

**步骤2：模型选择工具并生成调用**

当用户问"北京天气怎么样？"，模型的响应是：

```json
{
  "role": "assistant",
  "content": null,
  "tool_calls": [
    {
      "id": "call_abc123",
      "type": "function",
      "function": {
        "name": "get_weather",
        "arguments": "{\"city\": \"北京\"}"
      }
    }
  ]
}
```

**步骤3：开发者执行函数并返回结果**

```python
# 开发者自己实现的函数
def get_weather(city):
    # 调用天气API...
    return {"temperature": 25, "condition": "晴天"}

# 把结果返回给模型
result = get_weather("北京")
# 将result传回模型，模型生成最终回答："北京今天25度，晴天。"
```

### Function Calling的两个关键认知

> **认知一：工具定义本身就是Prompt。** 函数的name、description、parameters的内容都会影响模型的选择。这些不起眼的工具定义，其实就是Prompt的一部分。

> **认知二：Function Calling能力需要单独训练。** 这就是为什么很多模型虽然能力很强，但不支持Function Calling（如DeepSeek R1推理模型早期不支持）。模型在训练阶段需要大量学习"观察环境→选择工具→执行操作→读取反馈→调整策略"这一闭环。

### Function Calling的Token成本

一个函数的描述可能有上百Token。如果接入几十个工具，每次推理都需要把这一大坨工具描述传给模型——**Token耗费非常高**。这是大规模Agent应用的核心成本来源。

## MCP协议：工具调用的统一标准

### MCP解决什么问题？

假设你有10个Agent，每个都需要调用天气查询、数据库查询、发邮件等功能。**你需要每个Agent都复制一次工具代码吗？** 显然不可能。

MCP（Model Context Protocol）就是解决这个问题的——**把工具变成服务，让所有Agent都能调用**。

### MCP是什么？

> **MCP是一个通信协议**，用MCP实现的工具叫做**MCP Server**（服务端），调用方叫做**MCP Client**（客户端）。MCP Server可以是本地服务，也可以是Web服务。虽然MCP是为AI定制的标准，但实际上协议本身和AI没有直接关系——它就是一个标准的工具调用通信协议。

### MCP vs Function Calling的关系

| 维度 | Function Calling | MCP |
|------|-----------------|-----|
| **层级** | 模型层能力 | 协议层标准 |
| **作用** | 让模型选择并生成工具调用 | 让工具变成可发现、可组合的服务 |
| **关系** | MCP是Function Calling的"基础设施升级" | MCP依赖Function Calling格式 |
| **动态性** | 工具定义固定写在Prompt里 | 运行时动态发现可用工具 |

### MCP的核心优势：动态发现

使用MCP，AI Agent可以在运行时动态查询每个服务器可用的工具：

```
Agent连接MCP Server → 调用 tools/list → 获取该服务器支持的操作列表
→ 将工具信息提供给模型 → 模型选择合适的工具 → Agent执行调用
```

> **关键优势**：如果服务器升级了一个新工具（如"delete_file"），客户端可以立即发现它，AI可以开始使用它，**无需开发者更改Prompt或代码**——协议处理了发现。

### MCP架构图

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  AI Agent │────→│  MCP Client  │────→│  MCP Server  │
│ (大脑)    │←────│  (调用方)    │←────│  (工具服务)  │
└──────────┘     └──────────────┘     └──────────────┘
                                          │
                                    ┌─────┴─────┐
                                    │ 天气查询   │
                                    │ 数据库     │
                                    │ 发邮件     │
                                    │ GitHub    │
                                    │ Slack     │
                                    └───────────┘
```

一个MCP Server可以暴露多个工具，Agent可以连接多个MCP Server，实现工具的即插即用。

> **趋势判断**：随着MCP等协议的普及，「工具」正在从代码片段演变为可发现、可组合、可计费的服务单元。**工具即服务（Tools-as-a-Service）将成为AI Agent生态的基础设施。**

## AI Agent开发框架怎么选？

2026年主流Agent开发框架对比：

| 框架 | 定位 | GitHub Stars | 最适合 | 上手速度 |
|------|------|-------------|--------|----------|
| **LangGraph** | 状态图编排，精确控制 | ~85K（LangChain生态） | 严格工作流、合规控制 | 中等 |
| **CrewAI** | 角色制多Agent协作 | 增长快 | 多Agent协作原型 | 最快 |
| **AutoGen** | 开放式Agent对话 | 微软出品 | 复杂对话式多Agent | 中等 |
| **LangChain** | 通用LLM应用框架 | ~85K | 快速原型、需要集成多组件 | 最快 |
| **OpenAI Agents SDK** | 官方原生SDK | OpenAI出品 | OpenAI生态深度用户 | 快 |
| **Claude Agent SDK** | 官方原生SDK | 2026年崛起 | Claude生态深度用户 | 快 |

### 三大主流框架深度对比

#### LangGraph：精确控制派

**核心特点**：把Agent工作流建模为状态图，每个节点是一个动作，边定义转移条件。

- ✅ **优点**：精确控制每一步，适合需要合规审计的场景
- ❌ **缺点**：简单逻辑会觉得过度工程化，像"画流程图"先于写代码
- **适合**：需要确定性、可审计工作流的企业场景

#### CrewAI：角色协作派

**核心特点**：每个Agent有定义的角色（如"研究员""作家"）、工具集和任务，像一个团队协作。

- ✅ **优点**：抽象直觉，多Agent原型搭建最快
- ❌ **缺点**：灵活性低，复杂场景需要绕过框架
- **适合**：内容流水线、研究任务、分析任务等可预测工作流

#### AutoGen：开放对话派

**核心特点**：Agent之间可以自由对话、辩论、迭代解决问题，而非固定流程。

- ✅ **优点**：最灵活，适合需要"涌现智能"的场景
- ❌ **缺点**：难以预测，消耗Token多
- **适合**：复杂问题求解、研究探索

### 选框架的三个问题

根据腾讯云开发者社区的经验总结，选框架前想清楚：

| 问题 | 如果回答"是" | 推荐框架 |
|------|-------------|----------|
| 团队AI经验少吗？ | 是 → | LangChain（生态完善，快速上手） |
| 需要多Agent协作吗？ | 是 → | CrewAI（角色协作最直觉） |
| 需要精确控制每一步吗？ | 是 → | LangGraph（状态图编排） |
| 需要高度定制化吗？ | 是 → | 自研（但要团队有AI工程能力） |

> **真实案例**：
> - **客服问答系统**：选LangChain → 3天跑通Demo → 上线后部分链路改自研
> - **内容生成流水线**：选CrewAI → 2周上线 → 后续部分逻辑改自研
> - **代码生成工具**：选自研 → 2个月开发 → 性能可控性都好

## 实战：从零开发一个天气查询Agent

把理论变成实践。下面用Python + Function Calling + MCP，开发一个能查询真实天气的Agent。

### 目标

实现一个本地启动的天气查询MCP服务，并通过客户端成功调用 `get_weather` 工具获取真实天气数据。

### 步骤1：注册天气API并获取Key

1. 访问 OpenWeatherMap（openweathermap.org）
2. 注册账号并登录
3. 进入API Keys页面
4. 复制你的API Key

### 步骤2：编写MCP天气工具

使用FastMCP框架（构建MCP Server的标准框架，只需装饰一个函数即可）：

```python
# weather_mcp_server.py
from fastmcp import FastMCP
import requests

mcp = FastMCP("Weather Service")

@mcp.tool()
def get_weather(city: str) -> str:
    """获取指定城市的天气信息
    
    Args:
        city: 城市名称，如"北京"、"上海"
    
    Returns:
        天气信息的文字描述
    """
    API_KEY = "your_api_key_here"
    url = f"http://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city,
        "appid": API_KEY,
        "units": "metric",
        "lang": "zh_cn"
    }
    resp = requests.get(url, params=params)
    data = resp.json()
    
    temp = data["main"]["temp"]
    desc = data["weather"][0]["description"]
    return f"{city}当前温度{temp}°C，天气{desc}"

if __name__ == "__main__":
    mcp.run()
```

### 步骤3：编写Agent客户端

```python
# agent_client.py
from anthropic import Anthropic
import subprocess
import json

client = Anthropic()

def run_agent(user_query: str):
    """Agent主循环"""
    # 1. 把用户查询和可用工具发给模型
    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=4096,
        tools=[{
            "name": "get_weather",
            "description": "获取指定城市的天气信息",
            "input_schema": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "城市名称"}
                },
                "required": ["city"]
            }
        }],
        messages=[{"role": "user", "content": user_query}]
    )
    
    # 2. 检查模型是否请求调用工具
    if response.stop_reason == "tool_use":
        for content in response.content:
            if content.type == "tool_use":
                # 3. 执行工具（调用MCP Server）
                city = content.input["city"]
                result = call_mcp_weather(city)
                
                # 4. 把结果返回给模型，生成最终回答
                final = client.messages.create(
                    model="claude-opus-4-7",
                    max_tokens=4096,
                    messages=[
                        {"role": "user", "content": user_query},
                        {"role": "assistant", "content": response.content},
                        {"role": "user", "content": [
                            {
                                "type": "tool_result",
                                "tool_use_id": content.id,
                                "content": result
                            }
                        ]}
                    ]
                )
                return final.content[0].text
    
    return response.content[0].text

def call_mcp_weather(city: str) -> str:
    """调用MCP天气服务"""
    # 这里简化为直接调用，实际通过MCP协议通信
    from weather_mcp_server import get_weather
    return get_weather(city)

# 测试
print(run_agent("北京今天天气怎么样？"))
# 输出：北京当前温度25°C，天气晴天。
```

### 步骤4：运行并验证

```bash
# 启动MCP Server
python weather_mcp_server.py

# 另一个终端运行Agent
python agent_client.py
```

恭喜！你刚刚实现了一个完整的AI Agent循环：用户提问 → 模型选择工具 → 执行工具 → 返回结果 → 生成最终回答。

### 进阶：扩展你的Agent

基于这个基础框架，你可以扩展：

| 扩展方向 | 做法 |
|----------|------|
| **加更多工具** | 新增MCP Server（数据库查询、发邮件、搜索等） |
| **加记忆** | 接入向量数据库，存储对话历史 |
| **加多步规划** | 让Agent先制定计划，再逐步执行 |
| **加多Agent协作** | 用CrewAI定义多个角色Agent |

## 常见问题FAQ

### AI Agent和RPA（机器人流程自动化）有什么区别？

RPA按预定义规则执行固定流程，没有理解和决策能力；AI Agent基于大模型推理，能理解模糊需求、自主规划、处理意外情况。可以把RPA理解为"按剧本演的演员"，AI Agent是"能即兴发挥的演员"。很多2026年的产品（如实在Agent）已经把两者融合——用AI做决策，用RPA做执行。

### 开发AI Agent需要什么技术栈？

- **必须**：Python基础、一个大模型API（OpenAI/Anthropic/DeepSeek等）
- **推荐**：一个Agent框架（LangChain/CrewAI）、向量数据库（Chroma/Pinecone）
- **进阶**：MCP协议、Docker部署、监控告警

### AI Agent开发成本高吗？

主要成本是模型API调用费用。控制成本的关键：
- **选对模型**：简单任务用便宜模型（如DeepSeek V4），复杂任务才用旗舰模型
- **控制上下文**：不要把无关信息塞进Prompt
- **缓存结果**：相同工具调用结果可以缓存
- **限制循环**：设置Agent最大循环次数，防止无限调用

### AI Agent能做什么实际应用？

2026年最常见的落地场景：

| 场景 | 例子 |
|------|------|
| **客服自动化** | 理解用户问题 → 查询知识库 → 查询订单 → 退款/处理 |
| **数据分析** | 自然语言提问 → 自动写SQL → 生成图表 → 输出报告 |
| **代码开发** | 需求理解 → 写代码 → 跑测试 → 修复Bug（Claude Code就是典型Agent） |
| **办公自动化** | 读邮件 → 分类 → 起草回复 → 安排会议 |
| **运营监控** | 监控数据 → 异常检测 → 自动触发修复 |

### MCP和Function Calling该用哪个？

**不是二选一，而是配合使用。** Function Calling是模型层的能力（让模型学会选工具），MCP是协议层的标准（让工具变成可复用的服务）。

- **小项目/原型**：直接用Function Calling够了
- **多Agent/多工具**：用MCP把工具服务化，方便复用和扩展
- **企业级**：MCP + Function Calling + 权限管理 + 审计日志

### AI Agent会失控吗？安全怎么保证？

这是2026年最受关注的议题。核心安全措施：

| 安全层 | 做法 |
|--------|------|
| **权限控制** | 限制Agent能调用的工具和数据范围 |
| **人在回路** | 重要操作前必须人类确认 |
| **审计日志** | 记录Agent每一步操作 |
| **沙盒执行** | 在隔离环境中运行，限制系统权限 |
| **回滚机制** | 出错时能快速撤销 |

> **NVIDIA的定义**：自主智能体是"在安全的前提下进行推理、规划和执行任务的系统"，依赖沙盒、身份控制和策略引擎来管理工具访问。

### 想快速上手有什么推荐路径？

1. **第1周**：理解概念（读本文 + 官方文档）
2. **第2周**：用LangChain跑通一个简单Agent Demo
3. **第3-4周**：加入Function Calling + 一个真实工具
4. **第5-6周**：学习MCP，把工具服务化
5. **第7-8周**：用CrewAI做多Agent协作项目

## 总结

| 核心概念 | 一句话总结 |
|----------|------------|
| **AI Agent** | 以大模型为认知核心，能自主感知、规划决策、调用工具的软件实体 |
| **vs ChatGPT** | ChatGPT是参谋（说），Agent是同事（做） |
| **Function Calling** | 让模型学会选择工具并生成调用参数 |
| **MCP协议** | 把工具变成可发现、可复用的服务 |
| **四大组件** | 大脑（LLM）+ 工具（Function Calling/MCP）+ 记忆（Memory）+ 循环（Agent Loop） |
| **框架选择** | 快速原型→LangChain，多Agent→CrewAI，精确控制→LangGraph |

**开发Agent的核心理解**：

> 没有工具，Agent只是"嘴强王者"；有了工具，它才真正拥有改变现实的能力。

2026年开发AI Agent，不需要从零造轮子。选一个框架，定义好你的工具，让大模型做大脑，MCP做神经系统——你就能构建出真正能"办事"的智能体。

---

**相关阅读**：
- [2026年AI编程工具深度分析：Cursor、Claude Code、Copilot技术原理与能力对比](./01-2026年AI编程工具深度分析-Cursor-Claude-Code-Copilot技术原理与能力对比.md)
- [2026年AI编程工具选型指南：个人开发者到企业团队怎么选](./03-2026年AI编程工具选型指南-个人开发者到企业团队怎么选.md)

*最后更新：2026年8月 | 基于最新版本编写，API和框架版本以官方文档为准*
