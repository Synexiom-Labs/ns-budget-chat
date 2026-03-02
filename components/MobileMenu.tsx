'use client'

import { useState } from 'react'
import { track } from '@vercel/analytics'

const LINKS = [
  {
    label: 'Synexiom Labs',
    href: 'https://www.synexiomlabs.com',
    event: 'synexiom_click',
    icon: '↗',
  },
  {
    label: 'Official Budget',
    href: 'https://www.novascotia.ca/documents/budget-documents-2026-2027',
    event: 'budget_click',
    icon: '📋',
  },
  {
    label: 'Open Source on GitHub',
    href: 'https://github.com/synexiom-labs/ns-budget-chat',
    event: 'github_click',
    icon: '⭐',
  },
  {
    label: 'Source Documents',
    href: 'https://www.novascotia.ca/documents/budget-documents-2026-2027',
    event: 'source_docs_click',
    icon: '📄',
  },
]

export default function MobileMenu() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop: show Official Budget link directly */}
      <a
        href="https://www.novascotia.ca/documents/budget-documents-2026-2027"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:block text-xs transition-colors"
        style={{
          color: 'rgba(226, 228, 234, 0.65)',
          border: '1px solid rgb(30, 42, 66)',
          padding: '5px 12px',
          borderRadius: '6px',
          textDecoration: 'none',
        }}
      >
        Official Budget ↗
      </a>

      {/* Mobile: hamburger button */}
      <button
        className="sm:hidden flex items-center justify-center w-8 h-8 rounded"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        style={{
          background: open ? 'rgb(23, 30, 48)' : 'transparent',
          border: '1px solid rgb(30, 42, 66)',
          color: 'rgba(226, 228, 234, 0.8)',
          cursor: 'pointer',
          fontSize: '18px',
          lineHeight: 1,
        }}
      >
        {open ? '✕' : '☰'}
      </button>

      {/* Mobile dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="sm:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setOpen(false)}
          />

          {/* Dropdown panel */}
          <div
            className="sm:hidden absolute left-0 right-0 z-50"
            style={{
              top: '58px',
              background: 'rgb(10, 14, 24)',
              borderBottom: '1px solid rgb(20, 28, 48)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            <div className="flex flex-col px-5 py-4 gap-1">
              {LINKS.map((link) => (
                <a
                  key={link.href + link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    track(link.event, { location: 'mobile_menu' })
                    setOpen(false)
                  }}
                  className="flex items-center gap-3 text-sm py-3 transition-colors hover:text-white"
                  style={{
                    color: 'rgba(226, 228, 234, 0.75)',
                    textDecoration: 'none',
                    borderBottom: '1px solid rgb(20, 28, 48)',
                  }}
                >
                  <span className="text-base">{link.icon}</span>
                  <span>{link.label}</span>
                </a>
              ))}

              {/* Disclaimer */}
              <p
                className="text-xs pt-3 leading-relaxed"
                style={{ color: 'rgba(226, 228, 234, 0.3)' }}
              >
                AI responses may contain errors. Not affiliated with the Government of Nova Scotia.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  )
}
