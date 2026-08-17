<div align="center">

# 📚 dsh-library

**DeepSeek Harness 的本地文档知识库。**

*导入、检索、核验 —— 带引用标记的混合检索，agent 可以自证引用。*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh-plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-library/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-library/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-library?label=version)](https://github.com/PerryLink/dsh-library/releases)
[![npm version](https://img.shields.io/npm/v/dsh-library)](https://www.npmjs.com/package/dsh-library)
[![npm downloads](https://img.shields.io/npm/dm/dsh-library)](https://www.npmjs.com/package/dsh-library)

[English](README.md) · [简体中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [हिन्दी](README.hi.md)

</div>

---

## 兼容性

| 方面 | 状态 |
|---|---|
| Harness | DeepSeek Harness `0.1.0-rc.6`（声明兼容 `0.1.0-rc.5`–`0.1.0-rc.6`） |
| Node | `^22.19.0 \|\| >=24.0.0` |
| 存储 | 任意 storage-domain 后端（JSON 或 SQLite）；索引存放在宿主的存储域中 |
| 模型 | 无需任何模型 —— 内置嵌入为确定性哈希（零下载） |

## 你能得到什么

`dsh-library` 把本地 md/txt 文档变成可查询的知识库，并带一套 agent 可信任的质量管线：

- **`library_add` / `library_remove` / `library_list`** —— 按路径导入文档（分块 + 嵌入）、删除文档并做**清除验证**（用被删内容的签名探测剩余索引，残留即报告）、列出文档元数据。
- **`library_search`** —— 语义 + 关键词混合排序、最大边际相关多样性重排、相关性过滤与**中段丢失规避**（最强切片钉在首尾）。`inject: true` 时结果页注入调用 agent；每条命中带 `[n]` 来源标记，注入可从 `library/inject` 会话事件重建。
- **`library_cite_check`** —— 用模糊词面匹配 + 语义相似度双重校验答案中的 `[n]` 引用。
- **`library_diagnose`** —— 切片大小直方图、近似重复切片对、自检索探针与中段惩罚信号。
- **`/library`** —— 每个知识库一行索引摘要。

```text
文档 ── library_add ─▶ 切片（滑窗） ─▶ 嵌入（哈希 / 外部命令）
                              │
                  存储域（documents / chunks / purges）
                              │
查询 ── library_search ─▶ 混合打分 ─▶ MMR 重排 ─▶ 相关性过滤
                              │                ─▶ 中段规避排序
                              ▼
                带 [n] 标记的结果页 ── inject: true ─▶ agent + library/inject 事件
```

## 快速开始

```sh
# 1. 把 bundle 装进你的 profile
dsh plugin --profile web add "github:PerryLink/dsh-library#main"

# 或从 npm 安装（正式发布版）
dsh plugin --profile web add dsh-library

# 2. 重启并核实行
dsh --profile web --dump-config | grep -A2 'id: dsh-library'
```

然后让 agent 导入并使用文档：

```
> 把 ./docs/spec.md 加入 docs 知识库，然后回答：规范里关于重试是怎么说的？用 [n] 标记引用。
```

## 安装与卸载

- **git 通道**（最新 `main`）：`dsh plugin --profile web add "github:PerryLink/dsh-library#main"` —— `prepare` 脚本仅用生产依赖构建。
- **npm 通道**（正式发布版）：`dsh plugin --profile web add dsh-library`。
- **tarball 通道**：在本仓库执行 `pnpm pack`，然后 `dsh plugin --profile web add ./dsh-library-<version>.tgz`。
- **卸载**：`dsh plugin --profile web remove dsh-library`（或从 profile patch 中删除该行）。

> 如果 pnpm 对本包报 `ERR_PNPM_IGNORED_BUILDS`（esbuild 的平台二进制无害校验），在你的 `pnpm-workspace.yaml` 中加入 `allowBuilds: { esbuild: true }` —— `dsh` CLI 会打印确切片段。

## 配置

所有可调项都是 Schemastery `Config` 字段（可在 cordis.yml 中修改）。按 id 定向覆盖会替换整行 —— 需要重新声明每个键。`cordis.patch.yml` 内联说明了每个键。

| 键 | 默认值 | 含义 |
|---|---|---|
| `chunkSize` | `900` | 滑窗切片大小（字符，≤ 4000） |
| `chunkOverlap` | `120` | 相邻窗口重叠；必须小于 `chunkSize` |
| `maxFileBytes` | `5242880` | 超过该大小的文件在 `library_add` 被拒绝 |
| `embedding.dims` | `256` | 哈希嵌入维度（≥ 8） |
| `embedding.command` | `''` | 可选外部嵌入命令（空格分隔 argv、无 shell）走 `ctx.subprocess`；`''` = 内置哈希嵌入 |
| `embedding.timeoutMs` / `graceMs` / `maxOutputBytes` / `maxBatchItems` | `30000` / `1000` / `1048576` / `64` | 嵌入子进程预算 |
| `search.topK` | `8` | 完整管线后返回的结果数 |
| `search.hybridWeight` | `0.6` | 0 = 仅关键词，1 = 仅语义 |
| `search.minRelevance` | `0.15` | 低于该相关性阈值的切片被过滤 |
| `search.diversityLambda` | `0.5` | MMR 权衡：1 = 纯相关，0 = 纯多样 |
| `search.lostMiddleHead` / `lostMiddleTail` | `1` / `1` | 最强切片钉在首 / 尾 |
| `search.maxResultChars` | `16000` | 模型可见结果页字符预算 |
| `injection.enabled` / `maxChars` | `true` / `12000` | `library_search` 注入行为与预算 |
| `citation.windowChars` / `minScore` / `minSemantic` | `150` / `40` / `0.1` | `library_cite_check` 阈值 |
| `purge.signatureLength` / `maxProbes` | `4` / `24` | 清除验证签名与探测预算 |
| `diagnose.maxDuplicatePairs` / `sampleCap` / `positionBins` | `24` / `200` / `5` | `library_diagnose` 预算上限 |

## 工具与界面

| 工具 | 说明 |
|---|---|
| `library_add` | `{ path, library, name? }` → 文档 id；文件经 harness 文件系统服务读取 |
| `library_remove` | `{ library, documentId }` → 删除摘要 + 清除判定（残留即报告） |
| `library_list` | `{ library? }` → 文档元数据（绝不含正文） |
| `library_search` | `{ query, library, topK?, inject? }` → 带 `[n]` 标记的排序命中；`inject: true` 注入调用 agent |
| `library_cite_check` | `{ library, query, answer }` → 逐条引用有效/无效判定（模糊 + 语义） |
| `library_diagnose` | `{ library }` → 切片统计、重复、自检索、中段惩罚 |
| `/library [name]` | 命令：每个知识库的文档/切片摘要 |

## 权限与数据

- **权限**：插件只读取你让 `library_add` 指向的文件（经 harness 文件系统服务及其策略），并只写入自己的 `dsh_library` 存储域。无网络请求；可选外部嵌入命令经 `ctx.subprocess` 执行、无 shell 解释。
- **数据**：切片文本与嵌入存放在宿主的存储后端（与部署的其他持久数据同级信任）；插件不额外加密。文档路径与嵌入向量绝不进入会话日志。
- **会话日志**：`library/inject`（id、查询、切片 id、页大小）与 `library/purge`（判定）是仅日志审计事件 —— 模型可见的注入页可从中重建。

## 安全边界

- **默认本地。** 零模型下载、零网络调用 —— 打分是确定性哈希与词法数学。只有显式配置的嵌入命令会执行代码，且其协议做完整性检查与输出上限。
- **不伪造。** 引用检查只报告管线能验证的结论；可疑引用如实呈现，绝不猜测。
- **清除即验证。** `library_remove` 用被删内容的确定性签名探测剩余索引并报告残留，而不是假定成功。
- **失败大声。** 非法知识库名、超大文档、不可读文件、配置了却缺失的嵌入接缝，都以明确错误失败。

## 已知限制

- **词法级嵌入。** 内置哈希嵌入打分的是表面相似而非语义；对改写表达的检索质量低于真实嵌入模型 —— 配置 `embedding.command` 可获得更强语义。
- **本地引用模型。** `library_cite_check` 针对搜索结果页（`[n]` 编号）验证，不支持自由形式的来源名；模糊分数是有界的词序列部分匹配率。
- **无摄取管线。** 文档须按路径导入（`md`/`txt`）；PDF/docx 抽取不在 v0.1.0 范围。

## 开发

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc：src + tests 对照本地 harness checkout
pnpm run typecheck:ci  # tsc：对照已发布的 0.1.0-rc.6 类型（无 paths）
pnpm test           # vitest：八移植回归、核心词汇、真实栈装配
pnpm run build      # tsdown bundle + tsc 声明（lib/）
pnpm run verify:self-contained  # 依赖声明全部来自 registry
pnpm run verify:artifacts       # 构建产物 ESM 面 + bundle patch 齐全
pnpm pack           # 发布用 tarball
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `rag`, `knowledge-base`, `retrieval`, `embedding`, `vector-search`, `citation-validation`, `document-library`

## Contributors

- [@PerryLink](https://github.com/PerryLink) —— 创建者与维护者：八项质量移植、存储域索引、混合检索管线、引用/清除验证与五语文档。

## PerryLink DSH Plugin Family

本项目是由 [PerryLink](https://github.com/PerryLink) 维护的 [29 个 DeepSeek Harness 插件](https://github.com/PerryLink)之一。如果这个对你有用，其他插件很可能也会：

| Plugin | One-liner |
|---|---|
| [dsh-auto-review](https://github.com/PerryLink/dsh-auto-review) | 审批链上的第二模型自动审查，默认失败关闭 |
| [dsh-background-agents](https://github.com/PerryLink/dsh-background-agents) | 持久化后台子代理，带 Web UI 侧边栏、消息与打断 |
| [dsh-budget](https://github.com/PerryLink/dsh-budget) | DeepSeek Harness 的成本治理：预算、碳排与延迟一屏呈现。 |
| [dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind) | Claude Code /rewind 等价物：快照、会话分叉、一次性恢复 |
| [dsh-claude-move](https://github.com/PerryLink/dsh-claude-move) | 将 Claude Code 会话、记忆、技能与 CLAUDE.md 迁入 DSH |
| [dsh-click](https://github.com/PerryLink/dsh-click) | 跨平台原生桌面控制（DeepSeek Harness），Windows 优先。 |
| [dsh-composer-history](https://github.com/PerryLink/dsh-composer-history) | Web 输入框的终端式输入历史：方向键、Ctrl+R 搜索 |
| [dsh-defend](https://github.com/PerryLink/dsh-defend) | DeepSeek Harness 的提示注入、越狱与密钥泄露防护。 |
| [dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck) | 工程纪律门禁：需求质询、测试门禁、对抗式审查 |
| [dsh-draw](https://github.com/PerryLink/dsh-draw) | DeepSeek Harness 的统一静态图像生成路由。 |
| [dsh-fast](https://github.com/PerryLink/dsh-fast) | DeepSeek Harness 的只读性能诊断。 |
| [dsh-github](https://github.com/PerryLink/dsh-github) | DSH 的 GitHub PR/issue 集成，每次写入都经审批门 |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | DeepSeek Harness 的本地文档知识库。 |
| [dsh-local-ai](https://github.com/PerryLink/dsh-local-ai) | DeepSeek Harness 的本地模型（Ollama）接入。 |
| [dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions) | 经语言服务器的 LSP 诊断、格式化、补全、代码操作与重命名 |
| [dsh-mask](https://github.com/PerryLink/dsh-mask) | DeepSeek Harness 的 PII 脱敏中间件——数据到模型前匿名化，展示层还原。 |
| [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) | 只读 MCP 运行时面板：/mcp 命令 + 带状态、工具与错误的设置页 |
| [dsh-memento](https://github.com/PerryLink/dsh-memento) | 带审批门的跨会话记忆：ctx.memory 接缝 + SQLite + memory 工具 |
| [dsh-observe](https://github.com/PerryLink/dsh-observe) | DeepSeek Harness 的 OpenTelemetry 与 Langfuse 可观测导出器。 |
| [dsh-output-styles](https://github.com/PerryLink/dsh-output-styles) | Claude Code outputStyles 等价的运行时样式切换 |
| [dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules) | Claude Code 风格声明式 allow/deny/ask 权限规则，带审计 |
| [dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide) | 按需 agent 技能形式的插件开发知识库 |
| [dsh-score](https://github.com/PerryLink/dsh-score) | DeepSeek Harness 插件的多指标质量评分。 |
| [dsh-session-pin](https://github.com/PerryLink/dsh-session-pin) | 在 Web 侧边栏置顶会话，顺序持久化 |
| [dsh-session-sync](https://github.com/PerryLink/dsh-session-sync) | DeepSeek Harness 的跨设备会话同步——会话存储的专用 git 镜像。 |
| [dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security) | 安全审计技能包：密钥扫描、依赖与供应链审查 |
| [dsh-talk](https://github.com/PerryLink/dsh-talk) | DeepSeek Harness 的语音优先会话闭环：对它说，听它答。 |
| [dsh-test-drive](https://github.com/PerryLink/dsh-test-drive) | DeepSeek Harness 插件的隔离式安装冒烟实测。 |
| [dsh-translate](https://github.com/PerryLink/dsh-translate) | DeepSeek Harness 的厂商参数翻译与确定性 JSON 修复。 |

## License

[Apache License 2.0](LICENSE) © 2026 dsh-library contributors
