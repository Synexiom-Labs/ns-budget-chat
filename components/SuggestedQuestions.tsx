'use client'

const QUESTIONS = [
  { text: 'What is the total deficit for 2026–27?', icon: '📊' },
  { text: 'How much is being invested in healthcare?', icon: '🏥' },
  { text: 'What is the Fiscal Stability Plan?', icon: '📋' },
  { text: "What's happening with public sector jobs?", icon: '👥' },
  { text: 'How much is being spent on housing?', icon: '🏠' },
  { text: 'What does this budget mean for education?', icon: '🎓' },
]

interface Props {
  onSelect: (question: string) => void
}

export default function SuggestedQuestions({ onSelect }: Props) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3 text-center">
        Try asking
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {QUESTIONS.map((q) => (
          <button
            key={q.text}
            onClick={() => onSelect(q.text)}
            className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm"
          >
            <span className="text-base flex-shrink-0 mt-px" aria-hidden="true">
              {q.icon}
            </span>
            <span>{q.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
