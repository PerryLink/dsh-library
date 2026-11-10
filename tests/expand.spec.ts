/**
 * Bilingual query bridge: known terms expand, unknown terms do not.
 * @module dsh-library/test/expand.spec
 */

import { describe, expect, it } from 'vitest'
import { expandQuery, QUERY_BRIDGE } from '../src/expand.ts'

describe('expandQuery', () => {
  it('appends both directions of a known pair', () => {
    const expansion = expandQuery('peridynamics damage')
    expect(expansion.translations).toContain('近场动力学')
    expect(expansion.translations).toContain('损伤')
    expect(expansion.lexicalQuery).toContain('peridynamics')
    expect(expansion.lexicalQuery).toContain('近场动力学')
    expect(expansion.query).toBe('peridynamics damage')
  })

  it('works from Chinese to English', () => {
    expect(expandQuery('疲劳寿命').translations).toContain('fatigue')
  })

  it('does not invent translations for unknown queries', () => {
    expect(expandQuery('sourdough fermentation').translations).toEqual([])
  })

  it('keeps the dictionary auditable', () => {
    expect(Object.keys(QUERY_BRIDGE).length).toBeGreaterThan(10)
  })
})
