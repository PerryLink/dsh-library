# AGENTS.md

Standalone DeepSeek Harness plugin repository (`dsh-library`). Development follows the dsh-plugin-guide skill and the official plugin contract; this file records repo-local decisions.

## Layout

- `src/index.ts` — function-plugin contract (`name`/`inject`/`Config`/`apply`; NO default export). Injects `storageDomain` + `tools` + `commands`; the filesystem and subprocess seams are read optionally at call time and fail closed when absent. Declares the `dsh_library` storage domain (documents/chunks/purges), the `LibraryStore` runtime, six tools, the `/library` command, and the `library/inject` + `library/purge` `SessionEventMap` members.
- `src/config.ts` — Schemastery schema + explicit `resolveConfig` (every default and bound re-judged there). An empty `embedding.command` string is normalized to `undefined` so the cordis.patch.yml can carry `command: ''` as the "unset" spelling.
- `src/embedding.ts` — deterministic hash embedder (word tokens + character tri-grams into a signed bucket vector, L2-normalized; cosine = dot product), the external embedder subprocess protocol (JSON lines both ways, completeness-checked), and command-line splitting (no shell interpretation).
- `src/text.ts` — normalization, CJK-aware tokenization, term frequencies, char/token n-grams, FNV-1a.
- `src/ids.ts` — content-derived document ids, chunk ids, purge/injection ids, domain record keys.
- `src/quality/` — the eight upstream ports as pure functions (see THIRD_PARTY_NOTICES): chunk-visual, diversity, lost-middle, relevance, few-shot, reference, citation, purge.

## Hard rules applied here

- **Storage domain is the index.** All index state lives in the `dsh_library` domain (unit names allow `[a-z][a-z0-9_]*` only — hence the underscore, not the package hyphen). Record schemas are zod and validated at the durable boundary; `LibraryStore` never logs text or embeddings.
- **Model-visible ⟺ logged.** Injected result pages carry `[n]` source markers plus an inject id; the `library/inject` event records the id, query, chunk ids, and page size so the message is reconstructable. `library/purge` records every removal verdict.
- **Fail closed, fail loud.** Invalid library names throw; unreadable files, oversized documents, and a configured-but-absent embedder seam fail the call; the external embedder must answer every requested index exactly once or the batch fails.
- **No downloads.** The built-in embedder is deterministic hashing; the upstream model-based scorers (cross-encoder, SentenceTransformer, ChromaDB, fuzzywuzzy) are replaced by local-rules equivalents — the substitution per module is documented in its header. `upstream/` is reference-only (gitignored, never published).
- **Waterfall discipline.** This plugin registers no waterfall listeners today; if it ever does, allow/passthrough MUST call `next()` and only a deliberate deny/ask may short-circuit.
- **Safety bounds are constants, not tunables.** The MMR candidate-pool cap and the fuzzy-ratio token caps are documented fixed bounds; every user-facing knob lives in `Config`.

## Checks

`pnpm run typecheck && pnpm run typecheck:ci && pnpm test && pnpm run build && pnpm run verify:self-contained && pnpm run verify:artifacts && pnpm pack`

- `typecheck` resolves `@deepseek-ai/*` through tsconfig paths to the local harness checkout; `typecheck:ci` clears the paths and checks against the published `0.1.0-rc.6` types. Both must stay green.
- Tests run against the REAL stack: storage hub + JSON backend + storage domain, real `ToolRuntime`/`Commands`/`Session`, and a real local filesystem over a per-test mkdtemp sandbox.

## Docs

- Five-language READMEs (`README.md`, `README.zh.md`, `README.es.md`, `README.pt.md`, `README.hi.md`) — keep all five in sync; the English file is the source of truth.
- GitHub topics `dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `rag`, `knowledge-base`, `retrieval`, `embedding`, `vector-search`, `citation-validation`, `document-library` (mirror `package.json` keywords; the ecosystem's visibility channel is the `dsh-plugin` topic).
- License is Apache-2.0 (`LICENSE` + the package.json `license` field); upstream port provenance lives in `THIRD_PARTY_NOTICES.md`.
