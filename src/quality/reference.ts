/**
 * Port of RAG-Reference-Checker (upstream/PerryLink, Apache-2.0): citation
 * extraction (`[n]` markers), the surrounding-context window, and the
 * verify loop that marks each citation valid / suspicious / missing. The
 * upstream SentenceTransformer model (and its `download_model.py`) is
 * replaced by the plugin's deterministic hash embedder — zero downloads, and
 * the similarity threshold is the resolved `citation.minSemantic` config.
 * @module dsh-library/quality/reference
 */

import { cosine, embedHash } from '../embedding.ts'

/** One extracted citation marker: its numeric id and [start, end) span. */
export interface CitationMarker {
  readonly refId: number
  readonly start: number
  readonly end: number
}

/**
 * Extract every `[<digits>]` citation marker — the upstream
 * `extract_citations` (`r'\[(\d+)\]'`), with the numeric id returned as a
 * number like the upstream `int(match.group(1))`.
 * @param text - the answer text.
 * @returns the markers in scan order.
 */
export function extractCitations(text: string): CitationMarker[] {
  const markers: CitationMarker[] = []
  for (const match of text.matchAll(/\[(\d+)\]/gu)) {
    markers.push({ refId: Number(match[1]), start: match.index, end: match.index + match[0].length })
  }
  return markers
}

/**
 * Extract the character window around a citation position — the upstream
 * `extract_context` (`position ± window`, trimmed).
 * @param text - the answer text.
 * @param position - the citation marker position.
 * @param window - half-window size in characters.
 * @returns the trimmed context.
 */
export function extractContext(text: string, position: number, window = 50): string {
  const start = Math.max(0, position - window)
  const end = Math.min(text.length, position + window)
  return text.slice(start, end).trim()
}

/** One reference document the checker verifies against. */
export interface ReferenceDocument {
  readonly id: number
  readonly content: string
}

/** One citation verdict — the upstream per-citation result dictionary. */
export interface ReferenceVerdict {
  readonly refId: number
  /** `valid` (similarity ≥ threshold), `suspicious` (below), or `missing` (unknown id). */
  readonly status: 'valid' | 'suspicious' | 'missing'
  /** Semantic similarity, rounded to two decimals like upstream. */
  readonly similarity: number
  /** The claim context the similarity was computed from. */
  readonly context: string
  /** Present on suspicious/missing verdicts only. */
  readonly reason?: string
}

/** The whole verification report — the upstream `verify_references` return. */
export interface ReferenceReport {
  readonly total: number
  readonly valid: number
  readonly suspicious: number
  readonly details: readonly ReferenceVerdict[]
}

/** Verification options: similarity threshold and embedding dimensionality. */
export interface ReferenceOptions {
  /** Similarity threshold (0..1); below it a citation is `suspicious`. */
  readonly threshold?: number
  /** Hash-embedding dimensionality. */
  readonly dims?: number
}

/**
 * Verify every citation in an answer against the reference list — the
 * upstream `verify_references` with the hash embedder substituted for the
 * model. Unknown reference ids are `missing`; known ids whose context
 * similarity falls below the threshold are `suspicious`.
 * @param answer - the answer text containing `[n]` markers.
 * @param references - the reference documents keyed by numeric id.
 * @param options - verification options.
 * @returns the verification report.
 */
export function verifyReferences(answer: string, references: readonly ReferenceDocument[], options: ReferenceOptions = {}): ReferenceReport {
  const threshold = options.threshold ?? 0.5
  const dims = options.dims ?? 256
  const referenceById = new Map(references.map(reference => [reference.id, reference]))
  const details = extractCitations(answer).map((marker): ReferenceVerdict => {
    const context = extractContext(answer, marker.start)
    const reference = referenceById.get(marker.refId)
    if (reference === undefined) {
      return { refId: marker.refId, status: 'missing', similarity: 0, context, reason: '引用的文档不存在' }
    }
    const similarity = cosine(embedHash(context, dims), embedHash(reference.content, dims))
    const status = similarity >= threshold ? 'valid' : 'suspicious'
    return {
      refId: marker.refId,
      status,
      similarity: Math.round(similarity * 100) / 100,
      context,
      ...(status === 'suspicious' ? { reason: '低相似度' } : {}),
    }
  })
  return {
    total: details.length,
    valid: details.filter(verdict => verdict.status === 'valid').length,
    suspicious: details.filter(verdict => verdict.status === 'suspicious').length,
    details,
  }
}
