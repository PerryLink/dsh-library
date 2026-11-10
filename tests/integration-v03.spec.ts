/**
 * End-to-end 0.3 retrieval: the bilingual bridge reaches a Chinese document
 * from an English query and reports the expansion.
 * @module dsh-library/test/integration-v03.spec
 */

import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { callTool, mountHarness, unmountHarness } from './harness.ts'

describe('bilingual retrieval', () => {
  it('finds a Chinese chunk from an English query and reports expanded terms', async () => {
    const harness = await mountHarness()
    try {
      const file = path.join(harness.sandbox, 'cn.txt')
      writeFileSync(file, '近场动力学损伤演化模型与疲劳寿命预测。', 'utf8')
      const added = await callTool(harness, 'library_add', { path: file, library: 'docs' })
      expect(added.isError).toBe(false)

      const searched = await callTool(harness, 'library_search', { library: 'docs', query: 'peridynamics damage' })
      expect(searched.isError).toBe(false)
      if (searched.isError) throw new Error(searched.error.message)
      const value = searched.value as { results: Array<{ snippet: string }>; expanded: string[] }
      expect(value.results.length).toBeGreaterThan(0)
      expect(value.results[0]?.snippet).toContain('近场动力学')
      expect(value.expanded).toContain('近场动力学')
      expect(value.expanded).toContain('损伤')
    } finally {
      await unmountHarness(harness)
    }
  })
})
