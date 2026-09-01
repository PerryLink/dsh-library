/**
 * Shared text utilities for the quality modules: tokenization, term
 * frequencies, and n-gram windows. Pure and deterministic — every scoring
 * module builds on this vocabulary.
 * @module dsh-library/text
 */

/**
 * Normalize prose for scoring: lowercase and collapse whitespace.
 * Does NOT strip punctuation (token boundaries still cut on it).
 * @param text - input text.
 * @returns the normalized text.
 */
export function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/gu, ' ').trim()
}

/**
 * Tokenize into lowercase word tokens. ASCII words keep their boundaries;
 * every other run of letters counts as one token so CJK text still scores.
 * @param text - input text.
 * @returns the token list.
 */
export function tokenize(text: string): string[] {
  const tokens: string[] = []
  const pattern = /[a-z0-9]+|[\u00c0-\uffff]+/giu
  for (const match of normalize(text).matchAll(pattern)) {
    tokens.push(match[0])
  }
  return tokens
}

/**
 * CJK-aware scoring tokenization: like {@link tokenize}, but every CJK run
 * contributes its unigrams plus its adjacent bigrams, so a query and a
 * document overlap on sub-phrases instead of only on identical whole runs.
 * @param text - input text.
 * @returns the expanded token list.
 */
export function cjkTokenize(text: string): string[] {
  const tokens: string[] = []
  const pattern = /[a-z0-9]+|[\u00c0-\uffff]+/giu
  for (const match of normalize(text).matchAll(pattern)) {
    const run = match[0]
    if (/^[\u4e00-\u9fff]+$/u.test(run)) {
      for (const char of run) tokens.push(char)
      for (let index = 0; index < run.length - 1; index += 1) tokens.push(run.slice(index, index + 2))
    } else {
      tokens.push(run)
    }
  }
  return tokens
}

/** Deduplicated token set of one text. */
export function tokenSet(text: string): ReadonlySet<string> {
  return new Set(tokenize(text))
}

/**
 * Term-frequency map of a token list: token → occurrence count.
 * @param tokens - the token list.
 * @returns the frequency map (plain object, no prototype).
 */
export function termFrequenciesOf(tokens: readonly string[]): Record<string, number> {
  const frequencies = Object.create(null) as Record<string, number>
  for (const token of tokens) frequencies[token] = (frequencies[token] ?? 0) + 1
  return frequencies
}

/**
 * Term-frequency map of one text: token → occurrence count.
 * @param text - input text.
 * @returns the frequency map (plain object, no prototype).
 */
export function termFrequencies(text: string): Record<string, number> {
  return termFrequenciesOf(tokenize(text))
}

/**
 * Character n-grams of a normalized text, for the built-in hash embedder.
 * A space-padded form adds leading/trailing boundary markers so prefixes and
 * suffixes still contribute.
 * @param text - input text.
 * @param n - n-gram width.
 * @returns the n-gram array.
 */
export function charNGrams(text: string, n: number): string[] {
  const padded = ` ${normalize(text)} `
  if (padded.length <= n) return [padded]
  const grams: string[] = []
  for (let index = 0; index <= padded.length - n; index += 1) {
    grams.push(padded.slice(index, index + n))
  }
  return grams
}

/**
 * Token n-grams of a tokenized text (the purge signature vocabulary).
 * @param tokens - token list from {@link tokenize}.
 * @param n - n-gram width.
 * @returns n-gram tokens joined by spaces, deduplicated.
 */
export function tokenNGrams(tokens: readonly string[], n: number): string[] {
  if (tokens.length === 0) return []
  const grams: string[] = []
  const end = Math.max(tokens.length - n + 1, 1)
  for (let index = 0; index < end; index += 1) {
    grams.push(tokens.slice(index, Math.min(index + n, tokens.length)).join(' '))
  }
  return [...new Set(grams)]
}

/**
 * FNV-1a 32-bit string hash — the deterministic bucket of the hash embedder.
 * @param text - string to hash.
 * @returns an unsigned 32-bit integer.
 */
export function fnv1a(text: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}
