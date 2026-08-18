/**
 * Lifecycle and export-contract suite: the HMR-safety test (dispose the
 * contributing fiber, re-query the authoritative tool and command
 * registries), the default-export guard (module namespace + Loader unwrap
 * round-trip), and the tool three-interface assertion (model schema +
 * canonical value + content blocks) through the real ToolRuntime.
 * @module dsh-library/test/lifecycle.spec
 */

import Loader from '@deepseek-ai/cordis-plugin-loader'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import * as plugin from '../src/index.ts'
import { callTool, mountHarness, unmountHarness } from './harness.ts'

const TOOL_NAMES = ['library_add', 'library_remove', 'library_list', 'library_search', 'library_cite_check', 'library_diagnose']

// ---------------------------------------------------------------------------
// C2: the function-plugin namespace must survive Loader unwrapping
// ---------------------------------------------------------------------------

describe('export contract', () => {
  it('carries no default export and Loader unwrap round-trips the namespace', () => {
    expect('default' in plugin).toBe(false)
    const unwrapped = Object.create(Loader.prototype).unwrapExports(plugin)
    expect(unwrapped).toBe(plugin)
    expect(unwrapped.name).toBe('dsh-library')
    expect(unwrapped.inject).toEqual(['storageDomain', 'tools', 'commands'])
    expect(unwrapped.Config).not.toBeUndefined()
    expect(typeof unwrapped.apply).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// C1: disposing the contributing fiber removes every registry contribution
// ---------------------------------------------------------------------------

describe('fiber disposal', () => {
  it('removes all six tools and /library when its fiber is disposed', async () => {
    const harness = await mountHarness()
    try {
      for (const name of TOOL_NAMES) {
        expect(harness.ctx.tools.get(name)).toBeDefined()
      }
      expect(harness.ctx.commands.list(harness.agent).find(entry => entry.name === 'library')).toBeDefined()

      await harness.pluginFiber.dispose()

      for (const name of TOOL_NAMES) {
        expect(harness.ctx.tools.get(name)).toBeUndefined()
      }
      expect(harness.ctx.commands.list(harness.agent).find(entry => entry.name === 'library')).toBeUndefined()
    } finally {
      await unmountHarness(harness)
    }
  })
})

// ---------------------------------------------------------------------------
// U2: the tool three interfaces in one assertion through the real runtime
// ---------------------------------------------------------------------------

describe('tool three interfaces', () => {
  it('keeps the library_search schema, canonical value, and content blocks stable', async () => {
    const harness = await mountHarness()
    try {
      // Model-visible schema.
      const schema = harness.ctx.tools.schemas().find(entry => entry.name === 'library_search')
      expect(schema).toBeDefined()
      expect(schema?.parameters).toEqual(expect.objectContaining({
        type: 'object',
        properties: expect.objectContaining({
          query: expect.objectContaining({ type: 'string' }),
          library: expect.objectContaining({ type: 'string' }),
        }),
        required: expect.arrayContaining(['query', 'library']),
      }))

      // Seed one document, then search.
      const filePath = path.join(harness.sandbox, 'a.txt')
      writeFileSync(filePath, 'DeepSeek Harness is a plugin-based agent harness built on vendored Cordis.', 'utf8')
      const added = await callTool(harness, 'library_add', { path: filePath, library: 'docs' })
      expect(added.isError).toBe(false)

      const result = await callTool(harness, 'library_search', { library: 'docs', query: 'what is the harness built on' })
      expect(result.isError).toBe(false)
      if (result.isError) return

      // Canonical value.
      const value = result.value as { library: string; query: string; results: Array<{ snippet: string }>; injected: boolean }
      expect(value.library).toBe('docs')
      expect(value.query).toBe('what is the harness built on')
      expect(value.injected).toBe(false)
      expect(value.results.length).toBeGreaterThan(0)
      expect(value.results[0]?.snippet).toContain('Cordis')

      // Model-facing content blocks.
      expect(Array.isArray(result.content)).toBe(true)
      const text = result.content
        .filter((block: ContentBlock) => block.type === 'text')
        .map(block => (block as { text: string }).text)
        .join('\n')
      expect(text).toContain('[1]')
    } finally {
      await unmountHarness(harness)
    }
  })
})
