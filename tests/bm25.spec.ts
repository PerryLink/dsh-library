/**
 * BM25 channel: exact terms rank, CJK works, empty query is inert.
 * @module dsh-library/test/bm25.spec
 */

import { describe, expect, it } from 'vitest'
import { Bm25Index } from '../src/quality/bm25.ts'

describe('Bm25Index', () => {
  it('ranks the document that contains the rare term above unrelated text', () => {
    const index = new Bm25Index([
      { id: 'a', text: 'peridynamics damage model for composites' },
      { id: 'b', text: 'sourdough bread and bulk fermentation' },
    ])
    const scores = index.score('peridynamics')
    expect(scores.get('a')!).toBeGreaterThan(scores.get('b')!)
    expect(scores.get('b')).toBe(0)
  })

  it('scores CJK terms through the shared tokenizer', () => {
    const index = new Bm25Index([
      { id: 'a', text: '损伤演化与疲劳' },
      { id: 'b', text: '面包烘焙配方' },
    ])
    const scores = index.score('损伤')
    expect(scores.get('a')!).toBeGreaterThan(0)
    expect(scores.get('b')).toBe(0)
  })

  it('returns zero for an empty query or an empty index', () => {
    const index = new Bm25Index([{ id: 'a', text: 'anything' }])
    expect(index.score('').get('a')).toBe(0)
    expect(new Bm25Index([]).score('anything').size).toBe(0)
  })
})
