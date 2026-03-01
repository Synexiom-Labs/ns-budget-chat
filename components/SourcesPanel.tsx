'use client'

import type { SourceItem } from '@/lib/pdf-urls'

interface Props {
  sources: SourceItem[]
  onClose: () => void
}

export default function SourcesPanel({ sources, onClose }: Props) {
  return (
    <div
      className="fixed right-0 bottom-[42px] top-[58px] w-[360px] flex flex-col z-50 max-sm:w-full"
      style={{
        background: 'rgb(10, 14, 24)',
        borderLeft: '1px solid rgb(20, 28, 48)',
        animation: 'panelSlide 0.28s ease forwards',
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgb(20, 28, 48)' }}
      >
        <div>
          <div
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-sora)', color: 'rgb(226, 228, 234)' }}
          >
            Source Documents
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'rgba(226, 228, 234, 0.5)' }}>
            {sources.length} excerpt{sources.length !== 1 ? 's' : ''} retrieved
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded text-base transition-opacity hover:opacity-100"
          style={{
            background: 'rgb(23, 30, 48)',
            border: '1px solid rgb(30, 42, 66)',
            color: 'rgb(226, 228, 234)',
            opacity: 0.7,
            cursor: 'pointer',
          }}
          aria-label="Close sources panel"
        >
          ×
        </button>
      </div>

      {/* Source cards */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
        {sources.map((source, i) => (
          <div
            key={i}
            className="mb-2.5 p-3.5 rounded-lg"
            style={{
              background: 'rgb(23, 30, 48)',
              border: '1px solid rgb(30, 42, 66)',
              borderLeft: '3px solid rgb(26, 58, 143)',
            }}
          >
            {/* Document name + page badge */}
            <div className="flex items-start justify-between mb-2 gap-2">
              <div
                className="text-xs font-semibold flex-1 leading-snug"
                style={{ color: 'rgb(226, 228, 234)' }}
              >
                {source.document}
              </div>
              <span
                className="text-xs font-semibold flex-shrink-0 px-2 py-0.5 rounded text-white"
                style={{ background: 'rgb(26, 58, 143)' }}
              >
                p.{source.page}
              </span>
            </div>

            {/* Section label */}
            {source.section && (
              <div className="text-xs mb-2 leading-snug" style={{ color: 'rgba(226, 228, 234, 0.45)' }}>
                {source.section}
              </div>
            )}

            {/* PDF link */}
            {source.link && (
              <a
                href={source.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-medium rounded transition-all hover:text-white"
                style={{
                  color: 'rgb(226, 228, 234)',
                  border: '1px solid rgb(30, 42, 66)',
                  padding: '2px 10px',
                  textDecoration: 'none',
                  opacity: 0.8,
                }}
              >
                View in PDF ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
