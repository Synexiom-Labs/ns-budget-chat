import ChatInterface from '@/components/ChatInterface'
import Footer from '@/components/Footer'
import InfoSidebar from '@/components/InfoSidebar'
import MobileMenu from '@/components/MobileMenu'

function SynexiomLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="22" width="42" height="50" rx="14" stroke="rgb(226,228,234)" strokeWidth="3.5" fill="none" />
      <rect x="14" y="10" width="34" height="42" rx="12" stroke="rgb(226,228,234)" strokeWidth="3.5" fill="none" />
      <circle cx="38" cy="40" r="11" fill="rgb(26,58,143)" />
    </svg>
  )
}

export default function Home() {
  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Header — Synexiom dark void */}
      <header
        className="sticky top-0 z-10 flex-shrink-0 relative"
        style={{
          background: 'rgb(6, 8, 16)',
          borderBottom: '1px solid rgb(20, 28, 48)',
          height: '58px',
        }}
      >
        <div className="max-w-full px-6 h-full flex items-center justify-between">
          {/* Left: logo + title */}
          <div className="flex items-center gap-3">
            <SynexiomLogo size={30} />
            <div>
              <h1
                className="font-heading font-bold leading-none"
                style={{ fontSize: '17px', color: 'rgb(226, 228, 234)', letterSpacing: '0.1px' }}
              >
                NS Budget Chat
              </h1>
              <p
                className="hidden sm:block text-xs mt-0.5"
                style={{ color: 'rgba(226, 228, 234, 0.5)' }}
              >
                Nova Scotia Budget 2026–27 · Plain Language Guide
              </p>
            </div>
          </div>

          {/* Right: desktop link + mobile menu */}
          <MobileMenu />
        </div>
      </header>

      {/* Main chat */}
      <main className="flex-1 overflow-hidden flex" style={{ background: 'rgb(248, 250, 252)' }}>
        <InfoSidebar />
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
