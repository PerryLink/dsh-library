/**
 * `dsh-library` — the local-first knowledge base for DeepSeek Harness:
 * import md/txt documents into a storage-domain index, retrieve with a
 * hybrid semantic+keyword pipeline (diversity re-rank, relevance filter,
 * lost-in-the-middle avoidance), verify citations against retrieved chunks,
 * and diagnose chunk/retrieval quality. Everything model-visible carries a
 * source marker. The `library/inject` and `library/purge` audit events are
 * appended through the adaptive host gate (see `events.ts`); where the host
 * cannot carry them, the logged `tool/call` + `tool/result` events remain the
 * reconstructable trail. Document paths and embeddings never reach the log.
 *
 * Function plugin — no default export (the Loader unwraps
 * `exports.default ?? exports`).
 * @module dsh-library
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-commands'
import type { CommandInvocation } from '@deepseek-ai/dsh-commands'
import { defineDomain, type Domain, type KvTable } from '@deepseek-ai/dsh-storage-domain'
import { z as zod } from 'zod'
import type { FileSystem } from '@deepseek-ai/dsh-fs'
import { MessageId, type UserMessage } from '@deepseek-ai/dsh-llm'
import type { SubprocessRuntime } from '@deepseek-ai/dsh-subprocess'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ToolRunContext } from '@deepseek-ai/dsh-tools'
import { Config, resolveConfig, LIBRARY_NAME, type ResolvedConfig } from './config.ts'
import { cosine, resolveEmbedder, type Embedder } from './embedding.ts'
import { chunkIdOf, chunkKey, documentIdOf, documentKey, injectId, purgeId } from './ids.ts'
import { chunkSizeHistogram, chunkText, findDuplicateChunks, type Chunk } from './quality/chunk-visual.ts'
import { maximalMarginalRelevance } from './quality/diversity.ts'
import { avoidLostMiddle, middlePenalty, positionBins } from './quality/lost-middle.ts'
import { scoreRelevance } from './quality/relevance.ts'
import { validateCitations } from './quality/citation.ts'
import { verifyReferences } from './quality/reference.ts'
import { verifyPurge } from './quality/purge.ts'
import { appendAuditEvent, INJECT_EVENT, PURGE_EVENT, type LibraryInjectEvent, type LibraryPurgeEvent } from './events.ts'

export const name = 'dsh-library'

/** Hard services: the durable index lives in the storage domain; tools and the command register here. */
export const inject = ['storageDomain', 'tools', 'commands']

export { Config, resolveConfig, LIBRARY_NAME } from './config.ts'
export type { ResolvedConfig, EmbeddingConfig, SearchConfig, InjectionConfig, CitationConfig, PurgeConfig, DiagnoseConfig } from './config.ts'
export { embedHash, cosine, splitCommandLine, HashEmbedder, CommandEmbedder, OllamaEmbedder, probeOllama, resolveEmbedder } from './embedding.ts'
export type { Embedder, EmbedderResolution } from './embedding.ts'
export { CHUNK_SIZE_BUCKETS, chunkSizeHistogram, chunkText, chunkHash, findDuplicateChunks } from './quality/chunk-visual.ts'
export type { Chunk, ChunkSizeHistogram, ChunkDiagnostics } from './quality/chunk-visual.ts'
export { checkDiversity, maximalMarginalRelevance } from './quality/diversity.ts'
export type { DiversityReport, RerankCandidate, DuplicatePair } from './quality/diversity.ts'
export { successByPosition, makeProbe, insertProbe, buildProbePrompt, avoidLostMiddle, positionBins, middlePenalty, PROBE_PREFIX } from './quality/lost-middle.ts'
export type { ProbeResult, PositionStats, RankedItem, PositionBin } from './quality/lost-middle.ts'
export { scoreRelevance, scoreBatch, filterDocuments } from './quality/relevance.ts'
export type { ScoredDocument } from './quality/relevance.ts'
export { validateQaPair, selectFewShot, formatFewShotPrompt } from './quality/few-shot.ts'
export type { QaExample, SelectedExample, FewShotOptions } from './quality/few-shot.ts'
export { extractCitations, extractContext, verifyReferences } from './quality/reference.ts'
export type { CitationMarker, ReferenceDocument, ReferenceVerdict, ReferenceReport, ReferenceOptions } from './quality/reference.ts'
export { extractCitationNumbers, extractSentenceWithCitation, fuzzyPartialRatio, validateCitation, validateCitations } from './quality/citation.ts'
export type { CitationMatch, ValidationResult } from './quality/citation.ts'
export { verifyPurge, sampleSignatures } from './quality/purge.ts'
export type { RemainingChunk, PurgeProbeResult, PurgeReport, PurgeOptions } from './quality/purge.ts'
export { INJECT_EVENT, PURGE_EVENT, appendAuditEvent } from './events.ts'
export type { LibraryInjectEvent, LibraryPurgeEvent } from './events.ts'

/** Durable document record. */
const documentSchema = zod.object({
  library: zod.string(),
  documentId: zod.string(),
  name: zod.string(),
  contentHash: zod.string(),
  chunks: zod.array(zod.string()),
  chars: zod.number().int().nonnegative(),
  createdAt: zod.number().int().nonnegative(),
})
type DocumentRecord = zod.infer<typeof documentSchema>

/** Durable chunk record: text plus its precomputed embedding. */
const chunkSchema = zod.object({
  library: zod.string(),
  chunkId: zod.string(),
  documentId: zod.string(),
  seq: zod.number().int().nonnegative(),
  text: zod.string(),
  embedding: zod.array(zod.number()),
})
type ChunkRecord = zod.infer<typeof chunkSchema>

/** Durable purge-verification record. */
const purgeSchema = zod.object({
  purgeId: zod.string(),
  library: zod.string(),
  documentId: zod.string(),
  passed: zod.boolean(),
  totalFound: zod.number().int().nonnegative(),
  at: zod.number().int().nonnegative(),
})
type PurgeRecord = zod.infer<typeof purgeSchema>

/** The dsh-library storage-domain declaration (unit names allow `[a-z][a-z0-9_]*` only). */
export const libraryDomainSpec = defineDomain({
  name: 'dsh_library',
  version: 1,
  tables: {
    documents: { valueSchema: documentSchema },
    chunks: { valueSchema: chunkSchema },
    purges: { valueSchema: purgeSchema },
  },
})

/** Optional seams resolved at call time; the embedder is resolved at mount (fail closed when absent). */
interface StoreDeps {
  readonly embedder: Embedder
}

/** One `library_add` outcome. */
export interface LibraryAddResult {
  readonly library: string
  readonly documentId: string
  readonly name: string
  readonly chunks: number
  readonly chars: number
}

/** One `library_remove` outcome, including the purge verification. */
export interface LibraryRemoveResult {
  readonly library: string
  readonly documentId: string
  readonly removedChunks: number
  readonly purgePassed: boolean
  readonly purgeTotalFound: number
}

/** One `library_list` entry (no text). */
export interface LibraryListEntry {
  readonly library: string
  readonly documentId: string
  readonly name: string
  readonly chunks: number
  readonly chars: number
  readonly createdAt: number
}

/** One `library_search` hit. */
export interface LibrarySearchHit {
  readonly chunkId: string
  readonly documentId: string
  readonly seq: number
  /** Snippet of the chunk text (sanitized, capped). */
  readonly snippet: string
  /** Final combined score (post re-rank order is positional, not this value). */
  readonly score: number
}

/** The `library_search` canonical result. */
export interface LibrarySearchResult {
  readonly library: string
  readonly query: string
  readonly results: LibrarySearchHit[]
  /** True when the result page was injected into the calling agent. */
  readonly injected: boolean
}

/** One `library_cite_check` citation verdict. */
export interface LibraryCiteVerdict {
  readonly citation: string
  readonly sourceDocumentId: string
  readonly sourceSeq: number
  readonly valid: boolean
  readonly fuzzyScore: number
  readonly semanticSimilarity: number
  readonly reason: string
}

/** The `library_cite_check` report. */
export interface LibraryCiteReport {
  readonly library: string
  readonly query: string
  readonly total: number
  readonly valid: number
  readonly details: LibraryCiteVerdict[]
}

/** The `library_diagnose` report. */
export interface LibraryDiagnoseReport {
  readonly library: string
  readonly documents: number
  readonly chunks: number
  readonly histogram: ReturnType<typeof chunkSizeHistogram>
  readonly duplicatePairs: number
  readonly selfRetrieval: { probes: number; topKHit: number }
  readonly middlePenalty: number
}

/** Whether a library name is usable as a domain key. */
function assertLibraryName(library: string): string {
  const trimmed = library.trim()
  if (!LIBRARY_NAME.test(trimmed)) {
    throw new Error(`library name must match ${String(LIBRARY_NAME)}, got ${JSON.stringify(library)}`)
  }
  return trimmed
}

/** Bound one snippet for display: control characters stripped, length capped. */
function snippetOf(text: string, maxChars = 200): string {
  const cleaned = text.replace(/[\u0000-\u001f\u007f]/gu, ' ').replace(/\s+/gu, ' ').trim()
  return cleaned.length <= maxChars ? cleaned : `${cleaned.slice(0, maxChars - 1)}…`
}

/** One ranked candidate for the MMR step. */
interface Candidate {
  readonly chunk: ChunkRecord
  readonly hybrid: number
}

/** Safety bound on the MMR candidate pool (quadratic step; not a user tunable). */
const MAX_CANDIDATE_BOUND = 500

/**
 * The index runtime over one open storage domain: add/remove/list/search/
 * cite/diagnose. All record shapes are validated by the domain at the
 * durable boundary; this class never logs text or embeddings.
 */
export class LibraryStore {
  private readonly documents: KvTable<string, DocumentRecord>
  private readonly chunks: KvTable<string, ChunkRecord>
  private readonly purges: KvTable<string, PurgeRecord>

  /**
   * @param domain - the opened dsh-library domain.
   * @param config - resolved plugin config.
   * @param deps - optional subprocess seam for the external embedder.
   */
  constructor(
    domain: Domain<typeof libraryDomainSpec>,
    private readonly config: ResolvedConfig,
    private readonly deps: StoreDeps,
  ) {
    this.documents = domain.table('documents')
    this.chunks = domain.table('chunks')
    this.purges = domain.table('purges')
  }

  /** Embed a text batch with the resolved embedder backend. */
  private async embed(texts: readonly string[]): Promise<number[][]> {
    return this.deps.embedder.embed(texts)
  }

  /**
   * Import one document: chunk it, embed the chunks, and store the records.
   * @param library - target library name.
   * @param docName - display name.
   * @param content - full document text.
   * @returns the add summary.
   */
  async add(library: string, docName: string, content: string): Promise<LibraryAddResult> {
    const trimmedLibrary = assertLibraryName(library)
    const bytes = Buffer.byteLength(content, 'utf8')
    if (bytes > this.config.maxFileBytes) {
      throw new Error(`document is ${bytes} bytes; the cap is ${this.config.maxFileBytes} (config maxFileBytes)`)
    }
    const documentId = documentIdOf(content)
    const slices = chunkText(content, this.config.chunkSize, this.config.chunkOverlap)
    const embeddings = await this.embed(slices.map(slice => slice.text))
    const chunkIds = slices.map((_slice, index) => chunkIdOf(documentId, index))
    for (let index = 0; index < slices.length; index += 1) {
      await this.chunks.put(chunkKey(trimmedLibrary, chunkIds[index]!), {
        library: trimmedLibrary,
        chunkId: chunkIds[index]!,
        documentId,
        seq: index,
        text: slices[index]!.text,
        embedding: embeddings[index]!,
      })
    }
    await this.documents.put(documentKey(trimmedLibrary, documentId), {
      library: trimmedLibrary,
      documentId,
      name: docName.trim() || documentId,
      contentHash: documentId,
      chunks: chunkIds,
      chars: content.length,
      createdAt: Date.now(),
    })
    return { library: trimmedLibrary, documentId, name: docName.trim() || documentId, chunks: chunkIds.length, chars: content.length }
  }

  /**
   * Remove one document and verify the purge: the removed content must leave
   * no residue in the remaining chunks of the library.
   * @param library - owning library name.
   * @param documentId - stable document id.
   * @returns the removal summary plus the purge verdict.
   */
  async remove(library: string, documentId: string): Promise<LibraryRemoveResult> {
    const trimmedLibrary = assertLibraryName(library)
    const record = this.documents.get(documentKey(trimmedLibrary, documentId))
    if (record === undefined) {
      throw new Error(`document ${JSON.stringify(documentId)} does not exist in library ${JSON.stringify(trimmedLibrary)}`)
    }
    const removedTexts: string[] = []
    for (const chunkId of record.chunks) {
      const chunk = this.chunks.get(chunkKey(trimmedLibrary, chunkId))
      if (chunk !== undefined) removedTexts.push(chunk.text)
      await this.chunks.delete(chunkKey(trimmedLibrary, chunkId))
    }
    await this.documents.delete(documentKey(trimmedLibrary, documentId))
    const remaining = [...this.chunks.entries()]
      .filter(([key]) => key.startsWith(`${trimmedLibrary}:`))
      .map(([, chunk]) => ({ id: chunk.chunkId, text: chunk.text }))
    const report = verifyPurge(remaining, removedTexts.join('\n'), {
      signatureLength: this.config.purge.signatureLength,
      maxProbes: this.config.purge.maxProbes,
    })
    const id = purgeId()
    await this.purges.put(id, {
      purgeId: id,
      library: trimmedLibrary,
      documentId,
      passed: report.passed,
      totalFound: report.totalFound,
      at: Date.now(),
    })
    return { library: trimmedLibrary, documentId, removedChunks: record.chunks.length, purgePassed: report.passed, purgeTotalFound: report.totalFound }
  }

  /** List documents (metadata only, never text) of one library or every library. */
  list(library?: string): LibraryListEntry[] {
    const filter = library === undefined ? undefined : assertLibraryName(library)
    const entries: LibraryListEntry[] = []
    for (const [key, record] of this.documents.entries()) {
      if (filter !== undefined && record.library !== filter) continue
      entries.push({
        library: record.library,
        documentId: record.documentId,
        name: record.name,
        chunks: record.chunks.length,
        chars: record.chars,
        createdAt: record.createdAt,
      })
      void key
    }
    return entries.sort((a, b) => a.library.localeCompare(b.library) || a.documentId.localeCompare(b.documentId))
  }

  /** All chunk records of one library, in document/seq order. */
  private chunksOf(library: string): ChunkRecord[] {
    const trimmedLibrary = assertLibraryName(library)
    return [...this.chunks.entries()]
      .filter(([key]) => key.startsWith(`${trimmedLibrary}:`))
      .map(([, chunk]) => chunk)
      .sort((a, b) => a.documentId.localeCompare(b.documentId) || a.seq - b.seq)
  }

  /**
   * The hybrid retrieval pipeline: keyword + semantic scores, diversity
   * re-rank, relevance filter, lost-in-the-middle reorder, character budget.
   * @param library - library to search.
   * @param query - the query text.
   * @param topK - result cap (default from config).
   * @returns ranked hits.
   */
  async search(library: string, query: string, topK?: number): Promise<LibrarySearchHit[]> {
    const trimmedLibrary = assertLibraryName(library)
    const k = topK ?? this.config.search.topK
    const queryEmbedding = (await this.embed([query]))[0]!
    const records = this.chunksOf(trimmedLibrary)
    const candidates: Candidate[] = records.map(chunk => {
      const semantic = cosine(queryEmbedding, chunk.embedding)
      const keyword = scoreRelevance(query, chunk.text)
      const hybrid = this.config.search.hybridWeight * semantic + (1 - this.config.search.hybridWeight) * keyword
      return { chunk, hybrid }
    })
    const reranked = maximalMarginalRelevance(
      candidates.map(candidate => ({
        id: candidate.chunk.chunkId,
        relevance: candidate.hybrid,
        chunk: candidate.chunk,
        similarityTo: other => cosine(candidate.chunk.embedding, (other as unknown as { chunk: ChunkRecord }).chunk.embedding),
      })),
      this.config.search.diversityLambda,
      Math.min(candidates.length, MAX_CANDIDATE_BOUND),
    )
    const filtered = reranked
      .filter(entry => scoreRelevance(query, entry.chunk.text) >= this.config.search.minRelevance)
      .slice(0, 500)
    const reordered = avoidLostMiddle(
      filtered.map(entry => ({ id: entry.chunk.chunkId, score: entry.relevance })),
      this.config.search.lostMiddleHead,
      this.config.search.lostMiddleTail,
    )
    const byId = new Map(filtered.map(entry => [entry.chunk.chunkId, entry]))
    let budget = this.config.search.maxResultChars
    const hits: LibrarySearchHit[] = []
    for (const item of reordered) {
      const entry = byId.get(item.id)
      if (entry === undefined) continue
      const snippet = snippetOf(entry.chunk.text)
      budget -= snippet.length
      if (budget < 0 && hits.length > 0) break
      hits.push({
        chunkId: entry.chunk.chunkId,
        documentId: entry.chunk.documentId,
        seq: entry.chunk.seq,
        snippet,
        score: entry.relevance,
      })
      if (hits.length >= k) break
    }
    return hits
  }

  /** The citation sources for one query: the search pipeline result in order. */
  async citeCheck(library: string, query: string, answer: string): Promise<LibraryCiteReport> {
    const trimmedLibrary = assertLibraryName(library)
    const hits = await this.search(trimmedLibrary, query, 20)
    const sources: Record<string, string> = {}
    const byId = new Map<string, LibrarySearchHit>()
    hits.forEach((hit, index) => {
      sources[String(index + 1)] = this.chunks.get(chunkKey(trimmedLibrary, hit.chunkId))?.text ?? hit.snippet
      byId.set(String(index + 1), hit)
    })
    const fuzzy = validateCitations(answer, sources, this.config.citation.minScore)
    const semantic = verifyReferences(
      answer,
      hits.map((_hit, index) => ({ id: index + 1, content: sources[String(index + 1)]! })),
      { threshold: this.config.citation.minSemantic, dims: this.config.embedding.dims },
    )
    const semanticById = new Map(semantic.details.map(detail => [String(detail.refId), detail]))
    const details: LibraryCiteVerdict[] = fuzzy.results.map(match => {
      const source = byId.get(match.number)
      const semanticDetail = semanticById.get(match.number)
      const valid = match.is_valid && (semanticDetail?.status ?? 'missing') === 'valid'
      return {
        citation: `[${match.number}]`,
        sourceDocumentId: source?.documentId ?? '',
        sourceSeq: source?.seq ?? -1,
        valid,
        fuzzyScore: match.score,
        semanticSimilarity: semanticDetail?.similarity ?? 0,
        reason: source === undefined ? 'Source not found' : valid ? '' : match.reason || 'Low semantic similarity',
      }
    })
    return {
      library: trimmedLibrary,
      query,
      total: details.length,
      valid: details.filter(detail => detail.valid).length,
      details,
    }
  }

  /** Diagnose one library: chunk stats, duplicates, self-retrieval, middle penalty. */
  async diagnose(library: string): Promise<LibraryDiagnoseReport> {
    const trimmedLibrary = assertLibraryName(library)
    const records = this.chunksOf(trimmedLibrary)
    const slices: Chunk[] = records.map((chunk, index) => ({
      text: chunk.text,
      startPos: 0,
      endPos: chunk.text.length,
      index,
      overlapChars: 0,
    }))
    const histogram = chunkSizeHistogram(slices)
    const duplicateScan = findDuplicateChunks(
      slices.slice(0, this.config.diagnose.sampleCap),
      0.9,
      this.config.diagnose.maxDuplicatePairs,
    )
    const duplicatePairs = duplicateScan.pairs.length
    const probes = Math.min(5, records.length)
    let topKHit = 0
    const sampled = records.filter((_, index) => index % Math.max(1, Math.floor(records.length / probes)) === 0).slice(0, probes)
    for (const sample of sampled) {
      const hits = await this.search(trimmedLibrary, snippetOf(sample.text, 120), 3)
      if (hits.some(hit => hit.chunkId === sample.chunkId)) topKHit += 1
    }
    const ranked = records.map(chunk => ({ id: chunk.chunkId, score: scoreRelevance(trimmedLibrary, chunk.text) }))
    const bins = positionBins(ranked, this.config.diagnose.positionBins)
    return {
      library: trimmedLibrary,
      documents: this.list(trimmedLibrary).length,
      chunks: records.length,
      histogram,
      duplicatePairs,
      selfRetrieval: { probes: sampled.length, topKHit },
      middlePenalty: middlePenalty(bins),
    }
  }
}

/** Resolve the embedder backend at mount; a degraded Ollama falls back to hash with a logged reason. */
async function storeDepsOf(ctx: Context, config: ResolvedConfig): Promise<StoreDeps> {
  const subprocess = ctx.get('subprocess') as SubprocessRuntime | undefined
  const resolution = await resolveEmbedder(config.embedding, subprocess, process.cwd())
  if (resolution.degraded) {
    ctx.logger('dsh-library').warn(`embedder: ${resolution.reason}`)
  }
  return { embedder: resolution.embedder }
}

/** The store service shared by every tool and the command. */
interface LibraryServices {
  readonly ctx: Context
  readonly config: ResolvedConfig
  readonly store: LibraryStore
}

/** Append one audit event through the adaptive host gate; a failed append never changes the outcome. */
function audit(exec: ToolRunContext, type: typeof INJECT_EVENT | typeof PURGE_EVENT, event: LibraryInjectEvent | LibraryPurgeEvent): void {
  const session = exec.agent?.session
  if (session === undefined) return
  try {
    appendAuditEvent(session, type, event)
  } catch {
    // The tool result still logs the model-visible content.
  }
}

/**
 * Mount the plugin: open the storage domain, build the store, register the
 * tool family and the `/library` command. One effect owns the domain handle;
 * every registration is its own reversible effect.
 * @param ctx - the plugin context.
 * @param config - raw loader config; defaults applied through {@link resolveConfig}.
 */
export async function apply(ctx: Context, config: Config = {}): Promise<void> {
  const resolved = resolveConfig(config)
  const domain = await ctx.storageDomain.open(libraryDomainSpec)
  ctx.effect(() => () => domain.close(), 'dsh-library: storage domain')
  const store = new LibraryStore(domain, resolved, await storeDepsOf(ctx, resolved))
  const services: LibraryServices = { ctx, config: resolved, store }

  for (const tool of allTools(services)) {
    ctx.effect(() => ctx.tools.register(tool), `dsh-library: ${tool.name} tool`)
  }

  ctx.effect(() => ctx.commands.register({
    name: 'library',
    description: 'Local knowledge base: list libraries, count chunks, and check index health',
    handler: async (invocation: CommandInvocation) => {
      try {
        const argument = invocation.rawInput.trim()
        const entries = store.list(argument === '' ? undefined : argument)
        if (entries.length === 0) {
          return { kind: 'success' as const, text: argument === '' ? 'No documents indexed yet — use library_add to import md/txt files.' : `Library ${JSON.stringify(argument)} has no documents.` }
        }
        const byLibrary = new Map<string, { documents: number; chunks: number; chars: number }>()
        for (const entry of entries) {
          const agg = byLibrary.get(entry.library) ?? { documents: 0, chunks: 0, chars: 0 }
          agg.documents += 1
          agg.chunks += entry.chunks
          agg.chars += entry.chars
          byLibrary.set(entry.library, agg)
        }
        const lines = [...byLibrary.entries()].map(([library, agg]) =>
          `${library}: ${agg.documents} document(s), ${agg.chunks} chunk(s), ${agg.chars} chars`)
        return { kind: 'success' as const, text: lines.join('\n') }
      } catch (error) {
        return { kind: 'error' as const, text: error instanceof Error ? error.message : String(error) }
      }
    },
  }), 'dsh-library: /library command')
}

/** Every tool definition, in registration order. */
export function allTools(services: LibraryServices) {
  return [
    libraryAddTool(services),
    libraryRemoveTool(services),
    libraryListTool(services),
    librarySearchTool(services),
    libraryCiteCheckTool(services),
    libraryDiagnoseTool(services),
  ]
}

/** `library_add` — import one md/txt document by path into a library. */
function libraryAddTool(services: LibraryServices) {
  const { store, ctx } = services
  return defineTool({
    name: 'library_add',
    description:
      'Import a local markdown or plain-text document into the dsh-library knowledge base: chunk it, embed it, and index it under a library name. The file must be readable through the harness filesystem service and stay under the configured size cap. Returns the document id later used by library_remove/library_list.',
    parameters: {
      path: { type: 'string' as const, description: 'Path to the md/txt file (workspace-relative or absolute).', required: true as const },
      library: { type: 'string' as const, description: 'Target library name (lowercase letters, digits, hyphens).', required: true as const },
      name: { type: 'string' as const, description: 'Optional display name; defaults to the content-derived id.' },
    },
    output: {
      schema: {
        type: 'object' as const,
        properties: {
          ok: { type: 'boolean' as const, const: true },
          library: { type: 'string' as const },
          documentId: { type: 'string' as const },
          name: { type: 'string' as const },
          chunks: { type: 'integer' as const },
          chars: { type: 'integer' as const },
        },
        additionalProperties: false,
      },
      render(_args, value) {
        const result = value as LibraryAddResult
        return [{ type: 'text' as const, text: `Indexed ${JSON.stringify(result.name)} into library ${result.library}: ${result.chunks} chunk(s), ${result.chars} chars. documentId: ${result.documentId}` }]
      },
    },
    async execute(args, exec) {
      const parsed = args as { path: string; library: string; name?: string }
      if (ctx.get('fs') === undefined) {
        throw new Error('ctx.fs is not mounted — library_add cannot read local files')
      }
      const fs = ctx.get('fs') as FileSystem
      const sessionHeader = (exec.agent?.session as unknown as { header?: { cwd?: unknown } } | undefined)?.header
      const cwd = typeof sessionHeader?.cwd === 'string' ? sessionHeader.cwd : undefined
      const target = await fs.resolve(parsed.path, { ...(cwd === undefined ? {} : { cwd }), signal: exec.signal })
      const content = await fs.readText(target, exec.signal)
      return { ok: true as const, ...(await store.add(parsed.library, parsed.name ?? parsed.path, content)) }
    },
  })
}

/** `library_remove` — remove one document and verify the purge left no residue. */
function libraryRemoveTool(services: LibraryServices) {
  const { store } = services
  return defineTool({
    name: 'library_remove',
    description:
      'Remove one document from a dsh-library index and verify the purge: deterministic signatures of the removed content are probed against the remaining chunks, and residue is reported. Returns the purge verdict.',
    parameters: {
      library: { type: 'string' as const, description: 'Owning library name.', required: true as const },
      documentId: { type: 'string' as const, description: 'Document id from library_add or library_list.', required: true as const },
    },
    output: {
      schema: {
        type: 'object' as const,
        properties: {
          ok: { type: 'boolean' as const, const: true },
          library: { type: 'string' as const },
          documentId: { type: 'string' as const },
          removedChunks: { type: 'integer' as const },
          purgePassed: { type: 'boolean' as const },
          purgeTotalFound: { type: 'integer' as const },
        },
        additionalProperties: false,
      },
      render(_args, value) {
        const result = value as LibraryRemoveResult
        return [{ type: 'text' as const, text: `Removed ${result.documentId} from library ${result.library} (${result.removedChunks} chunk(s)). Purge verification: ${result.purgePassed ? 'passed — no residue' : `FAILED — ${result.purgeTotalFound} residue hit(s)`}` }]
      },
    },
    async execute(args, exec) {
      const parsed = args as { library: string; documentId: string }
      const result = await store.remove(parsed.library, parsed.documentId)
      audit(exec, 'library/purge', {
        purgeId: purgeId(),
        library: result.library,
        documentId: result.documentId,
        passed: result.purgePassed,
        totalFound: result.purgeTotalFound,
      })
      return { ok: true as const, ...result }
    },
  })
}

/** `library_list` — document metadata of one library or every library. */
function libraryListTool(services: LibraryServices) {
  const { store } = services
  return defineTool({
    name: 'library_list',
    description: 'List the documents indexed in one library (or every library when omitted). Metadata only — document text is never returned.',
    parameters: {
      library: { type: 'string' as const, description: 'Optional library name filter.' },
    },
    output: {
      schema: {
        type: 'object' as const,
        properties: {
          ok: { type: 'boolean' as const, const: true },
          entries: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                library: { type: 'string' as const },
                documentId: { type: 'string' as const },
                name: { type: 'string' as const },
                chunks: { type: 'integer' as const },
                chars: { type: 'integer' as const },
                createdAt: { type: 'integer' as const },
              },
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
      render(_args, value) {
        const entries = (value as { entries: LibraryListEntry[] }).entries
        return [{ type: 'text' as const, text: entries.length === 0 ? 'No documents match.' : entries.map(entry => `${entry.library}/${entry.documentId} ${JSON.stringify(entry.name)} — ${entry.chunks} chunk(s)`).join('\n') }]
      },
    },
    async execute(args) {
      const parsed = args as { library?: string }
      return { ok: true as const, entries: store.list(parsed.library) }
    },
  })
}

/** `library_search` — the hybrid retrieval pipeline with optional injection. */
function librarySearchTool(services: LibraryServices) {
  const { config, store } = services
  return defineTool({
    name: 'library_search',
    description:
      'Search a dsh-library index: hybrid semantic+keyword ranking, diversity re-rank, relevance filter, and lost-in-the-middle avoidance. Each hit carries a source marker ([1]...[n] over the result page). With inject: true the result page is injected into the calling agent (config injection.enabled) and logged as a library/inject session event.',
    parameters: {
      query: { type: 'string' as const, description: 'The search query.', required: true as const },
      library: { type: 'string' as const, description: 'Library to search.', required: true as const },
      topK: { type: 'integer' as const, description: 'Result cap; defaults to the configured search.topK.' },
      inject: { type: 'boolean' as const, description: 'Inject the result page into the calling agent (default false).' },
    },
    output: {
      schema: {
        type: 'object' as const,
        properties: {
          ok: { type: 'boolean' as const, const: true },
          library: { type: 'string' as const },
          query: { type: 'string' as const },
          results: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                chunkId: { type: 'string' as const },
                documentId: { type: 'string' as const },
                seq: { type: 'integer' as const },
                snippet: { type: 'string' as const },
                score: { type: 'number' as const },
              },
              additionalProperties: false,
            },
          },
          injected: { type: 'boolean' as const },
        },
        additionalProperties: false,
      },
      render(_args, value) {
        const result = value as LibrarySearchResult
        const lines = [`Library ${result.library}: ${result.results.length} result(s) for ${JSON.stringify(result.query)}`]
        result.results.forEach((hit, index) => {
          lines.push(`[${index + 1}] ${hit.snippet}`)
        })
        return [{ type: 'text' as const, text: lines.join('\n') }]
      },
    },
    async execute(args, exec) {
      const parsed = args as { query: string; library: string; topK?: number; inject?: boolean }
      const hits = await store.search(parsed.library, parsed.query, parsed.topK)
      const wantInject = parsed.inject === true && config.injection.enabled
      let injected = false
      let page = ''
      if (wantInject && hits.length > 0 && exec.agent !== undefined) {
        const id = injectId()
        page = hits.map((hit, index) => `[${index + 1}] ${hit.snippet}`).join('\n\n')
        if (page.length > config.injection.maxChars) {
          page = `${page.slice(0, config.injection.maxChars - 1)}…`
        }
        const message: UserMessage = {
          id: MessageId(`library-inject-${id}`),
          role: 'user',
          content: [{ type: 'text', text: `Library results for ${JSON.stringify(parsed.query)} (library ${parsed.library}, injectId ${id}):\n\n${page}` }],
          source: { kind: 'plugin', plugin: 'dsh-library' },
        }
        exec.agent.inject(message)
        audit(exec, 'library/inject', {
          injectId: id,
          library: parsed.library,
          query: parsed.query,
          chunks: hits.map(hit => hit.chunkId),
          chars: page.length,
        })
        injected = true
      }
      return { ok: true as const, library: parsed.library, query: parsed.query, results: hits, injected }
    },
  })
}

/** `library_cite_check` — verify `[n]` citations against the search result page. */
function libraryCiteCheckTool(services: LibraryServices) {
  const { store } = services
  return defineTool({
    name: 'library_cite_check',
    description:
      'Verify the [n] citations in an answer against the library: the sources are the search result page for the given query (the same pipeline library_search runs), and each citation is checked with a fuzzy token match AND a semantic similarity against its chunk. Returns one verdict per citation.',
    parameters: {
      library: { type: 'string' as const, description: 'Library the citations should point into.', required: true as const },
      query: { type: 'string' as const, description: 'The query whose result page the answer cites.', required: true as const },
      answer: { type: 'string' as const, description: 'The answer text containing [n] citation markers.', required: true as const },
    },
    output: {
      schema: {
        type: 'object' as const,
        properties: {
          ok: { type: 'boolean' as const, const: true },
          library: { type: 'string' as const },
          query: { type: 'string' as const },
          total: { type: 'integer' as const },
          valid: { type: 'integer' as const },
          details: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                citation: { type: 'string' as const },
                sourceDocumentId: { type: 'string' as const },
                sourceSeq: { type: 'integer' as const },
                valid: { type: 'boolean' as const },
                fuzzyScore: { type: 'integer' as const },
                semanticSimilarity: { type: 'number' as const },
                reason: { type: 'string' as const },
              },
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
      render(_args, value) {
        const report = value as LibraryCiteReport
        const lines = [`Citation check: ${report.valid}/${report.total} valid (query ${JSON.stringify(report.query)})`]
        for (const detail of report.details) {
          lines.push(`${detail.citation} ${detail.valid ? 'valid' : 'INVALID'} — fuzzy ${detail.fuzzyScore}, semantic ${detail.semanticSimilarity}${detail.reason === '' ? '' : ` (${detail.reason})`}`)
        }
        return [{ type: 'text' as const, text: lines.join('\n') }]
      },
    },
    async execute(args) {
      const parsed = args as { library: string; query: string; answer: string }
      return { ok: true as const, ...(await store.citeCheck(parsed.library, parsed.query, parsed.answer)) }
    },
  })
}

/** `library_diagnose` — chunk/duplicate/self-retrieval/middle-penalty report. */
function libraryDiagnoseTool(services: LibraryServices) {
  const { store } = services
  return defineTool({
    name: 'library_diagnose',
    description:
      'Diagnose one library: chunk-size histogram, near-duplicate chunk pairs, a self-retrieval probe (sampled chunks searched with their own text), and the lost-in-the-middle penalty over the ranked chunk list.',
    parameters: {
      library: { type: 'string' as const, description: 'Library to diagnose.', required: true as const },
    },
    output: {
      schema: {
        type: 'object' as const,
        properties: {
          ok: { type: 'boolean' as const, const: true },
          library: { type: 'string' as const },
          documents: { type: 'integer' as const },
          chunks: { type: 'integer' as const },
          histogram: {
            type: 'object' as const,
            properties: {
              buckets: {
                type: 'array' as const,
                items: {
                  type: 'object' as const,
                  properties: {
                    label: { type: 'string' as const },
                    min: { type: 'integer' as const },
                    max: { oneOf: [{ type: 'integer' as const }, { type: 'null' as const }] as const },
                    count: { type: 'integer' as const },
                  },
                  additionalProperties: false,
                },
              },
              minChars: { type: 'integer' as const },
              maxChars: { type: 'integer' as const },
              meanChars: { type: 'number' as const },
              totalChars: { type: 'integer' as const },
            },
            additionalProperties: false,
          },
          duplicatePairs: { type: 'integer' as const },
          selfRetrieval: {
            type: 'object' as const,
            properties: {
              probes: { type: 'integer' as const },
              topKHit: { type: 'integer' as const },
            },
            additionalProperties: false,
          },
          middlePenalty: { type: 'number' as const },
        },
        additionalProperties: false,
      },
      render(_args, value) {
        const report = value as LibraryDiagnoseReport
        return [{ type: 'text' as const, text: `Library ${report.library}: ${report.documents} document(s), ${report.chunks} chunk(s), mean chunk ${Math.round(report.histogram.meanChars)} chars, ${report.duplicatePairs} duplicate pair(s), self-retrieval ${report.selfRetrieval.topKHit}/${report.selfRetrieval.probes}, middle penalty ${report.middlePenalty.toFixed(2)}.` }]
      },
    },
    async execute(args) {
      const parsed = args as { library: string }
      const report = await store.diagnose(parsed.library)
      return {
        ok: true as const,
        library: report.library,
        documents: report.documents,
        chunks: report.chunks,
        histogram: { ...report.histogram, buckets: [...report.histogram.buckets] },
        duplicatePairs: report.duplicatePairs,
        selfRetrieval: report.selfRetrieval,
        middlePenalty: report.middlePenalty,
      }
    },
  })
}
