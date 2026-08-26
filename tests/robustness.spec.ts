/**
 * Fail-closed and event-reconstruction supplements: the `library/purge`
 * audit event reconstructs a removal, an oversized document is rejected with
 * a clear cap error, and a configured-but-absent embedder seam fails the add
 * instead of silently falling back.
 * @module dsh-library/test/robustness.spec
 */

import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { callTool, mountHarness, unmountHarness } from './harness.ts'

describe('library/purge event reconstruction', () => {
  it('records the purge verdict so a removal is reconstructable from the log', async () => {
    const harness = await mountHarness()
    try {
      const filePath = path.join(harness.sandbox, 'a.txt')
      writeFileSync(filePath, 'DeepSeek Harness is a plugin-based agent harness built on vendored Cordis.', 'utf8')
      const added = await callTool(harness, 'library_add', { path: filePath, library: 'docs' })
      expect(added.isError).toBe(false)
      const documentId = (added.value as { documentId: string }).documentId

      await callTool(harness, 'library_remove', { library: 'docs', documentId })

      const purgeEvent = harness.session.events.filter(event => event.type === 'library/purge').at(-1)
      expect(purgeEvent?.data).toMatchObject({ library: 'docs', documentId, passed: true })
    } finally {
      await unmountHarness(harness)
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
