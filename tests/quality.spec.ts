/**
 * Regression tests for the eight upstream quality ports: the ported
 * algorithms reproduce the upstream behaviors on their documented cases
 * (converted from the upstream Python tests/fixtures), plus the local-rules
 * substitutions (hash embedding, token-sequence fuzzy ratio).
 * @module dsh-library/test/quality.spec
 */

import { describe, expect, it } from 'vitest'
import { embedHash, cosine } from '../src/embedding.ts'
import { chunkText, chunkSizeHistogram, findDuplicateChunks } from '../src/quality/chunk-visual.ts'
import { checkDiversity, maximalMarginalRelevance } from '../src/quality/diversity.ts'
import { avoidLostMiddle, positionBins, middlePenalty } from '../src/quality/lost-middle.ts'
import { scoreRelevance, filterDocuments } from '../src/quality/relevance.ts'
import { selectFewShot, formatFewShotPrompt, validateQaPair } from '../src/quality/few-shot.ts'
import { extractCitations, extractContext, verifyReferences } from '../src/quality/reference.ts'
import { extractCitationNumbers, extractSentenceWithCitation, fuzzyPartialRatio, validateCitations } from '../src/quality/citation.ts'
import { verifyPurge, sampleSignatures } from '../src/quality/purge.ts'

describe('chunk-visual (RAG-Chunk-Visualizer port)', () => {
  it('slices with sliding-window overlap and records positions', () => {
    const chunks = chunkText('abcdefghij', 4, 2)
    expect(chunks.map(chunk => chunk.text)).toEqual(['abcd', 'cdef', 'efgh', 'ghij', 'ij'])
    expect(chunks[0]).toMatchObject({ startPos: 0, endPos: 4, index: 0, overlapChars: 0 })
    expect(chunks[1]).toMatchObject({ startPos: 2, overlapChars: 2 })
  })

  it('rejects invalid window parameters', () => {
    expect(() => chunkText('abc', 0, 0)).toThrow(/chunkSize/u)
    expect(() => chunkText('abc', 4, 4)).toThrow(/overlap/u)
  })

  it('histograms by power-of-two buckets', () => {
    const histogram = chunkSizeHistogram(chunkText('x'.repeat(700), 300, 0))
    expect(histogram.totalChars).toBe(700)
    expect(histogram.buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBeGreaterThan(0)
    expect(histogram.maxChars).toBeLessThanOrEqual(300)
  })

  it('finds duplicate chunk pairs', () => {
    const chunks = chunkText('hello world hello world hello world hello world', 12, 0)
    const result = findDuplicateChunks(chunks, 0.9, 10)
    expect(result.duplicateCount).toBeGreaterThan(0)
    expect(result.pairs.length).toBeGreaterThan(0)
  })
})

describe('diversity (Retrieval-Diversity-Check port)', () => {
  it('flags near-duplicates and reports token savings', () => {
    const report = checkDiversity(['hello world', 'hello world', 'something else entirely'], 0.9)
    expect(report.totalTexts).toBe(3)
    expect(report.duplicateCount).toBe(2)
    expect(report.tokenSavings).toBeCloseTo((2 / 3) * 100)
  })

  it('requires at least two texts', () => {
    expect(() => checkDiversity(['only one'])).toThrow(/at least 2/u)
  })

  it('MMR picks diverse results when lambda is low', () => {
    const candidates = [
      { id: 'a', relevance: 0.9, similarityTo: () => 0 },
      { id: 'b', relevance: 0.8, similarityTo: () => 0 },
    ]
    expect(maximalMarginalRelevance(candidates, 0, 2).map(item => item.id)).toEqual(['a', 'b'])
  })
})

describe('lost-middle (Lost-in-Middle-Tester port)', () => {
  it('pins strongest to head and tail, weakest to the middle', () => {
    const ranked = [{ id: '1', score: 1 }, { id: '2', score: 0.9 }, { id: '3', score: 0.8 }, { id: '4', score: 0.1 }]
    const order = avoidLostMiddle(ranked, 1, 1).map(item => item.id)
    expect(order[0]).toBe('1')
    expect(order[order.length - 1]).toBe('2')
    expect(order.slice(1, -1)).toContain('4')
  })

  it('computes the middle penalty over position bins', () => {
    const ranked = Array.from({ length: 10 }, (_, index) => ({ id: String(index), score: index < 2 || index > 7 ? 1 : 0.1 }))
    const bins = positionBins(ranked, 5)
    expect(bins).toHaveLength(5)
    expect(middlePenalty(bins)).toBeGreaterThan(0)
  })
})

describe('relevance (Context-Relevance-Scorer port)', () => {
  it('scores coverage of query terms', () => {
    expect(scoreRelevance('alpha beta', 'alpha and more')).toBeCloseTo(0.5)
    expect(scoreRelevance('alpha beta', 'alpha beta')).toBe(1)
    expect(scoreRelevance('', 'anything')).toBe(0)
  })

  it('filters documents below the threshold', () => {
    const kept = filterDocuments('red fish', ['red fish swim', 'blue birds fly'], 0.5)
    expect(kept).toEqual(['red fish swim'])
  })
})

describe('few-shot (Few-Shot-Selector port)', () => {
  const examples = [
    { id: '1', question: 'how do i add two numbers', answer: 'use +', category: 'math' },
    { id: '2', question: 'what is a variable', answer: 'a named box', category: 'basics' },
    { id: '3', question: 'how do i loop', answer: 'use for', category: 'basics' },
  ]

  it('validates QA pairs like upstream', () => {
    expect(validateQaPair('q', 'a')).toBe(true)
    expect(validateQaPair('  ', 'a')).toBe(false)
  })

  it('ranks the most similar question first', () => {
    const selected = selectFewShot('how do i loop over items', examples, { n: 2, dims: 64 })
    expect(selected).toHaveLength(2)
    expect(selected[0]!.example.id).toBe('3')
  })

  it('formats the upstream prompt layout', () => {
    const selected = selectFewShot('query', examples, { n: 1 })
    const prompt = formatFewShotPrompt('query', selected)
    expect(prompt).toContain('示例 1:')
    expect(prompt).toContain(`问题: ${selected[0]!.example.question}`)
    expect(prompt.endsWith('现在请回答: query')).toBe(true)
  })

  it('throws on an empty query or store', () => {
    expect(() => selectFewShot('  ', examples)).toThrow(/query/u)
    expect(() => selectFewShot('query', [])).toThrow(/empty/u)
  })
})

describe('reference (RAG-Reference-Checker port)', () => {
  const references = [
    { id: 1, content: 'The capital of France is Paris, located on the Seine river.' },
    { id: 2, content: 'Water boils at 100 degrees Celsius at sea level.' },
  ]

  it('extracts [n] markers with numeric ids', () => {
    expect(extractCitations('see [1] and [12]')[0]).toMatchObject({ refId: 1 })
  })

  it('extracts the position window', () => {
    expect(extractContext('abcdefghij', 5, 2)).toBe('defg')
  })

  it('marks citations valid / suspicious / missing', () => {
    const answer = 'Paris is the capital of France [1]. Bananas grow on trees [2]. Unknown fact [7].'
    const report = verifyReferences(answer, references, { threshold: 0.1, dims: 64 })
    expect(report.total).toBe(3)
    expect(report.details.find(detail => detail.refId === 1)?.status).toBe('valid')
    expect(report.details.find(detail => detail.refId === 2)?.status).toBe('suspicious')
    expect(report.details.find(detail => detail.refId === 7)?.status).toBe('missing')
  })
})

describe('citation (Citation-Validator-Lite port)', () => {
  it('extracts [n] markers as strings', () => {
    expect(extractCitationNumbers('a [1] b [12]')[0]).toMatchObject({ number: '1', start: 2, end: 5 })
  })

  it('extracts the sentence around a citation', () => {
    const text = 'First sentence. The answer is forty two [1] and that is it! Next sentence.'
    const context = extractSentenceWithCitation(text, text.indexOf('[1]'))
    expect(context).toContain('The answer is forty two [1] and that is it')
  })

  it('partial ratio prefers the best window (fuzzywuzzy parity)', () => {
    expect(fuzzyPartialRatio('hello world', 'a long document about hello world and other topics')).toBe(100)
    expect(fuzzyPartialRatio('xyzzy', 'nothing matches here')).toBeLessThan(50)
  })

  it('validates citations with the upstream threshold semantics', () => {
    const result = validateCitations(
      'The sky is blue [1]. Unknown [2].',
      { 1: 'The sky is blue.' },
      80,
    )
    expect(result.results).toHaveLength(2)
    expect(result.results[0]!.is_valid).toBe(true)
    expect(result.results[1]).toMatchObject({ is_valid: false, reason: 'Source not found', score: 0 })
  })
})

describe('purge (RAG-Purge-Verify port)', () => {
  it('samples signatures evenly', () => {
    expect(sampleSignatures(['a', 'b', 'c', 'd', 'e'], 3)).toEqual(['a', 'c', 'e'])
  })

  it('passes when the removed content left no residue', () => {
    const report = verifyPurge(
      [{ id: 'keep', text: 'completely unrelated material here' }],
      'the secret recipe for the sauce is hidden',
      { signatureLength: 3, maxProbes: 8 },
    )
    expect(report.passed).toBe(true)
    expect(report.totalFound).toBe(0)
  })

  it('fails when residue remains in the index', () => {
    const report = verifyPurge(
      [{ id: 'keep', text: 'the secret recipe for the sauce is hidden in this chunk' }],
      'the secret recipe for the sauce is hidden',
      { signatureLength: 3, maxProbes: 8 },
    )
    expect(report.passed).toBe(false)
    expect(report.totalFound).toBeGreaterThan(0)
    expect(report.probes[0]!.residueIds).toContain('keep')
  })
})

describe('embedding helpers', () => {
  it('hash embeddings are deterministic and cosine-similar for similar text', () => {
    const a = embedHash('the cat sat on the mat', 64)
    const b = embedHash('the cat sat on the mat', 64)
    expect(a).toEqual(b)
    expect(cosine(a, embedHash('the cat sat on the mat', 64))).toBeCloseTo(1, 5)
    expect(cosine(a, embedHash('quantum physics and cosmology', 64))).toBeLessThan(0.9)
  })
})
