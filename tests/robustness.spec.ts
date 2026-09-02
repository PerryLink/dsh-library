/**
 * Fail-closed and audit-gate supplements: the `library/purge` audit append
 * follows the adaptive host gate (skipped on envelope-less hosts, appended on
 * known-vocabulary hosts) while the tool result always carries the verdict,
 * an oversized document is rejected with a clear cap error, and a
 * configured-but-absent embedder seam fails the add instead of silently
 * falling back.
 * @module dsh-library/test/robustness.spec
 */

import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { KNOWN_SESSION_EVENT_TYPES } from '@deepseek-ai/dsh-session'
import { PURGE_EVENT } from '../src/events.ts'
import { callTool, mountHarness, unmountHarness } from './harness.ts'

const DOC = 'DeepSeek Harness is a plugin-based agent harness built on vendored Cordis.'

describe('library/purge audit gate', () => {
  it('skips the append on an envelope-less host and keeps the verdict in the tool result', async () => {
    const harness = await mountHarness()
    try {
      const filePath = path.join(harness.sandbox, 'a.txt')
      writeFileSync(filePath, DOC, 'utf8')
      const added = await callTool(harness, 'library_add', { path: filePath, library: 'docs' })
      expect(added.isError).toBe(false)
      const documentId = (added.value as { documentId: string }).documentId

      const removed = await callTool(harness, 'library_remove', { library: 'docs', documentId })
      expect(removed.isError).toBe(false)
      expect(removed.value).toMatchObject({ library: 'docs', documentId, purgePassed: true })

      // The published 0.1.1-rc.2 host neither knows the plugin vocabulary nor
      // has the `ignorable` envelope, so the gate must not append.
      expect(harness.session.snapshotEvents().filter(event => event.type === 'library/purge')).toHaveLength(0)
    } finally {
      await unmountHarness(harness)
    }
  })

  it('appends the audit event when the host knows the vocabulary', async () => {
    ;(KNOWN_SESSION_EVENT_TYPES as Set<string>).add(PURGE_EVENT)
    try {
      const harness = await mountHarness()
      try {
        const filePath = path.join(harness.sandbox, 'a.txt')
        writeFileSync(filePath, DOC, 'utf8')
        const added = await callTool(harness, 'library_add', { path: filePath, library: 'docs' })
        expect(added.isError).toBe(false)
        const documentId = (added.value as { documentId: string }).documentId

        await callTool(harness, 'library_remove', { library: 'docs', documentId })

        const purgeEvent = harness.session.snapshotEvents().filter(event => event.type === 'library/purge').at(-1)
        expect(purgeEvent?.data).toMatchObject({ library: 'docs', documentId, passed: true })
      } finally {
        await unmountHarness(harness)
      }
    } finally {
      ;(KNOWN_SESSION_EVENT_TYPES as Set<string>).delete(PURGE_EVENT)
    }
  })
})

describe('fail closed', () => {
  it('rejects an oversized document with a clear cap error', async () => {
    const harness = await mountHarness({ maxFileBytes: 100 })
    try {
      const filePath = path.join(harness.sandbox, 'big.txt')
      writeFileSync(filePath, 'x'.repeat(10_000), 'utf8')
      const result = await callTool(harness, 'library_add', { path: filePath, library: 'docs' })
      expect(result.isError).toBe(true)
      if (result.isError) expect(result.error.message).toContain('maxFileBytes')
    } finally {
      await unmountHarness(harness)
    }
  })

  it('fails at mount when an external embedder command is configured but the seam is absent', async () => {
    await expect(mountHarness({ embedding: { command: 'fake-embedder' } })).rejects.toThrow(/ctx.subprocess is not mounted/u)
  })
})
