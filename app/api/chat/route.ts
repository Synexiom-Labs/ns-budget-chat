import { streamText, UIMessage, isTextUIPart } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { NextRequest } from 'next/server'
import { retrieve, classifyQuery } from '@/lib/rag/retriever'
import { rerank, assembleContext } from '@/lib/rag/reranker'
import { buildSystemPrompt, OUT_OF_SCOPE_RESPONSE } from '@/lib/rag/prompts'
import { checkRateLimit } from '@/lib/rate-limit'
import { getCachedResponse, setCachedResponse } from '@/lib/cache'

// Stream a text response in the AI SDK v6 data-stream wire format.
// useChat requires BOTH d: (step finish) AND e: (message finish) to commit
// the message to state. Missing e: causes the response to be silently discarded.
function streamCachedText(text: string, remaining: number): Response {
  const encoder = new TextEncoder()
  const finish = `{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}`
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`))
      controller.enqueue(encoder.encode(`d:${finish}\n`))
      controller.enqueue(encoder.encode(`e:${finish}\n`))
      controller.close()
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'x-vercel-ai-data-stream': 'v1',
      'X-RateLimit-Remaining': String(remaining),
      'X-Cache': 'HIT',
    },
  })
}

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
  let conversationMessages: { role: 'user' | 'assistant'; content: string }[]
  try {
    const body = await req.json()
    // AI SDK v6 useChat sends full messages array
    const messages: UIMessage[] = body.messages ?? []
    const lastUserMsg = messages.filter((m) => m.role === 'user').pop()
    if (!lastUserMsg) {
      return new Response('No user message found', { status: 400 })
    }
    // Extract text from last user message (used for retrieval)
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

    // Build full conversation history for Claude (maintains context across turns)
    conversationMessages = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.parts
          .filter(isTextUIPart)
          .map((p) => p.text)
          .join(' ')
          .trim(),
      }))
      .filter((m) => m.content.length > 0)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  // --- Out-of-scope check (skip for follow-up messages in an active conversation) ---
  const isFollowUp = conversationMessages.length > 1
  const queryType = classifyQuery(message)
  if (queryType === 'out-of-scope' && !isFollowUp) {
    return streamCachedText(OUT_OF_SCOPE_RESPONSE, remaining)
  }

  // --- Cache check (only for fresh single-turn queries, not follow-ups) ---
  if (!isFollowUp) {
    const cached = await getCachedResponse(message)
    if (cached) {
      return streamCachedText(cached, remaining)
    }
  }

  // --- Retrieve context (based on last user message only) ---
  let context = ''
  try {
    const rawChunks = await retrieve(message)
    const ranked = rerank(message, rawChunks)
    context = assembleContext(ranked)
  } catch (err) {
    console.error('Retrieval error:', err)
    context = 'No relevant budget document sections could be retrieved for this query.'
  }

  // --- Stream response with full conversation history ---
  const systemPrompt = buildSystemPrompt(context)

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    system: systemPrompt,
    messages: conversationMessages,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    onFinish: async ({ text }) => {
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
