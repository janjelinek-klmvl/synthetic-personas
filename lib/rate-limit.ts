import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Rate limiting is opt-in: if Upstash env vars are absent (local dev, CI builds)
// the limiter is a no-op so nothing breaks. In production, set
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable it.
const hasRedis = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

// Keep retries low: the default (5 with exponential backoff) adds ~4 s to
// every request when Redis is unreachable. One retry covers a transient blip.
const redis = hasRedis ? Redis.fromEnv({ retry: { retries: 1, backoff: () => 200 } }) : null

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
      // Upstash resolves to success (fail-open) if Redis hasn't answered by then.
      timeout: 2000,
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
  try {
    const { success, reset } = await limiter.limit(identifier)
    const retryAfterSeconds = Math.max(0, Math.ceil((reset - Date.now()) / 1000))
    return { ok: success, retryAfterSeconds }
  } catch (err) {
    // Fail OPEN. The limiter is a guard rail, not a dependency: if Redis is
    // unreachable (deleted database, DNS failure, network blip, bad token)
    // the request must still go through. Previously this threw and every
    // guarded route returned 500 in production.
    logRedisFailure(err)
    return { ok: true, retryAfterSeconds: 0 }
  }
}

// Log the first failure at full detail, then throttle to one line per minute
// so a dead Redis doesn't flood the function logs on every request.
let lastRedisWarnAt = 0
function logRedisFailure(err: unknown) {
  const now = Date.now()
  if (now - lastRedisWarnAt < 60_000) return
  lastRedisWarnAt = now
  const cause = (err as { cause?: { code?: string; hostname?: string } })?.cause
  const summary = cause?.code
    ? `${cause.code}${cause.hostname ? ` (${cause.hostname})` : ''}`
    : err instanceof Error ? err.message : String(err)
  console.warn(
    `rate-limit: Upstash unreachable, allowing request (fail-open). ${summary}. ` +
      'Check UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN or remove them to disable rate limiting.',
  )
}
