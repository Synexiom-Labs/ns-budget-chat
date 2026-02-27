'use client'

import { useChat } from '@ai-sdk/react'
import { useRef, useEffect, useState } from 'react'
import MessageBubble from './MessageBubble'
import SuggestedQuestions from './SuggestedQuestions'

export default function ChatInterface() {
  // AI SDK v6 useChat API — DefaultChatTransport uses /api/chat by default
  const { messages, sendMessage, status, error } = useChat()

  const isLoading = status === 'submitted' || status === 'streaming'

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [input, setInput] = useState('')
  const [hasStarted, setHasStarted] = useState(false)

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
    sendMessage({ text: text.trim() })
  }

  function onSuggestionClick(text: string) {
    submit(text)
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
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {showSuggestions && (
          <div className="pt-8">
            {/* Hero text */}
            <div className="text-center mb-10">
              <p className="text-2xl font-semibold text-gray-800 mb-2">
                Understand your provincial budget
              </p>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Ask anything about the Nova Scotia Budget 2026–27. Get plain-language answers with
                citations from the official documents.
              </p>
            </div>
            <SuggestedQuestions onSelect={onSuggestionClick} />
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <div className="flex items-center gap-1 pt-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
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

      {/* Input area */}
      <div className="border-t border-gray-100 bg-white px-4 py-4">
        <form onSubmit={onFormSubmit} className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about the Nova Scotia Budget 2026–27…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            disabled={isLoading}
            aria-label="Ask a question about the budget"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-gray-400">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
