/**
 * Port of Context-Relevance-Scorer (upstream/PerryLink, Apache-2.0): the
 * relevance scoring/filtering pipeline that `library_search` runs after
 * retrieval. The upstream cross-encoder model is replaced by a local-rules
 * lexical scorer (zero downloads): token overlap weighted toward rarer
 * query terms, normalized to 0..1 — same `(document, score, passed)` API
 * shape as the upstream `score_batch`/`filter_documents`.
 * @module dsh-library/quality/relevance
 */

import { termFrequencies, tokenize } from '../text.ts'

/**
 * Score one document's relevance to a query with the local-rules scorer.
 * Each query token contributes its document frequency share: a query term
 * the document covers at least once contributes fully; the score is the
 * covered-query-weight fraction. Repeated query terms are down-weighted
 * (1/count) so spam cannot inflate coverage.
 * @param query - the query text.
 * @param document - the candidate document text.
 * @returns relevance within 0..1 (0 for an empty query or document).
 */
export function scoreRelevance(query: string, document: string): number {
  const queryTokens = tokenize(query)
  if (queryTokens.length === 0) return 0
  const documentTerms = termFrequencies(document)
  const queryTerms = termFrequencies(query)
  let covered = 0
  let total = 0
  for (const [token, count] of Object.entries(queryTerms)) {
    const weight = 1 / count
    total += weight
    if ((documentTerms[token] ?? 0) > 0) covered += weight
  }
  return total === 0 ? 0 : covered / total
}

/** One scored document, mirroring the upstream `score_batch` tuple. */
export interface ScoredDocument {
  readonly document: string
  readonly score: number
  readonly passed: boolean
}

/**
 * Score a batch of documents against one query — the upstream `score_batch`.
 * @param query - the query text.
 * @param documents - the candidate documents.
 * @param threshold - the pass threshold (0..1); score ≥ threshold passes.
 * @returns one entry per document, in input order.
 */
export function scoreBatch(query: string, documents: readonly string[], threshold = 0.5): ScoredDocument[] {
  return documents.map(document => {
    const score = scoreRelevance(query, document)
    return { document, score, passed: score >= threshold }
  })
}

/**
 * Keep only documents that pass the threshold — the upstream
 * `filter_documents`, with the local-rules scorer substituted for the model.
 * @param query - the query text.
 * @param documents - the candidate documents.
 * @param threshold - the pass threshold (0..1).
 * @returns the passing documents in input order.
 */
export function filterDocuments(query: string, documents: readonly string[], threshold = 0.5): string[] {
  return scoreBatch(query, documents, threshold)
    .filter(entry => entry.passed)
    .map(entry => entry.document)
}
