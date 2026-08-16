/**
 * Port of Citation-Validator-Lite (upstream/PerryLink, Apache-2.0): citation
 * extraction (`[n]` markers), sentence-bounded claim windows, and fuzzy
 * validation against the cited source. The upstream `fuzzywuzzy`
 * `partial_ratio` is reimplemented as a bounded token-sequence partial ratio
 * (zero dependencies) — the shorter text slides over every token window of
 * the longer one and the best ratio wins, matching the upstream semantics.
 * @module dsh-library/quality/citation
 */

import { tokenize } from '../text.ts'

/** One citation match — the upstream `CitationMatch` dataclass. */
export interface CitationMatch {
  readonly number: string
  readonly context: string
  readonly is_valid: boolean
  /** Fuzzy score 0..100. */
  readonly score: number
  readonly start_pos: number
  readonly end_pos: number
  readonly reason: string
}

/** The whole validation result — the upstream `ValidationResult` dataclass. */
export interface ValidationResult {
  readonly results: readonly CitationMatch[]
  readonly threshold: number
}

/**
 * Extract every `[<digits>]` citation marker as (number, start, end) — the
 * upstream `extract_citations` (`r'\[(\d+)\]'`).
 * @param text - the answer text.
 * @returns the markers in scan order.
 */
export function extractCitationNumbers(text: string): Array<{ number: string; start: number; end: number }> {
  const markers: Array<{ number: string; start: number; end: number }> = []
  for (const match of text.matchAll(/\[(\d+)\]/gu)) {
    markers.push({ number: match[1]!, start: match.index, end: match.index + match[0].length })
  }
  return markers
}

/**
 * Extract the sentence around a citation position — the upstream
 * `extract_sentence_with_citation`: scan backwards to the nearest sentence
 * ending (`.`, `!`, `?`, newline) and forwards the same way, bounded by the
 * window.
 * @param text - the answer text.
 * @param citationPos - the citation marker position.
 * @param window - maximum half-window in characters.
 * @returns the trimmed sentence context.
 */
export function extractSentenceWithCitation(text: string, citationPos: number, window = 150): string {
  const sentenceEndings = new Set(['.', '!', '?', '\n'])
  let start = citationPos
  for (let index = citationPos - 1; index >= Math.max(0, citationPos - window); index -= 1) {
    if (sentenceEndings.has(text[index]!)) {
      start = index + 1
      break
    }
    if (index === Math.max(0, citationPos - window)) start = Math.max(0, citationPos - window)
  }
  let end = citationPos
  for (let index = citationPos; index < Math.min(text.length, citationPos + window); index += 1) {
    if (sentenceEndings.has(text[index]!)) {
      end = index + 1
      break
    }
    if (index === Math.min(text.length, citationPos + window) - 1) end = Math.min(text.length, citationPos + window)
  }
  return text.slice(start, end).trim()
}

/** Bounds keeping the fuzzy ratio quadratic budget predictable. */
const MAX_CLAIM_TOKENS = 120
const MAX_SOURCE_TOKENS = 600

/**
 * Sequence ratio of two token lists — `2 * matches / (lenA + lenB)` where
 * `matches` is the longest-common-subsequence length (difflib-style).
 * @param a - first token list.
 * @param b - second token list.
 * @returns ratio within 0..1.
 */
function sequenceRatio(a: readonly string[], b: readonly string[]): number {
  if (a.length === 0 && b.length === 0) return 1
  if (a.length === 0 || b.length === 0) return 0
  const shorter = a.length <= b.length ? a : b
  const longer = a.length <= b.length ? b : a
  let previous = new Array<number>(shorter.length + 1).fill(0)
  for (let i = 1; i <= longer.length; i += 1) {
    const current = new Array<number>(shorter.length + 1).fill(0)
    for (let j = 1; j <= shorter.length; j += 1) {
      current[j] = longer[i - 1] === shorter[j - 1] ? previous[j - 1]! + 1 : Math.max(previous[j]!, current[j - 1]!)
    }
    previous = current
  }
  const matches = previous[shorter.length]!
  return (2 * matches) / (a.length + b.length)
}

/**
 * Bounded port of `fuzz.partial_ratio`: the best sequence ratio between one
 * text and every token window of the other. Both sides are token-capped so
 * hostilely long sources stay within a fixed quadratic budget.
 * @param claim - the claim text.
 * @param source - the source text.
 * @returns the best ratio as a 0..100 integer score.
 */
export function fuzzyPartialRatio(claim: string, source: string): number {
  const claimTokens = tokenize(claim).slice(0, MAX_CLAIM_TOKENS)
  const sourceTokens = tokenize(source).slice(0, MAX_SOURCE_TOKENS)
  if (claimTokens.length === 0 || sourceTokens.length === 0) return 0
  if (sourceTokens.length <= claimTokens.length) return Math.round(sequenceRatio(claimTokens, sourceTokens) * 100)
  let best = 0
  const windowLength = claimTokens.length
  for (let start = 0; start + windowLength <= sourceTokens.length; start += 1) {
    const ratio = sequenceRatio(claimTokens, sourceTokens.slice(start, start + windowLength))
    if (ratio > best) best = ratio
  }
  return Math.round(best * 100)
}

/**
 * Validate one citation claim against its source — the upstream
 * `validate_citation` (`fuzz.partial_ratio(claim, source) >= threshold`).
 * @param claim - the claim context.
 * @param source - the cited source text.
 * @param threshold - pass score (0..100).
 * @returns `[isValid, score]`.
 */
export function validateCitation(claim: string, source: string, threshold = 80): [boolean, number] {
  const score = fuzzyPartialRatio(claim, source)
  return [score >= threshold, score]
}

/**
 * Validate every citation in an answer — the upstream `validate_citations`.
 * Unknown source numbers are invalid with score 0 and reason
 * "Source not found"; low scores carry a "Low match score: N%" reason.
 * @param answer - the answer text with `[n]` markers.
 * @param sources - source text keyed by citation number.
 * @param threshold - pass score (0..100).
 * @returns the validation result.
 */
export function validateCitations(answer: string, sources: Readonly<Record<string, string>>, threshold = 80): ValidationResult {
  const results = extractCitationNumbers(answer).map((marker): CitationMatch => {
    const context = extractSentenceWithCitation(answer, marker.start)
    const source = sources[marker.number]
    if (source === undefined) {
      return { number: marker.number, context, is_valid: false, score: 0, start_pos: marker.start, end_pos: marker.end, reason: 'Source not found' }
    }
    const [isValid, score] = validateCitation(context, source, threshold)
    return {
      number: marker.number,
      context,
      is_valid: isValid,
      score,
      start_pos: marker.start,
      end_pos: marker.end,
      reason: isValid ? '' : `Low match score: ${score}%`,
    }
  })
  return { results, threshold }
}
