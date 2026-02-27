import { streamText, UIMessage, isTextUIPart } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { NextRequest } from 'next/server'
import { retrieve, classifyQuery } from '@/lib/rag/retriever'
import { rerank, assembleContext } from '@/lib/rag/reranker'
import { buildSystemPrompt, OUT_OF_SCOPE_RESPONSE } from '@/lib/rag/prompts'
import { checkRateLimit } from '@/lib/rate-limit'
import { setCachedResponse } from '@/lib/cache'

export const runtime = 'nodejs'
export const maxDuration = 30

const MAX_OUTPUT_TOKENS = parseInt(process.env.MAX_OUTPUT_TOKENS ?? '1500')

export async function POST(req: NextRequest) {
  // --- Rate limiting ---
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'

  const { success, remaining } = await checkRateLimit(ip)
  if (!success) {
    return new Response('Too many requests. Please wait a minute before trying again.', {
      status: 429,
      headers: { 'Retry-After': '60', 'X-RateLimit-Remaining': '0' },
    })
  }

  // --- Parse request (AI SDK v6 sends { messages: UIMessage[] }) ---
  let message: string
  try {
    const body = await req.json()
    // AI SDK v6 useChat sends full messages array; extract last user message
    const messages: UIMessage[] = body.messages ?? []
    const lastUserMsg = messages.filter((m) => m.role === 'user').pop()
    if (!lastUserMsg) {
      return new Response('No user message found', { status: 400 })
    }
    // Extract text from message parts
    message = lastUserMsg.parts
      .filter(isTextUIPart)
      .map((p) => p.text)
      .join(' ')
      .trim()

    if (!message) {
      return new Response('Message is required', { status: 400 })
    }
    if (message.length > 1000) {
      return new Response('Message too long (max 1000 characters)', { status: 400 })
    }
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  // --- Out-of-scope check ---
  const queryType = classifyQuery(message)
  if (queryType === 'out-of-scope') {
    return new Response(OUT_OF_SCOPE_RESPONSE, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  // --- Retrieve context ---
  let context = ''
  try {
    const rawChunks = await retrieve(message)
    const ranked = rerank(message, rawChunks)
    context = assembleContext(ranked)
  } catch (err) {
    console.error('Retrieval error:', err)
    context = 'No relevant budget document sections could be retrieved for this query.'
  }

  // --- Stream response ---
  const systemPrompt = buildSystemPrompt(context)

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    system: systemPrompt,
    messages: [{ role: 'user', content: message }],
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    onFinish: async ({ text }) => {
      // Write to cache for future queries (read from cache is Phase 2)
      if (text.length > 50) {
        await setCachedResponse(message, text)
      }
    },
  })

  return result.toUIMessageStreamResponse({
    headers: {
      'X-RateLimit-Remaining': String(remaining),
    },
  })
}
