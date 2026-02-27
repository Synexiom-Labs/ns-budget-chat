export interface Chunk {
  id: string
  content: string
  metadata: ChunkMetadata
  score?: number
}

export interface ChunkMetadata {
  document_name: string
  page_number: number
  section_title: string
  content_type: 'narrative' | 'table' | 'summary'
  department?: string
  fiscal_year: string
}

export interface Citation {
  document: string
  page: number
  section: string
  text_snippet: string
}

export interface TableRow {
  [key: string]: string | number
}

export interface StructuredTable {
  id: string
  title: string
  document_name: string
  page_number: number
  section: string
  department?: string
  fiscal_year: string
  columns: string[]
  rows: TableRow[]
  notes?: string
  keywords: string[]
}

export interface PageContent {
  pageNumber: number
  text: string
}

export interface ProcessedChunk {
  id: string
  content: string
  metadata: ChunkMetadata
  embedding?: number[]
}

export type QueryType = 'factual' | 'comparison' | 'explanation' | 'exploratory' | 'out-of-scope'

export interface DocInfo {
  document_name: string
  content_type: 'narrative' | 'table' | 'summary'
  fiscal_year: string
}
