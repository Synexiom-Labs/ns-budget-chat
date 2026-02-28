export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="max-w-3xl mx-auto px-4 py-3 space-y-1">
        <p className="text-xs text-gray-400 text-center">
          AI-generated answers based on official NS budget documents. Always verify against source
          material. Not affiliated with the Government of Nova Scotia.
        </p>
        <p className="text-xs text-gray-400 text-center">
          <a
            href="https://github.com/synexiom-labs/ns-budget-chat"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors underline underline-offset-2"
          >
            Open Source
          </a>
          {' · '}
          <a
            href="https://synexiomlabs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors underline underline-offset-2"
          >
            Built by Synexiom Labs
          </a>
          {' · '}
          <a
            href="https://www.novascotia.ca/documents/budget-documents-2026-2027"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors underline underline-offset-2"
          >
            Source Documents
          </a>
        </p>
      </div>
    </footer>
  )
}
