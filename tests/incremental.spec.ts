/**
 * Incremental import: identical content + embedder = zero embed calls.
 * @module dsh-library/test/incremental.spec
 */

import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { callTool, mountHarness, unmountHarness } from './harness.ts'

describe('incremental import', () => {
  it('reuses the index when content and embedder are unchanged', async () => {
    const harness = await mountHarness()
    try {
      const file = path.join(harness.sandbox, 'doc.txt')
      writeFileSync(file, 'Peridynamics damage evolves with loading.', 'utf8')
      const first = await callTool(harness, 'library_add', { path: file, library: 'docs' })
      expect(first.isError).toBe(false)
      if (first.isError) throw new Error(first.error.message)
      const firstValue = first.value as { documentId: string; reused: boolean; embeddedChunks: number }
      expect(firstValue.reused).toBe(false)
      expect(firstValue.embeddedChunks).toBeGreaterThan(0)

      const second = await callTool(harness, 'library_add', { path: file, library: 'docs' })
      expect(second.isError).toBe(false)
      if (second.isError) throw new Error(second.error.message)
      const secondValue = second.value as { documentId: string; reused: boolean; embeddedChunks: number }
      expect(secondValue.documentId).toBe(firstValue.documentId)
      expect(secondValue.reused).toBe(true)
      expect(secondValue.embeddedChunks).toBe(0)
    } finally {
      await unmountHarness(harness)
    }
  })
})
