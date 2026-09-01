# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- The `library_search` relevance gate now filters on the hybrid score — the same value the diversity re-rank orders by — instead of re-scoring each chunk lexically, so semantic matches pass the `search.minRelevance` threshold ([#2](https://github.com/PerryLink/dsh-library/issues/2)).
- CJK queries now score through unigram + adjacent-bigram tokens instead of whole-run tokens, so partial Chinese phrase overlaps pass the relevance gate ([#2](https://github.com/PerryLink/dsh-library/issues/2)).

## [0.2.2] - 2026-09-01

### Changed

- Upgrade the `@deepseek-ai/dsh-*` dev dependencies from `0.1.2-alpha.2` to `0.1.2-alpha.3` (peer ranges stay `>=0.1.0-rc.8 <0.2.0`), align the `@deepseek-ai/cordis` / `@deepseek-ai/schemastery` carets to `^4.0.2` / `^3.18.2`, and refresh `dshWorkshop.compatibility.dshVersions` and the five-language README version strings to `0.1.2-alpha.3`.

## [0.2.1] - 2026-08-30

### Changed

- Session audit appends (`library/inject`, `library/purge`) now go through an adaptive host gate: harnesses whose known-type set covers the vocabulary get the events, `ignorable`-envelope builds get them with the marker, and envelope-less builds (0.1.1-rc.2, 0.1.2-alpha.1, which fail closed on unknown event types at read) get no append — the logged `tool/call` + `tool/result` events remain the reconstructable audit trail. Plugin behavior is otherwise unchanged.

### Fixed

- CI flake: the real-stack robustness tests could exceed vitest's 5s default timeout on windows-latest with Node 24 under v8 coverage instrumentation; the suite timeout is now 30s.
- The test harness no longer imports `CallId` from `@deepseek-ai/dsh-llm` (renamed to `ToolCallId` on host master); the call-id brand is now derived from `ToolExecution['callId']`, keeping both the checkout and the published 0.1.1-rc.2 type rulers green.

## [0.2.0] - 2026-08-26

### Added

- Embedder provider seam with an optional local Ollama backend.

## [0.1.4] - 2026-08-23

### Fixed

- Declared `@deepseek-ai/dsh-commands` as a peer dependency: the `/library` command hard-injects the `commands` service, so its provider package must be declared alongside `@deepseek-ai/dsh-tools` and `@deepseek-ai/dsh-storage-domain` instead of being a dev-only dependency.

## [0.1.3] - 2026-08-22

### Changed

- Upgraded every `@deepseek-ai/dsh-*` dependency to `0.1.1-rc.2` (devDependencies exact, peerDependencies `>=0.1.0-rc.8 <0.2.0`) and re-declared compatibility for DeepSeek Harness `0.1.1-rc.2`.

## [0.1.2] - 2026-08-21

### Changed

- Upgraded every `@deepseek-ai/dsh-*` dependency to `0.1.0-rc.8` (devDependencies exact, peerDependencies `>=0.1.0-rc.8 <0.2.0`) and re-declared compatibility for DeepSeek Harness `0.1.0-rc.8`.

## [0.1.1] - 2026-08-17

### Fixed

- The bundle patch now composes the storage stack (`@deepseek-ai/dsh-storage` + `dsh-storage-json` + `dsh-storage-domain`) and declares all three packages, so a bare profile gets the `storageDomain` service the plugin injects instead of hanging with `pending (waiting for service: storageDomain)`.

## [0.1.0] - 2026-08-16

- Initial release: local-first document knowledge base with hybrid semantic+keyword search, diversity re-ranking, citation-aware injection, cite/diagnose tools, and the /library command.

### Added

- Local-first knowledge base for DeepSeek Harness: `library_add` / `library_remove` / `library_list` / `library_search` / `library_cite_check` / `library_diagnose` plus the `/library` command.
- Hybrid semantic + keyword retrieval pipeline: deterministic hash embedding (zero downloads, optional external embedder command over `ctx.subprocess`), maximal-marginal-relevance diversity re-rank, relevance filtering, and lost-in-the-middle avoidance.
- Citation checking (`[n]` markers): fuzzy token-match plus semantic similarity against the search result page.
- Purge verification after `library_remove` (RAG-Purge-Verify port): token n-gram signature probes over the remaining index.
- Eight upstream quality ports under `src/quality/` (Apache-2.0, see THIRD_PARTY_NOTICES): Few-Shot-Selector, Context-Relevance-Scorer, Lost-in-Middle-Tester, RAG-Reference-Checker, RAG-Chunk-Visualizer, Retrieval-Diversity-Check, Citation-Validator-Lite, RAG-Purge-Verify.
- Storage-domain index (`dsh_library` domain: documents/chunks/purges tables) validated at the durable boundary; `library/inject` and `library/purge` session audit events.
