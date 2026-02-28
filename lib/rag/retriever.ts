import { Pinecone } from '@pinecone-database/pinecone'
import { generateEmbedding } from './embeddings'
import { Chunk, QueryType } from '@/types'
import { searchTables } from '@/lib/tables'

let pineconeClient: Pinecone | null = null

function getPinecone(): Pinecone {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
  }
  return pineconeClient
}

const FINANCIAL_KEYWORDS = [
  'budget', 'spending', 'allocation', 'fund', 'invest', 'cost', 'expense',
  'revenue', 'deficit', 'surplus', 'billion', 'million', 'dollar', '$',
  'fte', 'position', 'staff', 'employee', 'percent', '%', 'tax', 'transfer',
]


export function classifyQuery(query: string): QueryType {
  const lower = query.toLowerCase()

  // Out of scope — clearly not about the budget
  const outOfScopePatterns = [
    /^(hi|hello|hey|what('s| is) (up|your name|the weather)|how are you)/,
    /weather|sports|recipe|movie|music|joke/,
  ]
  if (outOfScopePatterns.some((p) => p.test(lower))) return 'out-of-scope'

  // Comparison
  if (
    /compare|compared to|versus|vs\.?|difference|change from|last year|previous year|year.over.year|increase|decrease|more than|less than|grew|fell|cut/.test(
      lower
    )
  ) {
    return 'comparison'
  }

  // Factual — asking for a specific number or dollar amount
  if (
    /how much|what is the (total|amount|cost|budget|allocation|deficit|revenue|expense)|total (budget|spending|revenue|deficit)|how many (fte|position|job|staff)/.test(
      lower
    ) ||
    FINANCIAL_KEYWORDS.some((kw) => lower.includes(kw))
  ) {
    return 'factual'
  }

  // Explanation
  if (/why|explain|what does|how does|what is the reason|purpose|mean for|impact|effect/.test(lower)) {
    return 'explanation'
  }

  return 'exploratory'
}

export async function retrieve(query: string): Promise<Chunk[]> {
  const queryType = classifyQuery(query)

  if (queryType === 'out-of-scope') return []

  const pc = getPinecone()
  const index = pc.index(process.env.PINECONE_INDEX || 'ns-budget-chat')

  // Generate query embedding
  const embedding = await generateEmbedding(query)

  // Semantic search — fetch extra to allow post-filtering
  const searchResponse = await index.query({
    vector: embedding,
    topK: 12,
    includeMetadata: true,
  })

  const semanticChunks: Chunk[] = searchResponse.matches
    .filter((m) => (m.score ?? 0) >= 0.65)
    .map((m) => ({
      id: m.id,
      content: (m.metadata?.content as string) ?? '',
      metadata: {
        document_name: (m.metadata?.document_name as string) ?? '',
        page_number: (m.metadata?.page_number as number) ?? 0,
        section_title: (m.metadata?.section_title as string) ?? '',
        content_type: (m.metadata?.content_type as 'narrative' | 'table' | 'summary') ?? 'narrative',
        department: m.metadata?.department as string | undefined,
        fiscal_year: (m.metadata?.fiscal_year as string) ?? '2026-27',
      },
      score: m.score ?? 0,
    }))
    .slice(0, 8)

  // For factual/comparison queries, also search pre-structured tables
  if (queryType === 'factual' || queryType === 'comparison') {
    const tableChunks = searchTables(query)
    // Merge: table chunks first (higher priority), then semantic, deduplicated, max 8
    const merged = deduplicateChunks([...tableChunks, ...semanticChunks])
    return merged.slice(0, 8)
  }

  return semanticChunks
}

function deduplicateChunks(chunks: Chunk[]): Chunk[] {
  const seen = new Set<string>()
  return chunks.filter((c) => {
    const key = c.id || c.content.slice(0, 80)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
