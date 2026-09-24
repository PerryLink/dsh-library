<div align="center">

# 📚 dsh-library
- **Canal 1024 store**: `npm i -g dsh1024` una vez, luego `dsh1024 plugin --profile web add dsh-library` (cuenta para el ranking de instalaciones de [deepseek1024.com](https://deepseek1024.com)).

**Base de conocimiento local de documentos para DeepSeek Harness.**

*Importa, recupera, verifica — búsqueda híbrida con citas que tu agente puede comprobar.*

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
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-library?metric=downloads&lang=es)](https://dshfind.com/es/plugins/PerryLink/dsh-library?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

</div>

---


<!-- star-cta -->
## ⭐ 如果它帮到了你

Este plugin forma parte de la [familia de plugins DSH](https://github.com/PerryLink) (más de 40, todos Apache-2.0). Si te resulta útil, **dale una estrella**: no desbloquea nada, pero ayuda a que la siguiente persona lo encuentre antes.

*English:* part of a 40+ plugin family for DeepSeek Harness. If it is useful, **a star helps the next person find it** — nothing is gated behind it.
## Compatibilidad

| Superficie | Estado |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.1.7-rc.1` (verificado el 2026-09-24: doble typecheck + 89 pruebas + puertas self-contained/artifacts; rango de peers `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0 \|\| >=0.1.7-0 <0.2.0`). Único paquete de la familia con un smoke real de host alpha.2 (2026-09-11). |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Almacenamiento | Cualquier backend de storage-domain (JSON o SQLite); el índice vive en el dominio de almacenamiento del host |
| Modelos | Ninguno requerido — el embedder integrado es hash determinista (cero descargas) |

## Qué obtienes

`dsh-library` convierte documentos md/txt locales en una base de conocimiento consultable con un pipeline de calidad en el que tu agente puede confiar:

- **`library_add` / `library_remove` / `library_list`** — importa un documento por ruta (troceado e incrustado), elimina uno con **verificación de purga** (las firmas del contenido eliminado se sondean contra el índice restante y cualquier residuo se reporta) y lista los metadatos de los documentos.
- **`library_search`** — ranking híbrido semántico + palabras clave, re-ranking por diversidad de máxima relevancia marginal, filtrado por relevancia y **evitación del lost-in-the-middle** (los chunks más fuertes se fijan a la cabeza y la cola). Con `inject: true` la página de resultados se inyecta en el agente que llama; cada resultado lleva un marcador `[n]` y la inyección es reconstruible desde el evento de sesión `library/inject` (condicionado por el host; ver Permisos y datos).
- **`library_cite_check`** — verifica las citas `[n]` de una respuesta contra la página de resultados con una coincidencia difusa de tokens Y una comprobación de similitud semántica.
- **`library_diagnose`** — histograma de tamaños de chunk, pares de chunks casi duplicados, una sonda de auto-recuperación y la señal de penalización media.
- **`/library`** — resúmenes del índice por biblioteca en una línea.

```text
documento ── library_add ─▶ chunk (ventana deslizante) ─▶ embed (hash / comando externo)
                                     │
                        dominio de almacenamiento (documents / chunks / purges)
                                     │
consulta ── library_search ─▶ puntuación híbrida ─▶ re-rank MMR ─▶ filtro de relevancia
                                     │                        ─▶ orden lost-in-middle
                                     ▼
                    página de resultados con marcadores [n] ── inject: true ─▶ agente + evento library/inject (condicionado por el host)
```

## Inicio rápido

```sh
# 1. instala el bundle en tu perfil
dsh plugin --profile web add "github:PerryLink/dsh-library#main"

# o desde npm (versiones publicadas)
dsh plugin --profile web add dsh-library

# 2. reinicia y verifica la fila
dsh --profile web --dump-config | grep -A2 'id: dsh-library'
```

Luego pide al agente que importe y use un documento:

```
> Añade ./docs/spec.md a la biblioteca docs y responde: ¿qué dice la spec sobre reintentos? Cita con marcadores [n].
```

## Instalación y desinstalación

- **Canal git** (último `main`): `dsh plugin --profile web add "github:PerryLink/dsh-library#main"` — el script `prepare` compila solo con dependencias de producción.
- **Canal npm** (versiones publicadas): `dsh plugin --profile web add dsh-library`.
- **Canal tarball**: `pnpm pack` en este repositorio y luego `dsh plugin --profile web add ./dsh-library-<version>.tgz`.
- **Desinstalar**: `dsh plugin --profile web remove dsh-library` (o elimina la fila del parche del perfil).

> Si pnpm informa `ERR_PNPM_IGNORED_BUILDS` para este paquete (la validación inofensiva del binario de esbuild), añade `allowBuilds: { esbuild: true }` a tu `pnpm-workspace.yaml` — el CLI `dsh` imprime el fragmento exacto.

## Configuración

Todos los ajustes son campos `Config` de Schemastery (modificables desde cordis.yml). Una sobrescritura dirigida por id reemplaza toda la fila — vuelve a declarar cada clave que necesites. `cordis.patch.yml` documenta cada clave en línea.

| Clave | Por defecto | Significado |
|---|---|---|
| `chunkSize` | `900` | Tamaño del chunk en caracteres (ventana deslizante, ≤ 4000) |
| `chunkOverlap` | `120` | Solapamiento entre ventanas; debe ser menor que `chunkSize` |
| `maxFileBytes` | `5242880` | Archivos mayores se rechazan en `library_add` |
| `embedding.dims` | `256` | Dimensionalidad del hash embedding (≥ 8) |
| `embedding.provider` | `hash` | Backend del embedder: `hash` (integrado, cero descargas), `command` (subproceso externo, requiere `embedding.command`), `ollama` (Ollama local, probado y degradado a `hash` si es inalcanzable) |
| `embedding.command` | `''` | Comando de embedder externo opcional (argv separado por espacios, sin shell) sobre `ctx.subprocess`; configurarlo selecciona el backend `command` |
| `embedding.ollamaUrl` / `ollamaModel` | `http://127.0.0.1:11434` / `nomic-embed-text` | Endpoint y modelo de Ollama local para el backend `ollama` (cero nube) |
| `embedding.timeoutMs` / `graceMs` / `maxOutputBytes` / `maxBatchItems` | `30000` / `1000` / `1048576` / `64` | Presupuesto del subproceso del embedder |
| `search.topK` | `8` | Resultados devueltos tras el pipeline completo |
| `search.hybridWeight` | `0.6` | 0 = solo palabras clave, 1 = solo semántica |
| `search.minRelevance` | `0.15` | Los chunks bajo este umbral de relevancia se filtran |
| `search.diversityLambda` | `0.5` | Compensación MMR: 1 = relevancia pura, 0 = diversidad pura |
| `search.lostMiddleHead` / `lostMiddleTail` | `1` / `1` | Chunks más fuertes fijados a la cabeza / cola |
| `search.maxResultChars` | `16000` | Presupuesto de caracteres de la página de resultados |
| `injection.enabled` / `maxChars` | `true` / `12000` | Comportamiento y presupuesto de inyección de `library_search` |
| `citation.windowChars` / `minScore` / `minSemantic` | `150` / `40` / `0.1` | Umbrales de `library_cite_check` |
| `purge.signatureLength` / `maxProbes` | `4` / `24` | Firmas y presupuesto de sondas de la verificación de purga |
| `diagnose.maxDuplicatePairs` / `sampleCap` / `positionBins` | `24` / `200` / `5` | Límites de `library_diagnose` |

## Herramientas y superficies

| Herramienta | Notas |
|---|---|
| `library_add` | `{ path, library, name? }` → id del documento; lectura a través del servicio de archivos del harness |
| `library_remove` | `{ library, documentId }` → resumen de eliminación + veredicto de purga (residuo reportado) |
| `library_list` | `{ library? }` → metadatos de documentos (nunca texto) |
| `library_search` | `{ query, library, topK?, inject? }` → resultados ordenados con marcadores `[n]`; `inject: true` siembra el agente que llama |
| `library_cite_check` | `{ library, query, answer }` → veredictos por cita válida/inválida (difuso + semántico) |
| `library_diagnose` | `{ library }` → estadísticas de chunks, duplicados, auto-recuperación, penalización media |
| `/library [name]` | Comando: resúmenes de documentos/chunks por biblioteca |

## Permisos y datos

- **Permisos**: el plugin solo lee los archivos a los que apunta `library_add` (a través del servicio de archivos del harness y su política) y escribe en su propio dominio de almacenamiento `dsh_library`. Sin peticiones de red; un embedder externo opcional se ejecuta por `ctx.subprocess` sin interpretación de shell.
- **Datos**: el texto de los chunks y los embeddings viven en el backend de almacenamiento del host (la misma confianza que el resto de los datos durables del despliegue); el plugin no añade cifrado. Las rutas de documentos y los embeddings nunca entran en el registro de sesión.
- **Registro de sesión**: `library/inject` (id, consulta, ids de chunks, tamaño de página) y `library/purge` (veredicto) son eventos de auditoría solo-registro — la página inyectada visible para el modelo es reconstruible a partir de ellos. El append está condicionado por el host: los harnesses cuyo conjunto de tipos conocidos cubre el vocabulario reciben los eventos, las builds con envoltura `ignorable` los reciben con el marcador, y las builds sin envoltura (0.1.1-rc.2, 0.1.2-rc.1) omiten el append — allí los eventos registrados `tool/call` + `tool/result` siguen siendo el rastro de auditoría reconstruible.
0.1.2-rc.1 (adaptado el 2026-09-02): el sobre de sesión conserva su campo ignorable solo para compatibilidad de lectura de logs almacenados - Session.append aún no puede estamparlo, por lo que el comportamiento de la puerta no cambia.

## Límites de seguridad

- **Local por defecto.** Cero descargas de modelos, cero llamadas de red — la puntuación es hash determinista y matemática de tokens. Solo un comando de embedder configurado explícitamente ejecuta código, y su protocolo se verifica por completitud y se limita en salida.
- **Sin fabricación.** Las comprobaciones de citas informan lo que el pipeline puede verificar; las citas sospechosas se muestran con honestidad, nunca se adivinan.
- **La purga se verifica.** `library_remove` sondea el índice restante con firmas deterministas del contenido eliminado e informa del residuo en lugar de asumir éxito.
- **Fallo ruidoso.** Nombres de biblioteca inválidos, documentos demasiado grandes, archivos ilegibles y un seam de embedder configurado pero ausente fallan con un error claro.

## Limitaciones conocidas

- **Embeddings de grado léxico.** El embedder hash integrado puntúa similitud superficial, no significado; la calidad de recuperación en paráfrasis es menor que con un modelo real — configura `embedding.command` para semántica más fuerte.
- **Modelo de citas local.** `library_cite_check` valida contra la página de resultados (la numeración `[n]`), no contra nombres de fuente libres; la puntuación difusa es una razón parcial de secuencias de tokens acotada.
- **Sin pipeline de ingesta.** Los documentos deben importarse por ruta (`md`/`txt`); la extracción de PDF/docx queda fuera de v0.1.0.
- **Eventos de auditoría condicionados por el host.** `library/inject` / `library/purge` solo se añaden en harnesses que pueden llevarlos (ver Permisos y datos); en la línea publicada `0.1.2-rc.1` (como en las líneas sin envoltura anteriores) no se añaden, y cada hecho sigue siendo reconstruible desde el registro de llamada/resultado de la herramienta.

## Desarrollo

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests contra el checkout local del harness
pnpm run typecheck:ci  # tsc contra los tipos publicados 0.1.7-rc.1 (sin paths)
pnpm test           # vitest: puertos de calidad, vocabulario núcleo, ensamblaje con pila real
pnpm run build      # bundle tsdown + declaraciones tsc (lib/)
pnpm run verify:self-contained  # las especificaciones de dependencias resuelven desde el registry
pnpm run verify:artifacts       # cara ESM construida + bundle patch presente
pnpm pack           # el tarball publicado
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `rag`, `knowledge-base`, `retrieval`, `embedding`, `vector-search`, `citation-validation`, `document-library`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — creador y mantenedor: los ocho puertos de calidad, el índice de dominio de almacenamiento, el pipeline de recuperación híbrido, la verificación de citas/purga y la documentación en cinco idiomas.

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

### Instalar desde el mercado de DSH Desktop

Todos los plugins de PerryLink pueden explorarse en el mercado integrado de DSH Desktop: **Market → Sources → add source → pegar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ seleccionarlo**. La instalación sigue pasando por la verificación de identidad npm del mercado y tu confirmación.
