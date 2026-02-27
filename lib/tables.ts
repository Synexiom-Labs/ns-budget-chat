import { Chunk, StructuredTable } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import fiscalSummary from '@/data/tables/fiscal-summary.json'
import keyInvestments from '@/data/tables/key-investments.json'

const ALL_TABLES: StructuredTable[] = [
  fiscalSummary as StructuredTable,
  keyInvestments as StructuredTable,
]

function tableToText(table: StructuredTable): string {
  const header = `**${table.title}** (${table.document_name}, p.${table.page_number})\n`
  const colHeader = table.columns.join(' | ')
  const separator = table.columns.map(() => '---').join(' | ')
  const rows = table.rows
    .map((row) => table.columns.map((col) => String(row[col] ?? '')).join(' | '))
    .join('\n')
  const notes = table.notes ? `\n_Note: ${table.notes}_` : ''
  return `${header}${colHeader}\n${separator}\n${rows}${notes}`
}

export function searchTables(query: string): Chunk[] {
  const lower = query.toLowerCase()

  return ALL_TABLES.filter((table) =>
    table.keywords.some((kw) => lower.includes(kw.toLowerCase()))
  ).map((table) => ({
    id: `table:${table.id}`,
    content: tableToText(table),
    metadata: {
      document_name: table.document_name,
      page_number: table.page_number,
      section_title: table.section,
      content_type: 'table' as const,
      department: table.department,
      fiscal_year: table.fiscal_year,
    },
    score: 0.95, // Tables are high-confidence for matched queries
  }))
}
