/**
 * The adaptive audit gate. The host capability is OBSERVED, never inferred
 * from an append implementation's source text: the mount probe appends one
 * event on a scratch session and reads the returned record back. The three
 * branch semantics are unchanged — known-vocabulary hosts append plainly,
 * hosts that stamp the `ignorable` envelope append with the marker, and hosts
 * that cannot stamp it skip the append (now visibly, with one warning).
 * @module dsh-library/test/events.spec
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { KNOWN_SESSION_EVENT_TYPES, type Session } from '@deepseek-ai/dsh-session'
import {
  adoptMarkerSupport,
  appendAuditEvent,
  INJECT_EVENT,
  probeMarkerSupport,
  PURGE_EVENT,
  type LibraryInjectEvent,
  type LibraryPurgeEvent,
} from '../src/events.ts'

const payload: LibraryInjectEvent = {
  injectId: 'inj-1',
  library: 'docs',
  query: 'what is the harness built on',
  chunks: ['chunk-1'],
  chars: 32,
}

const purgePayload: LibraryPurgeEvent = {
  purgeId: 'purge-1',
  library: 'docs',
  documentId: 'doc-1',
  passed: true,
  totalFound: 0,
}

afterEach(() => {
  // The verdict is process-global state; reset it so cases stay independent.
  adoptMarkerSupport('unknown')
})

describe('appendAuditEvent', () => {
  it('appends plainly when the host knows the vocabulary', () => {
    ;(KNOWN_SESSION_EVENT_TYPES as Set<string>).add(INJECT_EVENT)
    try {
      const calls: unknown[][] = []
      const append = function (type: string, data: unknown) {
        calls.push([type, data])
        return {}
      }
      const outcome = appendAuditEvent({ append } as unknown as Session, INJECT_EVENT, payload)
      expect(outcome).toBe('appended')
      expect(calls).toEqual([[INJECT_EVENT, payload]])
    } finally {
      ;(KNOWN_SESSION_EVENT_TYPES as Set<string>).delete(INJECT_EVENT)
    }
  })

  it('appends with the marker when the adopted verdict says this host stamps it', () => {
    adoptMarkerSupport('supported')
    const calls: unknown[][] = []
    const append = function (type: string, data: unknown, options?: unknown) {
      calls.push(options === undefined ? [type, data] : [type, data, options])
      return { ignorable: (options as { ignorable?: boolean } | undefined)?.ignorable === true }
    }
    const outcome = appendAuditEvent({ append } as unknown as Session, INJECT_EVENT, payload)
    expect(outcome).toBe('appended-marked')
    expect(calls).toEqual([[INJECT_EVENT, payload, { ignorable: true }]])
  })

  it('skips visibly, warning exactly once, when the host cannot stamp the marker', () => {
    adoptMarkerSupport('unsupported')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
      const calls: unknown[][] = []
      const append = function (type: string, data: unknown, surface?: unknown) {
        calls.push(surface === undefined ? [type, data] : [type, data, surface])
        return { surface }
      }
      const session = { append } as unknown as Session
      expect(appendAuditEvent(session, INJECT_EVENT, payload)).toBe('skipped-unmarked-host')
      expect(appendAuditEvent(session, PURGE_EVENT, purgePayload)).toBe('skipped-unmarked-host')
      expect(calls).toHaveLength(0)
      const skipWarnings = warn.mock.calls.filter(([message]) => String(message).includes('dsh-library'))
      expect(skipWarnings).toHaveLength(1)
    } finally {
      warn.mockRestore()
    }
  })
})

describe('probeMarkerSupport', () => {
  it('reports supported when the appended record carries the marker back', async () => {
    const session = {
      append: (_type: string, _data: unknown, options?: { ignorable?: boolean }) => ({ ignorable: options?.ignorable === true }),
    } as unknown as Session
    expect(await probeMarkerSupport(() => session)).toBe('supported')
  })

  it('reports unsupported when the host drops the options bag', async () => {
    const session = {
      append: (_type: string, _data: unknown, _options?: unknown) => ({}),
    } as unknown as Session
    expect(await probeMarkerSupport(() => session)).toBe('unsupported')
  })

  it('reports unsupported when the scratch append throws (fail closed)', async () => {
    const session = {
      append: () => { throw new Error('unknown event type') },
    } as unknown as Session
    expect(await probeMarkerSupport(() => session)).toBe('unsupported')
  })
})
