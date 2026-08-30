/**
 * Session audit events for dsh-library (declaration merging into the harness's
 * `SessionEventMap`) and the adaptive append gate. Both events are log-only;
 * tool arguments and rendered results are already logged by the tool runtime
 * as `tool/call` + `tool/result`, and these events carry the audit facts that
 * exist outside them: the inject id linking the injected marker text back to
 * the search that produced it, and each purge-verification verdict.
 *
 * The gate appends only when the host can carry the events safely:
 * - hosts whose known-type set covers the vocabulary append plainly;
 * - hosts with an `ignorable` append option (pre-0.1.2 master builds) append
 *   with the marker, so builds that do not know the type skip it on restore;
 * - envelope-less hosts (0.1.0-rc.6/rc.8, 0.1.1-rc.2, and 0.1.2-alpha.1,
 *   which removed the envelope and fails closed on unknown types at read)
 *   get no append — the tool results remain the reconstructable audit trail.
 *
 * @module dsh-library/events
 */

import { KNOWN_SESSION_EVENT_TYPES, type Session } from '@deepseek-ai/dsh-session'

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    /** One `library_search` injection: id links the injected marker text back to this event. */
    'library/inject': LibraryInjectEvent
    /** One `library_remove` purge verification outcome. */
    'library/purge': LibraryPurgeEvent
  }
}

/** The `library_search` injection audit payload. */
export interface LibraryInjectEvent {
  /** Inject id carried by the injected marker text. */
  injectId: string
  /** Library the search ran against. */
  library: string
  /** The search query. */
  query: string
  /** Chunk ids of the injected result page. */
  chunks: string[]
  /** Injected page length in characters (after the budget cap). */
  chars: number
}

/** The `library_remove` purge-verification audit payload. */
export interface LibraryPurgeEvent {
  /** Purge probe run id. */
  purgeId: string
  /** Library the document was removed from. */
  library: string
  /** Removed document id. */
  documentId: string
  /** Whether the purge probes found no residue. */
  passed: boolean
  /** Residue hits found by the purge probes. */
  totalFound: number
}

/** The injection audit event type. */
export const INJECT_EVENT = 'library/inject' as const

/** The purge audit event type. */
export const PURGE_EVENT = 'library/purge' as const

/** Loose append shape probed at runtime (envelope-less hosts take no options; pre-0.1.2 master builds took `ignorable`). */
type AppendProbe = (type: string, data: unknown, options?: { ignorable: true }) => unknown

/**
 * Append one dsh-library audit event when the host can carry it safely; skip
 * silently otherwise (the `tool/call` + `tool/result` events remain the
 * model-visible log, so nothing model-visible is lost). See the module doc
 * for the three host classes.
 * @param session - the calling session.
 * @param type - the audit event type.
 * @param data - the audit payload.
 */
export function appendAuditEvent(
  session: Session,
  type: typeof INJECT_EVENT | typeof PURGE_EVENT,
  data: LibraryInjectEvent | LibraryPurgeEvent,
): void {
  if (KNOWN_SESSION_EVENT_TYPES.has(type)) {
    if (type === INJECT_EVENT) session.append(type, data as LibraryInjectEvent)
    else session.append(type, data as LibraryPurgeEvent)
    return
  }
  const append = session.append as AppendProbe
  if (Function.prototype.toString.call(append).includes('ignorable')) {
    append.call(session, type, data, { ignorable: true })
  }
}
