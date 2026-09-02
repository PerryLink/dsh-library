<div align="center">

# 📚 dsh-library
- **1024 store channel**: `npm i -g dsh1024` once, then `dsh1024 plugin --profile web add dsh-library` (counts toward the [deepseek1024.com](https://deepseek1024.com) install ranking).
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-library)

**Local document knowledge base for DeepSeek Harness.**

*Import, retrieve, verify — hybrid search with citations your agent can check.*

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

## Compatibility

| Surface | Status |
|---|---|
| Harness | DeepSeek Harness `0.1.2-alpha.5` (compat declared for `0.1.2-alpha.5`) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Storage | Any storage-domain backend (JSON or SQLite); the index lives in the host's storage domain |
| Models | None required — the built-in embedder is deterministic hashing (zero downloads) |

## What you get

`dsh-library` turns local md/txt documents into a queryable knowledge base with a quality pipeline your agent can trust:

- **`library_add` / `library_remove` / `library_list`** — import a document by path (chunked and embedded), remove one with **purge verification** (signatures of the removed content are probed against the remaining index and any residue is reported), and list document metadata.
- **`library_search`** — hybrid semantic + keyword ranking, maximal-marginal-relevance diversity re-rank, relevance filtering, and **lost-in-the-middle avoidance** (strongest chunks pinned to head and tail). With `inject: true` the result page is injected into the calling agent; every hit carries a `[n]` source marker and the injection is reconstructable from the `library/inject` session event (host-gated; see Permissions & data).
- **`library_cite_check`** — verify the `[n]` citations in an answer against the search result page with a fuzzy token match AND a semantic similarity check.
- **`library_diagnose`** — chunk-size histogram, near-duplicate chunk pairs, a self-retrieval probe, and the middle-penalty signal.
- **`/library`** — one-line index summaries per library.

```text
document ── library_add ─▶ chunk (sliding window) ─▶ embed (hash / external cmd)
                                  │
                        storage domain (documents / chunks / purges)
                                  │
query ── library_search ─▶ hybrid score ─▶ MMR re-rank ─▶ relevance filter
                                  │                    ─▶ lost-in-middle order
                                  ▼
                    result page with [n] markers ── inject: true ─▶ agent + library/inject event (host-gated)
```

## Quick start

```sh
# 1. install the bundle into your profile
dsh plugin --profile web add "github:PerryLink/dsh-library#main"

# or from npm (published releases)
dsh plugin --profile web add dsh-library

# 2. restart and verify the row
dsh --profile web --dump-config | grep -A2 'id: dsh-library'
```

Then ask the agent to import and use a document:

```
> Add ./docs/spec.md to library docs, then answer: what does the spec say about retries? Cite [n] markers.
```

## Install & uninstall

- **git channel** (latest `main`): `dsh plugin --profile web add "github:PerryLink/dsh-library#main"` — the `prepare` script builds with production dependencies only.
- **npm channel** (published releases): `dsh plugin --profile web add dsh-library`.
- **tarball channel**: `pnpm pack` in this repo, then `dsh plugin --profile web add ./dsh-library-<version>.tgz`.
- **uninstall**: `dsh plugin --profile web remove dsh-library` (or remove the row from the profile patch).

> If pnpm reports `ERR_PNPM_IGNORED_BUILDS` for this package (esbuild's harmless platform-binary validation), add `allowBuilds: { esbuild: true }` to your `pnpm-workspace.yaml` — the `dsh` CLI prints the exact snippet.

## Configuration

All tunables are Schemastery `Config` fields (changeable from cordis.yml). An id-targeted override replaces the whole row — restate every key you need. `cordis.patch.yml` documents each key inline.

| Key | Default | Meaning |
|---|---|---|
| `chunkSize` | `900` | Sliding-window chunk size in characters (≤ 4000) |
| `chunkOverlap` | `120` | Overlap between consecutive windows; must be smaller than `chunkSize` |
| `maxFileBytes` | `5242880` | Files larger than this are rejected on `library_add` |
| `embedding.dims` | `256` | Hash-embedding dimensionality (≥ 8) |
| `embedding.provider` | `hash` | Embedder backend: `hash` (built-in, zero downloads), `command` (external subprocess, requires `embedding.command`), or `ollama` (local Ollama, probed and degraded to `hash` when unreachable) |
| `embedding.command` | `''` | Optional external embedder command (space-separated argv, no shell) over `ctx.subprocess`; setting it selects the `command` provider |
| `embedding.ollamaUrl` / `ollamaModel` | `http://127.0.0.1:11434` / `nomic-embed-text` | Local Ollama endpoint + model for the `ollama` provider (zero cloud) |
| `embedding.timeoutMs` / `graceMs` / `maxOutputBytes` / `maxBatchItems` | `30000` / `1000` / `1048576` / `64` | Embedder subprocess budget |
| `search.topK` | `8` | Results returned after the full pipeline |
| `search.hybridWeight` | `0.6` | 0 = keyword-only, 1 = semantic-only |
| `search.minRelevance` | `0.15` | Chunks below this relevance threshold are filtered out |
| `search.diversityLambda` | `0.5` | MMR trade-off: 1 = pure relevance, 0 = pure diversity |
| `search.lostMiddleHead` / `lostMiddleTail` | `1` / `1` | Strongest chunks pinned to head / tail |
| `search.maxResultChars` | `16000` | Character budget of the model-facing result page |
| `injection.enabled` / `maxChars` | `true` / `12000` | `library_search` inject behavior and budget |
| `citation.windowChars` / `minScore` / `minSemantic` | `150` / `40` / `0.1` | `library_cite_check` thresholds |
| `purge.signatureLength` / `maxProbes` | `4` / `24` | Purge verification signatures and probe budget |
| `diagnose.maxDuplicatePairs` / `sampleCap` / `positionBins` | `24` / `200` / `5` | `library_diagnose` budget caps |

## Tools & surfaces

| Tool | Notes |
|---|---|
| `library_add` | `{ path, library, name? }` → document id; file read through the harness filesystem service |
| `library_remove` | `{ library, documentId }` → removal summary + purge verdict (residue reported) |
| `library_list` | `{ library? }` → document metadata (never text) |
| `library_search` | `{ query, library, topK?, inject? }` → ranked hits with `[n]` markers; `inject: true` seeds the calling agent |
| `library_cite_check` | `{ library, query, answer }` → per-citation valid/invalid verdicts (fuzzy + semantic) |
| `library_diagnose` | `{ library }` → chunk stats, duplicates, self-retrieval, middle penalty |
| `/library [name]` | Command: per-library document/chunk summaries |

## Permissions & data

- **Permissions**: the plugin only reads files you point `library_add` at (through the harness filesystem service and its policy) and writes into its own `dsh_library` storage domain. No network requests; an optional external embedder runs through `ctx.subprocess` without shell interpretation.
- **Data**: chunk text and embeddings live in the host's storage backend (same trust as the deployment's other durable data); the plugin adds no encryption. Document paths and embeddings never enter the session log.
- **Session log**: `library/inject` (id, query, chunk ids, page size) and `library/purge` (verdict) are log-only audit events — the model-visible injected page is reconstructable from them. The append is host-gated: harnesses whose known-type set covers the vocabulary get the events, `ignorable`-envelope builds get them with the marker, and envelope-less builds (0.1.1-rc.2, 0.1.2-alpha.5) skip the append — the logged `tool/call` + `tool/result` events remain the reconstructable audit trail there.
0.1.2-alpha.5 (adapted 2026-09-02): the session envelope keeps its ignorable field for stored-log read compatibility only - Session.append still cannot stamp it, so audit-gate behavior is unchanged.

## Security boundaries

- **Local by default.** Zero model downloads, zero network calls — scoring is deterministic hashing and token math. Only an explicitly configured embedder command runs code, and its protocol is completeness-checked and output-capped.
- **No fabrication.** Citation checks report what the pipeline can verify; failed repairs and suspicious citations are surfaced honestly, never guessed.
- **Purge is verified.** `library_remove` probes the remaining index with deterministic signatures of the removed content and reports residue instead of assuming success.
- **Fail loud.** Invalid library names, oversized documents, unreadable files, and a configured-but-absent embedder seam all fail the call with a clear error.

## Known limitations

- **Lexical-grade embeddings.** The built-in hash embedder scores surface similarity, not meaning; retrieval quality on paraphrases is lower than a real embedding model — configure `embedding.command` (any subprocess embedder) or `embedding.provider: ollama` (a local Ollama embedding model) for stronger semantics.
- **Local citation model.** `library_cite_check` validates against the search result page (the `[n]` numbering), not against free-form source names; the fuzzy score is a bounded token-sequence partial ratio.
- **No ingestion pipeline.** Documents must be imported by path (`md`/`txt`); PDF/docx extraction is out of scope for v0.1.0.
- **Host-gated audit events.** `library/inject` / `library/purge` are only appended on harnesses that can carry them (see Permissions & data); on the published 0.1.1-rc.2 line they are not appended, and every fact stays reconstructable from the tool call/result log.

## Development

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests against the local harness checkout
pnpm run typecheck:ci  # tsc against the published 0.1.2-alpha.5 types (no paths)
pnpm test           # vitest: quality ports, core vocabulary, real-stack assembly
pnpm run build      # tsdown bundle + tsc declarations (lib/)
pnpm run verify:self-contained  # dependency specs resolve from the registry
pnpm run verify:artifacts       # built ESM face + bundle patch present
pnpm pack           # the published tarball
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `rag`, `knowledge-base`, `retrieval`, `embedding`, `vector-search`, `citation-validation`, `document-library`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — creator and maintainer: the eight quality ports, storage-domain index, hybrid retrieval pipeline, citation/purge verification, and the five-language docs.

## PerryLink DSH Plugin Family

This project is one of the [33 DeepSeek Harness plugins](https://github.com/PerryLink) maintained by [PerryLink](https://github.com/PerryLink). If this one helps you, the others likely will too:

| Plugin | One-liner |
|---|---|
| **[dsh-dsh-auto-review](https://github.com/PerryLink/dsh-dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default | |
| **[dsh-dsh-background-agents](https://github.com/PerryLink/dsh-dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | |
| **[dsh-dsh-budget](https://github.com/PerryLink/dsh-dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | |
| **[dsh-dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore | |
| **[dsh-dsh-claude-move](https://github.com/PerryLink/dsh-dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | |
| **[dsh-dsh-click](https://github.com/PerryLink/dsh-dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. | |
| **[dsh-dsh-composer-history](https://github.com/PerryLink/dsh-dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search | |
| **[dsh-dsh-data-quality](https://github.com/PerryLink/dsh-dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) | |
| **[dsh-dsh-defend](https://github.com/PerryLink/dsh-dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | |
| **[dsh-dsh-doublecheck](https://github.com/PerryLink/dsh-dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review | |
| **[dsh-dsh-draw](https://github.com/PerryLink/dsh-dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | |
| **[dsh-dsh-fast](https://github.com/PerryLink/dsh-dsh-fast)** | Read-only performance diagnostics for DeepSeek Harness. | |
| **[dsh-dsh-fund-research](https://github.com/PerryLink/dsh-dsh-fund-research)** | Deterministic research reports for Chinese public mutual funds | |
| **[dsh-dsh-github](https://github.com/PerryLink/dsh-dsh-github)** | GitHub PR/issues integration for DSH, every write gated by approval | |
| **[dsh-dsh-industry-research](https://github.com/PerryLink/dsh-dsh-industry-research)** | Industry research orchestration that seals its deliverables through this plugin's `ctx.researchReport.assemble` | |
| **[dsh-dsh-local-ai](https://github.com/PerryLink/dsh-dsh-local-ai)** | Local-model (Ollama) integration for DeepSeek Harness. | |
| **[dsh-dsh-lsp-actions](https://github.com/PerryLink/dsh-dsh-lsp-actions)** | LSP diagnostics, formatting, completion, code actions and rename over language servers | |
| **[dsh-dsh-mask](https://github.com/PerryLink/dsh-dsh-mask)** | PII masking middleware: anonymize at the model boundary, restore at the display layer | |
| **[dsh-dsh-mcp-panel](https://github.com/PerryLink/dsh-dsh-mcp-panel)** | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors | |
| **[dsh-dsh-memento](https://github.com/PerryLink/dsh-dsh-memento)** | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool | |
| **[dsh-dsh-observe](https://github.com/PerryLink/dsh-dsh-observe)** | OpenTelemetry and Langfuse observability exporter for DeepSeek Harness. | |
| **[dsh-dsh-output-styles](https://github.com/PerryLink/dsh-dsh-output-styles)** | Claude Code outputStyles-equivalent runtime style switching | |
| **[dsh-dsh-permission-rules](https://github.com/PerryLink/dsh-dsh-permission-rules)** | Claude Code-style declarative allow/deny/ask permission rules with audit | |
| **[dsh-dsh-plugin-guide](https://github.com/PerryLink/dsh-dsh-plugin-guide)** | Plugin-development knowledge base as an on-demand agent skill | |
| **[dsh-dsh-research-report](https://github.com/PerryLink/dsh-dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions | |
| **[dsh-dsh-score](https://github.com/PerryLink/dsh-dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. | |
| **[dsh-dsh-session-pin](https://github.com/PerryLink/dsh-dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | |
| **[dsh-dsh-session-sync](https://github.com/PerryLink/dsh-dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. | |
| **[dsh-dsh-skill-pack-security](https://github.com/PerryLink/dsh-dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review | |
| **[dsh-dsh-talk](https://github.com/PerryLink/dsh-dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. | |
| **[dsh-dsh-test-drive](https://github.com/PerryLink/dsh-dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. | |
| **[dsh-dsh-translate](https://github.com/PerryLink/dsh-dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. | |

## License

[Apache License 2.0](LICENSE) © 2026 dsh-library contributors
