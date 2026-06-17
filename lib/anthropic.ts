// Anthropic SDK client factory + env-loading workaround.
//
// Some shells (Claude Desktop / Claude Code) export ANTHROPIC_API_KEY as an
// empty string. Next.js's .env.local loader doesn't override existing process
// env vars, so the empty value wins. Fall back to reading the key straight
// out of .env.local when the env var is empty.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'

export function readAnthropicKey(): string | undefined {
  const fromEnv = process.env.ANTHROPIC_API_KEY
  if (fromEnv && fromEnv.length > 0) return fromEnv
  try {
    const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
    const match = raw.match(/^ANTHROPIC_API_KEY=(.+)$/m)
    return match?.[1].trim()
  } catch {
    return undefined
  }
}

let cached: Anthropic | null = null
export function anthropic(): Anthropic {
  if (cached) return cached
  cached = new Anthropic({ apiKey: readAnthropicKey() })
  return cached
}
