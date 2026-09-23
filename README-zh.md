<div align="center">

# 📚 dsh-library
- **1024 商店渠道**：先 `npm i -g dsh1024`，再 `dsh1024 plugin --profile web add dsh-library`（计入 [deepseek1024.com](https://deepseek1024.com) 安装排行）。

**DeepSeek Harness 的本地文档知识库。**

*导入、检索、核验 —— 带引用标记的混合检索，agent 可以自证引用。*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-library)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![dsh-doctor](https://raw.githubusercontent.com/PerryLink/dsh-plugin-doctor/main/badges/PerryLink__dsh-library.svg)](https://github.com/PerryLink/dsh-plugin-doctor#verified-徽章)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-zh.svg)](https://dsh.market/)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-library/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-library/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-library?label=version)](https://github.com/PerryLink/dsh-library/releases)
[![npm version](https://img.shields.io/npm/v/dsh-library)](https://www.npmjs.com/package/dsh-library)
[![npm downloads](https://img.shields.io/npm/dm/dsh-library)](https://www.npmjs.com/package/dsh-library)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-library?metric=downloads&lang=zh)](https://dshfind.com/zh/plugins/PerryLink/dsh-library?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

</div>

---

## 兼容性

| 方面 | 状态 |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.1.7-alpha.2`（2026-09-18 核验：双 typecheck 尺子 + 89 项测试 + self-contained/artifacts 门；peer 三段式 `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0 \|\| >=0.1.7-0 <0.2.0`）。全族唯一已实跑 alpha.2 宿主冒烟的仓（2026-09-11）。 |
| Node | `^22.19.0 \|\| >=24.0.0` |
| 存储 | 任意 storage-domain 后端（JSON 或 SQLite）；索引存放在宿主的存储域中 |
| 模型 | 无需任何模型 —— 内置嵌入为确定性哈希（零下载） |

## 你能得到什么

`dsh-library` 把本地 md/txt 文档变成可查询的知识库，并带一套 agent 可信任的质量管线：

- **`library_add` / `library_remove` / `library_list`** —— 按路径导入文档（分块 + 嵌入）、删除文档并做**清除验证**（用被删内容的签名探测剩余索引，残留即报告）、列出文档元数据。
- **`library_search`** —— 语义 + 关键词混合排序、最大边际相关多样性重排、相关性过滤与**中段丢失规避**（最强切片钉在首尾）。`inject: true` 时结果页注入调用 agent；每条命中带 `[n]` 来源标记，注入可从 `library/inject` 会话事件重建（受宿主门控，见「权限与数据」）。
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
                带 [n] 标记的结果页 ── inject: true ─▶ agent + library/inject 事件（受宿主门控）
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
| `embedding.provider` | `hash` | 嵌入后端：`hash`（内置，零下载）、`command`（外部子进程，需 `embedding.command`）、`ollama`（本地 Ollama，探测不可用时降级回 `hash`） |
| `embedding.command` | `''` | 可选外部嵌入命令（空格分隔 argv、无 shell）走 `ctx.subprocess`；设置后即选择 `command` 后端 |
| `embedding.ollamaUrl` / `ollamaModel` | `http://127.0.0.1:11434` / `nomic-embed-text` | `ollama` 后端的本地 Ollama 端点与模型（零云端） |
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
- **会话日志**：`library/inject`（id、查询、切片 id、页大小）与 `library/purge`（判定）是仅日志审计事件 —— 模型可见的注入页可从中重建。写入受宿主门控：已知类型集合覆盖该词汇的宿主直接写入；带 `ignorable` 信封的构建加标记写入；无信封构建（0.1.1-rc.2、0.1.2-rc.1）跳过写入 —— 此时已记录的 `tool/call` + `tool/result` 事件仍是可重建的审计链。
0.1.2-rc.1（2026-09-02 已适配）：会话信封保留 ignorable 字段但仅用于存量日志读取兼容——Session.append 仍无法盖章，门控行为不变。

## 安全边界

- **默认本地。** 零模型下载、零网络调用 —— 打分是确定性哈希与词法数学。只有显式配置的嵌入命令会执行代码，且其协议做完整性检查与输出上限。
- **不伪造。** 引用检查只报告管线能验证的结论；可疑引用如实呈现，绝不猜测。
- **清除即验证。** `library_remove` 用被删内容的确定性签名探测剩余索引并报告残留，而不是假定成功。
- **失败大声。** 非法知识库名、超大文档、不可读文件、配置了却缺失的嵌入接缝，都以明确错误失败。

## 已知限制

- **词法级嵌入。** 内置哈希嵌入打分的是表面相似而非语义；对改写表达的检索质量低于真实嵌入模型 —— 配置 `embedding.command`（任意子进程嵌入）或 `embedding.provider: ollama`（本地 Ollama 嵌入模型）可获得更强语义。
- **本地引用模型。** `library_cite_check` 针对搜索结果页（`[n]` 编号）验证，不支持自由形式的来源名；模糊分数是有界的词序列部分匹配率。
- **无摄取管线。** 文档须按路径导入（`md`/`txt`）；PDF/docx 抽取不在 v0.1.0 范围。
- **宿主门控的审计事件。** `library/inject` / `library/purge` 只在能承载它们的宿主上写入（见「权限与数据」）；在已发布的 `0.1.2-rc.1` 线上（与更早的无信封线一样）不写入，所有事实仍可从工具调用/结果日志重建。

## 开发

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc：src + tests 对照本地 harness checkout
pnpm run typecheck:ci  # tsc：对照已发布的 0.1.7-alpha.2 类型（无 paths）
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

This project is one of the **45 DeepSeek Harness plugins** maintained by [PerryLink](https://github.com/PerryLink). If this one helps you, the others likely will too:

| Plugin | One-liner |
|---|---|
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default | |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command | |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | |
| **[dsh-catalog](https://github.com/PerryLink/dsh-catalog)** | DSH Desktop Market standard catalog source for the PerryLink family | |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence | |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore | |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. | |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search | |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) | |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review | |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Read-only performance diagnostics for DeepSeek Harness. | |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Deterministic research reports for Chinese public mutual funds | |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | GitHub PR/issues integration for DSH, every write gated by approval | |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Industry research orchestration that seals its deliverables through this plugin's `ctx.researchReport.assemble` | |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** | Laya typed decisions (`noul`/`choice`/`score`) as a first-class Cordis service and model-visible tools | |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Local document knowledge base for DeepSeek Harness. | |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Local-model (Ollama) integration for DeepSeek Harness. | |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | LSP diagnostics, formatting, completion, code actions and rename over language servers | |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | PII masking middleware: anonymize at the model boundary, restore at the display layer | |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors | |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool | |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | OpenTelemetry and Langfuse observability exporter for DeepSeek Harness. | |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Claude Code outputStyles-equivalent runtime style switching | |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Claude Code-style declarative allow/deny/ask permission rules with audit | |
| **[dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification)** | Community certification registry with repro-checkable grades and badges | |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | Zero-dependency static + sandbox smoke detector for DSH plugins | |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Plugin-development knowledge base as an on-demand agent skill | |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | Shared zero-runtime-dependency toolkit for the PerryLink DSH plugins | |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** | One-package, one-corridor-index plugin upgrade skill: routes a repository to the matching closed corridor card | |
| **[dsh-plugin-upgrade-015](https://github.com/PerryLink/dsh-plugin-upgrade-015)** | Merged `0.1.3-alpha.1` → `0.1.5-rc.1` upgrade corridor card plus a zero-dependency seam scanner | |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions | |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. | |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. | |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review | |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. | |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. | |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 task bridge: session-header panel + 11 tools | |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. | |


## License

[Apache License 2.0](LICENSE) © 2026 dsh-library contributors

### 从 DSH Desktop 市场安装

所有 PerryLink 插件均可在 DSH Desktop 内置市场中浏览：**市场 → 来源 → 添加来源 → 粘贴** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ 选中**。安装仍需通过市场的 npm 身份校验与你的确认。
