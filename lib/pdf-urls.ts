/**
 * Maps document names (as stored in Pinecone metadata / cited in responses)
 * to their official Nova Scotia PDF URLs.
 */

export interface SourceItem {
  document: string
  page: number
  section?: string
  link: string
}

const PDF_URLS: Record<string, string> = {
  'Budget 2026-27 (Main)':
    'https://www.novascotia.ca/sites/default/files/documents/6-4173/ftb-bfi-046-en-budget-2026-2027.pdf',
  'Budget Address':
    'https://www.novascotia.ca/sites/default/files/documents/7-4172/address-budget-2026-27-en.pdf',
  'Estimates & Supplementary Detail':
    'https://www.novascotia.ca/sites/default/files/documents/7-4172/budget-estimates-2026-27-en.pdf',
  'Budget Highlights':
    'https://www.novascotia.ca/sites/default/files/documents/7-4172/highlights-budget-2026-27-en.pdf',
  'Government Business Plan':
    'https://www.novascotia.ca/sites/default/files/documents/7-4172/government-business-plan-2026-27-en.pdf',
  'Additional Appropriations':
    'https://www.novascotia.ca/sites/default/files/documents/7-4172/additional-appropriations-budget-2026-27-en.pdf',
}

/** Returns a PDF URL with page anchor, or empty string if doc is unknown. */
export function getPdfLink(documentName: string, page: number): string {
  // Exact match first
  if (PDF_URLS[documentName]) return `${PDF_URLS[documentName]}#page=${page}`

  // Fuzzy match — handles minor name variations from the model
  const key = Object.keys(PDF_URLS).find(
    (k) =>
      documentName.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(documentName.toLowerCase())
  )
  return key ? `${PDF_URLS[key]}#page=${page}` : ''
}
