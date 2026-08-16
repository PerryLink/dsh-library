/**
 * Port of Few-Shot-Selector (upstream/PerryLink, Apache-2.0): the
 * similarity-ranked example selection and the prompt formatter. The upstream
 * ChromaDB collection + SentenceTransformer model are replaced by the
 * plugin's deterministic hash embedder (zero downloads) — same
 * "embed question, cosine-rank, top-n" pipeline and the same prompt layout.
 * @module dsh-library/quality/few-shot
 */

import { cosine, embedHash } from '../embedding.ts'

/** One QA example in the local store, mirroring the upstream metadata shape. */
export interface QaExample {
  readonly id: string
  readonly question: string
  readonly answer: string
  readonly category?: string
  /** Free-form tags, joined by commas in the upstream metadata. */
  readonly tags?: readonly string[]
}

/** One selected example plus its similarity to the query. */
export interface SelectedExample {
  readonly example: QaExample
  /** Cosine similarity to the query (0..1 for the hash embedder). */
  readonly score: number
}

/** Selection options: how many examples and the embedding dimensionality. */
export interface FewShotOptions {
  /** How many examples to return (upstream `n_results`). */
  readonly n?: number
  /** Hash-embedding dimensionality used for ranking. */
  readonly dims?: number
}

/** Whether a QA pair is usable, ported from upstream `validate_qa_pair`. */
export function validateQaPair(question: string, answer: string): boolean {
  return question.trim().length > 0 && answer.trim().length > 0
}

/**
 * Rank the example store by cosine similarity to the query and return the
 * top `n` — the upstream `search_similar` with the hash embedder in place of
 * the SentenceTransformer model. An empty query or store throws, like
 * upstream (`ValueError` / `DatabaseNotInitializedError`).
 * @param query - the query text.
 * @param examples - the QA store.
 * @param options - selection options.
 * @returns the selected examples, best first.
 * @throws TypeError on an empty query or empty store.
 */
export function selectFewShot(query: string, examples: readonly QaExample[], options: FewShotOptions = {}): SelectedExample[] {
  if (query.trim().length === 0) throw new TypeError('query must not be empty')
  if (examples.length === 0) throw new TypeError('the example store is empty; add examples first')
  const n = options.n ?? 3
  const dims = options.dims ?? 256
  if (!Number.isSafeInteger(n) || n <= 0) throw new TypeError(`n must be a positive integer, got ${String(n)}`)
  const queryVector = embedHash(query, dims)
  return examples
    .map(example => ({ example, score: cosine(queryVector, embedHash(example.question, dims)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(n, examples.length))
}

/**
 * Format the upstream few-shot prompt: an intro line, one numbered
 * question/answer block per example, then the query — ported 1:1 from
 * `format_prompt`.
 * @param query - the query text.
 * @param selected - the selected examples, in order.
 * @returns the formatted prompt text.
 */
export function formatFewShotPrompt(query: string, selected: readonly SelectedExample[]): string {
  let prompt = '以下是一些相关示例:\n\n'
  selected.forEach((entry, index) => {
    prompt += `示例 ${index + 1}:\n`
    prompt += `问题: ${entry.example.question}\n`
    prompt += `答案: ${entry.example.answer}\n\n`
  })
  prompt += `现在请回答: ${query}`
  return prompt
}
