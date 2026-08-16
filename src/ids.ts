/**
 * Identity minting for dsh-library records: content-derived document ids,
 * per-chunk ids, and the unique ids that link injected model-visible text
 * back to its `library/inject` session event (model-visible ⟺ logged).
 * @module dsh-library/ids
 */

import { createHash, randomUUID } from 'node:crypto'

/** Stable document id: first 16 hex chars of the SHA-256 of its content. */
export function documentIdOf(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex').slice(0, 16)
}

/** Chunk id: the owning document id plus the chunk sequence. */
export function chunkIdOf(documentId: string, seq: number): string {
  return `${documentId}#${seq}`
}

/** Parse a chunk id back into its document id and sequence; null when malformed. */
export function parseChunkId(chunkId: string): { documentId: string; seq: number } | null {
  const cut = chunkId.lastIndexOf('#')
  if (cut <= 0 || cut === chunkId.length - 1) return null
  const seq = Number(chunkId.slice(cut + 1))
  if (!Number.isSafeInteger(seq) || seq < 0) return null
  return { documentId: chunkId.slice(0, cut), seq }
}

/** One purge-verification run's identity, recorded in the purges table. */
export function purgeId(): string {
  return `purge-${randomUUID()}`
}

/**
 * One injection's identity: embedded in the injected marker text so the
 * model-visible message is reconstructable from the `library/inject` event.
 */
export function injectId(): string {
  return randomUUID()
}

/** Domain record key of one document inside the `documents` table. */
export function documentKey(library: string, documentId: string): string {
  return `${library}:${documentId}`
}

/** Domain record key of one chunk inside the `chunks` table. */
export function chunkKey(library: string, chunkId: string): string {
  return `${library}:${chunkId}`
}
