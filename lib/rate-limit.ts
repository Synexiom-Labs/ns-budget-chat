import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let ratelimiter: Ratelimit | null = null

function getRatelimiter(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  if (!ratelimiter) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    const rpm = parseInt(process.env.RATE_LIMIT_RPM ?? '20')
    ratelimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(rpm, '60 s'),
      analytics: false,
      prefix: 'nsbc_rl',
    })
  }
  return ratelimiter
}

export async function checkRateLimit(
  ip: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const limiter = getRatelimiter()
  if (!limiter) {
    // No Redis configured — allow all requests
    return { success: true, remaining: 999, reset: 0 }
  }
  const result = await limiter.limit(ip)
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  }
}
