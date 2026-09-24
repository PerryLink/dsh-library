# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.16] - 2026-09-25

### Changed

- Host pins move to `0.1.7-rc.2`; re-verified against that host line. Every `@deepseek-ai/dsh-*` dev/test dependency now pins `0.1.7-rc.2`, the `dshWorkshop.compatibility.dshVersions` timeline appends `0.1.7-rc.2`, and the compatibility baseline in every README records the `dsh-v0.1.7-rc.2` host. The declared host ranges (`engines.dsh` and the `peerDependencies` union) are deliberately **unchanged** — they already admit `0.1.7-rc.2`, and a range is what the manifest accepts, not what has been tested.

## [0.2.15] - 2026-09-24
### Changed

- Move the `@deepseek-ai/dsh-*` pins from `0.1.7-alpha.2` to `0.1.7-rc.1` and re-verify against that host line. `dshWorkshop.compatibility.dshVersions` records `0.1.7-rc.1` alongside the earlier lines, the five READMEs name `dsh-v0.1.7-rc.1`, and the compat workflow installs the `0.1.7-rc.1` host (`@deepseek-ai/dsh`, `dsh-base`, `dsh-headless`). The declared peer ranges and `engines.dsh` are deliberately **unchanged**: the existing four-clause union already admits `0.1.7-rc.1`, and the family convention keeps the declared range wider than the verified line. `0.1.7-rc.1` carries no plugin-facing seam change over `0.1.7-alpha.2` — the host's core packages differ only in their version fields — so no source or test expectation had to change.

## [0.2.14] - 2026-09-23

### Fixed

- The session-log audit appends were unreachable on the `0.1.7` line: the host removed the `'plugin'` catch-all from `MessageSourceMap`, so `source: { kind: 'plugin', plugin }` no longer type-checked and the `library/inject` / `library/purge` events could not be written at all. This package now declares its **own** message-source kind (`'dsh-library'`) through a `declare module '@deepseek-ai/dsh-llm'` augmentation — the same producer-owned pattern the host's own plugins use — instead of borrowing the deleted catch-all.

### Changed

- Move the `@deepseek-ai/dsh-*` dev/test pins to `0.1.7-alpha.2` and re-verify both rulers against that line: `typecheck` resolves the local harness checkout, `typecheck:ci` the published `0.1.7-alpha.2` faces.
- Every declared host range — `engines.dsh` and the nine `peerDependencies` bands — gains the `|| >=0.1.7-0 <0.2.0` arm, so the bands now admit the `0.1.7` prerelease line. Under semver's prerelease rule a range whose only prerelease comparators sit on earlier version tuples cannot admit a later alpha, so the previous three-arm form excluded the very host this release targets. No existing arm was removed or narrowed.
- `dshWorkshop.compatibility.dshVersions` gains `0.1.7-alpha.2`, and all five READMEs name the verified line.
- The compat workflow now installs the `0.1.7-alpha.2` host instead of `0.1.6-alpha.2`, so the scheduled end-to-end run exercises the line this package declares.

## [0.2.13] - 2026-09-19

### Added

- `pnpm run check:lockfile` (`scripts/check-lockfile-drift.mjs`) fails fast when `package.json` and `pnpm-lock.yaml` disagree; the probe is read-only and the documented checks chain runs it alongside the other gates.

### Changed

- The release workflow now publishes through **npm trusted publishing** (OIDC) instead of the long-lived `NPM_TOKEN` secret: `setup-node` no longer sets `registry-url` (its empty `_authToken` line made the registry answer 404 on PUT), npm is upgraded to >= 11.5.1 before publishing, and the "NPM_TOKEN is not set -> skip" guard is gone so a missing publisher cannot turn a release into a silent no-op.
## [0.2.12] - 2026-09-18

### Fixed

- The mount no longer loses its registrations when the fiber is disposed inside the dependency-resolution await: the storage-domain effect closes the handle with the fiber, and the tool/command registrations are skipped instead of throwing `INACTIVE_EFFECT` halfway through `apply`.

- The audit gate now decides whether this host can carry `library/inject` / `library/purge` from an **observed** probe instead of an append implementation's source text. At mount the plugin appends one audit event on a throwaway session and reads the returned record back; a host that stamps `ignorable === true` gets the marked appends, and every other host (including the `0.1.6-alpha.2` line, whose third append parameter is a `SurfaceIntent` that exists only for surface-eligible types) gets no append **plus one visible warning** instead of a silent skip. The three branch semantics are unchanged; the probe fails closed to "unsupported" on any error, and the test contract injects the verdict explicitly.

### Changed

- Declare `dsh.manifestVersion: 1` and the canonical three-clause `engines.dsh` (G-3).
- The CI workflow already runs both rulers (published peers + the alpha.2 checkout face with a freshness assertion); no change was needed there.

## [0.2.11] - 2026-09-12

### Changed

- Rename the four translated READMEs to `README-<lang>.md`. npm selects the package-page readme as the first markdown file matching its `{README,README.*}` glob (`@npmcli/package-json`, publish path), and that glob order puts `README.<lang>.md` ahead of `README.md` — so npm was serving the Simplified-Chinese file for this package too (measured on 15/15 sampled packages of the family). The new names sit outside the glob, so the English source is served again. No content changed apart from the language-switcher link each translation holds to its siblings, and the repo readme gate still passes. Takes effect with the next release; an already-published version cannot gain a corrected readme retroactively.
- Pin the `@deepseek-ai/dsh-*` dev/test dependencies to the published `0.1.5-rc.2` line and record `0.1.5-rc.2` in `dshWorkshop.compatibility.dshVersions`; the monthly Compat workflow now runs against `0.1.5-rc.2`. The peer range `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0` is unchanged, so no supported host line is dropped.

## [0.2.10] - 2026-09-10

### Changed

- Pin the `@deepseek-ai/dsh-*` dev/test dependencies to the published `0.1.5-rc.1` line and record `0.1.5-rc.1` in `dshWorkshop.compatibility.dshVersions`; the monthly Compat workflow now runs against `0.1.5-rc.1`. The peer range `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0` is unchanged, so no supported host line is dropped.

### Docs

- Refresh the five-language README compatibility baseline to `dsh-v0.1.5-rc.1` (verified 2026-09-10).

## [0.2.9] - 2026-09-09

### Changed

- Align the `@deepseek-ai/dsh-*` peer ranges to `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0` and pin the dev/test dependencies to the published `0.1.5-alpha.1` line: adaptation to DeepSeek Harness `dsh-v0.1.5-alpha.1` (session format V3, `ctx.agent` removal, `Inbox` type-only interface); runtime behavior is unchanged for every supported host line.
- Record `0.1.5-alpha.1` in `dshWorkshop.compatibility.dshVersions`.

### Docs

- Refresh the five-language README compatibility baseline to `dsh-v0.1.5-alpha.1` (verified 2026-09-09).

## [0.2.8] - 2026-09-08

### Docs

- Repair GBK mojibake in the package.json description: the em dash was corrupted to the U+95B3 U+30E6 U+646C marker sequence; the description is restored to the clean pre-corruption text (em dash before `SQLite`); no behavior change.


## [0.2.7] - 2026-09-07

### Docs

- Fix the DSH plugin badge URL: shields.io rejects the four-segment static badge form with "404 badge not found"; the label now uses the documented double-dash form (`dsh--plugin`), rendering identically; no behavior change.


## [0.2.6] - 2026-09-07

### Fixed

- Align the `@deepseek-ai/dsh-*` peer ranges to `>=0.1.2-rc.1 <0.2.0`: the older `>=0.1.0-rc.8 <0.2.0` band resolved to only the `0.1.0-rc.8` prerelease under registry-driven resolution and broke fresh tarball installs; no behavior change.

### Docs

- Refresh the five-language README support-version wording: the verified GitHub tag `dsh-v0.1.3-alpha.1` now leads the compatibility claim, while npm `0.1.2-rc.1` stays the published dependency-pin line (peers `>=0.1.2-rc.1 <0.2.0`); no behavior change.


## [0.2.5] - 2026-09-04

### Fixed

- Remove the `storage` / `storage-json` / `storage-domain` rows from the bundle patch: the shipped profiles compose that stack through `dsh-base`, so the inserted rows collided with the same ids and made the profile refuse to boot (`duplicate loader entry id: storage`). The patch now mounts only the plugin row; bare profiles compose the storage stack themselves.

## [0.2.4] - 2026-09-04
- Align devDeps pins to the published dsh 0.1.2-rc.1 line and move the compat CI probes from 0.1.1-rc.2 to 0.1.2-rc.1; no behavior change.

## [0.2.3] - 2026-09-02
- Align devDeps pins to the published dsh 0.1.2-alpha.5 line; no behavior change.

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
