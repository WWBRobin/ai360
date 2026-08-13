# Claude Skills 安装与使用完全指南：让 Claude 变成你的专属专家（2026 最新版）

> Claude Skills 是 Anthropic 在 2025 年 10 月推出的核心功能。本文手把手教你什么是 Skills、如何安装、如何创建自定义 Skill，涵盖 Claude.ai、Claude Code 和 API 三大平台。

## 什么是 Claude Skills？

你有没有这样的经历：每次开一个新的 Claude 对话，都要重新交代你的工作流程、写作风格、专业术语、质量标准？第一轮对话基本都在"重新建立上下文"。

**Claude Skills 就是为了解决这个问题。**

Skill 是一个文件夹，里面装着你预先写好的指令。Claude 会在需要时**自动加载**这些指令，不需要你每次手动粘贴。你可以把它理解为：

> **Skill = 给 Claude 的"岗位说明书 + 操作手册"**

打个比方：MCP（Model Context Protocol）给 Claude 提供了"厨房"——让它能连接各种工具和数据。而 Skills 提供的是"菜谱"——告诉它怎么用这些工具做出一道好菜。

### Skills 的三大特点

| 特点 | 说明 |
|------|------|
| **渐进式加载** | 默认只加载约 100 token 的元数据，需要时才加载完整指令，不会浪费上下文 |
| **可组合** | 多个 Skill 可以同时启用，互相协作 |
| **跨平台通用** | 同一个 Skill 在 Claude.ai、Claude Code、API 中都能用 |

### Skills 已有的预置能力

Anthropic 官方提供了多款预置 Skills：
- 📄 **文档处理**：Word（docx）、PDF、PPT、Excel 的创建与编辑
- 🎨 **前端设计**：生成符合设计规范的 UI 代码
- 📝 **写作辅助**：博客写作、邮件起草
- 🔌 **API 开发**：Claude API 参考文档与最佳实践

---

## 目录

1. [三种安装方式总览](#1)
2. [方式一：在 Claude.ai 网页版安装](#2)
3. [方式二：在 Claude Code 中安装](#3)
4. [方式三：通过 npx 命令行安装](#4)
5. [如何创建自己的自定义 Skill](#5)
6. [Skill 文件结构详解](#6)
7. [Skill 编写最佳实践](#7)
8. [常见问题](#8)

---

<a id="1"></a>
## 一、三种安装方式总览

| 方式 | 平台 | 适合人群 | 难度 |
|------|------|----------|------|
| **网页上传** | Claude.ai | 非技术用户 | ⭐ 最简单 |
| **文件夹安装** | Claude Code（CLI） | 开发者 | ⭐⭐ |
| **npx 命令安装** | 命令行 | 开发者 | ⭐⭐ |
| **组织级分发** | 企业版 | 团队管理员 | ⭐⭐⭐ |

下面分别详细介绍。

---

<a id="2"></a>
## 二、方式一：在 Claude.ai 网页版安装

这是最简单的方式，不需要任何命令行操作。

### 安装步骤

1. **下载或准备好 Skill 文件夹**
   - 从 [github.com/anthropics/skills](https://github.com/anthropics/skills) 下载官方 Skill
   - 或使用你自己创建的 Skill 文件夹

2. **打包成 ZIP**
   ```bash
   # 把 Skill 文件夹打包成 zip
   zip -r my-skill.zip my-skill/
   ```

3. **在 Claude.ai 中上传**
   - 打开 [claude.ai](https://claude.ai)
   - 进入 **Settings（设置）** → **Capabilities（能力）** → **Skills**
   - 点击 **Upload**，选择刚才的 zip 文件
   - 上传完成后，Skill 会出现在列表中

4. **测试**
   - 在对话中提出与 Skill 相关的任务
   - Claude 会自动检测并加载对应的 Skill
   - 例如：安装了 blog-content-writer Skill 后，直接说"帮我写一篇关于远程办公的博客文章"

### 管理已安装的 Skill

在 Settings → Capabilities → Skills 页面可以：
- **启用/禁用**：用开关控制是否加载
- **删除**：移除不需要的 Skill
- **更新**：删除旧的，上传新版本

---

<a id="3"></a>
## 三、方式二：在 Claude Code 中安装

Claude Code 是 Anthropic 的命令行 AI 编程工具，安装 Skill 有两种位置：

### 全局安装（所有项目可用）

```bash
# 创建全局 skills 目录
mkdir -p ~/.claude/skills

# 把 Skill 文件夹复制过去
cp -r my-skill/ ~/.claude/skills/

# 确认安装成功
ls ~/.claude/skills/
```

### 项目级安装（仅当前项目可用）

```bash
# 在项目根目录创建 skills 文件夹
mkdir -p .claude/skills

# 复制 Skill
cp -r my-skill/ .claude/skills/
```

> **区别**：全局安装的 Skill 在所有项目中都可用，项目级安装的 Skill 只在该项目中生效。推荐把通用 Skill 放全局，项目特定的放项目级。

### 通过插件市场安装

Claude Code 还支持插件市场方式：

```bash
# 添加市场
/plugin marketplace add anthropics/skills

# 安装指定 Skill
/plugin install claude-api@anthropic-agent-skills
```

---

<a id="4"></a>
## 四、方式三：通过 npx 命令行安装

Anthropic 官方提供了一个快捷安装工具：

```bash
# 安装指定的官方 Skill
npx skills add --skill claude-api
```

### 使用 Vercel add-skill 工具（第三方）

社区工具 `add-skill` 可以一键安装到多个 Agent 平台：

```bash
npx add-skill [repo-name]
```

这个工具会自动检测你的环境（Claude Code、其他 AI 编程工具等），并把 Skill 安装到正确的位置。

---

<a id="5"></a>
## 五、如何创建自己的自定义 Skill

安装别人的 Skill 只是开始。Skill 真正强大的地方在于：**你可以创建完全属于自己的 Skill**，把你的专业知识和工作流程固化下来。

### Step 1：确定使用场景（最重要）

在写任何文件之前，先回答四个问题：

1. **用户想完成什么？**（如：写一篇符合公司风格的博客）
2. **需要哪些步骤？**（读风格指南 → 确认主题 → 起草 → 质量检查）
3. **需要什么工具？**（Claude 内置能力 / MCP 连接的工具）
4. **哪些知识/规范需要固化？**（写作风格、格式要求、质量标准）

### Step 2：创建文件结构

一个标准的 Skill 就是一个文件夹：

```
blog-content-writer/
├── SKILL.md              ← 必须有，核心指令文件
├── references/           ← 可选，参考文档
│   └── style-guide.md    ← 公司写作风格指南
├── templates/            ← 可选，模板文件
│   └── blog-template.md  ← 博客模板
└── scripts/              ← 可选，可执行脚本
    └── validate.py       ← 质量检查脚本
```

### Step 3：编写 SKILL.md

这是 Skill 的核心文件。格式为 YAML frontmatter + Markdown 正文：

```markdown
---
name: blog-content-writer
description: 按照公司风格指南撰写博客文章。当用户说"写博客"、"写文章"、"按我们的风格写内容"时触发。
version: 1.0.0
---

# 博客内容写作助手

## 使用说明

当用户要求撰写博客文章时，按照以下步骤操作：

### 步骤 1：读取风格指南
打开 `references/style-guide.md`，了解公司的写作风格和格式要求。

### 步骤 2：确认主题和受众
向用户确认：
- 文章主题是什么？
- 目标读者是谁？
- 有没有特别想强调的点？

### 步骤 3：撰写初稿
- 遵循风格指南中的标题层级和语调
- 每段不超过 4 句话
- 关键数据必须标注来源

### 步骤 4：质量检查
在交付前确认：
- [ ] 是否符合风格指南
- [ ] 是否有未标注来源的数据
- [ ] 段落长度是否合适
- [ ] 是否有错别字
```

### Step 4：安装和测试

按照前面介绍的方式安装，然后在对话中测试触发效果。

---

<a id="6"></a>
## 六、Skill 文件结构详解

### SKILL.md（必需）

这是 Skill 的核心。包含两部分：

**YAML Frontmatter（始终加载，约 100 token）**
```yaml
---
name: skill-name          # 小写字母+连字符
description: 一句话描述。触发条件要写在 description 的前半段。
---
```

> **关键**：`description` 是 Claude 判断是否加载这个 Skill 的依据。把**触发条件**写在 description 前面，这样 Claude 在只看到元数据时就能判断是否需要加载。

**Markdown 正文（按需加载）**

包含完整的指令、步骤、示例、排错指南。

### references/ 目录（可选）

存放 Claude 按需加载的参考文档：

- API 参考手册
- 详细的风格规范
- 扩展的排错指南

Claude 不会一开始就加载这些文件，而是在任务需要时才读取——这就是"渐进式加载"，避免上下文被无关内容撑爆。

### templates/ 目录（可选）

存放模板文件，如代码模板、文档模板。

### scripts/ 目录（可选）

存放可执行脚本，Claude 可以调用这些脚本完成任务。

---

<a id="7"></a>
## 七、Skill 编写最佳实践

根据 Anthropic 官方指南，以下是经过验证的最佳实践：

### ✅ 应该做的

1. **先定义场景，再写文件**
   不要上来就建文件夹。先想清楚这个 Skill 要解决什么问题。

2. **用步骤而非描述**
   ```
   ❌ "你应该写出好的博客文章"
   ✅ "步骤 1：读取风格指南。步骤 2：确认主题..."
   ```

3. **把触发条件写在 description 前面**
   Claude 默认只看到 frontmatter，触发词要在前面才能被检测到。

4. **利用渐进式加载**
   核心指令放 SKILL.md，大段参考资料放 references/。

5. **给出具体的成功标准**
   - 量化标准：至少 90% 的相关请求能触发 Skill
   - 质性标准：用户不需要中途纠正 Claude

### ❌ 不应该做的

1. **不要假设 Skill 是唯一能力**
   Claude 可能同时加载多个 Skill，你的 Skill 要能和其他 Skill 协作。

2. **不要把所有内容塞进 SKILL.md**
   超过 500 行的 SKILL.md 效果会下降。把详细参考移到 references/。

3. **不要写含糊的指令**
   ```
   ❌ "生成高质量内容"
   ✅ "每段 3-4 句话，关键数据标注来源，使用 H2/H3 标题"
   ```

---

<a id="8"></a>
## 八、常见问题

### Q1：Skills 是免费的吗？

是的。Skills 是开源的指令文件，免费使用。官方 Skills 仓库在 [github.com/anthropics/skills](https://github.com/anthropics/skills)，任何人都可以查看和使用。截至 2026 年中，该仓库已有超过 14 万 Star。

### Q2：我需要付费版 Claude 才能用 Skills 吗？

Skills 功能本身不需要额外付费，但需要 Claude 账号。在 Claude Code（CLI）中使用需要 Claude Code 订阅。通过 API 使用 Skills 需要 API 密钥和 beta header：`skills-2025-10-02`。

### Q3：安装多少个 Skill 合适？

没有硬性限制。由于渐进式加载机制，默认只加载每个 Skill 的 frontmatter（约 100 token），安装很多 Skill 也不会显著消耗上下文。但建议只安装你真正需要的，避免混乱。

### Q4：Skill 和 MCP 有什么区别？

| | MCP | Skills |
|---|---|---|
| **提供什么** | 连接外部工具和数据（"能做什么"） | 提供方法论和步骤指导（"怎么做好"） |
| **类比** | 厨房设备和食材 | 菜谱和烹饪步骤 |
| **关系** | 互补，配合使用效果最好 |

### Q5：Skill 触发不了怎么办？

- 检查 `description` 是否清晰描述了触发条件
- 确保触发词出现在 description 的前半段
- 尝试在对话中更明确地表达任务意图
- 检查 Skill 是否已启用

### Q6：如何通过 API 使用 Skills？

通过 Claude API 使用 Skills 需要：
1. 在请求中启用代码执行工具
2. 在 `container` 参数中指定 `skill_id`
3. 添加 beta header：`skills-2025-10-02`

---

## 总结

Claude Skills 的本质很简单：**一个文件夹 + 一个 SKILL.md**。但它解决的问题很实在——让你不再每次对话都从零开始。

**核心要点回顾：**

| 要点 | 说明 |
|------|------|
| **安装方式** | 网页上传 ZIP / Claude Code 文件夹 / npx 命令 |
| **文件结构** | SKILL.md（必需）+ references/ + templates/ + scripts/ |
| **加载机制** | 渐进式加载，默认只占 100 token |
| **自定义要点** | 先定场景再写文件，触发词放 description 前面 |

**现在就去试试**：从 [github.com/anthropics/skills](https://github.com/anthropics/skills) 下载一个官方 Skill，按本文方法安装，然后在 Claude 中说一句相关的任务，看看它如何自动工作。

---

*最后更新：2026 年 8 月 | 本文基于 Claude Skills 2025 年 10 月发布版及后续更新编写。*
