import { Chunk } from '@/types'

const DOLLAR_PATTERN = /\$[\d,.]+\s*(billion|million|B|M)?/i
const DEPT_KEYWORDS = [
  'health', 'education', 'housing', 'justice', 'environment', 'transportation',
  'finance', 'community', 'labour', 'energy', 'agriculture', 'tourism',
]

function queryHasFinancialTerms(query: string): boolean {
  return DOLLAR_PATTERN.test(query) || /billion|million|budget|deficit|revenue|expense|spending/.test(query.toLowerCase())
}

function queryDepartment(query: string): string | null {
  const lower = query.toLowerCase()
  return DEPT_KEYWORDS.find((d) => lower.includes(d)) ?? null
}

export function rerank(query: string, chunks: Chunk[]): Chunk[] {
  const isFinancial = queryHasFinancialTerms(query)
  const targetDept = queryDepartment(query)

  return chunks
    .map((chunk) => {
      let score = chunk.score ?? 0.5

      // Boost table/summary chunks for financial queries
      if (isFinancial && (chunk.metadata.content_type === 'table' || chunk.metadata.content_type === 'summary')) {
        score *= 1.5
      }

      // Boost Highlights for summary-type queries
      if (chunk.metadata.document_name.toLowerCase().includes('highlight') && chunk.metadata.content_type === 'summary') {
        score *= 1.2
      }

      // Boost chunks matching the queried department
      if (targetDept && chunk.metadata.department?.toLowerCase().includes(targetDept)) {
        score *= 1.3
      }

      // Slight boost for Estimates when asking about specific dollar amounts
      if (isFinancial && chunk.metadata.document_name.toLowerCase().includes('estimate')) {
        score *= 1.1
      }

      return { ...chunk, score }
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
}

export function assembleContext(chunks: Chunk[], maxTokens = 7000): string {
  // Rough approximation: 1 token ≈ 4 chars
  const maxChars = maxTokens * 4
  let totalChars = 0
  const selected: Chunk[] = []

  for (const chunk of chunks) {
    const chunkChars = chunk.content.length
    if (totalChars + chunkChars > maxChars) break
    selected.push(chunk)
    totalChars += chunkChars
  }

  return selected
    .map(
      (c) =>
        `[Source: ${c.metadata.document_name}, p.${c.metadata.page_number}${
          c.metadata.section_title ? `, ${c.metadata.section_title}` : ''
        }]\n${c.content}`
    )
    .join('\n\n---\n\n')
}
