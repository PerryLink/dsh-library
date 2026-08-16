/**
 * Port of Lost-in-Middle-Tester (upstream/PerryLink, Apache-2.0): the probe
 * insertion and position statistics vocabulary, plus the avoidance strategy
 * that `library_search` applies to its retrieved list — the strongest chunks
 * are pinned to the head and tail of the context so the model never meets
 * the key evidence only in the middle.
 * @module dsh-library/quality/lost-middle
 */

/** One probe trial's outcome, mirroring the upstream `TestResult` shape. */
export interface ProbeResult {
  /** Relative insertion position within 0..1. */
  readonly position: number
  readonly probe: string
  readonly found: boolean
}

/** Default probe prefix, mirroring the upstream `SECRET_CODE_` convention. */
export const PROBE_PREFIX = 'SECRET_CODE_'

/**
 * Deterministic probe text for one trial. The upstream generator draws 4
 * random chars; here the caller supplies the suffix so tests replay.
 * @param suffix - the 4-character uppercase/digit suffix.
 * @returns the full probe string.
 */
export function makeProbe(suffix: string): string {
  return `${PROBE_PREFIX}${suffix}`
}

/**
 * Insert a probe sentence into one paragraph — the upstream
 * `PasswordInserter.insert`, deterministic instead of random.
 * @param paragraphs - the paragraph list.
 * @param position - relative position within 0..1 (clamped to the list).
 * @param probe - the probe string to insert.
 * @returns the modified list, the probe, and the insertion index.
 */
export function insertProbe(
  paragraphs: readonly string[],
  position: number,
  probe: string,
): { modified: string[]; probe: string; index: number } {
  if (paragraphs.length === 0) throw new TypeError('insertProbe requires at least one paragraph')
  let insertIndex = Math.round((paragraphs.length - 1) * Math.min(Math.max(position, 0), 1))
  if (insertIndex < 0) insertIndex = 0
  if (insertIndex > paragraphs.length - 1) insertIndex = paragraphs.length - 1
  const modified = [...paragraphs]
  modified[insertIndex] = `${modified[insertIndex]} The verification code is ${probe}.`
  return { modified, probe, index: insertIndex }
}

/** Per-position statistics, mirroring the upstream `ResultCollector`. */
export interface PositionStats {
  readonly successRate: number
  readonly successCount: number
  readonly totalCount: number
}

/** Success counts keyed by position (the upstream statistics dictionary). */
export function successByPosition(results: readonly ProbeResult[]): Map<number, PositionStats> {
  const totals = new Map<number, { success: number; total: number }>()
  for (const result of results) {
    const slot = totals.get(result.position) ?? { success: 0, total: 0 }
    slot.total += 1
    if (result.found) slot.success += 1
    totals.set(result.position, slot)
  }
  const stats = new Map<number, PositionStats>()
  for (const [position, data] of totals) {
    stats.set(position, {
      successRate: data.success / data.total,
      successCount: data.success,
      totalCount: data.total,
    })
  }
  return stats
}

/**
 * The upstream prompt template used to test whether a model can surface a
 * probe at a given position.
 * @param document - the joined document text.
 * @returns the model prompt.
 */
export function buildProbePrompt(document: string): string {
  return `Below is a long document. Please read it carefully and find the verification code mentioned in the text. The code follows the format "${PROBE_PREFIX}XXXX".\n\nDocument:\n${document}\n\nQuestion: What is the verification code mentioned in the document? Please respond with ONLY the code itself, nothing else.`
}

/** One ranked item the avoidance strategy reorders. */
export interface RankedItem {
  readonly id: string
  readonly score: number
}

/**
 * Lost-in-the-middle avoidance: reorder a ranked list so the strongest items
 * sit at the head and the tail of the context window (the positions models
 * read most reliably), leaving the weakest in the middle. Within each zone
 * the score order is preserved.
 * @param ranked - the items ranked by score, descending.
 * @param head - how many strongest items to pin to the head.
 * @param tail - how many next-strongest items to pin to the tail.
 * @returns the reordered list (same length, same members).
 */
export function avoidLostMiddle(ranked: readonly RankedItem[], head: number, tail: number): RankedItem[] {
  const sorted = [...ranked].sort((a, b) => b.score - a.score)
  const headItems = sorted.slice(0, head)
  const tailItems = sorted.slice(head, head + tail)
  const middleItems = sorted.slice(head + tail)
  return [...headItems, ...middleItems, ...tailItems]
}

/** One position bin of a middle-penalty report. */
export interface PositionBin {
  /** Inclusive relative start of the bin (0..1). */
  readonly start: number
  /** Exclusive relative end of the bin (0..1). */
  readonly end: number
  readonly count: number
  readonly meanScore: number
}

/**
 * Bin one ranked list by relative position and fold each bin's mean score —
 * the middle-penalty report: a score trough in the middle bins is the
 * lost-in-the-middle risk signal `library_diagnose` reports.
 * @param ranked - the items in their final context order.
 * @param bins - how many equal-width bins to use.
 * @returns one entry per bin.
 */
export function positionBins(ranked: readonly RankedItem[], bins: number): PositionBin[] {
  if (ranked.length === 0) return []
  const result: PositionBin[] = []
  for (let index = 0; index < bins; index += 1) {
    const startIndex = Math.floor((ranked.length * index) / bins)
    const endIndex = Math.floor((ranked.length * (index + 1)) / bins)
    const slice = ranked.slice(startIndex, endIndex)
    let sum = 0
    for (const item of slice) sum += item.score
    result.push({
      start: index / bins,
      end: (index + 1) / bins,
      count: slice.length,
      meanScore: slice.length === 0 ? 0 : sum / slice.length,
    })
  }
  return result
}

/**
 * The middle-penalty magnitude: how much the middle bins' mean score drops
 * below the best bin's mean. 0 means no penalty (flat distribution); larger
 * values mean strong content sits at the edges and weak content in the middle.
 * @param bins - a {@link positionBins} report.
 * @returns the penalty within 0..1, or 0 for an empty report.
 */
export function middlePenalty(bins: readonly PositionBin[]): number {
  if (bins.length === 0) return 0
  let best = 0
  for (const bin of bins) if (bin.meanScore > best) best = bin.meanScore
  if (best <= 0) return 0
  const middle = bins.filter((_, index) => index > 0 && index < bins.length - 1)
  if (middle.length === 0) return 0
  let mean = 0
  for (const bin of middle) mean += bin.meanScore
  return Math.max(0, (best - mean / middle.length) / best)
}
