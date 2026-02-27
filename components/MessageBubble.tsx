'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { UIMessage } from 'ai'
import { isTextUIPart } from 'ai'
import CitationBadge from './CitationBadge'

interface Props {
  message: UIMessage
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

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  const textContent = extractText(message)

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3 text-sm text-white shadow-sm">
          <p className="whitespace-pre-wrap">{textContent}</p>
        </div>
      </div>
    )
  }

  const citations = parseCitations(textContent)

  return (
    <div className="flex gap-3">
      {/* AI avatar */}
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-white text-xs font-bold">AI</span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Message content */}
        <div className="prose prose-sm prose-gray max-w-none text-gray-800 [&>p]:leading-relaxed [&>ul]:mt-2 [&>ol]:mt-2 [&_table]:text-xs [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-gray-200 [&_th]:px-2 [&_th]:py-1 [&_th]:bg-gray-50">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{textContent}</ReactMarkdown>
        </div>

        {/* Citation badges */}
        {citations.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {citations.map((c, i) => (
              <CitationBadge
                key={i}
                document={c.document}
                page={c.page}
                section={c.section}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
