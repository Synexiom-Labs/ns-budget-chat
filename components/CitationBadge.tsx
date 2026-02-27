'use client'

interface Props {
  document: string
  page: number
  section?: string
}

const DOC_SHORT: Record<string, string> = {
  'Budget 2026-27 (Main)': 'Main Budget',
  'Budget Address': 'Address',
  'Estimates & Supplementary Detail': 'Estimates',
  'Budget Highlights': 'Highlights',
  'Government Business Plan': 'Business Plan',
  'Additional Appropriations': 'Addl. Approps.',
}

function shorten(doc: string): string {
  // Check for partial matches
  for (const [full, short] of Object.entries(DOC_SHORT)) {
    if (doc.toLowerCase().includes(full.toLowerCase()) || full.toLowerCase().includes(doc.toLowerCase())) {
      return short
    }
  }
  // Return first 20 chars as fallback
  return doc.length > 22 ? doc.slice(0, 20) + '…' : doc
}

export default function CitationBadge({ document, page, section }: Props) {
  const label = `${shorten(document)}, p.${page}`
  const title = section ? `${document}, p.${page} — ${section}` : `${document}, p.${page}`

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs text-blue-700 font-medium cursor-default select-none"
      title={title}
      role="note"
      aria-label={`Source: ${title}`}
    >
      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      {label}
    </span>
  )
}
