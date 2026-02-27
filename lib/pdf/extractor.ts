import fs from 'fs'
import { PDFParse } from 'pdf-parse'
import { PageContent } from '@/types'

export async function extractPdfPages(pdfPath: string): Promise<PageContent[]> {
  const buffer = fs.readFileSync(pdfPath)
  const data = new Uint8Array(buffer)

  const parser = new PDFParse({ data })
  const result = await parser.getText()

  // pdf-parse v2 returns pages with { num, text }
  if (result.pages && result.pages.length > 0) {
    return result.pages.map((p) => ({
      pageNumber: p.num,
      text: p.text.replace(/\s+/g, ' ').trim(),
    }))
  }

  // Fallback: single page with all text
  return [{ pageNumber: 1, text: result.text }]
}

export function estimatePageNumber(charOffset: number, totalChars: number, totalPages: number): number {
  if (totalPages <= 1) return 1
  return Math.max(1, Math.ceil((charOffset / totalChars) * totalPages))
}
