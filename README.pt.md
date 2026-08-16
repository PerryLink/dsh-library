<div align="center">

# 📚 dsh-library

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
| Harness | DeepSeek Harness `0.1.0-rc.6` (compatibilidade declarada para `0.1.0-rc.5`–`0.1.0-rc.6`) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Armazenamento | Qualquer backend de storage-domain (JSON ou SQLite); o índice vive no domínio de armazenamento do host |
| Modelos | Nenhum necessário — o embedder integrado é hash determinístico (zero downloads) |

## O que você ganha

O `dsh-library` transforma documentos md/txt locais em uma base de conhecimento consultável com um pipeline de qualidade em que seu agente pode confiar:

- **`library_add` / `library_remove` / `library_list`** — importa um documento por caminho (dividido em chunks e embutido), remove um com **verificação de expurgo** (assinaturas do conteúdo removido são sondadas contra o índice restante e qualquer resíduo é reportado) e lista os metadados dos documentos.
- **`library_search`** — ranking híbrido semântico + palavras-chave, re-ranking por diversidade de máxima relevância marginal, filtragem por relevância e **evitação do lost-in-the-middle** (os chunks mais fortes são fixados na cabeça e na cauda). Com `inject: true` a página de resultados é injetada no agente chamador; cada resultado carrega um marcador `[n]` e a injeção é reconstruível a partir do evento de sessão `library/inject`.
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
                    página de resultados com marcadores [n] ── inject: true ─▶ agente + evento library/inject
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
| `embedding.command` | `''` | Comando de embedder externo opcional (argv separado por espaços, sem shell) via `ctx.subprocess`; `''` = embedder hash integrado |
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
- **Registro de sessão**: `library/inject` (id, consulta, ids de chunks, tamanho da página) e `library/purge` (veredicto) são eventos de auditoria somente-registro — a página injetada visível ao modelo é reconstruível a partir deles.

## Limites de segurança

- **Local por padrão.** Zero downloads de modelos, zero chamadas de rede — a pontuação é hash determinístico e matemática de tokens. Apenas um comando de embedder configurado explicitamente executa código, e seu protocolo é verificado por completude e limitado em saída.
- **Sem fabricação.** As checagens de citações informam o que o pipeline pode verificar; citações suspeitas são exibidas com honestidade, nunca adivinhadas.
- **O expurgo é verificado.** O `library_remove` sonda o índice restante com assinaturas determinísticas do conteúdo removido e reporta o resíduo em vez de assumir sucesso.
- **Falha ruidosa.** Nomes de biblioteca inválidos, documentos grandes demais, arquivos ilegíveis e um seam de embedder configurado mas ausente falham com erro claro.

## Limitações conhecidas

- **Embeddings de grau léxico.** O embedder hash integrado pontua similaridade superficial, não significado; a qualidade de recuperação em paráfrases é menor que com um modelo real — configure `embedding.command` para semântica mais forte.
- **Modelo de citação local.** O `library_cite_check` valida contra a página de resultados (a numeração `[n]`), não contra nomes de fonte livres; a pontuação difusa é uma razão parcial de sequências de tokens limitada.
- **Sem pipeline de ingestão.** Os documentos devem ser importados por caminho (`md`/`txt`); a extração de PDF/docx fica fora da v0.1.0.

## Desenvolvimento

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests contra o checkout local do harness
pnpm run typecheck:ci  # tsc contra os tipos publicados 0.1.0-rc.6 (sem paths)
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

## License

[Apache License 2.0](LICENSE) © 2026 dsh-library contributors
