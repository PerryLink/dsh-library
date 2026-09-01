/**
 * Core vocabulary tests: config resolution (defaults + fail-loud bounds),
 * text utilities, id minting, and the domain spec shape.
 * @module dsh-library/test/core.spec
 */

import { describe, expect, it } from 'vitest'
import { Config, resolveConfig, LIBRARY_NAME } from '../src/config.ts'
import { normalize, tokenize, cjkTokenize, tokenSet, termFrequencies, charNGrams, tokenNGrams, fnv1a } from '../src/text.ts'
import { embedHash, cosine, splitCommandLine } from '../src/embedding.ts'
import { documentIdOf, chunkIdOf, parseChunkId, documentKey, chunkKey } from '../src/ids.ts'
import { libraryDomainSpec } from '../src/index.ts'

describe('Config schema', () => {
  it('applies every default on an empty input', () => {
    const resolved = Config({}) as { chunkSize: number; search: { topK: number }; embedding: { command: string } }
    expect(resolved.chunkSize).toBe(900)
    expect(resolved.search.topK).toBe(8)
    expect(resolved.embedding.command).toBe('')
  })

  it('fails loud on an overlap not smaller than the chunk size', () => {
    expect(() => resolveConfig({ chunkSize: 100, chunkOverlap: 100 })).toThrow(/chunkOverlap/u)
  })

  it('fails loud on an oversized chunk window', () => {
    expect(() => resolveConfig({ chunkSize: 9999 })).toThrow(/chunkSize/u)
  })

  it('fails loud on out-of-range search weights', () => {
    expect(() => resolveConfig({ search: { hybridWeight: 2 } })).toThrow(/hybridWeight/u)
  })

  it('treats an empty embedder command as unset', () => {
    const resolved = resolveConfig({ embedding: { command: '   ' } })
    expect(resolved.embedding.command).toBeUndefined()
  })

  it('accepts only safe library names', () => {
    expect(LIBRARY_NAME.test('my-library')).toBe(true)
    expect(LIBRARY_NAME.test('My Library')).toBe(false)
  })
})

describe('text utilities', () => {
  it('normalizes and tokenizes (CJK-aware)', () => {
    expect(normalize('  Hello   World ')).toBe('hello world')
    expect(tokenize('Hello 世界')).toEqual(['hello', '世界'])
  })

  it('expands CJK runs into unigrams plus adjacent bigrams for scoring', () => {
    expect(cjkTokenize('中文')).toEqual(['中', '文', '中文'])
    expect(cjkTokenize('Hello 世界')).toEqual(['hello', '世', '界', '世界'])
  })

  it('tokenSet deduplicates', () => {
    expect(tokenSet('a b a')).toEqual(new Set(['a', 'b']))
  })

  it('termFrequencies counts occurrences', () => {
    expect(termFrequencies('a b a')).toMatchObject({ a: 2, b: 1 })
  })

  it('charNGrams pads boundaries', () => {
    expect(charNGrams('ab', 3)).toEqual([' ab', 'ab '])
    expect(charNGrams('abc', 3)).toEqual([' ab', 'abc', 'bc '])
  })

  it('tokenNGrams deduplicates', () => {
    expect(tokenNGrams(['a', 'b', 'a'], 2)).toEqual(['a b', 'b a'])
  })

  it('fnv1a is deterministic', () => {
    expect(fnv1a('hello')).toBe(fnv1a('hello'))
    expect(fnv1a('hello')).not.toBe(fnv1a('world'))
  })
})

describe('embedding helpers', () => {
  it('splits command lines without shell interpretation', () => {
    expect(splitCommandLine('  embed --model "x y" ')).toEqual(['embed', '--model', '"x', 'y"'])
  })

  it('cosine rejects dimension mismatches', () => {
    expect(() => cosine([1], [1, 2])).toThrow(/dimension/u)
  })

  it('embedHash respects dims and normalizes', () => {
    const vector = embedHash('text', 16)
    expect(vector).toHaveLength(16)
    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
    expect(norm).toBeCloseTo(1, 5)
  })
})

describe('identity minting', () => {
  it('document ids are content-derived and stable', () => {
    expect(documentIdOf('abc')).toBe(documentIdOf('abc'))
    expect(documentIdOf('abc')).not.toBe(documentIdOf('abd'))
  })

  it('chunk ids round-trip', () => {
    const id = chunkIdOf('doc', 3)
    expect(parseChunkId(id)).toEqual({ documentId: 'doc', seq: 3 })
    expect(parseChunkId('nope')).toBeNull()
  })

  it('domain keys carry the library prefix', () => {
    expect(documentKey('lib', 'doc')).toBe('lib:doc')
    expect(chunkKey('lib', 'doc#0')).toBe('lib:doc#0')
  })
})

describe('domain spec', () => {
  it('declares the three tables with version 1', () => {
    expect(libraryDomainSpec.name).toBe('dsh_library')
    expect(libraryDomainSpec.version).toBe(1)
    expect(Object.keys(libraryDomainSpec.tables).sort()).toEqual(['chunks', 'documents', 'purges'])
  })
})
