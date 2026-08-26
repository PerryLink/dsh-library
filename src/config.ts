/**
 * Config schema and resolution for `dsh-library`. Every tunable is a
 * validated {@link Config} field changeable from cordis.yml (no hardcoded
 * tunables); `resolveConfig` is the explicit resolution step that fails loud
 * on out-of-range values and invalid embedder commands.
 * @module dsh-library/config
 */

import z from '@deepseek-ai/schemastery'

/** Library names: safe as domain keys and shown verbatim to the model. */
export const LIBRARY_NAME = /^[a-z0-9][a-z0-9-]{0,63}$/

/** Chunking defaults: window size and overlap, in characters. */
export const DEFAULT_CHUNK_SIZE = 900
export const DEFAULT_CHUNK_OVERLAP = 120
/** Files larger than this are rejected with a clear error instead of being truncated. */
export const DEFAULT_MAX_FILE_BYTES = 5 * 1024 * 1024
/** Absolute safety bound on one stored chunk (chunkSize must stay below it). */
export const MAX_CHUNK_CHARS = 4000
/** Hash-embedding dimensionality used by the zero-download local embedder. */
export const DEFAULT_EMBEDDING_DIMS = 256
/** Local Ollama base URL (zero cloud — only this localhost endpoint is ever contacted). */
export const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434'
/** Default Ollama embedding model. */
export const DEFAULT_OLLAMA_MODEL = 'nomic-embed-text'
/** Embedder subprocess budget. */
export const DEFAULT_EMBEDDING_TIMEOUT_MS = 30_000
export const DEFAULT_EMBEDDING_GRACE_MS = 1000
export const DEFAULT_EMBEDDING_MAX_OUTPUT_BYTES = 1024 * 1024
export const DEFAULT_EMBEDDING_MAX_BATCH = 64
/** Search defaults. */
export const DEFAULT_SEARCH_TOPK = 8
export const DEFAULT_SEARCH_HYBRID_WEIGHT = 0.6
export const DEFAULT_SEARCH_MIN_RELEVANCE = 0.15
export const DEFAULT_SEARCH_DIVERSITY_LAMBDA = 0.5
export const DEFAULT_SEARCH_MAX_RESULT_CHARS = 16_000
/** Lost-in-the-middle avoidance: strongest results pinned to head and tail. */
export const DEFAULT_LOST_MIDDLE_HEAD = 1
export const DEFAULT_LOST_MIDDLE_TAIL = 1
/** Injection defaults. */
export const DEFAULT_INJECT_MAX_CHARS = 12_000
/** Citation defaults. */
export const DEFAULT_CITATION_WINDOW_CHARS = 150
export const DEFAULT_CITATION_MIN_SCORE = 40
export const DEFAULT_CITATION_MIN_SEMANTIC = 0.1
/** Purge verification defaults. */
export const DEFAULT_PURGE_SIGNATURE_LENGTH = 4
export const DEFAULT_PURGE_MAX_PROBES = 24
/** Diagnose defaults. */
export const DEFAULT_DIAGNOSE_MAX_DUPLICATE_PAIRS = 24
export const DEFAULT_DIAGNOSE_SAMPLE_CAP = 200
export const DEFAULT_DIAGNOSE_POSITION_BINS = 5

/** Embedder selection: built-in hash embedding, an external command, or a local Ollama server. */
export interface EmbeddingConfig {
  /** Hash-embedding dimensionality (built-in embedder only). Must be ≥ 8. */
  dims?: number
  /**
   * Which embedder backend to use: `hash` (built-in, zero downloads), `command`
   * (the external subprocess protocol, requires `command`), or `ollama` (a
   * local Ollama server, probed and degraded to `hash` when unavailable).
   * When `command` is set, the command provider wins regardless of this field.
   */
  provider?: 'hash' | 'command' | 'ollama'
  /**
   * Optional external embedder command line (space-separated, no shell
   * interpretation; executed through `ctx.subprocess`). The command must read
   * one JSON object per text line on stdin (`{"index": <n>, "text": "..."}`)
   * and write one JSON object per line on stdout
   * (`{"index": <n>, "vector": [<number>, ...]}`). Indices must cover every
   * input line exactly once. When unset, the built-in deterministic hash
   * embedder runs with zero downloads.
   */
  command?: string
  /** Local Ollama base URL for the `ollama` provider (default `http://127.0.0.1:11434`). */
  ollamaUrl?: string
  /** Ollama embedding model name (default `nomic-embed-text`). */
  ollamaModel?: string
  /** Cooperative timeout for one embedder invocation (ms). */
  timeoutMs?: number
  /** Terminate-escalation grace handed to the subprocess seam (ms). */
  graceMs?: number
  /** Max bytes of one embedder stdout before the batch fails. */
  maxOutputBytes?: number
  /** Max texts embedded per subprocess invocation; larger batches are split. */
  maxBatchItems?: number
}

/** Search pipeline tuning (hybrid scoring → diversity re-rank → relevance filter → position strategy). */
export interface SearchConfig {
  /** How many chunks one search returns after the full pipeline. */
  topK?: number
  /**
   * Hybrid weight: 0 = keyword-only, 1 = semantic-only. Keyword and semantic
   * scores are each normalized to 0..1 before combining.
   */
  hybridWeight?: number
  /** Chunks scoring below this relevance threshold are filtered out (fail closed to fewer, better results). */
  minRelevance?: number
  /** Diversity re-rank weight: 1 = pure relevance order, 0 = pure diversity. */
  diversityLambda?: number
  /** Strongest chunks pinned to the head of the context (lost-in-the-middle avoidance). */
  lostMiddleHead?: number
  /** Strongest chunks pinned to the tail of the context. */
  lostMiddleTail?: number
  /** Character budget for the model-facing result page; longer pages are truncated with a marker. */
  maxResultChars?: number
}

/** On-demand `agent.inject()` behavior of `library_search`. */
export interface InjectionConfig {
  /** Whether `library_search` with `inject: true` injects into the calling agent. */
  enabled?: boolean
  /** Character budget of one injected context message. */
  maxChars?: number
}

/** Citation checking thresholds for `library_cite_check`. */
export interface CitationConfig {
  /** Context window (chars) around each citation marker that forms the claim. */
  windowChars?: number
  /** Minimum fuzzy token-match score (0-100) for a citation to be valid. */
  minScore?: number
  /** Minimum semantic similarity (hash embedding, 0-1) for a citation to be valid. */
  minSemantic?: number
}

/** Purge verification (RAG-Purge-Verify port) after `library_remove`. */
export interface PurgeConfig {
  /** Token n-gram length of the removed-content signatures scanned for residue. */
  signatureLength?: number
  /** How many signatures are probed per removal; longer documents sample deterministically. */
  maxProbes?: number
}

/** `library_diagnose` budget caps. */
export interface DiagnoseConfig {
  /** Cap on reported near-duplicate chunk pairs. */
  maxDuplicatePairs?: number
  /** Chunks sampled into the duplicate scan (the pair check is quadratic). */
  sampleCap?: number
  /** How many position bins the lost-in-the-middle report uses. */
  positionBins?: number
}

/** Raw plugin config — every field optional; {@link Config} supplies the defaults. */
export interface Config {
  /** Sliding-window chunk size in characters. */
  chunkSize?: number
  /** Sliding-window overlap in characters; must be smaller than {@link Config.chunkSize}. */
  chunkOverlap?: number
  /** Max bytes of one imported file; larger files fail with a clear error. */
  maxFileBytes?: number
  /** Embedding options (see {@link EmbeddingConfig}). */
  embedding?: EmbeddingConfig
  /** Search pipeline options (see {@link SearchConfig}). */
  search?: SearchConfig
  /** Injection options (see {@link InjectionConfig}). */
  injection?: InjectionConfig
  /** Citation options (see {@link CitationConfig}). */
  citation?: CitationConfig
  /** Purge options (see {@link PurgeConfig}). */
  purge?: PurgeConfig
  /** Diagnose options (see {@link DiagnoseConfig}). */
  diagnose?: DiagnoseConfig
}

/** Resolved embedding config: defaults applied, `command` explicitly optional. */
export interface ResolvedEmbeddingConfig {
  readonly dims: number
  readonly provider: 'hash' | 'command' | 'ollama'
  readonly command: string | undefined
  readonly ollamaUrl: string
  readonly ollamaModel: string
  readonly timeoutMs: number
  readonly graceMs: number
  readonly maxOutputBytes: number
  readonly maxBatchItems: number
}

/** Resolved search config after defaulting. */
export interface ResolvedSearchConfig {
  readonly topK: number
  readonly hybridWeight: number
  readonly minRelevance: number
  readonly diversityLambda: number
  readonly lostMiddleHead: number
  readonly lostMiddleTail: number
  readonly maxResultChars: number
}

/** Resolved injection config after defaulting. */
export interface ResolvedInjectionConfig {
  readonly enabled: boolean
  readonly maxChars: number
}

/** Resolved citation config after defaulting. */
export interface ResolvedCitationConfig {
  readonly windowChars: number
  readonly minScore: number
  readonly minSemantic: number
}

/** Resolved purge config after defaulting. */
export interface ResolvedPurgeConfig {
  readonly signatureLength: number
  readonly maxProbes: number
}

/** Resolved diagnose config after defaulting. */
export interface ResolvedDiagnoseConfig {
  readonly maxDuplicatePairs: number
  readonly sampleCap: number
  readonly positionBins: number
}

/** Config after {@link resolveConfig}: every optional field has its explicit default. */
export interface ResolvedConfig {
  readonly chunkSize: number
  readonly chunkOverlap: number
  readonly maxFileBytes: number
  readonly embedding: ResolvedEmbeddingConfig
  readonly search: ResolvedSearchConfig
  readonly injection: ResolvedInjectionConfig
  readonly citation: ResolvedCitationConfig
  readonly purge: ResolvedPurgeConfig
  readonly diagnose: ResolvedDiagnoseConfig
}

/** Schemastery schema: the loader validates and fills defaults before `apply`. */
export const Config: z<Config> = z.object({
  chunkSize: z.number().default(DEFAULT_CHUNK_SIZE),
  chunkOverlap: z.number().default(DEFAULT_CHUNK_OVERLAP),
  maxFileBytes: z.number().default(DEFAULT_MAX_FILE_BYTES),
  embedding: z.object({
    dims: z.number().default(DEFAULT_EMBEDDING_DIMS),
    provider: z.union([z.const('hash'), z.const('command'), z.const('ollama')]).default('hash'),
    command: z.string(),
    ollamaUrl: z.string().default(DEFAULT_OLLAMA_URL),
    ollamaModel: z.string().default(DEFAULT_OLLAMA_MODEL),
    timeoutMs: z.number().default(DEFAULT_EMBEDDING_TIMEOUT_MS),
    graceMs: z.number().default(DEFAULT_EMBEDDING_GRACE_MS),
    maxOutputBytes: z.number().default(DEFAULT_EMBEDDING_MAX_OUTPUT_BYTES),
    maxBatchItems: z.number().default(DEFAULT_EMBEDDING_MAX_BATCH),
  }).default({
    dims: DEFAULT_EMBEDDING_DIMS,
    provider: 'hash',
    command: '',
    ollamaUrl: DEFAULT_OLLAMA_URL,
    ollamaModel: DEFAULT_OLLAMA_MODEL,
    timeoutMs: DEFAULT_EMBEDDING_TIMEOUT_MS,
    graceMs: DEFAULT_EMBEDDING_GRACE_MS,
    maxOutputBytes: DEFAULT_EMBEDDING_MAX_OUTPUT_BYTES,
    maxBatchItems: DEFAULT_EMBEDDING_MAX_BATCH,
  }),
  search: z.object({
    topK: z.number().default(DEFAULT_SEARCH_TOPK),
    hybridWeight: z.number().default(DEFAULT_SEARCH_HYBRID_WEIGHT),
    minRelevance: z.number().default(DEFAULT_SEARCH_MIN_RELEVANCE),
    diversityLambda: z.number().default(DEFAULT_SEARCH_DIVERSITY_LAMBDA),
    lostMiddleHead: z.number().default(DEFAULT_LOST_MIDDLE_HEAD),
    lostMiddleTail: z.number().default(DEFAULT_LOST_MIDDLE_TAIL),
    maxResultChars: z.number().default(DEFAULT_SEARCH_MAX_RESULT_CHARS),
  }).default({
    topK: DEFAULT_SEARCH_TOPK,
    hybridWeight: DEFAULT_SEARCH_HYBRID_WEIGHT,
    minRelevance: DEFAULT_SEARCH_MIN_RELEVANCE,
    diversityLambda: DEFAULT_SEARCH_DIVERSITY_LAMBDA,
    lostMiddleHead: DEFAULT_LOST_MIDDLE_HEAD,
    lostMiddleTail: DEFAULT_LOST_MIDDLE_TAIL,
    maxResultChars: DEFAULT_SEARCH_MAX_RESULT_CHARS,
  }),
  injection: z.object({
    enabled: z.boolean().default(true),
    maxChars: z.number().default(DEFAULT_INJECT_MAX_CHARS),
  }).default({ enabled: true, maxChars: DEFAULT_INJECT_MAX_CHARS }),
  citation: z.object({
    windowChars: z.number().default(DEFAULT_CITATION_WINDOW_CHARS),
    minScore: z.number().default(DEFAULT_CITATION_MIN_SCORE),
    minSemantic: z.number().default(DEFAULT_CITATION_MIN_SEMANTIC),
  }).default({
    windowChars: DEFAULT_CITATION_WINDOW_CHARS,
    minScore: DEFAULT_CITATION_MIN_SCORE,
    minSemantic: DEFAULT_CITATION_MIN_SEMANTIC,
  }),
  purge: z.object({
    signatureLength: z.number().default(DEFAULT_PURGE_SIGNATURE_LENGTH),
    maxProbes: z.number().default(DEFAULT_PURGE_MAX_PROBES),
  }).default({ signatureLength: DEFAULT_PURGE_SIGNATURE_LENGTH, maxProbes: DEFAULT_PURGE_MAX_PROBES }),
  diagnose: z.object({
    maxDuplicatePairs: z.number().default(DEFAULT_DIAGNOSE_MAX_DUPLICATE_PAIRS),
    sampleCap: z.number().default(DEFAULT_DIAGNOSE_SAMPLE_CAP),
    positionBins: z.number().default(DEFAULT_DIAGNOSE_POSITION_BINS),
  }).default({
    maxDuplicatePairs: DEFAULT_DIAGNOSE_MAX_DUPLICATE_PAIRS,
    sampleCap: DEFAULT_DIAGNOSE_SAMPLE_CAP,
    positionBins: DEFAULT_DIAGNOSE_POSITION_BINS,
  }),
})

/** Reject a non-positive or non-integer count with the owning key name. */
function assertPositiveInteger(name: string, value: number): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`dsh-library: ${name} must be a positive safe integer, got ${String(value)}`)
  }
}

/** Reject a non-finite number with the owning key name. */
function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new TypeError(`dsh-library: ${name} must be finite, got ${String(value)}`)
  }
}

/**
 * Validate raw values and compile the resolved config. Defaults are applied
 * HERE — the explicit resolution step — so a partially-specified config from
 * a direct `ctx.plugin` mount behaves like the loader-filled one.
 * @param config - raw (possibly partial) plugin config.
 * @returns the fully resolved config.
 * @throws TypeError on non-positive caps, an oversized chunk window, or an
 *   embedder command without an executable part (misconfiguration fails loud).
 */
export function resolveConfig(config: Config = {}): ResolvedConfig {
  assertPositiveInteger('chunkSize', config.chunkSize ?? DEFAULT_CHUNK_SIZE)
  assertPositiveInteger('chunkOverlap', config.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP)
  assertPositiveInteger('maxFileBytes', config.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES)
  const chunkSize = config.chunkSize ?? DEFAULT_CHUNK_SIZE
  const chunkOverlap = config.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP
  if (chunkSize > MAX_CHUNK_CHARS) {
    throw new TypeError(`dsh-library: chunkSize must not exceed ${MAX_CHUNK_CHARS}, got ${chunkSize}`)
  }
  if (chunkOverlap >= chunkSize) {
    throw new TypeError(`dsh-library: chunkOverlap (${chunkOverlap}) must be smaller than chunkSize (${chunkSize})`)
  }
  const embedding = config.embedding ?? {}
  const dims = embedding.dims ?? DEFAULT_EMBEDDING_DIMS
  if (!Number.isSafeInteger(dims) || dims < 8) {
    throw new TypeError(`dsh-library: embedding.dims must be an integer ≥ 8, got ${String(dims)}`)
  }
  for (const [name, value] of [
    ['embedding.timeoutMs', embedding.timeoutMs ?? DEFAULT_EMBEDDING_TIMEOUT_MS],
    ['embedding.graceMs', embedding.graceMs ?? DEFAULT_EMBEDDING_GRACE_MS],
    ['embedding.maxOutputBytes', embedding.maxOutputBytes ?? DEFAULT_EMBEDDING_MAX_OUTPUT_BYTES],
    ['embedding.maxBatchItems', embedding.maxBatchItems ?? DEFAULT_EMBEDDING_MAX_BATCH],
  ] as const) {
    assertPositiveInteger(name, value)
  }
  const rawCommand = embedding.command
  const command = rawCommand === undefined || rawCommand.trim().length === 0 ? undefined : rawCommand.trim()
  const rawProvider = embedding.provider
  let provider: 'hash' | 'command' | 'ollama'
  if (command !== undefined) {
    provider = 'command' // an explicit command wins over any provider spelling
  } else if (rawProvider === undefined || rawProvider === 'hash') {
    provider = 'hash'
  } else if (rawProvider === 'command') {
    throw new TypeError('dsh-library: embedding.provider=command requires embedding.command to be set')
  } else if (rawProvider === 'ollama') {
    provider = 'ollama'
  } else {
    throw new TypeError(`dsh-library: embedding.provider must be hash|command|ollama, got ${JSON.stringify(rawProvider)}`)
  }
  const ollamaUrl = (embedding.ollamaUrl ?? DEFAULT_OLLAMA_URL).trim()
  const ollamaModel = (embedding.ollamaModel ?? DEFAULT_OLLAMA_MODEL).trim()
  if (provider === 'ollama') {
    if (ollamaUrl.length === 0) throw new TypeError('dsh-library: embedding.ollamaUrl must be a non-empty URL when provider=ollama')
    if (ollamaModel.length === 0) throw new TypeError('dsh-library: embedding.ollamaModel must be a non-empty model name when provider=ollama')
  }
  const search = config.search ?? {}
  const topK = search.topK ?? DEFAULT_SEARCH_TOPK
  assertPositiveInteger('search.topK', topK)
  for (const [name, value] of [
    ['search.hybridWeight', search.hybridWeight ?? DEFAULT_SEARCH_HYBRID_WEIGHT],
    ['search.minRelevance', search.minRelevance ?? DEFAULT_SEARCH_MIN_RELEVANCE],
    ['search.diversityLambda', search.diversityLambda ?? DEFAULT_SEARCH_DIVERSITY_LAMBDA],
    ['search.maxResultChars', search.maxResultChars ?? DEFAULT_SEARCH_MAX_RESULT_CHARS],
  ] as const) {
    assertFinite(name, value)
  }
  const hybridWeight = search.hybridWeight ?? DEFAULT_SEARCH_HYBRID_WEIGHT
  if (hybridWeight < 0 || hybridWeight > 1) {
    throw new TypeError(`dsh-library: search.hybridWeight must be within 0..1, got ${hybridWeight}`)
  }
  const minRelevance = search.minRelevance ?? DEFAULT_SEARCH_MIN_RELEVANCE
  if (minRelevance < 0 || minRelevance > 1) {
    throw new TypeError(`dsh-library: search.minRelevance must be within 0..1, got ${minRelevance}`)
  }
  const diversityLambda = search.diversityLambda ?? DEFAULT_SEARCH_DIVERSITY_LAMBDA
  if (diversityLambda < 0 || diversityLambda > 1) {
    throw new TypeError(`dsh-library: search.diversityLambda must be within 0..1, got ${diversityLambda}`)
  }
  const lostMiddleHead = search.lostMiddleHead ?? DEFAULT_LOST_MIDDLE_HEAD
  const lostMiddleTail = search.lostMiddleTail ?? DEFAULT_LOST_MIDDLE_TAIL
  if (!Number.isSafeInteger(lostMiddleHead) || lostMiddleHead < 0
    || !Number.isSafeInteger(lostMiddleTail) || lostMiddleTail < 0
    || lostMiddleHead + lostMiddleTail > topK) {
    throw new TypeError(`dsh-library: search.lostMiddleHead + search.lostMiddleTail (${lostMiddleHead} + ${lostMiddleTail}) must not exceed search.topK (${topK})`)
  }
  const injection = config.injection ?? {}
  assertPositiveInteger('injection.maxChars', injection.maxChars ?? DEFAULT_INJECT_MAX_CHARS)
  const citation = config.citation ?? {}
  assertPositiveInteger('citation.windowChars', citation.windowChars ?? DEFAULT_CITATION_WINDOW_CHARS)
  const minScore = citation.minScore ?? DEFAULT_CITATION_MIN_SCORE
  if (!Number.isFinite(minScore) || minScore < 0 || minScore > 100) {
    throw new TypeError(`dsh-library: citation.minScore must be within 0..100, got ${String(minScore)}`)
  }
  const minSemantic = citation.minSemantic ?? DEFAULT_CITATION_MIN_SEMANTIC
  if (!Number.isFinite(minSemantic) || minSemantic < 0 || minSemantic > 1) {
    throw new TypeError(`dsh-library: citation.minSemantic must be within 0..1, got ${String(minSemantic)}`)
  }
  const purge = config.purge ?? {}
  assertPositiveInteger('purge.signatureLength', purge.signatureLength ?? DEFAULT_PURGE_SIGNATURE_LENGTH)
  assertPositiveInteger('purge.maxProbes', purge.maxProbes ?? DEFAULT_PURGE_MAX_PROBES)
  const diagnose = config.diagnose ?? {}
  assertPositiveInteger('diagnose.maxDuplicatePairs', diagnose.maxDuplicatePairs ?? DEFAULT_DIAGNOSE_MAX_DUPLICATE_PAIRS)
  assertPositiveInteger('diagnose.sampleCap', diagnose.sampleCap ?? DEFAULT_DIAGNOSE_SAMPLE_CAP)
  const positionBins = diagnose.positionBins ?? DEFAULT_DIAGNOSE_POSITION_BINS
  if (!Number.isSafeInteger(positionBins) || positionBins < 2) {
    throw new TypeError(`dsh-library: diagnose.positionBins must be an integer ≥ 2, got ${String(positionBins)}`)
  }
  return {
    chunkSize,
    chunkOverlap,
    maxFileBytes: config.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES,
    embedding: {
      dims,
      provider,
      command: command === undefined ? undefined : command.trim(),
      ollamaUrl,
      ollamaModel,
      timeoutMs: embedding.timeoutMs ?? DEFAULT_EMBEDDING_TIMEOUT_MS,
      graceMs: embedding.graceMs ?? DEFAULT_EMBEDDING_GRACE_MS,
      maxOutputBytes: embedding.maxOutputBytes ?? DEFAULT_EMBEDDING_MAX_OUTPUT_BYTES,
      maxBatchItems: embedding.maxBatchItems ?? DEFAULT_EMBEDDING_MAX_BATCH,
    },
    search: {
      topK,
      hybridWeight,
      minRelevance,
      diversityLambda,
      lostMiddleHead,
      lostMiddleTail,
      maxResultChars: search.maxResultChars ?? DEFAULT_SEARCH_MAX_RESULT_CHARS,
    },
    injection: {
      enabled: injection.enabled ?? true,
      maxChars: injection.maxChars ?? DEFAULT_INJECT_MAX_CHARS,
    },
    citation: {
      windowChars: citation.windowChars ?? DEFAULT_CITATION_WINDOW_CHARS,
      minScore,
      minSemantic,
    },
    purge: {
      signatureLength: purge.signatureLength ?? DEFAULT_PURGE_SIGNATURE_LENGTH,
      maxProbes: purge.maxProbes ?? DEFAULT_PURGE_MAX_PROBES,
    },
    diagnose: {
      maxDuplicatePairs: diagnose.maxDuplicatePairs ?? DEFAULT_DIAGNOSE_MAX_DUPLICATE_PAIRS,
      sampleCap: diagnose.sampleCap ?? DEFAULT_DIAGNOSE_SAMPLE_CAP,
      positionBins,
    },
  }
}
