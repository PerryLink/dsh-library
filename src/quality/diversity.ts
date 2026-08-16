/**
 * Port of Retrieval-Diversity-Check (upstream/PerryLink, Apache-2.0): the
 * TF-IDF cosine duplicate scan (`check_diversity`) plus the maximal-marginal
 * relevance re-ranking that `library_search` applies to its hybrid-ranked
 * candidates. Pure functions — the upstream numpy/sklearn calls are replaced
 * by the shared token vocabulary.
 * @module dsh-library/quality/diversity
 */

import { termFrequencies } from '../text.ts'

/** One duplicate pair from {@link checkDiversity}. */
export interface DuplicatePair {
  readonly first: number
  readonly second: number
  readonly similarity: number
}

/** The `check_diversity` result dictionary, ported 1:1. */
export interface DiversityReport {
  readonly totalTexts: number
  readonly duplicateCount: number
  /** Percentage of texts involved in at least one duplicate pair. */
  readonly tokenSavings: number
  readonly duplicates: readonly DuplicatePair[]
  /** Row-major lower-triangle-free matrix of pairwise cosine similarities. */
  readonly similarityMatrix: readonly (readonly number[])[]
}

/**
 * Check a text list for near-duplicates — the upstream `check_diversity`.
 * TF-IDF-lite vectors share one token vocabulary; pairs whose cosine
 * similarity is STRICTLY above `threshold` are duplicates (upstream uses
 * `>`). Fewer than two texts throw, like upstream.
 * @param texts - the texts to compare.
 * @param threshold - similarity threshold (0..1).
 * @returns the diversity report.
 * @throws TypeError on fewer than two texts.
 */
export function checkDiversity(texts: readonly string[], threshold = 0.9): DiversityReport {
  if (texts.length < 2) throw new TypeError('at least 2 texts are required for comparison')
  const vectors = texts.map(text => termFrequencies(text))
  const matrix: number[][] = []
  const duplicates: DuplicatePair[] = []
  const duplicateIndices = new Set<number>()
  for (let i = 0; i < texts.length; i += 1) {
    const row: number[] = []
    matrix.push(row)
    for (let j = 0; j < texts.length; j += 1) {
      const similarity = j === i ? 1 : cosineTf(vectors[i]!, vectors[j]!)
      row.push(similarity)
      if (j > i && similarity > threshold) {
        duplicates.push({ first: i, second: j, similarity })
        duplicateIndices.add(i)
        duplicateIndices.add(j)
      }
    }
  }
  const duplicateCount = duplicateIndices.size
  const tokenSavings = texts.length > 0 ? (duplicateCount / texts.length) * 100 : 0
  return { totalTexts: texts.length, duplicateCount, tokenSavings, duplicates, similarityMatrix: matrix }
}

/** Cosine over two raw term-frequency maps. */
function cosineTf(a: Record<string, number>, b: Record<string, number>): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (const count of Object.values(a)) normA += count * count
  for (const count of Object.values(b)) normB += count * count
  for (const [token, countA] of Object.entries(a)) {
    const countB = b[token] ?? 0
    dot += countA * countB
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/** One re-rankable candidate: an item plus its relevance and pair similarity. */
export interface RerankCandidate {
  readonly id: string
  /** Pre-existing relevance (hybrid score), used as the MMR relevance term. */
  readonly relevance: number
  /** Pairwise similarity to one already-selected item. */
  similarityTo(other: RerankCandidate): number
}

/**
 * Maximal marginal relevance over {@link RerankCandidate}s: greedily pick the
 * candidate maximizing `lambda * relevance - (1 - lambda) * maxSimilarity`.
 * `lambda = 1` is pure relevance order, `lambda = 0` pure diversity.
 * @param candidates - the ranked candidate pool.
 * @param lambda - relevance/diversity trade-off within 0..1.
 * @param topK - how many to pick.
 * @returns the picked candidates in selection order.
 */
export function maximalMarginalRelevance<T extends RerankCandidate>(
  candidates: readonly T[],
  lambda: number,
  topK: number,
): T[] {
  const pool = [...candidates]
  const selected: T[] = []
  while (selected.length < topK && pool.length > 0) {
    let bestIndex = -1
    let bestScore = Number.NEGATIVE_INFINITY
    for (let index = 0; index < pool.length; index += 1) {
      const candidate = pool[index]!
      let maxSimilarity = 0
      for (const chosen of selected) {
        const similarity = candidate.similarityTo(chosen)
        if (similarity > maxSimilarity) maxSimilarity = similarity
      }
      const score = lambda * candidate.relevance - (1 - lambda) * maxSimilarity
      if (score > bestScore) {
        bestScore = score
        bestIndex = index
      }
    }
    selected.push(pool.splice(bestIndex, 1)[0]!)
  }
  return selected
}
