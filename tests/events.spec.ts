/**
 * The adaptive audit gate: plain append on known-type hosts, marked append on
 * `ignorable`-envelope hosts, and a silent skip on envelope-less hosts
 * (0.1.0-rc.6/rc.8, 0.1.1-rc.2, 0.1.2-alpha.1).
 * @module dsh-library/test/events.spec
 */

import { describe, expect, it } from 'vitest'
import { KNOWN_SESSION_EVENT_TYPES, type Session } from '@deepseek-ai/dsh-session'
import { appendAuditEvent, INJECT_EVENT, type LibraryInjectEvent } from '../src/events.ts'

const payload: LibraryInjectEvent = {
  injectId: 'inj-1',
  library: 'docs',
  query: 'what is the harness built on',
  chunks: ['chunk-1'],
  chars: 32,
}

describe('appendAuditEvent', () => {
  it('appends plainly when the host knows the vocabulary', () => {
    ;(KNOWN_SESSION_EVENT_TYPES as Set<string>).add(INJECT_EVENT)
    try {
      const calls: unknown[][] = []
      const append = function (type: string, data: unknown) {
        calls.push([type, data])
        return {}
      }
      appendAuditEvent({ append } as unknown as Session, INJECT_EVENT, payload)
      expect(calls).toEqual([[INJECT_EVENT, payload]])
    } finally {
      ;(KNOWN_SESSION_EVENT_TYPES as Set<string>).delete(INJECT_EVENT)
    }
  })

  it('appends with the marker on envelope hosts', () => {
    const calls: unknown[][] = []
    const append = function (type: string, data: unknown, options?: unknown) {
      // The `ignorable` marker rides the options bag on envelope hosts.
      calls.push(options === undefined ? [type, data] : [type, data, options])
      return { ignorable: (options as { ignorable?: boolean } | undefined)?.ignorable === true }
    }
    appendAuditEvent({ append } as unknown as Session, INJECT_EVENT, payload)
    expect(calls).toEqual([[INJECT_EVENT, payload, { ignorable: true }]])
  })

  it('skips the append on envelope-less hosts', () => {
    const calls: unknown[][] = []
    const append = function (type: string, data: unknown, surface?: unknown) {
      calls.push(surface === undefined ? [type, data] : [type, data, surface])
      return { surface }
    }
    appendAuditEvent({ append } as unknown as Session, INJECT_EVENT, payload)
    expect(calls).toHaveLength(0)
  })
})
