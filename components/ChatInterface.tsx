'use client'

import { useChat } from '@ai-sdk/react'
import { useRef, useEffect, useState } from 'react'
import MessageBubble from './MessageBubble'
import SuggestedQuestions from './SuggestedQuestions'
import SourcesPanel from './SourcesPanel'
import type { SourceItem } from '@/lib/pdf-urls'

export default function ChatInterface() {
  const { messages, sendMessage, status, error } = useChat()
  const isLoading = status === 'submitted' || status === 'streaming'

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [input, setInput] = useState('')
  const [hasStarted, setHasStarted] = useState(false)

  // Sources panel state
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelSources, setPanelSources] = useState<SourceItem[]>([])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [input])

  function submit(text: string) {
    if (!text.trim() || isLoading) return
    setHasStarted(true)
    setInput('')
    setPanelOpen(false)
    sendMessage({ text: text.trim() })
  }

  function openSources(sources: SourceItem[]) {
    setPanelSources(sources)
    setPanelOpen(true)
  }

  function onFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    submit(input)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(input)
    }
  }

  const showSuggestions = !hasStarted && messages.length === 0

  return (
    <div
      className="flex h-full overflow-hidden transition-all duration-300"
      style={{ marginRight: panelOpen ? '360px' : '0' }}
    >
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Message area */}
        <div
          className="flex-1 overflow-y-auto px-5 py-7 scrollbar-hide"
          style={{ background: 'rgb(248, 250, 252)' }}
        >
          <div className="max-w-[700px] mx-auto flex flex-col gap-5">
            {showSuggestions && (
              <div>
                {/* Welcome hero */}
                <div className="text-center mb-9">
                  {/* Large logo card */}
                  <div
                    className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center mx-auto mb-5"
                    style={{ background: 'rgb(6, 8, 16)', boxShadow: '0 8px 28px rgba(6,8,16,0.15)' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none" className="w-10 h-10">
                      <rect x="20" y="22" width="42" height="50" rx="14" stroke="rgb(226,228,234)" strokeWidth="3.5" fill="none" />
                      <rect x="14" y="10" width="34" height="42" rx="12" stroke="rgb(226,228,234)" strokeWidth="3.5" fill="none" />
                      <circle cx="38" cy="40" r="11" fill="rgb(26,58,143)" />
                    </svg>
                  </div>

                  <h2
                    className="font-heading font-bold mb-3"
                    style={{ fontSize: '26px', color: 'rgb(30, 41, 59)' }}
                  >
                    Welcome to NS Budget Chat
                  </h2>
                  <p className="text-sm max-w-[460px] mx-auto mb-5" style={{ color: 'rgb(100, 116, 139)', lineHeight: 1.7 }}>
                    Ask anything about Nova Scotia&apos;s Budget 2026–27 in plain language.
                    Every answer is cited directly from the official budget documents.
                  </p>

                  {/* Disclaimer badge */}
                  <div
                    className="inline-block text-xs rounded px-3.5 py-1.5"
                    style={{
                      background: 'rgba(26, 58, 143, 0.06)',
                      border: '1px solid rgba(26, 58, 143, 0.18)',
                      color: 'rgb(26, 58, 143)',
                    }}
                  >
                    ⓘ Not affiliated with the Government of Nova Scotia
                  </div>
                </div>

                <SuggestedQuestions onSelect={submit} />
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className="msg-appear">
                <MessageBubble
                  message={message}
                  onShowSources={message.role === 'assistant' ? openSources : undefined}
                />
              </div>
            ))}

            {/* Loading dots */}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="msg-appear flex flex-col items-start gap-1.5">
                <div className="text-xs font-medium pl-1" style={{ color: 'rgb(100, 116, 139)' }}>
                  NS Budget Chat
                </div>
                <div className="flex gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ background: 'rgb(26, 58, 143)' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none" className="w-5 h-5">
                      <rect x="20" y="22" width="42" height="50" rx="14" stroke="white" strokeWidth="3.5" fill="none" />
                      <rect x="14" y="10" width="34" height="42" rx="12" stroke="white" strokeWidth="3.5" fill="none" />
                      <circle cx="38" cy="40" r="11" fill="white" />
                    </svg>
                  </div>
                  <div
                    className="flex items-center gap-1.5 px-4 py-3"
                    style={{
                      background: 'white',
                      border: '1px solid rgb(218, 224, 232)',
                      borderRadius: '18px 18px 18px 4px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{
                          background: 'rgb(26, 58, 143)',
                          animationDelay: `${i * 150}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                Something went wrong. Please try again.
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input area */}
        <div
          className="flex-shrink-0 px-5 py-3"
          style={{ background: 'white', borderTop: '1px solid rgb(218, 224, 232)' }}
        >
          <form onSubmit={onFormSubmit} className="max-w-[700px] mx-auto flex items-end gap-2.5">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about Nova Scotia's Budget 2026–27…"
              rows={1}
              className="flex-1 resize-none text-sm"
              style={{
                border: '1px solid rgb(218, 224, 232)',
                borderRadius: '10px',
                padding: '11px 15px',
                outline: 'none',
                lineHeight: 1.5,
                maxHeight: '120px',
                overflowY: 'auto',
                background: 'white',
                color: 'rgb(30, 41, 59)',
                fontFamily: 'var(--font-inter)',
                transition: 'border-color 0.18s, box-shadow 0.18s',
              }}
              disabled={isLoading}
              aria-label="Ask a question about the budget"
              onFocus={(e) => {
                e.target.style.borderColor = 'rgb(26, 58, 143)'
                e.target.style.boxShadow = '0 0 0 3px rgba(26,58,143,0.08)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgb(218, 224, 232)'
                e.target.style.boxShadow = 'none'
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex-shrink-0 text-sm font-medium text-white transition-all"
              style={{
                background: isLoading || !input.trim() ? 'rgb(148, 163, 184)' : 'rgb(26, 58, 143)',
                borderRadius: '10px',
                padding: '11px 22px',
                border: 'none',
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-inter)',
              }}
              aria-label="Send message"
            >
              Send ↑
            </button>
          </form>
          <p className="mt-1.5 text-center text-xs" style={{ color: 'rgb(148, 163, 184)' }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Sources side panel */}
      {panelOpen && (
        <SourcesPanel sources={panelSources} onClose={() => setPanelOpen(false)} />
      )}
    </div>
  )
}
