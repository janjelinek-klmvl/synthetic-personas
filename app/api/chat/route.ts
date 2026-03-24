import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getPersonaById } from '@/lib/personas'
import { buildSystemPrompt } from '@/lib/prompts'
import { TestContext } from '@/lib/types'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { personaId, ideaText, context, messages } = await req.json() as {
    personaId: string
    ideaText: string
    context: TestContext
    messages: { role: 'user' | 'assistant'; content: string }[]
  }

  const persona = getPersonaById(personaId)
  if (!persona) {
    return new Response(JSON.stringify({ error: 'Persona not found' }), { status: 400 })
  }

  // Build a chat-mode system prompt — same persona identity but conversational, no JSON
  const basePrompt = buildSystemPrompt(persona)
  const systemPrompt = basePrompt
    .replace(
      'RESPONSE FORMAT:\nReturn valid JSON only. No markdown fences. No preamble. No explanation outside the JSON.',
      `RESPONSE FORMAT:
Respond conversationally in character as ${persona.name}. You have just reviewed this idea and the user wants to ask you follow-up questions. Keep responses focused and authentic to your persona — 2–4 sentences unless a longer answer is genuinely warranted. Do not use JSON. Do not break character.`
    ) + `\n\nIDEA YOU REVIEWED:\n${ideaText}`

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    temperature: 0.8,
    system: systemPrompt,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
