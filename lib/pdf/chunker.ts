import { PageContent, ProcessedChunk, DocInfo } from '@/types'
import { v4 as uuidv4 } from 'uuid'

const TARGET_CHUNK_TOKENS = 650
const OVERLAP_TOKENS = 100
// Rough approximation: 1 token ≈ 4 chars
const CHARS_PER_TOKEN = 4
const TARGET_CHUNK_CHARS = TARGET_CHUNK_TOKENS * CHARS_PER_TOKEN
const OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN

// Section header patterns common in government PDFs
const SECTION_HEADER_RE = /^(?:[A-Z][A-Z\s&,'-]{4,}|(?:\d+\.)+\s+[A-Z])/m

function detectSectionTitle(text: string): string {
  const match = text.match(SECTION_HEADER_RE)
  return match ? match[0].trim().slice(0, 120) : ''
}

export function chunkDocument(pages: PageContent[], docInfo: DocInfo): ProcessedChunk[] {
  // For summary/small docs: treat as single chunk
  if (docInfo.content_type === 'summary') {
    const fullText = pages.map((p) => p.text).join('\n')
    return [
      {
        id: uuidv4(),
        content: fullText.slice(0, 8000), // safety cap
        metadata: {
          document_name: docInfo.document_name,
          page_number: 1,
          section_title: docInfo.document_name,
          content_type: 'summary',
          fiscal_year: docInfo.fiscal_year,
        },
      },
    ]
  }

  const chunks: ProcessedChunk[] = []

  // Build a flat list of paragraphs with their page numbers
  const paragraphs: Array<{ text: string; pageNumber: number }> = []

  for (const page of pages) {
    const paras = page.text
      .split(/\n{2,}|\r\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 40) // skip very short fragments

    for (const para of paras) {
      paragraphs.push({ text: para, pageNumber: page.pageNumber })
    }
  }

  // Slide a window over paragraphs to create chunks with overlap
  let i = 0
  while (i < paragraphs.length) {
    let chunkText = ''
    let startPage = paragraphs[i].pageNumber
    let j = i

    // Accumulate paragraphs until we hit the target chunk size
    while (j < paragraphs.length && chunkText.length < TARGET_CHUNK_CHARS) {
      chunkText += (chunkText ? '\n\n' : '') + paragraphs[j].text
      j++
    }

    const sectionTitle = detectSectionTitle(chunkText)

    chunks.push({
      id: uuidv4(),
      content: chunkText.trim(),
      metadata: {
        document_name: docInfo.document_name,
        page_number: startPage,
        section_title: sectionTitle,
        content_type: docInfo.content_type,
        fiscal_year: docInfo.fiscal_year,
      },
    })

    // Advance with overlap: back up by ~OVERLAP_CHARS worth of paragraphs
    let overlapChars = 0
    let backtrack = j - 1
    while (backtrack > i && overlapChars < OVERLAP_CHARS) {
      overlapChars += paragraphs[backtrack].text.length
      backtrack--
    }
    i = Math.max(i + 1, backtrack + 1)
  }

  return chunks
}
