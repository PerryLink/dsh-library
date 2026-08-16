<div align="center">

# 📚 dsh-library

**Base de conocimiento local de documentos para DeepSeek Harness.**

*Importa, recupera, verifica — búsqueda híbrida con citas que tu agente puede comprobar.*

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

## Compatibilidad

| Superficie | Estado |
|---|---|
| Harness | DeepSeek Harness `0.1.0-rc.6` (compatibilidad declarada para `0.1.0-rc.5`–`0.1.0-rc.6`) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Almacenamiento | Cualquier backend de storage-domain (JSON o SQLite); el índice vive en el dominio de almacenamiento del host |
| Modelos | Ninguno requerido — el embedder integrado es hash determinista (cero descargas) |

## Qué obtienes

`dsh-library` convierte documentos md/txt locales en una base de conocimiento consultable con un pipeline de calidad en el que tu agente puede confiar:

- **`library_add` / `library_remove` / `library_list`** — importa un documento por ruta (troceado e incrustado), elimina uno con **verificación de purga** (las firmas del contenido eliminado se sondean contra el índice restante y cualquier residuo se reporta) y lista los metadatos de los documentos.
- **`library_search`** — ranking híbrido semántico + palabras clave, re-ranking por diversidad de máxima relevancia marginal, filtrado por relevancia y **evitación del lost-in-the-middle** (los chunks más fuertes se fijan a la cabeza y la cola). Con `inject: true` la página de resultados se inyecta en el agente que llama; cada resultado lleva un marcador `[n]` y la inyección es reconstruible desde el evento de sesión `library/inject`.
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
                    página de resultados con marcadores [n] ── inject: true ─▶ agente + evento library/inject
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
| `embedding.command` | `''` | Comando de embedder externo opcional (argv separado por espacios, sin shell) sobre `ctx.subprocess`; `''` = embedder hash integrado |
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
- **Registro de sesión**: `library/inject` (id, consulta, ids de chunks, tamaño de página) y `library/purge` (veredicto) son eventos de auditoría solo-registro — la página inyectada visible para el modelo es reconstruible a partir de ellos.

## Límites de seguridad

- **Local por defecto.** Cero descargas de modelos, cero llamadas de red — la puntuación es hash determinista y matemática de tokens. Solo un comando de embedder configurado explícitamente ejecuta código, y su protocolo se verifica por completitud y se limita en salida.
- **Sin fabricación.** Las comprobaciones de citas informan lo que el pipeline puede verificar; las citas sospechosas se muestran con honestidad, nunca se adivinan.
- **La purga se verifica.** `library_remove` sondea el índice restante con firmas deterministas del contenido eliminado e informa del residuo en lugar de asumir éxito.
- **Fallo ruidoso.** Nombres de biblioteca inválidos, documentos demasiado grandes, archivos ilegibles y un seam de embedder configurado pero ausente fallan con un error claro.

## Limitaciones conocidas

- **Embeddings de grado léxico.** El embedder hash integrado puntúa similitud superficial, no significado; la calidad de recuperación en paráfrasis es menor que con un modelo real — configura `embedding.command` para semántica más fuerte.
- **Modelo de citas local.** `library_cite_check` valida contra la página de resultados (la numeración `[n]`), no contra nombres de fuente libres; la puntuación difusa es una razón parcial de secuencias de tokens acotada.
- **Sin pipeline de ingesta.** Los documentos deben importarse por ruta (`md`/`txt`); la extracción de PDF/docx queda fuera de v0.1.0.

## Desarrollo

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests contra el checkout local del harness
pnpm run typecheck:ci  # tsc contra los tipos publicados 0.1.0-rc.6 (sin paths)
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

## License

[Apache License 2.0](LICENSE) © 2026 dsh-library contributors
