'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { UIMessage } from 'ai'
import { isTextUIPart } from 'ai'
import CitationBadge from './CitationBadge'
import type { SourceItem } from '@/lib/pdf-urls'
import { getPdfLink } from '@/lib/pdf-urls'

interface Props {
  message: UIMessage
  onShowSources?: (sources: SourceItem[]) => void
}

// Matches: [Budget Highlights, p.3] or [Estimates & Supplementary Detail, p.42, Health]
const CITATION_RE = /\[([^\]]+),\s*p\.(\d+)(?:,\s*([^\]]+))?\]/g

interface ParsedCitation {
  document: string
  page: number
  section?: string
  raw: string
}

function parseCitations(text: string): ParsedCitation[] {
  const citations: ParsedCitation[] = []
  const seen = new Set<string>()
  let match: RegExpExecArray | null

  CITATION_RE.lastIndex = 0
  while ((match = CITATION_RE.exec(text)) !== null) {
    const key = `${match[1]}:${match[2]}`
    if (!seen.has(key)) {
      seen.add(key)
      citations.push({
        document: match[1].trim(),
        page: parseInt(match[2]),
        section: match[3]?.trim(),
        raw: match[0],
      })
    }
  }
  return citations
}

function extractText(message: UIMessage): string {
  return message.parts.filter(isTextUIPart).map((p) => p.text).join('')
}

export default function MessageBubble({ message, onShowSources }: Props) {
  const isUser = message.role === 'user'
  const textContent = extractText(message)

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] px-4 py-3 text-sm text-white"
          style={{
            background: 'rgb(26, 58, 143)',
            borderRadius: '18px 18px 4px 18px',
            boxShadow: '0 2px 10px rgba(26,58,143,0.25)',
            lineHeight: 1.65,
          }}
        >
          <p className="whitespace-pre-wrap">{textContent}</p>
        </div>
      </div>
    )
  }

  const citations = parseCitations(textContent)
  const sources: SourceItem[] = citations.map((c) => ({
    document: c.document,
    page: c.page,
    section: c.section,
    link: getPdfLink(c.document, c.page),
  }))

  return (
    <div className="flex flex-col items-start gap-1.5">
      {/* Assistant label */}
      <div className="text-xs font-medium pl-1" style={{ color: 'rgb(100, 116, 139)' }}>
        NS Budget Chat
      </div>

      {/* Bubble row */}
      <div className="flex gap-3 w-full">
        {/* Synexiom Labs avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden"
          style={{ background: 'rgb(26, 58, 143)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none" className="w-5 h-5">
            <rect x="20" y="22" width="42" height="50" rx="14" stroke="white" strokeWidth="3.5" fill="none" />
            <rect x="14" y="10" width="34" height="42" rx="12" stroke="white" strokeWidth="3.5" fill="none" />
            <circle cx="38" cy="40" r="11" fill="white" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          {/* Message bubble */}
          <div
            className="px-4 py-3 text-sm"
            style={{
              background: 'rgb(255, 255, 255)',
              border: '1px solid rgb(218, 224, 232)',
              borderRadius: '18px 18px 18px 4px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
              lineHeight: 1.65,
              color: 'rgb(30, 41, 59)',
            }}
          >
            <div className="prose prose-sm max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mt-2 [&>ol]:mt-2 [&_table]:text-xs [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-gray-200 [&_th]:px-2 [&_th]:py-1 [&_th]:bg-gray-50">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{textContent}</ReactMarkdown>
            </div>
          </div>

          {/* Citation badges + sources panel button */}
          {citations.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {citations.map((c, i) => (
                <CitationBadge key={i} document={c.document} page={c.page} section={c.section} />
              ))}
              {onShowSources && (
                <button
                  onClick={() => onShowSources(sources)}
                  className="flex items-center gap-1 text-xs font-medium rounded-full transition-all hover:bg-blue-50"
                  style={{
                    color: 'rgb(26, 58, 143)',
                    border: '1px solid rgb(218, 224, 232)',
                    padding: '3px 11px',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  📄 {citations.length} source{citations.length !== 1 ? 's' : ''} found
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
