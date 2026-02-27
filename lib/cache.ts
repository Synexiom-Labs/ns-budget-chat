import { Redis } from '@upstash/redis'

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return redis
}

const CACHE_TTL_SECONDS = parseInt(process.env.CACHE_TTL_HOURS ?? '168') * 3600

function cacheKey(query: string): string {
  // Normalize: lowercase, trim whitespace, remove punctuation
  const normalized = query.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')
  return `nsbq:${normalized}`
}

export async function getCachedResponse(query: string): Promise<string | null> {
  const r = getRedis()
  if (!r) return null
  try {
    return await r.get<string>(cacheKey(query))
  } catch {
    return null
  }
}

export async function setCachedResponse(query: string, response: string): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    await r.set(cacheKey(query), response, { ex: CACHE_TTL_SECONDS })
  } catch {
    // Non-fatal — cache miss is acceptable
  }
}
