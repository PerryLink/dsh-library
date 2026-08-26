/**
 * Embedding pipeline: the built-in deterministic hash embedder (zero
 * downloads — word tokens plus character tri-grams hashed into a signed
 * bucket vector, L2-normalized), the optional external embedder command
 * protocol over `ctx.subprocess`, and the cosine/dot utilities the scoring
 * modules share.
 * @module dsh-library/embedding
 */

import type { SubprocessRuntime } from '@deepseek-ai/dsh-subprocess'
import type { SubprocessSpawnSpec } from '@deepseek-ai/dsh-subprocess'
import type { ResolvedEmbeddingConfig } from './config.ts'
import { charNGrams, fnv1a, tokenize } from './text.ts'

/**
 * Embed one text with the built-in hash embedder. Each word token and each
 * character tri-gram hashes (FNV-1a) to a signed bucket: the index is the
 * hash modulo `dims` and the sign is the hash's high bit. The result is
 * L2-normalized so cosine similarity is a dot product.
 * @param text - input text.
 * @param dims - vector dimensionality (≥ 1).
 * @returns the normalized embedding as a plain number array.
 */
export function embedHash(text: string, dims: number): number[] {
  const vector = new Float64Array(dims)
  const features = [...tokenize(text), ...charNGrams(text, 3)]
  for (const feature of features) {
    const hash = fnv1a(feature)
    const index = hash % dims
    const sign = (hash & 0x80000000) === 0 ? 1 : -1
    vector[index] = vector[index]! + sign
  }
  return normalizeVector(vector)
}

/** L2-normalize a vector in place; a zero vector stays zero. */
function normalizeVector(vector: Float64Array): number[] {
  let squared = 0
  for (const value of vector) squared += value * value
  const norm = Math.sqrt(squared)
  const result = new Array<number>(vector.length)
  for (let index = 0; index < vector.length; index += 1) {
    result[index] = norm === 0 ? 0 : vector[index]! / norm
  }
  return result
}

/**
 * Cosine similarity of two equal-length vectors (already-normalized vectors
 * make this a plain dot product, but the function normalizes anyway).
 * @param a - first vector.
 * @param b - second vector.
 * @returns similarity within 0..1 for non-negative-input vectors.
 */
export function cosine(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length) throw new TypeError(`vector dimension mismatch: ${a.length} vs ${b.length}`)
  let dot = 0
  let normA = 0
  let normB = 0
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index]! * b[index]!
    normA += a[index]! * a[index]!
    normB += b[index]! * b[index]!
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/** Parse one embedder stdout line into an index/vector pair, or null when malformed. */
function parseEmbeddingLine(line: string, dims: number): { index: number; vector: number[] } | null {
  const trimmed = line.trim()
  if (trimmed.length === 0) return null
  try {
    const parsed: unknown = JSON.parse(trimmed)
    if (typeof parsed !== 'object' || parsed === null) return null
    const record = parsed as Record<string, unknown>
    if (typeof record['index'] !== 'number' || !Array.isArray(record['vector'])) return null
    const vector = record['vector'] as unknown[]
    if (vector.length !== dims || vector.some(value => typeof value !== 'number' || !Number.isFinite(value))) return null
    return { index: record['index'], vector: normalizeVector(Float64Array.from(vector as number[])) }
  } catch {
    // One malformed line must not kill the whole batch; the completeness
    // check below reports which indices are missing.
    return null
  }
}

/**
 * Run the configured external embedder command once over a text batch.
 * The protocol is JSON lines both ways: each stdin line is
 * `{"index": <n>, "text": "..."}` and each stdout line is
 * `{"index": <n>, "vector": [<number>, ...]}`. Every requested index must be
 * answered exactly once or the call fails closed (misconfiguration must
 * surface, not silently degrade retrieval).
 * @param subprocess - the mounted `ctx.subprocess` service.
 * @param argv - the configured command line split into argv (argv[0] = program).
 * @param cwd - working directory for the child.
 * @param texts - the texts to embed, in index order.
 * @param dims - expected vector dimensionality.
 * @param caps - timeout, grace, and output caps.
 * @returns embeddings in the same order as {@link texts}.
 * @throws Error on spawn failure, non-zero exit, or an incomplete/oversized answer.
 */
export async function embedWithCommand(
  subprocess: SubprocessRuntime,
  argv: readonly string[],
  cwd: string,
  texts: readonly string[],
  dims: number,
  caps: { timeoutMs: number; graceMs: number; maxOutputBytes: number },
): Promise<number[][]> {
  const payload = texts
    .map((text, index) => JSON.stringify({ index, text }))
    .join('\n')
  const abort = AbortSignal.timeout(caps.timeoutMs)
  const spec: SubprocessSpawnSpec = {
    argv,
    cwd,
    stdio: {
      stdin: { data: `${payload}\n` },
      stdout: { maxBytes: caps.maxOutputBytes },
      stderr: { maxBytes: caps.maxOutputBytes },
    },
    graceMs: caps.graceMs,
    signal: abort,
  }
  const handle = subprocess.spawn(spec)
  const outcome = await handle.done
  if (outcome.exitCode !== 0 || outcome.signal !== null) {
    throw new Error(`dsh-library: embedder command exited abnormally (exit ${String(outcome.exitCode)}, signal ${String(outcome.signal)})`)
  }
  const stdout = handle.collected.stdout
  if (stdout === undefined) throw new Error('dsh-library: embedder stdout was not collected')
  const read = stdout.readFrom(0)
  if (read.lossy) throw new Error('dsh-library: embedder output exceeded the configured cap')
  const answers = new Map<number, number[]>()
  let malformed = 0
  for (const line of read.text.split('\n')) {
    const parsed = parseEmbeddingLine(line, dims)
    if (parsed === null) {
      malformed += 1
      continue
    }
    answers.set(parsed.index, parsed.vector)
  }
  const missing = texts.map((_, index) => index).filter(index => !answers.has(index))
  if (missing.length > 0 || answers.size !== texts.length) {
    throw new Error(`dsh-library: embedder answered ${answers.size} of ${texts.length} indices`
      + (missing.length > 0 ? `; missing: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? '…' : ''}` : '')
      + (malformed > 0 ? `; ${malformed} malformed line(s)` : ''))
  }
  return texts.map((_, index) => answers.get(index)!)
}

/**
 * Split a flat command line into argv without shell interpretation.
 * Whitespace separates; quotes are NOT processed (documented: no shell).
 * @param command - the configured command string.
 * @returns the argv vector; an empty string yields an empty vector.
 */
export function splitCommandLine(command: string): string[] {
  return command.trim().split(/\s+/u).filter(part => part.length > 0)
}

// ── Embedder provider seam ──────────────────────────────────────────────────

/**
 * The embedder provider seam: one pluggable text→vector backend. The built-in
 * {@link HashEmbedder} is the zero-download default; {@link CommandEmbedder}
 * and {@link OllamaEmbedder} are optional backends (probe → use → degrade for
 * Ollama; fail loud for a configured-but-absent command).
 */
export interface Embedder {
  /** Provider name recorded alongside the index (hash | command | ollama). */
  readonly name: 'hash' | 'command' | 'ollama'
  /** Vector dimensionality this backend emits. */
  readonly dims: number
  /**
   * Embed one batch of texts, returning one vector per input in the same order.
   * @param texts - the texts to embed.
   * @returns the L2-normalized embeddings.
   */
  embed(texts: readonly string[]): Promise<number[][]>
}

/** Built-in deterministic hash embedder: zero downloads, pure local hashing. */
export class HashEmbedder implements Embedder {
  readonly name = 'hash' as const

  /**
   * @param dims - vector dimensionality (≥ 1).
   */
  constructor(readonly dims: number) {}

  async embed(texts: readonly string[]): Promise<number[][]> {
    return texts.map(text => embedHash(text, this.dims))
  }
}

/** External command embedder over the JSON-lines subprocess protocol. */
export class CommandEmbedder implements Embedder {
  readonly name = 'command' as const

  /**
   * @param subprocess - the mounted subprocess seam.
   * @param argv - the command line split into argv (argv[0] = program).
   * @param cwd - working directory for the child.
   * @param dims - expected vector dimensionality.
   * @param caps - timeout, grace, and output caps.
   * @param maxBatchItems - texts per subprocess invocation; larger batches split.
   */
  constructor(
    private readonly subprocess: SubprocessRuntime,
    private readonly argv: readonly string[],
    private readonly cwd: string,
    readonly dims: number,
    private readonly caps: { timeoutMs: number; graceMs: number; maxOutputBytes: number },
    private readonly maxBatchItems: number,
  ) {}

  async embed(texts: readonly string[]): Promise<number[][]> {
    const out: number[][] = []
    for (let index = 0; index < texts.length; index += this.maxBatchItems) {
      out.push(...(await embedWithCommand(
        this.subprocess,
        this.argv,
        this.cwd,
        texts.slice(index, index + this.maxBatchItems),
        this.dims,
        this.caps,
      )))
    }
    return out
  }
}

/**
 * Local Ollama embedder over the `/api/embed` endpoint. Zero cloud: the model
 * runs on a localhost Ollama server. A non-2xx response or a malformed vector
 * fails the batch (misconfiguration must surface, not silently degrade
 * retrieval); availability is probed up front by {@link probeOllama}.
 */
export class OllamaEmbedder implements Embedder {
  readonly name = 'ollama' as const

  /**
   * @param url - the Ollama base URL (e.g. `http://127.0.0.1:11434`).
   * @param model - the embedding model name (e.g. `nomic-embed-text`).
   * @param dims - the probed embedding dimensionality.
   * @param timeoutMs - per-request timeout.
   * @param maxBatchItems - texts per `/api/embed` call; larger batches split.
   */
  constructor(
    private readonly url: string,
    private readonly model: string,
    readonly dims: number,
    private readonly timeoutMs: number,
    private readonly maxBatchItems: number,
  ) {}

  async embed(texts: readonly string[]): Promise<number[][]> {
    const out: number[][] = []
    for (let index = 0; index < texts.length; index += this.maxBatchItems) {
      out.push(...(await this.embedBatch(texts.slice(index, index + this.maxBatchItems))))
    }
    return out
  }

  /** POST one batch to `/api/embed` and validate the returned vectors. */
  private async embedBatch(texts: readonly string[]): Promise<number[][]> {
    let response: Response
    try {
      response = await fetch(`${this.url}/api/embed`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: this.model, input: [...texts] }),
        signal: AbortSignal.timeout(this.timeoutMs),
      })
    } catch (error) {
      throw new Error(`dsh-library: ollama embed request failed: ${error instanceof Error ? error.message : String(error)}`)
    }
    if (!response.ok) {
      throw new Error(`dsh-library: ollama embed failed (HTTP ${response.status})`)
    }
    const body = await response.json() as Record<string, unknown>
    const embeddings = body['embeddings']
    if (!Array.isArray(embeddings) || embeddings.length !== texts.length) {
      throw new Error(`dsh-library: ollama answered ${Array.isArray(embeddings) ? embeddings.length : 0} of ${texts.length} inputs`)
    }
    return embeddings.map((vector) => {
      if (!Array.isArray(vector) || vector.length !== this.dims || vector.some(value => typeof value !== 'number' || !Number.isFinite(value))) {
        throw new Error('dsh-library: ollama returned a malformed embedding vector')
      }
      return normalizeVector(Float64Array.from(vector as number[]))
    })
  }
}

/**
 * Probe a local Ollama server for one embedding model. Sends a single-word
 * probe through `/api/embed` and returns the model's vector dimensionality, or
 * undefined when the server is unreachable, the model is unknown, or the
 * response is malformed. Zero cloud — only the configured local URL is ever
 * contacted.
 * @param url - the Ollama base URL.
 * @param model - the embedding model name.
 * @param timeoutMs - probe timeout.
 * @returns the model's dimensionality, or undefined when unavailable.
 */
export async function probeOllama(url: string, model: string, timeoutMs: number): Promise<number | undefined> {
  try {
    const response = await fetch(`${url}/api/embed`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, input: ['probe'] }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) return undefined
    const body = await response.json() as Record<string, unknown>
    const embeddings = body['embeddings']
    if (!Array.isArray(embeddings) || embeddings.length !== 1 || !Array.isArray(embeddings[0])) return undefined
    return (embeddings[0] as unknown[]).length
  } catch {
    return undefined
  }
}

/** The outcome of {@link resolveEmbedder}: the backend plus its degradation note. */
export interface EmbedderResolution {
  /** The resolved backend. */
  readonly embedder: Embedder
  /** True when the configured backend was unavailable and a default was substituted. */
  readonly degraded: boolean
  /** Human-readable degradation reason (present only when {@link EmbedderResolution.degraded}). */
  readonly reason?: string
}

/**
 * Resolve the embedder backend from the resolved config: the configured
 * command wins (fail loud without a subprocess seam), the `ollama` provider is
 * probed and degrades gracefully to the built-in hash embedder when the server
 * is unreachable, and the built-in hash embedder is the zero-download default.
 * @param config - the resolved embedding config.
 * @param subprocess - the optional subprocess seam (command provider only).
 * @param cwd - working directory for the command provider.
 * @returns the backend plus its degradation note.
 */
export async function resolveEmbedder(
  config: ResolvedEmbeddingConfig,
  subprocess: SubprocessRuntime | undefined,
  cwd: string,
): Promise<EmbedderResolution> {
  if (config.provider === 'command') {
    if (subprocess === undefined) {
      throw new Error('dsh-library: embedding.provider=command but ctx.subprocess is not mounted — the external embedder cannot run')
    }
    return {
      embedder: new CommandEmbedder(
        subprocess,
        splitCommandLine(config.command!),
        cwd,
        config.dims,
        { timeoutMs: config.timeoutMs, graceMs: config.graceMs, maxOutputBytes: config.maxOutputBytes },
        config.maxBatchItems,
      ),
      degraded: false,
    }
  }
  if (config.provider === 'ollama') {
    const dims = await probeOllama(config.ollamaUrl, config.ollamaModel, config.timeoutMs)
    if (dims === undefined) {
      return {
        embedder: new HashEmbedder(config.dims),
        degraded: true,
        reason: `ollama unavailable at ${config.ollamaUrl} (model ${config.ollamaModel}); degraded to the built-in hash embedder`,
      }
    }
    return {
      embedder: new OllamaEmbedder(config.ollamaUrl, config.ollamaModel, dims, config.timeoutMs, config.maxBatchItems),
      degraded: false,
    }
  }
  return { embedder: new HashEmbedder(config.dims), degraded: false }
}
