import ChatInterface from '@/components/ChatInterface'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">NS Budget Chat</h1>
            <p className="text-xs text-gray-500">Nova Scotia Budget 2026–27</p>
          </div>
          <a
            href="https://www.synexiomlabs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="Synexiom Labs"
          >
            <div className="w-6 h-6 rounded-full bg-[#1a3a8f] flex items-center justify-center overflow-hidden">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none" className="w-4 h-4">
                <rect x="20" y="22" width="42" height="50" rx="14" stroke="white" strokeWidth="3.5" fill="none"/>
                <rect x="14" y="10" width="34" height="42" rx="12" stroke="white" strokeWidth="3.5" fill="none"/>
                <circle cx="38" cy="40" r="11" fill="white"/>
              </svg>
            </div>
            <span className="hidden sm:inline">Synexiom Labs</span>
          </a>
        </div>
      </header>

      {/* Main chat */}
      <main className="flex-1 overflow-hidden">
        <ChatInterface />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
