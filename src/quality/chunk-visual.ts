/**
 * Port of RAG-Chunk-Visualizer (upstream/PerryLink, Apache-2.0): the
 * sliding-window `chunk_text` algorithm plus the structured diagnostics that
 * power `library_diagnose`. Pure functions — no I/O, no model.
 * @module dsh-library/quality/chunk-visual
 */

import { fnv1a } from '../text.ts'

/** One sliding-window chunk, mirroring the upstream `Chunk` dataclass. */
export interface Chunk {
  readonly text: string
  readonly startPos: number
  readonly endPos: number
  readonly index: number
  readonly overlapChars: number
}

/**
 * Slice one text into sliding-window chunks — the exact algorithm of the
 * upstream `chunk_text`. Validation matches upstream: `chunkSize` > 0,
 * `overlap` ≥ 0 and strictly smaller than `chunkSize`.
 * @param text - the text to slice.
 * @param chunkSize - window width in characters.
 * @param overlap - overlap between consecutive windows in characters.
 * @returns the chunk list (empty for empty input).
 * @throws TypeError on invalid parameters.
 */
export function chunkText(text: string, chunkSize: number, overlap: number): Chunk[] {
  if (chunkSize <= 0) throw new TypeError('chunkSize must be greater than 0')
  if (overlap < 0) throw new TypeError('overlap must be at least 0')
  if (overlap >= chunkSize) throw new TypeError('overlap must be smaller than chunkSize')
  const chunks: Chunk[] = []
  let position = 0
  let chunkIndex = 0
  while (position < text.length) {
    const end = Math.min(position + chunkSize, text.length)
    chunks.push({
      text: text.slice(position, end),
      startPos: position,
      endPos: end,
      index: chunkIndex,
      overlapChars: chunkIndex > 0 ? overlap : 0,
    })
    position += chunkSize - overlap
    chunkIndex += 1
  }
  return chunks
}

/** Size-bucket boundary: powers of two from 256 chars up (diagnose histogram). */
export const CHUNK_SIZE_BUCKETS: readonly number[] = [256, 512, 1024, 2048, 4096]

/** Per-bucket character counts of one chunk list. */
export interface ChunkSizeHistogram {
  readonly buckets: readonly { label: string; min: number; max: number | null; count: number }[]
  readonly minChars: number
  readonly maxChars: number
  readonly meanChars: number
  readonly totalChars: number
}

/**
 * Bucket one chunk list into size classes and fold the basic size facts.
 * @param chunks - the chunks to analyze.
 * @returns the histogram and size summary.
 */
export function chunkSizeHistogram(chunks: readonly Chunk[]): ChunkSizeHistogram {
  const bounds = [...CHUNK_SIZE_BUCKETS, Number.POSITIVE_INFINITY]
  const counts = CHUNK_SIZE_BUCKETS.map(() => 0)
  let totalChars = 0
  let minChars = Number.POSITIVE_INFINITY
  let maxChars = 0
  for (const chunk of chunks) {
    totalChars += chunk.text.length
    if (chunk.text.length < minChars) minChars = chunk.text.length
    if (chunk.text.length > maxChars) maxChars = chunk.text.length
    for (let index = 0; index < bounds.length; index += 1) {
      if (chunk.text.length <= bounds[index]!) {
        counts[index] = (counts[index] ?? 0) + 1
        break
      }
    }
  }
  const buckets = CHUNK_SIZE_BUCKETS.map((min, index) => ({
    label: index === CHUNK_SIZE_BUCKETS.length - 1 ? `${min}+` : `${min}-${CHUNK_SIZE_BUCKETS[index + 1]! - 1}`,
    min,
    max: index === CHUNK_SIZE_BUCKETS.length - 1 ? null : CHUNK_SIZE_BUCKETS[index + 1]! - 1,
    count: counts[index]!,
  }))
  return {
    buckets,
    minChars: chunks.length === 0 ? 0 : minChars,
    maxChars,
    meanChars: chunks.length === 0 ? 0 : Math.round(totalChars / chunks.length),
    totalChars,
  }
}

/** Folded structural statistics of one document's chunk list. */
export interface ChunkDiagnostics {
  readonly chunkCount: number
  readonly totalChars: number
  readonly histogram: ChunkSizeHistogram
  /** How many of the total chars live in overlapping windows (redundancy signal). */
  readonly overlapChars: number
  /** overlapChars as a percentage of totalChars. */
  readonly overlapPercent: number
  /** True when the last chunk is shorter than the others (a normal, expected tail). */
  readonly truncatedTail: boolean
  /** Maximum single-chunk char count. */
  readonly maxChunkChars: number
}

/**
 * Fold the structural diagnostics of one chunk list — the visualization
 * module's numbers without any rendering.
 * @param chunks - the chunks to analyze.
 * @returns the folded diagnostics.
 */
export function diagnoseChunks(chunks: readonly Chunk[]): ChunkDiagnostics {
  let overlapChars = 0
  let maxChunkChars = 0
  for (const chunk of chunks) {
    overlapChars += chunk.overlapChars
    if (chunk.text.length > maxChunkChars) maxChunkChars = chunk.text.length
  }
  const histogram = chunkSizeHistogram(chunks)
  const totalChars = histogram.totalChars
  const last = chunks.at(-1)
  return {
    chunkCount: chunks.length,
    totalChars,
    histogram,
    overlapChars,
    overlapPercent: totalChars === 0 ? 0 : Math.round((overlapChars / totalChars) * 1000) / 10,
    truncatedTail: chunks.length > 1 && last !== undefined && last.text.length < maxChunkChars,
    maxChunkChars,
  }
}

/**
 * Stable per-chunk content hash (FNV-1a) — the duplicate-detection key.
 * @param chunk - the chunk to hash.
 * @returns the hex hash.
 */
export function chunkHash(chunk: Chunk): string {
  return fnv1a(chunk.text).toString(16).padStart(8, '0')
}

/** One detected near-duplicate pair. */
export interface DuplicatePair {
  readonly indexA: number
  readonly indexB: number
  readonly similarity: number
}

/**
 * Find exact and near-duplicate chunk pairs by cosine similarity over the
 * pair's shared token vocabulary (the diversity module's measure). The scan
 * is quadratic, so callers bound the input.
 * @param chunks - the chunks to scan.
 * @param threshold - similarity above which a pair counts as duplicate.
 * @param maxPairs - cap on reported pairs (the scan still computes the count).
 * @returns reported pairs and the duplicate count.
 */
export function findDuplicateChunks(
  chunks: readonly Chunk[],
  threshold: number,
  maxPairs: number,
): { pairs: DuplicatePair[]; duplicateCount: number } {
  const pairs: DuplicatePair[] = []
  let duplicateCount = 0
  const texts = chunks.map(chunk => chunk.text)
  for (let i = 0; i < texts.length; i += 1) {
    for (let j = i + 1; j < texts.length; j += 1) {
      const similarity = pairSimilarity(texts[i]!, texts[j]!)
      if (similarity > threshold) {
        duplicateCount += 1
        if (pairs.length < maxPairs) pairs.push({ indexA: i, indexB: j, similarity })
      }
    }
  }
  return { pairs, duplicateCount }
}

/** Cosine similarity over the union token set of two texts (TF-IDF-lite). */
function pairSimilarity(a: string, b: string): number {
  const tokensA = tokenMap(a)
  const tokensB = tokenMap(b)
  if (tokensA.size === 0 || tokensB.size === 0) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (const count of tokensA.values()) normA += count * count
  for (const count of tokensB.values()) normB += count * count
  for (const [token, countA] of tokensA) {
    const countB = tokensB.get(token) ?? 0
    dot += countA * countB
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/** Raw term-count map of one text (same vocabulary as {@link termFrequencies}). */
function tokenMap(text: string): Map<string, number> {
  const map = new Map<string, number>()
  for (const match of text.toLowerCase().matchAll(/[a-z0-9]+|[\u00c0-\uffff]+/giu)) {
    map.set(match[0], (map.get(match[0]) ?? 0) + 1)
  }
  return map
}
