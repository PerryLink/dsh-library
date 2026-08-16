# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Local-first knowledge base for DeepSeek Harness: `library_add` / `library_remove` / `library_list` / `library_search` / `library_cite_check` / `library_diagnose` plus the `/library` command.
- Hybrid semantic + keyword retrieval pipeline: deterministic hash embedding (zero downloads, optional external embedder command over `ctx.subprocess`), maximal-marginal-relevance diversity re-rank, relevance filtering, and lost-in-the-middle avoidance.
- Citation checking (`[n]` markers): fuzzy token-match plus semantic similarity against the search result page.
- Purge verification after `library_remove` (RAG-Purge-Verify port): token n-gram signature probes over the remaining index.
- Eight upstream quality ports under `src/quality/` (Apache-2.0, see THIRD_PARTY_NOTICES): Few-Shot-Selector, Context-Relevance-Scorer, Lost-in-Middle-Tester, RAG-Reference-Checker, RAG-Chunk-Visualizer, Retrieval-Diversity-Check, Citation-Validator-Lite, RAG-Purge-Verify.
- Storage-domain index (`dsh_library` domain: documents/chunks/purges tables) validated at the durable boundary; `library/inject` and `library/purge` session audit events.
