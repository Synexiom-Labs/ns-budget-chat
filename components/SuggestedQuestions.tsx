'use client'

const QUESTIONS = [
  { text: 'What is the total deficit for 2026–27?' },
  { text: 'How much is being invested in healthcare?' },
  { text: 'What is the Fiscal Stability Plan?' },
  { text: "What's happening with public sector jobs?" },
  { text: 'How much is being spent on housing?' },
  { text: 'What does this budget mean for education?' },
]

interface Props {
  onSelect: (question: string) => void
}

export default function SuggestedQuestions({ onSelect }: Props) {
  return (
    <div>
      <p
        className="text-xs font-medium uppercase tracking-wide mb-3 text-center"
        style={{ color: 'rgb(148, 163, 184)' }}
      >
        Try asking
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {QUESTIONS.map((q) => (
          <button
            key={q.text}
            onClick={() => onSelect(q.text)}
            className="text-left text-sm transition-all"
            style={{
              background: 'white',
              border: '1px solid rgb(218, 224, 232)',
              borderLeft: '3px solid rgb(26, 58, 143)',
              borderRadius: '10px',
              padding: '13px 15px',
              color: 'rgb(30, 41, 59)',
              cursor: 'pointer',
              lineHeight: 1.45,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.background = '#eef2ff'
              el.style.borderLeftColor = 'rgb(34, 74, 175)'
              el.style.transform = 'translateY(-1px)'
              el.style.boxShadow = '0 3px 10px rgba(26,58,143,0.1)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.background = 'white'
              el.style.borderLeftColor = 'rgb(26, 58, 143)'
              el.style.transform = 'none'
              el.style.boxShadow = 'none'
            }}
          >
            {q.text}
          </button>
        ))}
      </div>
    </div>
  )
}
