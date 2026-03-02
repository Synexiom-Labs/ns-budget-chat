'use client'

import { track } from '@vercel/analytics'

export default function InfoSidebar() {
  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0 w-[220px] px-5 pt-7 pb-6 gap-5 overflow-y-auto"
      style={{
        background: 'white',
        borderRight: '1px solid rgb(218, 224, 232)',
      }}
    >
      {/* Synexiom Labs brand */}
      <div>
        <a
          href="https://www.synexiomlabs.com"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('synexiom_click', { location: 'sidebar' })}
          className="flex items-center gap-2 mb-2.5 group"
          style={{ textDecoration: 'none' }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgb(6, 8, 16)' }}
          >
            <svg width="16" height="16" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="20" y="22" width="42" height="50" rx="14" stroke="rgb(226,228,234)" strokeWidth="3.5" fill="none" />
              <rect x="14" y="10" width="34" height="42" rx="12" stroke="rgb(226,228,234)" strokeWidth="3.5" fill="none" />
              <circle cx="38" cy="40" r="11" fill="rgb(26,58,143)" />
            </svg>
          </div>
          <span
            className="text-sm font-semibold group-hover:underline"
            style={{ color: 'rgb(30, 41, 59)', fontFamily: 'var(--font-sora)' }}
          >
            Synexiom Labs
          </span>
        </a>
        <p className="text-xs leading-relaxed" style={{ color: 'rgb(100, 116, 139)' }}>
          Building free, open civic tools for Nova Scotians.
        </p>
      </div>

      <hr style={{ borderColor: 'rgb(218, 224, 232)', margin: 0 }} />

      {/* Links */}
      <div className="flex flex-col gap-3">
        <a
          href="https://github.com/synexiom-labs/ns-budget-chat"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('github_click', { location: 'sidebar' })}
          className="flex items-center gap-2 text-xs transition-colors hover:underline"
          style={{ color: 'rgb(30, 41, 59)', textDecoration: 'none' }}
        >
          <span>⭐</span>
          <span>Open Source on GitHub</span>
        </a>
        <a
          href="https://www.novascotia.ca/documents/budget-documents-2026-2027"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('source_docs_click', { location: 'sidebar' })}
          className="flex items-center gap-2 text-xs transition-colors hover:underline"
          style={{ color: 'rgb(30, 41, 59)', textDecoration: 'none' }}
        >
          <span>📄</span>
          <span>Official Budget Documents</span>
        </a>
      </div>

      <hr style={{ borderColor: 'rgb(218, 224, 232)', margin: 0 }} />

      {/* AI disclaimer */}
      <p className="text-xs leading-relaxed" style={{ color: 'rgb(148, 163, 184)' }}>
        AI responses may contain errors. Always verify important figures with the official budget documents.
      </p>
    </aside>
  )
}
