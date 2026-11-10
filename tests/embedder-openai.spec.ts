/**
 * OpenAI-compatible embedder: request shape, batching, normalization, failures.
 * @module dsh-library/test/embedder-openai.spec
 */

import { describe, expect, it } from 'vitest'
import { OpenAiEmbedder } from '../src/embedding.ts'

function fakeFetch(payloads: unknown[], status = 200) {
  const calls: Array<{ url: string; init?: RequestInit }> = []
  let index = 0
  const impl = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    calls.push({ url: String(url), ...(init === undefined ? {} : { init }) })
    const payload = payloads[index] ?? payloads.at(-1)
    index += 1
    return new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } })
  }
  return { impl: impl as typeof fetch, calls }
}

describe('OpenAiEmbedder', () => {
  it('posts batches, sends the bearer token and normalizes vectors', async () => {
    const { impl, calls } = fakeFetch([
      { data: [{ index: 1, embedding: [0, 2] }, { index: 0, embedding: [3, 4] }] },
      { data: [{ index: 0, embedding: [1, 0] }] },
    ])
    const embedder = new OpenAiEmbedder('https://api.example.test/v1', 'm', 'secret', 2, 1000, 2, impl)
    const vectors = await embedder.embed(['a', 'b', 'c'])
    expect(calls).toHaveLength(2)
    expect(calls[0]?.url).toBe('https://api.example.test/v1/embeddings')
    expect((calls[0]?.init?.headers as Record<string, string>).authorization).toBe('Bearer secret')
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({ model: 'm', input: ['a', 'b'] })
    expect(vectors[0]?.[0]).toBeCloseTo(0.6, 6)
    expect(vectors[0]?.[1]).toBeCloseTo(0.8, 6)
    expect(vectors[2]).toEqual([1, 0])
  })

  it('fails on a dimension mismatch', async () => {
    const { impl } = fakeFetch([{ data: [{ index: 0, embedding: [1, 2, 3] }] }])
    const embedder = new OpenAiEmbedder('https://api.example.test/v1', 'm', 'k', 2, 1000, 4, impl)
    await expect(embedder.embed(['a'])).rejects.toThrow(/vector length/u)
  })

  it('fails on a non-2xx response', async () => {
    const { impl } = fakeFetch([{ error: 'nope' }], 401)
    const embedder = new OpenAiEmbedder('https://api.example.test/v1', 'm', 'k', 2, 1000, 4, impl)
    await expect(embedder.embed(['a'])).rejects.toThrow(/HTTP 401/u)
  })
})
