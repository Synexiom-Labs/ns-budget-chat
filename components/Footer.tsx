export default function Footer() {
  return (
    <footer
      className="flex-shrink-0 flex items-center justify-center gap-2 text-xs flex-wrap px-4 py-2.5"
      style={{
        background: 'rgb(6, 8, 16)',
        borderTop: '1px solid rgb(20, 28, 48)',
        color: 'rgba(226, 228, 234, 0.35)',
      }}
    >
      <span>AI may make errors — verify with official documents.</span>
      <span style={{ opacity: 0.3 }}>·</span>
      <span>Built by</span>
      <a
        href="https://www.synexiomlabs.com"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold transition-colors hover:text-white"
        style={{ color: 'rgba(226, 228, 234, 0.7)', textDecoration: 'none' }}
      >
        Synexiom Labs
      </a>
      <span style={{ opacity: 0.3 }}>·</span>
      <a
        href="https://github.com/synexiom-labs/ns-budget-chat"
        target="_blank"
        rel="noopener noreferrer"
        className="transition-colors hover:text-white"
        style={{ color: 'rgba(226, 228, 234, 0.5)', textDecoration: 'none' }}
      >
        Open Source
      </a>
      <span style={{ opacity: 0.3 }}>·</span>
      <a
        href="https://www.novascotia.ca/documents/budget-documents-2026-2027"
        target="_blank"
        rel="noopener noreferrer"
        className="transition-colors hover:text-white"
        style={{ color: 'rgba(226, 228, 234, 0.5)', textDecoration: 'none' }}
      >
        Source Documents
      </a>
    </footer>
  )
}
