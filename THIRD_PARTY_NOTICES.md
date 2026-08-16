# Third-party notices

`src/quality/` ports eight upstream projects by the same author (PerryLink,
Apache-2.0 each, as verified in their `upstream/<name>/LICENSE` files). The
port keeps the upstream algorithm and vocabulary but replaces every
model-download dependency with local-rules equivalents — no upstream code is
bundled verbatim, and no model or index binary ships with this package.

| Upstream project | Ported into | Substitution |
|---|---|---|
| Few-Shot-Selector | `src/quality/few-shot.ts` | ChromaDB + SentenceTransformer → deterministic hash embedding |
| Context-Relevance-Scorer | `src/quality/relevance.ts` | cross-encoder model → weighted token-overlap scorer |
| Lost-in-Middle-Tester | `src/quality/lost-middle.ts` | probe LLM trials → deterministic position strategy + bin report |
| RAG-Reference-Checker | `src/quality/reference.ts` | SentenceTransformer (`download_model.py`) → hash embedding |
| RAG-Chunk-Visualizer | `src/quality/chunk-visual.ts` | pure sliding-window chunking + diagnostics |
| Retrieval-Diversity-Check | `src/quality/diversity.ts` | numpy/sklearn TF-IDF → shared token vocabulary |
| Citation-Validator-Lite | `src/quality/citation.ts` | `fuzzywuzzy.partial_ratio` → bounded token-sequence partial ratio |
| RAG-Purge-Verify | `src/quality/purge.ts` | vector-store engine probes → token n-gram signature probes |

The upstream sources remain in `upstream/` for reference only: the directory
is gitignored and excluded from the published package.

Runtime dependencies (peerDependencies) are the official
`@deepseek-ai/dsh-*` packages; build-time dependencies are `typescript` and
`tsdown` (regular dependencies so the git-install channel's `prepare` can
build), and `zod` (the storage-domain record schemas). The plugin performs no
network requests of its own and downloads nothing at install or run time.
