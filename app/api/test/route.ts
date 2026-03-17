import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getPersonaById } from '@/lib/personas'
import { getTestTypeById } from '@/lib/testTypes'
import { buildSystemPrompt, buildUserPrompt } from '@/lib/prompts'
import { TestRequest } from '@/lib/types'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  let body: TestRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { ideaText, fileContent, personaId, testType: testTypeId } = body

  // Validation
  if (!ideaText || ideaText.trim().length < 20) {
    return NextResponse.json(
      { error: 'Idea description must be at least 20 characters.' },
      { status: 400 }
    )
  }

  const persona = getPersonaById(personaId)
  if (!persona) {
    return NextResponse.json({ error: 'Invalid persona selected.' }, { status: 400 })
  }

  const testType = getTestTypeById(testTypeId)
  if (!testType) {
    return NextResponse.json({ error: 'Invalid test type selected.' }, { status: 400 })
  }

  const systemPrompt = buildSystemPrompt(persona)
  const userPrompt = buildUserPrompt(ideaText, fileContent, testTypeId)

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawContent = message.content[0]
    if (rawContent.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response format from AI.' }, { status: 500 })
    }

    let report
    try {
      // Strip any accidental markdown fences just in case
      const cleaned = rawContent.text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
      report = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      )
    }

    // Ensure personaId is set correctly
    report.personaId = personaId

    return NextResponse.json({ report })
  } catch (err: unknown) {
    console.error('Anthropic API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `AI service error: ${message}` }, { status: 500 })
  }
}
