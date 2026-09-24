<div align="center">

# 📚 dsh-library
- **Canal 1024 store**: `npm i -g dsh1024` uma vez, depois `dsh1024 plugin --profile web add dsh-library` (conta para o ranking de instalações do [deepseek1024.com](https://deepseek1024.com)).

**Base de conhecimento local de documentos para o DeepSeek Harness.**

*Importe, recupere, verifique — busca híbrida com citações que seu agente pode conferir.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-library)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![dsh-doctor](https://raw.githubusercontent.com/PerryLink/dsh-plugin-doctor/main/badges/PerryLink__dsh-library.svg)](https://github.com/PerryLink/dsh-plugin-doctor#verified-徽章)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-library/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-library/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-library?label=version)](https://github.com/PerryLink/dsh-library/releases)
[![npm version](https://img.shields.io/npm/v/dsh-library)](https://www.npmjs.com/package/dsh-library)
[![npm downloads](https://img.shields.io/npm/dm/dsh-library)](https://www.npmjs.com/package/dsh-library)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-library?metric=downloads&lang=pt)](https://dshfind.com/pt/plugins/PerryLink/dsh-library?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

</div>

---

## Compatibilidade

| Superfície | Status |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.1.7-rc.1` (verificado em 2026-09-24: typecheck duplo + 89 testes + portas self-contained/artifacts; intervalo de peers `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0 \|\| >=0.1.7-0 <0.2.0`). Único pacote da família com smoke real de host alpha.2 (2026-09-11). |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Armazenamento | Qualquer backend de storage-domain (JSON ou SQLite); o índice vive no domínio de armazenamento do host |
| Modelos | Nenhum necessário — o embedder integrado é hash determinístico (zero downloads) |

## O que você ganha

O `dsh-library` transforma documentos md/txt locais em uma base de conhecimento consultável com um pipeline de qualidade em que seu agente pode confiar:

- **`library_add` / `library_remove` / `library_list`** — importa um documento por caminho (dividido em chunks e embutido), remove um com **verificação de expurgo** (assinaturas do conteúdo removido são sondadas contra o índice restante e qualquer resíduo é reportado) e lista os metadados dos documentos.
- **`library_search`** — ranking híbrido semântico + palavras-chave, re-ranking por diversidade de máxima relevância marginal, filtragem por relevância e **evitação do lost-in-the-middle** (os chunks mais fortes são fixados na cabeça e na cauda). Com `inject: true` a página de resultados é injetada no agente chamador; cada resultado carrega um marcador `[n]` e a injeção é reconstruível a partir do evento de sessão `library/inject` (condicionado pelo host; veja Permissões e dados).
- **`library_cite_check`** — verifica as citações `[n]` de uma resposta contra a página de resultados com correspondência difusa de tokens E uma checagem de similaridade semântica.
- **`library_diagnose`** — histograma de tamanhos de chunk, pares de chunks quase duplicados, uma sonda de auto-recuperação e o sinal de penalidade do meio.
- **`/library`** — resumos do índice por biblioteca em uma linha.

```text
documento ── library_add ─▶ chunk (janela deslizante) ─▶ embed (hash / comando externo)
                                     │
                       domínio de armazenamento (documents / chunks / purges)
                                     │
consulta ── library_search ─▶ pontuação híbrida ─▶ re-rank MMR ─▶ filtro de relevância
                                     │                        ─▶ ordem lost-in-middle
                                     ▼
                    página de resultados com marcadores [n] ── inject: true ─▶ agente + evento library/inject (condicionado pelo host)
```

## Início rápido

```sh
# 1. instale o bundle no seu perfil
dsh plugin --profile web add "github:PerryLink/dsh-library#main"

# ou pelo npm (versões publicadas)
dsh plugin --profile web add dsh-library

# 2. reinicie e verifique a linha
dsh --profile web --dump-config | grep -A2 'id: dsh-library'
```

Depois peça ao agente para importar e usar um documento:

```
> Adicione ./docs/spec.md à biblioteca docs e responda: o que a spec diz sobre retries? Cite com marcadores [n].
```

## Instalação e desinstalação

- **Canal git** (último `main`): `dsh plugin --profile web add "github:PerryLink/dsh-library#main"` — o script `prepare` compila apenas com dependências de produção.
- **Canal npm** (versões publicadas): `dsh plugin --profile web add dsh-library`.
- **Canal tarball**: `pnpm pack` neste repositório e então `dsh plugin --profile web add ./dsh-library-<version>.tgz`.
- **Desinstalar**: `dsh plugin --profile web remove dsh-library` (ou remova a linha do patch do perfil).

> Se o pnpm reportar `ERR_PNPM_IGNORED_BUILDS` para este pacote (a validação inofensiva do binário do esbuild), adicione `allowBuilds: { esbuild: true }` ao seu `pnpm-workspace.yaml` — o CLI `dsh` imprime o trecho exato.

## Configuração

Todos os ajustes são campos `Config` do Schemastery (alteráveis pelo cordis.yml). Uma sobrescrita direcionada por id substitui a linha inteira — redeclare cada chave que precisar. O `cordis.patch.yml` documenta cada chave em linha.

| Chave | Padrão | Significado |
|---|---|---|
| `chunkSize` | `900` | Tamanho do chunk em caracteres (janela deslizante, ≤ 4000) |
| `chunkOverlap` | `120` | Sobreposição entre janelas; deve ser menor que `chunkSize` |
| `maxFileBytes` | `5242880` | Arquivos maiores são rejeitados no `library_add` |
| `embedding.dims` | `256` | Dimensionalidade do hash embedding (≥ 8) |
| `embedding.provider` | `hash` | Backend do embedder: `hash` (integrado, zero downloads), `command` (subprocesso externo, requer `embedding.command`), `ollama` (Ollama local, sondado e degradado para `hash` se inalcançável) |
| `embedding.command` | `''` | Comando de embedder externo opcional (argv separado por espaços, sem shell) via `ctx.subprocess`; configurá-lo seleciona o backend `command` |
| `embedding.ollamaUrl` / `ollamaModel` | `http://127.0.0.1:11434` / `nomic-embed-text` | Endpoint e modelo do Ollama local para o backend `ollama` (zero nuvem) |
| `embedding.timeoutMs` / `graceMs` / `maxOutputBytes` / `maxBatchItems` | `30000` / `1000` / `1048576` / `64` | Orçamento do subprocesso do embedder |
| `search.topK` | `8` | Resultados devolvidos após o pipeline completo |
| `search.hybridWeight` | `0.6` | 0 = só palavras-chave, 1 = só semântica |
| `search.minRelevance` | `0.15` | Chunks abaixo deste limiar de relevância são filtrados |
| `search.diversityLambda` | `0.5` | Compensação MMR: 1 = relevância pura, 0 = diversidade pura |
| `search.lostMiddleHead` / `lostMiddleTail` | `1` / `1` | Chunks mais fortes fixados na cabeça / cauda |
| `search.maxResultChars` | `16000` | Orçamento de caracteres da página de resultados |
| `injection.enabled` / `maxChars` | `true` / `12000` | Comportamento e orçamento de injeção do `library_search` |
| `citation.windowChars` / `minScore` / `minSemantic` | `150` / `40` / `0.1` | Limiares do `library_cite_check` |
| `purge.signatureLength` / `maxProbes` | `4` / `24` | Assinaturas e orçamento de sondas da verificação de expurgo |
| `diagnose.maxDuplicatePairs` / `sampleCap` / `positionBins` | `24` / `200` / `5` | Limites do `library_diagnose` |

## Ferramentas e superfícies

| Ferramenta | Notas |
|---|---|
| `library_add` | `{ path, library, name? }` → id do documento; leitura pelo serviço de arquivos do harness |
| `library_remove` | `{ library, documentId }` → resumo da remoção + veredicto de expurgo (resíduo reportado) |
| `library_list` | `{ library? }` → metadados dos documentos (nunca texto) |
| `library_search` | `{ query, library, topK?, inject? }` → resultados ordenados com marcadores `[n]`; `inject: true` semeia o agente chamador |
| `library_cite_check` | `{ library, query, answer }` → veredictos por citação válida/inválida (difuso + semântico) |
| `library_diagnose` | `{ library }` → estatísticas de chunks, duplicados, auto-recuperação, penalidade do meio |
| `/library [name]` | Comando: resumos de documentos/chunks por biblioteca |

## Permissões e dados

- **Permissões**: o plugin só lê os arquivos apontados pelo `library_add` (pelo serviço de arquivos do harness e sua política) e escreve no seu próprio domínio de armazenamento `dsh_library`. Sem requisições de rede; um embedder externo opcional executa via `ctx.subprocess` sem interpretação de shell.
- **Dados**: o texto dos chunks e os embeddings vivem no backend de armazenamento do host (a mesma confiança do restante dos dados duráveis da implantação); o plugin não adiciona criptografia. Caminhos de documentos e embeddings nunca entram no registro de sessão.
- **Registro de sessão**: `library/inject` (id, consulta, ids de chunks, tamanho da página) e `library/purge` (veredicto) são eventos de auditoria somente-registro — a página injetada visível ao modelo é reconstruível a partir deles. O append é condicionado pelo host: harnesses cujo conjunto de tipos conhecidos cobre o vocabulário recebem os eventos, builds com envelope `ignorable` os recebem com o marcador, e builds sem envelope (0.1.1-rc.2, 0.1.2-rc.1) pulam o append — ali, os eventos registrados `tool/call` + `tool/result` continuam sendo a trilha de auditoria reconstruível.
0.1.2-rc.1 (adaptado em 2026-09-02): o envelope de sessão mantém seu campo ignorable apenas para compatibilidade de leitura de logs armazenados - o Session.append ainda não consegue estampá-lo, então o comportamento da porta não muda.

## Limites de segurança

- **Local por padrão.** Zero downloads de modelos, zero chamadas de rede — a pontuação é hash determinístico e matemática de tokens. Apenas um comando de embedder configurado explicitamente executa código, e seu protocolo é verificado por completude e limitado em saída.
- **Sem fabricação.** As checagens de citações informam o que o pipeline pode verificar; citações suspeitas são exibidas com honestidade, nunca adivinhadas.
- **O expurgo é verificado.** O `library_remove` sonda o índice restante com assinaturas determinísticas do conteúdo removido e reporta o resíduo em vez de assumir sucesso.
- **Falha ruidosa.** Nomes de biblioteca inválidos, documentos grandes demais, arquivos ilegíveis e um seam de embedder configurado mas ausente falham com erro claro.

## Limitações conhecidas

- **Embeddings de grau léxico.** O embedder hash integrado pontua similaridade superficial, não significado; a qualidade de recuperação em paráfrases é menor que com um modelo real — configure `embedding.command` para semântica mais forte.
- **Modelo de citação local.** O `library_cite_check` valida contra a página de resultados (a numeração `[n]`), não contra nomes de fonte livres; a pontuação difusa é uma razão parcial de sequências de tokens limitada.
- **Sem pipeline de ingestão.** Os documentos devem ser importados por caminho (`md`/`txt`); a extração de PDF/docx fica fora da v0.1.0.
- **Eventos de auditoria condicionados pelo host.** `library/inject` / `library/purge` só são gravados em harnesses que podem carregá-los (veja Permissões e dados); na linha publicada `0.1.2-rc.1` (como nas linhas sem envelope anteriores) eles não são gravados, e cada fato continua reconstruível a partir do registro de chamada/resultado da ferramenta.

## Desenvolvimento

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests contra o checkout local do harness
pnpm run typecheck:ci  # tsc contra os tipos publicados 0.1.7-rc.1 (sem paths)
pnpm test           # vitest: portas de qualidade, vocabulário núcleo, montagem com pilha real
pnpm run build      # bundle tsdown + declarações tsc (lib/)
pnpm run verify:self-contained  # especificações de dependências resolvem pelo registry
pnpm run verify:artifacts       # face ESM construída + bundle patch presente
pnpm pack           # o tarball publicado
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `rag`, `knowledge-base`, `retrieval`, `embedding`, `vector-search`, `citation-validation`, `document-library`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — criador e mantenedor: os oito portes de qualidade, o índice de domínio de armazenamento, o pipeline de recuperação híbrido, a verificação de citações/expurgo e a documentação em cinco idiomas.

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

### Instalar a partir do mercado do DSH Desktop

Todos os plugins PerryLink podem ser explorados no mercado integrado do DSH Desktop: **Market → Sources → add source → colar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ selecionar**. A instalação continua passando pela verificação de identidade npm do mercado e pela sua confirmação.
