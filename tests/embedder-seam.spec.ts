/**
 * Embedder provider seam tests: the built-in hash backend is the default, the
 * command provider fails loud without a subprocess seam, the Ollama provider
 * degrades gracefully to hash when its local server is unreachable, and config
 * validates the provider spelling.
 * @module dsh-library/test/embedder-seam.spec
 */

import { describe, expect, it } from 'vitest'
import { resolveConfig } from '../src/config.ts'
import { HashEmbedder, probeOllama, resolveEmbedder } from '../src/embedding.ts'

describe('resolveConfig provider selection', () => {
  it('defaults to the hash provider', () => {
    expect(resolveConfig({}).embedding.provider).toBe('hash')
  })

  it('treats an explicit command as the command provider', () => {
    const resolved = resolveConfig({ embedding: { command: 'node embed.mjs' } })
    expect(resolved.embedding.provider).toBe('command')
    expect(resolved.embedding.command).toBe('node embed.mjs')
  })

  it('rejects provider=command without a command', () => {
    expect(() => resolveConfig({ embedding: { provider: 'command' } })).toThrow(/provider=command requires embedding.command/u)
  })

  it('rejects an unknown provider spelling', () => {
    expect(() => resolveConfig({ embedding: { provider: 'cloud' as never } })).toThrow(/provider must be hash\|command\|ollama/u)
  })

  it('defaults the Ollama URL and model', () => {
    const resolved = resolveConfig({ embedding: { provider: 'ollama' } })
    expect(resolved.embedding.ollamaUrl).toBe('http://127.0.0.1:11434')
    expect(resolved.embedding.ollamaModel).toBe('nomic-embed-text')
  })
})

describe('resolveEmbedder', () => {
  it('returns the built-in hash embedder by default', async () => {
    const resolution = await resolveEmbedder(resolveConfig({}).embedding, undefined, process.cwd())
    expect(resolution.embedder.name).toBe('hash')
    expect(resolution.embedder.dims).toBe(256)
    expect(resolution.degraded).toBe(false)
  })

  it('fails loud for the command provider without a subprocess seam', async () => {
    const config = resolveConfig({ embedding: { command: 'node embed.mjs' } }).embedding
    await expect(resolveEmbedder(config, undefined, process.cwd())).rejects.toThrow(/ctx.subprocess is not mounted/u)
  })

  it('degrades the Ollama provider to hash when the local server is unreachable', async () => {
    const config = resolveConfig({ embedding: { provider: 'ollama', ollamaUrl: 'http://127.0.0.1:1', timeoutMs: 300 } }).embedding
    const resolution = await resolveEmbedder(config, undefined, process.cwd())
    expect(resolution.degraded).toBe(true)
    expect(resolution.embedder.name).toBe('hash')
    expect(resolution.reason).toContain('degraded to the built-in hash embedder')
  })
})

describe('HashEmbedder', () => {
  it('embeds a batch with the configured dimensionality', async () => {
    const embedder = new HashEmbedder(32)
    const vectors = await embedder.embed(['alpha', 'beta'])
    expect(vectors).toHaveLength(2)
    expect(vectors[0]).toHaveLength(32)
    expect(vectors[1]).toHaveLength(32)
  })
})

describe('probeOllama', () => {
  it('returns undefined for an unreachable local server', async () => {
    await expect(probeOllama('http://127.0.0.1:1', 'nomic-embed-text', 300)).resolves.toBeUndefined()
  })
})
