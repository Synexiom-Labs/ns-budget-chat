/**
 * scripts/validate.ts
 * Runs ground-truth Q&A pairs against the live API to validate answer quality.
 * Run: npm run validate
 * Requires the dev server to be running: npm run dev
 */

import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const GROUND_TRUTH_FILE = path.join(process.cwd(), 'data', 'ground-truth.json')

interface TestCase {
  question: string
  expected_answer_contains: string[]
  source: string
}

interface TestResult {
  question: string
  passed: boolean
  missing: string[]
  response: string
}

async function runTest(testCase: TestCase): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            id: 'test-1',
            role: 'user',
            parts: [{ type: 'text', text: testCase.question }],
          },
        ],
      }),
    })

    if (!response.ok) {
      return {
        question: testCase.question,
        passed: false,
        missing: ['API error: ' + response.status],
        response: '',
      }
    }

    // Read streamed response
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        // Parse Vercel AI SDK data stream format
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              fullText += JSON.parse(line.slice(2))
            } catch {}
          }
        }
      }
    }

    const lowerResponse = fullText.toLowerCase()
    const missing = testCase.expected_answer_contains.filter(
      (expected) => !lowerResponse.includes(expected.toLowerCase())
    )

    return {
      question: testCase.question,
      passed: missing.length === 0,
      missing,
      response: fullText.slice(0, 300),
    }
  } catch (err) {
    return {
      question: testCase.question,
      passed: false,
      missing: ['Exception: ' + (err as Error).message],
      response: '',
    }
  }
}

async function main() {
  console.log('\n🧪 NS Budget Chat — Accuracy Validation\n')

  if (!fs.existsSync(GROUND_TRUTH_FILE)) {
    console.error(`Ground truth file not found: ${GROUND_TRUTH_FILE}`)
    console.error('Copy data/ground-truth.example.json to data/ground-truth.json and fill in verified answers.')
    process.exit(1)
  }

  const testCases: TestCase[] = JSON.parse(fs.readFileSync(GROUND_TRUTH_FILE, 'utf-8'))
  console.log(`Running ${testCases.length} test cases against ${BASE_URL}\n`)

  const results: TestResult[] = []
  let passed = 0

  for (const testCase of testCases) {
    process.stdout.write(`Testing: "${testCase.question.slice(0, 60)}..."`)
    const result = await runTest(testCase)
    results.push(result)

    if (result.passed) {
      console.log(' ✅')
      passed++
    } else {
      console.log(' ❌')
      console.log(`  Missing: ${result.missing.join(', ')}`)
      console.log(`  Response: ${result.response}`)
    }

    // Pause between tests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  const total = testCases.length
  const percentage = Math.round((passed / total) * 100)
  console.log(`\n📊 Results: ${passed}/${total} passed (${percentage}%)`)

  if (percentage < 80) {
    console.log('\n❌ Below 80% accuracy threshold. Review retrieval and prompt settings before deploying.')
    process.exit(1)
  } else {
    console.log('\n✅ Accuracy above threshold. Ready to deploy.')
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
