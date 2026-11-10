/**
 * 0.3 config: fusion switch and embedding presets.
 * @module dsh-library/test/config-v03.spec
 */

import { describe, expect, it } from 'vitest'
import { resolveConfig } from '../src/config.ts'

describe('search fusion', () => {
  it('defaults to rrf and accepts weighted', () => {
    expect(resolveConfig({}).search.fusion).toBe('rrf')
    expect(resolveConfig({ search: { fusion: 'weighted' } }).search.fusion).toBe('weighted')
  })

  it('rejects an unknown fusion', () => {
    expect(() => resolveConfig({ search: { fusion: 'max' as never } })).toThrow(/fusion/u)
  })
})

describe('embedding presets', () => {
  it('maps preset=openai to the OpenAI provider with 1536 dims', () => {
    const resolved = resolveConfig({ embedding: { preset: 'openai' } })
    expect(resolved.embedding.provider).toBe('openai')
    expect(resolved.embedding.dims).toBe(1536)
    expect(resolved.embedding.openaiModel).toBe('text-embedding-3-small')
  })

  it('lets an explicit provider win over the preset', () => {
    const resolved = resolveConfig({ embedding: { preset: 'openai', provider: 'hash', dims: 64 } })
    expect(resolved.embedding.provider).toBe('hash')
    expect(resolved.embedding.dims).toBe(64)
  })

  it('validates the OpenAI base URL and model when that provider is selected', () => {
    expect(() => resolveConfig({ embedding: { preset: 'openai', openaiBaseUrl: 'not-a-url' } })).toThrow(/openaiBaseUrl/u)
    expect(() => resolveConfig({ embedding: { preset: 'openai', openaiModel: '  ' } })).toThrow(/openaiModel/u)
  })
})
