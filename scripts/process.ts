/**
 * scripts/process.ts
 * Extracts text from PDFs, applies content-aware chunking, outputs JSON chunks.
 * Run: npm run process
 */

import fs from 'fs'
import path from 'path'
import { extractPdfPages } from '../lib/pdf/extractor'
import { chunkDocument } from '../lib/pdf/chunker'
import { DocInfo, ProcessedChunk } from '../types'

const PDF_DIR = path.join(process.cwd(), 'data', 'pdfs')
const CHUNKS_DIR = path.join(process.cwd(), 'data', 'chunks')

const DOC_CONFIG: Array<{ filename: string; docInfo: DocInfo }> = [
  {
    filename: 'budget-main-2026-27.pdf',
    docInfo: {
      document_name: 'Budget 2026-27 (Main)',
      content_type: 'narrative',
      fiscal_year: '2026-27',
    },
  },
  {
    filename: 'budget-address-2026-27.pdf',
    docInfo: {
      document_name: 'Budget Address',
      content_type: 'narrative',
      fiscal_year: '2026-27',
    },
  },
  {
    filename: 'budget-estimates-2026-27.pdf',
    docInfo: {
      document_name: 'Estimates & Supplementary Detail',
      content_type: 'narrative',
      fiscal_year: '2026-27',
    },
  },
  {
    filename: 'budget-highlights-2026-27.pdf',
    docInfo: {
      document_name: 'Budget Highlights',
      content_type: 'summary',
      fiscal_year: '2026-27',
    },
  },
  {
    filename: 'government-business-plan-2026-27.pdf',
    docInfo: {
      document_name: 'Government Business Plan',
      content_type: 'narrative',
      fiscal_year: '2026-27',
    },
  },
  {
    filename: 'additional-appropriations-2026-27.pdf',
    docInfo: {
      document_name: 'Additional Appropriations',
      content_type: 'summary',
      fiscal_year: '2026-27',
    },
  },
]

async function main() {
  console.log('\n⚙️  NS Budget Chat — PDF Processing\n')

  if (!fs.existsSync(CHUNKS_DIR)) {
    fs.mkdirSync(CHUNKS_DIR, { recursive: true })
  }

  let totalChunks = 0
  const allChunks: ProcessedChunk[] = []

  for (const { filename, docInfo } of DOC_CONFIG) {
    const pdfPath = path.join(PDF_DIR, filename)

    if (!fs.existsSync(pdfPath)) {
      console.warn(`  ⚠️  Not found (run npm run ingest first): ${filename}`)
      continue
    }

    console.log(`Processing: ${docInfo.document_name}`)

    try {
      const pages = await extractPdfPages(pdfPath)
      console.log(`  Extracted ${pages.length} pages`)

      const chunks = chunkDocument(pages, docInfo)
      console.log(`  Created ${chunks.length} chunks`)

      // Save per-document chunks
      const outFile = path.join(CHUNKS_DIR, filename.replace('.pdf', '.json'))
      fs.writeFileSync(outFile, JSON.stringify(chunks, null, 2))

      allChunks.push(...chunks)
      totalChunks += chunks.length
    } catch (err) {
      console.error(`  ✗ Error processing ${filename}: ${(err as Error).message}`)
    }
  }

  // Save combined chunks file
  const allChunksFile = path.join(CHUNKS_DIR, '_all-chunks.json')
  fs.writeFileSync(allChunksFile, JSON.stringify(allChunks, null, 2))

  console.log(`\n✅ Total chunks created: ${totalChunks}`)
  console.log(`📁 Chunks saved to: ${CHUNKS_DIR}`)
  console.log('\nNext step: npm run index\n')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
