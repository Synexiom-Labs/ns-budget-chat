import { NextResponse } from 'next/server'

const SUGGESTIONS = [
  {
    id: '1',
    text: 'What is the total deficit for 2026–27?',
    category: 'fiscal',
  },
  {
    id: '2',
    text: 'How much is being invested in healthcare?',
    category: 'health',
  },
  {
    id: '3',
    text: 'What is the Fiscal Stability Plan?',
    category: 'fiscal',
  },
  {
    id: '4',
    text: "What's happening with public sector jobs?",
    category: 'workforce',
  },
  {
    id: '5',
    text: 'How much is being spent on housing?',
    category: 'housing',
  },
  {
    id: '6',
    text: 'What does this budget mean for education?',
    category: 'education',
  },
]

export async function GET() {
  return NextResponse.json(SUGGESTIONS, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
