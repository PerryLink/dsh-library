/**
 * Assembly-level tests through the REAL tool pipeline and the REAL storage
 * stack: import → list → search (with injection) → cite check → diagnose →
 * remove with purge verification, plus the `/library` command.
 * @module dsh-library/test/index.spec
 */

import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import { callTool, mountHarness, unmountHarness, type Harness } from './harness.ts'

async function addSample(harness: Harness, library: string, fileName: string, content: string) {
  const filePath = path.join(harness.sandbox, fileName)
  writeFileSync(filePath, content, 'utf8')
  const result = await callTool(harness, 'library_add', { path: filePath, library })
  expect(result.isError).toBe(false)
  if (result.isError) throw new Error(result.error.message)
  return result.value as { documentId: string; chunks: number; chars: number }
}

const DOC_A = [
  'DeepSeek Harness is a plugin-based agent harness built on vendored Cordis.',
  'Everything in the harness is a plugin row inside a cordis.yml composition.',
  'The tools/pre-execute waterfall lets plugins gate every tool dispatch.',
].join(' ')

const DOC_B = [
  'The recipe for sourdough starts with a levain fed the night before.',
  'Bulk fermentation takes four to six hours at room temperature.',
  'Bake in a dutch oven at 230 degrees Celsius for the first twenty minutes.',
].join(' ')

describe('library tools through the real pipeline', () => {
  it('imports, lists, searches, and injects with source markers', async () => {
    const harness = await mountHarness()
    try {
      const added = await addSample(harness, 'docs', 'a.txt', DOC_A)
      expect(added.chunks).toBeGreaterThan(0)

      const listed = await callTool(harness, 'library_list', { library: 'docs' })
      expect(listed.isError).toBe(false)
      if (!listed.isError) expect((listed.value as { entries: unknown[] }).entries).toHaveLength(1)

      const searched = await callTool(harness, 'library_search', {
        library: 'docs',
        query: 'what is the harness built on',
        inject: true,
      })
      expect(searched.isError).toBe(false)
      if (searched.isError) throw new Error(searched.error.message)
      const value = searched.value as { results: Array<{ snippet: string }>; injected: boolean }
      expect(value.results.length).toBeGreaterThan(0)
      expect(value.results[0]!.snippet).toContain('Cordis')
      expect(value.injected).toBe(true)

      // The published 0.1.1-rc.2 host neither knows the plugin vocabulary nor
      // has the `ignorable` envelope, so the audit gate skips the append; the
      // logged tool result (and the injected page itself) remain the audit trail.
      expect(harness.session.events.filter(event => event.type === 'library/inject')).toHaveLength(0)

      const text = searched.content.filter((block: ContentBlock) => block.type === 'text').map(block => (block as { text: string }).text).join('\n')
      expect(text).toContain('[1]')
    } finally {
      await unmountHarness(harness)
    }
  })

  it('verifies citations against the result page', async () => {
    const harness = await mountHarness()
    try {
      await addSample(harness, 'docs', 'a.txt', DOC_A)
      await addSample(harness, 'docs', 'b.txt', DOC_B)
      const checked = await callTool(harness, 'library_cite_check', {
        library: 'docs',
        query: 'how do you bake sourdough',
        answer: 'Bake in a dutch oven at 230 degrees Celsius for twenty minutes [1].',
      })
      expect(checked.isError).toBe(false)
      if (checked.isError) throw new Error(checked.error.message)
      const value = checked.value as { total: number; valid: number }
      expect(value.total).toBe(1)
      expect(value.valid).toBe(1)
    } finally {
      await unmountHarness(harness)
    }
  })

  it('diagnoses a library', async () => {
    const harness = await mountHarness()
    try {
      await addSample(harness, 'docs', 'a.txt', DOC_A)
      const diagnosed = await callTool(harness, 'library_diagnose', { library: 'docs' })
      expect(diagnosed.isError).toBe(false)
      if (diagnosed.isError) throw new Error(diagnosed.error.message)
      const value = diagnosed.value as { documents: number; chunks: number; selfRetrieval: { probes: number; topKHit: number } }
      expect(value.documents).toBe(1)
      expect(value.chunks).toBeGreaterThan(0)
      expect(value.selfRetrieval.topKHit).toBe(value.selfRetrieval.probes)
    } finally {
      await unmountHarness(harness)
    }
  })

  it('removes a document and verifies the purge', async () => {
    const harness = await mountHarness()
    try {
      const added = await addSample(harness, 'docs', 'a.txt', DOC_A)
      const removed = await callTool(harness, 'library_remove', { library: 'docs', documentId: added.documentId })
      expect(removed.isError).toBe(false)
      if (removed.isError) throw new Error(removed.error.message)
      const value = removed.value as { removedChunks: number; purgePassed: boolean }
      expect(value.removedChunks).toBeGreaterThan(0)
      expect(value.purgePassed).toBe(true)

      const listed = await callTool(harness, 'library_list', { library: 'docs' })
      if (!listed.isError) expect((listed.value as { entries: unknown[] }).entries).toHaveLength(0)
    } finally {
      await unmountHarness(harness)
    }
  })

  it('fails loudly on an unreadable path', async () => {
    const harness = await mountHarness()
    try {
      const result = await callTool(harness, 'library_add', { path: 'missing.txt', library: 'docs' })
      expect(result.isError).toBe(true)
    } finally {
      await unmountHarness(harness)
    }
  })

  it('rejects invalid library names', async () => {
    const harness = await mountHarness()
    try {
      const result = await callTool(harness, 'library_list', { library: 'Not A Name' })
      expect(result.isError).toBe(true)
    } finally {
      await unmountHarness(harness)
    }
  })
})

describe('/library command', () => {
  it('reports library summaries', async () => {
    const harness = await mountHarness()
    try {
      await addSample(harness, 'docs', 'a.txt', DOC_A)
      const outcome = await harness.ctx.commands.execute(harness.agent, '/library docs', [], new AbortController().signal)
      const result = outcome?.result as { kind: string; text?: string }
      expect(result?.kind).toBe('success')
      expect(result?.text).toContain('docs: 1 document(s)')
    } finally {
      await unmountHarness(harness)
    }
  })
})
