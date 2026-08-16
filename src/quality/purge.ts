/**
 * Port of RAG-Purge-Verify (upstream/PerryLink, Apache-2.0): after a
 * document is removed, probe the remaining index with deterministic
 * signatures of the removed content and report any residue. The upstream
 * metadata-filter and payload-text engine probes become token n-gram
 * signature probes over the remaining chunks; `passed` requires zero hits,
 * exactly like the upstream `total_found == 0` gate.
 * @module dsh-library/quality/purge
 */

import { tokenNGrams, tokenize } from '../text.ts'

/** One remaining index entry the purge verification probes against. */
export interface RemainingChunk {
  readonly id: string
  readonly text: string
}

/** One signature probe's outcome — the upstream per-check result dictionary. */
export interface PurgeProbeResult {
  readonly signature: string
  readonly foundCount: number
  readonly residueIds: readonly string[]
}

/** The whole verification report — the upstream `verify` return. */
export interface PurgeReport {
  /** True when no signature matched anything (the upstream pass stamp). */
  readonly passed: boolean
  readonly totalFound: number
  readonly probes: readonly PurgeProbeResult[]
}

/** Purge verification options, bound to the resolved purge config. */
export interface PurgeOptions {
  /** Token n-gram width of the signatures. */
  readonly signatureLength?: number
  /** How many signatures are probed; longer documents sample deterministically. */
  readonly maxProbes?: number
}

/**
 * Deterministically pick up to `maxProbes` signatures from a list: indices
 * are spread evenly across the list so long documents are sampled end to end.
 * @param signatures - the full signature list.
 * @param maxProbes - the probe budget.
 * @returns the sampled signatures in original order.
 */
export function sampleSignatures(signatures: readonly string[], maxProbes: number): string[] {
  if (signatures.length <= maxProbes) return [...signatures]
  const picked: string[] = []
  for (let index = 0; index < maxProbes; index += 1) {
    const sourceIndex = maxProbes === 1 ? 0 : Math.round((index * (signatures.length - 1)) / (maxProbes - 1))
    picked.push(signatures[sourceIndex]!)
  }
  return picked
}

/**
 * Verify that a removed document left no residue in the remaining index —
 * the upstream `Verifier.verify` flow. Signatures are token n-grams of the
 * removed content; a chunk is residue when it contains every token of one
 * signature (as token-subsequence containment is too strict for chunk
 * boundaries, exact phrase containment is used).
 * @param remaining - the chunks that should remain after removal.
 * @param removedContent - the removed document text.
 * @param options - purge options.
 * @returns the purge report; `passed` is true only on zero residue.
 */
export function verifyPurge(remaining: readonly RemainingChunk[], removedContent: string, options: PurgeOptions = {}): PurgeReport {
  const signatureLength = options.signatureLength ?? 4
  const maxProbes = options.maxProbes ?? 24
  const signatures = sampleSignatures(tokenNGrams(tokenize(removedContent), signatureLength), maxProbes)
  const probes = signatures.map((signature): PurgeProbeResult => {
    const residueIds = remaining
      .filter(chunk => chunk.text.includes(signature))
      .map(chunk => chunk.id)
    return { signature, foundCount: residueIds.length, residueIds }
  })
  const totalFound = probes.reduce((sum, probe) => sum + probe.foundCount, 0)
  return { passed: totalFound === 0, totalFound, probes }
}
