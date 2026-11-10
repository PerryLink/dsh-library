/**
 * BM25 over library chunks.
 *
 * A lexical channel independent of the embedding model: exact terms, method
 * names and abbreviations still rank when the embedder is a 256-d hash. The
 * index is built per search from the chunks of one library; no persistence and
 * no tuning state leak between libraries.
 *
 * @module dsh-library/quality/bm25
 */

import { cjkTokenize } from '../text.ts'

/** One document in the index. */
export interface Bm25Document {
  readonly id: string
  readonly text: string
}

/** BM25 parameters (the standard defaults). */
export const BM25_K1 = 1.2
/** Length-normalization parameter. */
export const BM25_B = 0.75

interface IndexedDocument {
  readonly id: string
  readonly tf: ReadonlyMap<string, number>
  readonly length: number
}

/**
 * An in-memory BM25 index over one library's chunks.
 */
export class Bm25Index {
  private readonly documents: IndexedDocument[] = []
  private readonly documentFrequency = new Map<string, number>()
  private readonly averageLength: number

  /**
   * @param documents - chunk id + text.
   */
  constructor(documents: readonly Bm25Document[]) {
    let totalLength = 0
    for (const document of documents) {
      const tokens = cjkTokenize(document.text)
      const tf = new Map<string, number>()
      for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1)
      for (const token of tf.keys()) this.documentFrequency.set(token, (this.documentFrequency.get(token) ?? 0) + 1)
      totalLength += tokens.length
      this.documents.push({ id: document.id, tf, length: tokens.length })
    }
    this.averageLength = this.documents.length === 0 ? 0 : totalLength / this.documents.length
  }

  /**
   * Score every document for a query.
   * @param query - the query text (may be expanded with translations).
   * @returns id → BM25 score; absent ids score 0.
   */
  score(query: string): Map<string, number> {
    const scores = new Map<string, number>()
    const terms = [...new Set(cjkTokenize(query))]
    if (terms.length === 0 || this.documents.length === 0) {
      for (const document of this.documents) scores.set(document.id, 0)
      return scores
    }
    const total = this.documents.length
    for (const document of this.documents) {
      let score = 0
      for (const term of terms) {
        const tf = document.tf.get(term) ?? 0
        if (tf === 0) continue
        const df = this.documentFrequency.get(term) ?? 0
        const idf = Math.log(1 + (total - df + 0.5) / (df + 0.5))
        const denominator = tf + BM25_K1 * (1 - BM25_B + BM25_B * (this.averageLength === 0 ? 0 : document.length / this.averageLength))
        score += idf * (tf * (BM25_K1 + 1)) / denominator
      }
      scores.set(document.id, score)
    }
    return scores
  }
}
