/**
 * Small bilingual query bridge (Chinese ↔ English).
 *
 * Domain terms are often written in one language in the paper and the other in
 * the query. The bridge appends known translations to the lexical channels
 * (BM25 and keyword); it never rewrites the user's query and never invents a
 * translation it does not contain. The dictionary is deliberately small and
 * auditable — adding a term is a one-line diff.
 *
 * @module dsh-library/expand
 */

/** One auditable translation pair. Both directions are matched. */
export const QUERY_BRIDGE: Readonly<Record<string, readonly string[]>> = {
  '近场动力学': ['peridynamics'],
  peridynamics: ['近场动力学'],
  '损伤': ['damage'],
  damage: ['损伤'],
  '疲劳': ['fatigue'],
  fatigue: ['疲劳'],
  '断裂': ['fracture'],
  fracture: ['断裂'],
  '复合材料': ['composite'],
  composite: ['复合材料'],
  '有限元': ['finite element'],
  'finite element': ['有限元'],
  '机器学习': ['machine learning'],
  'machine learning': ['机器学习'],
  '深度学习': ['deep learning'],
  'deep learning': ['深度学习'],
  '神经网络': ['neural network'],
  'neural network': ['神经网络'],
  '系统综述': ['systematic review'],
  'systematic review': ['系统综述'],
  '元分析': ['meta-analysis'],
  'meta-analysis': ['元分析'],
  '随机对照试验': ['randomized controlled trial'],
  'randomized controlled trial': ['随机对照试验'],
}

/** The expansion of one query. */
export interface QueryExpansion {
  /** The original query (unchanged). */
  readonly query: string
  /** Additional terms appended to the lexical channels. */
  readonly translations: readonly string[]
  /** Original + translations, joined for tokenization. */
  readonly lexicalQuery: string
}

/**
 * Expand a query with known bilingual terms.
 * @param query - the user's query.
 * @returns the original query plus unique translations that are not already present.
 */
export function expandQuery(query: string): QueryExpansion {
  const normalized = query.normalize('NFKC').toLowerCase()
  const translations = new Set<string>()
  for (const [term, equivalents] of Object.entries(QUERY_BRIDGE)) {
    if (!normalized.includes(term.normalize('NFKC').toLowerCase())) continue
    for (const equivalent of equivalents) {
      if (!normalized.includes(equivalent.normalize('NFKC').toLowerCase())) translations.add(equivalent)
    }
  }
  const list = [...translations]
  return {
    query,
    translations: list,
    lexicalQuery: [query, ...list].join(' '),
  }
}
