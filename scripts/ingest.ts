/**
 * scripts/ingest.ts
 * Downloads all six NS Budget 2026-27 PDFs to data/pdfs/
 * Run: npm run ingest
 */

import fs from 'fs'
import path from 'path'
import https from 'https'

const PDF_DIR = path.join(process.cwd(), 'data', 'pdfs')

const BUDGET_PDFS = [
  {
    name: 'budget-main-2026-27.pdf',
    url: 'https://www.novascotia.ca/sites/default/files/documents/6-4173/ftb-bfi-046-en-budget-2026-2027.pdf',
    description: 'Budget 2026-27 (Main)',
  },
  {
    name: 'budget-address-2026-27.pdf',
    url: 'https://www.novascotia.ca/sites/default/files/documents/7-4172/address-budget-2026-27-en.pdf',
    description: 'Budget Address',
  },
  {
    name: 'budget-estimates-2026-27.pdf',
    url: 'https://www.novascotia.ca/sites/default/files/documents/7-4172/budget-estimates-2026-27-en.pdf',
    description: 'Estimates & Supplementary Detail',
  },
  {
    name: 'budget-highlights-2026-27.pdf',
    url: 'https://www.novascotia.ca/sites/default/files/documents/7-4172/highlights-budget-2026-27-en.pdf',
    description: 'Budget Highlights',
  },
  {
    name: 'government-business-plan-2026-27.pdf',
    url: 'https://www.novascotia.ca/sites/default/files/documents/7-4172/government-business-plan-2026-27-en.pdf',
    description: 'Government Business Plan',
  },
  {
    name: 'additional-appropriations-2026-27.pdf',
    url: 'https://www.novascotia.ca/sites/default/files/documents/7-4172/additional-appropriations-budget-2026-27-en.pdf',
    description: 'Additional Appropriations',
  },
]

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      const stats = fs.statSync(dest)
      if (stats.size > 10000) {
        console.log(`  ✓ Already downloaded: ${path.basename(dest)} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`)
        resolve()
        return
      }
    }

    const file = fs.createWriteStream(dest)

    const request = https.get(url, { headers: { 'User-Agent': 'ns-budget-chat/1.0 (open source)' } }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close()
        fs.unlinkSync(dest)
        downloadFile(response.headers.location!, dest).then(resolve).catch(reject)
        return
      }

      if (response.statusCode !== 200) {
        file.close()
        fs.unlinkSync(dest)
        reject(new Error(`HTTP ${response.statusCode} for ${url}`))
        return
      }

      response.pipe(file)

      file.on('finish', () => {
        file.close()
        const stats = fs.statSync(dest)
        console.log(`  ✓ Downloaded: ${path.basename(dest)} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`)
        resolve()
      })
    })

    request.on('error', (err) => {
      file.close()
      if (fs.existsSync(dest)) fs.unlinkSync(dest)
      reject(err)
    })

    file.on('error', (err) => {
      file.close()
      if (fs.existsSync(dest)) fs.unlinkSync(dest)
      reject(err)
    })
  })
}

async function main() {
  console.log('\n📥 NS Budget Chat — PDF Ingestion\n')

  if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true })
  }

  let success = 0
  let failed = 0

  for (const pdf of BUDGET_PDFS) {
    console.log(`Downloading: ${pdf.description}`)
    const dest = path.join(PDF_DIR, pdf.name)
    try {
      await downloadFile(pdf.url, dest)
      success++
    } catch (err) {
      console.error(`  ✗ FAILED: ${(err as Error).message}`)
      failed++
    }
  }

  console.log(`\n✅ Done: ${success} downloaded, ${failed} failed`)
  console.log(`📁 PDFs saved to: ${PDF_DIR}`)

  if (failed === 0) {
    console.log('\nNext step: npm run process\n')
  } else {
    console.log('\n⚠️  Some downloads failed. Check URLs and retry.\n')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
