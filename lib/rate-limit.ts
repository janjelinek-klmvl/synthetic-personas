import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Rate limiting is opt-in: if Upstash env vars are absent (local dev, CI builds)
// the limiter is a no-op so nothing breaks. In production, set
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable it.
const hasRedis = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

const redis = hasRedis ? Redis.fromEnv() : null

const limiters = new Map<string, Ratelimit>()

function getLimiter(name: string, limit: number, windowSeconds: number): Ratelimit | null {
  if (!redis) return null
  const cacheKey = `${name}:${limit}:${windowSeconds}`
  let limiter = limiters.get(cacheKey)
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: `rl:${name}`,
      analytics: false,
    })
    limiters.set(cacheKey, limiter)
  }
  return limiter
}

export interface RateLimitResult {
  ok: boolean
  retryAfterSeconds: number
}

// identifier should be a stable per-caller key (e.g. company id or user id).
export async function checkRateLimit(
  name: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const limiter = getLimiter(name, limit, windowSeconds)
  if (!limiter) return { ok: true, retryAfterSeconds: 0 }
  const { success, reset } = await limiter.limit(identifier)
  const retryAfterSeconds = Math.max(0, Math.ceil((reset - Date.now()) / 1000))
  return { ok: success, retryAfterSeconds }
}
