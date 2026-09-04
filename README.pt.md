<div align="center">

# 📚 dsh-library
- **Canal 1024 store**: `npm i -g dsh1024` uma vez, depois `dsh1024 plugin --profile web add dsh-library` (conta para o ranking de instalações do [deepseek1024.com](https://deepseek1024.com)).

**Base de conhecimento local de documentos para o DeepSeek Harness.**

*Importe, recupere, verifique — busca híbrida com citações que seu agente pode conferir.*

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

## Compatibilidade

| Superfície | Status |
|---|---|
| Harness | DeepSeek Harness `0.1.2-rc.1` (compatibilidade declarada para `0.1.2-rc.1`) |
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
- **Eventos de auditoria condicionados pelo host.** `library/inject` / `library/purge` só são gravados em harnesses que podem carregá-los (veja Permissões e dados); na linha publicada 0.1.1-rc.2 eles não são gravados, e cada fato continua reconstruível a partir do registro de chamada/resultado da ferramenta.

## Desenvolvimento

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests contra o checkout local do harness
pnpm run typecheck:ci  # tsc contra os tipos publicados 0.1.2-rc.1 (sem paths)
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

Este projeto é um dos [33 plugins de DeepSeek Harness](https://github.com/PerryLink) mantidos por [PerryLink](https://github.com/PerryLink). Se este ajuda você, os outros provavelmente também:

| Plugin | One-liner |
|---|---|
| **[dsh-dsh-auto-review](https://github.com/PerryLink/dsh-dsh-auto-review)** | Auto-revisão de segundo modelo na cadeia de aprovação, com falha fechada por padrão | |
| **[dsh-dsh-background-agents](https://github.com/PerryLink/dsh-dsh-background-agents)** | Agentes filhos em segundo plano duráveis com barra lateral de UI web, mensagens e interrupção | |
| **[dsh-dsh-budget](https://github.com/PerryLink/dsh-dsh-budget)** | Governança de custos para DeepSeek Harness: orçamentos, carbono e latência em um painel. | |
| **[dsh-dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-dsh-checkpoint-rewind)** | Equivalente ao /rewind do Claude Code: instantâneos, bifurcações de sessão, restauração de uso único | |
| **[dsh-dsh-claude-move](https://github.com/PerryLink/dsh-dsh-claude-move)** | Migre sessões, memória, habilidades e CLAUDE.md do Claude Code para o DSH | |
| **[dsh-dsh-click](https://github.com/PerryLink/dsh-dsh-click)** | Controle de desktop nativo multiplataforma para DeepSeek Harness — Windows primeiro. | |
| **[dsh-dsh-composer-history](https://github.com/PerryLink/dsh-dsh-composer-history)** | Histórico de entrada estilo terminal para o compositor web: setas, busca Ctrl+R | |
| **[dsh-dsh-data-quality](https://github.com/PerryLink/dsh-dsh-data-quality)** | Verificações de qualidade de datasets e verificação de citações (a ponte numérica opcional consumida aqui) | |
| **[dsh-dsh-defend](https://github.com/PerryLink/dsh-dsh-defend)** | Defesa contra injeção de prompt, jailbreak e vazamento de segredos para DeepSeek Harness. | |
| **[dsh-dsh-doublecheck](https://github.com/PerryLink/dsh-dsh-doublecheck)** | Guardião de disciplina de engenharia: sabatina de requisitos, portões de teste, revisão adversária | |
| **[dsh-dsh-draw](https://github.com/PerryLink/dsh-dsh-draw)** | Roteamento unificado de geração de imagens estáticas para DeepSeek Harness. | |
| **[dsh-dsh-fast](https://github.com/PerryLink/dsh-dsh-fast)** | Diagnóstico de desempenho só de leitura para DeepSeek Harness. | |
| **[dsh-dsh-fund-research](https://github.com/PerryLink/dsh-dsh-fund-research)** | Relatórios de pesquisa deterministas para fundos mútuos públicos chineses | |
| **[dsh-dsh-github](https://github.com/PerryLink/dsh-dsh-github)** | Integração de PR/issues do GitHub para o DSH, cada escrita controlada por aprovação | |
| **[dsh-dsh-industry-research](https://github.com/PerryLink/dsh-dsh-industry-research)** | Orquestração de pesquisa setorial que sela as suas entregas através do `ctx.researchReport.assemble` deste plugin | |
| **[dsh-dsh-local-ai](https://github.com/PerryLink/dsh-dsh-local-ai)** | Integração de modelos locais (Ollama) para DeepSeek Harness. | |
| **[dsh-dsh-lsp-actions](https://github.com/PerryLink/dsh-dsh-lsp-actions)** | Diagnósticos, formatação, autocompletar, ações de código e renomeação LSP sobre servidores de linguagem | |
| **[dsh-dsh-mask](https://github.com/PerryLink/dsh-dsh-mask)** | Middleware de mascaramento de PII: anonimiza no limite do modelo, restaura na camada de exibição | |
| **[dsh-dsh-mcp-panel](https://github.com/PerryLink/dsh-dsh-mcp-panel)** | Painel de tempo de execução MCP somente leitura: comando /mcp + aba Settings com status, ferramentas e erros | |
| **[dsh-dsh-memento](https://github.com/PerryLink/dsh-dsh-memento)** | Memória entre sessões controlada por aprovação: costura ctx.memory + SQLite + ferramenta de memória | |
| **[dsh-dsh-observe](https://github.com/PerryLink/dsh-dsh-observe)** | Exportador de observabilidade OpenTelemetry e Langfuse para DeepSeek Harness. | |
| **[dsh-dsh-output-styles](https://github.com/PerryLink/dsh-dsh-output-styles)** | Troca de estilo em tempo de execução equivalente ao outputStyles do Claude Code | |
| **[dsh-dsh-permission-rules](https://github.com/PerryLink/dsh-dsh-permission-rules)** | Regras de permissão declarativas allow/deny/ask estilo Claude Code com auditoria | |
| **[dsh-dsh-plugin-guide](https://github.com/PerryLink/dsh-dsh-plugin-guide)** | Base de conhecimento de desenvolvimento de plugins como habilidade de agente sob demanda | |
| **[dsh-dsh-research-report](https://github.com/PerryLink/dsh-dsh-research-report)** | Motor de relatórios de pesquisa verificáveis com evidência endereçada por conteúdo | |
| **[dsh-dsh-score](https://github.com/PerryLink/dsh-dsh-score)** | Pontuação de qualidade multidimensional para plugins de DeepSeek Harness. | |
| **[dsh-dsh-session-pin](https://github.com/PerryLink/dsh-dsh-session-pin)** | Fixe sessões na barra lateral web com ordenação durável | |
| **[dsh-dsh-session-sync](https://github.com/PerryLink/dsh-dsh-session-sync)** | Sincronização de sessões entre dispositivos para DeepSeek Harness — um espelho git dedicado do seu armazenamento de sessões. | |
| **[dsh-dsh-skill-pack-security](https://github.com/PerryLink/dsh-dsh-skill-pack-security)** | Pacote de habilidades de auditoria de segurança: varredura de segredos, revisão de dependências e cadeia de suprimentos | |
| **[dsh-dsh-talk](https://github.com/PerryLink/dsh-dsh-talk)** | Loop de sessão com voz para DeepSeek Harness: fale e ouça a resposta. | |
| **[dsh-dsh-test-drive](https://github.com/PerryLink/dsh-dsh-test-drive)** | Test drives isolados de instalação e smoke para plugins de DeepSeek Harness. | |
| **[dsh-dsh-translate](https://github.com/PerryLink/dsh-dsh-translate)** | Tradução de parâmetros entre fornecedores e reparo determinístico de JSON para DeepSeek Harness. | |

## License

[Apache License 2.0](LICENSE) © 2026 dsh-library contributors

### Instalar a partir do mercado do DSH Desktop

Todos os plugins PerryLink podem ser explorados no mercado integrado do DSH Desktop: **Market → Sources → add source → colar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ selecionar**. A instalação continua passando pela verificação de identidade npm do mercado e pela sua confirmação.
