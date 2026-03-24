import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getPersonaById } from '@/lib/personas'
import { buildSystemPrompt, buildUserPrompt } from '@/lib/prompts'
import { TestRequest, TestReport, CombinedTestReport } from '@/lib/types'

const client = new Anthropic()

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  personaId: string,
  testType: 'qualitative' | 'quantitative'
): Promise<TestReport> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    temperature: 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const rawContent = message.content[0]
  if (rawContent.type !== 'text') {
    throw new Error('Unexpected response format from AI.')
  }

  const cleaned = rawContent.text
    .replace(/^```(?:json)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim()

  const report = JSON.parse(cleaned) as TestReport
  report.personaId = personaId
  return report
}

export async function POST(req: NextRequest) {
  let body: TestRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { ideaText, fileContent, personaIds, context } = body

  // Validation
  if (!ideaText || ideaText.trim().length < 20) {
    return NextResponse.json(
      { error: 'Idea description must be at least 20 characters.' },
      { status: 400 }
    )
  }

  if (!Array.isArray(personaIds) || personaIds.length === 0) {
    return NextResponse.json({ error: 'At least one persona is required.' }, { status: 400 })
  }

  if (!context?.ideaType) {
    return NextResponse.json({ error: 'Idea type is required.' }, { status: 400 })
  }

  // Resolve all personas upfront
  const resolvedPersonas = personaIds.map(id => getPersonaById(id)).filter(Boolean) as NonNullable<ReturnType<typeof getPersonaById>>[]
  if (resolvedPersonas.length === 0) {
    return NextResponse.json({ error: 'No valid personas found.' }, { status: 400 })
  }

  try {
    // Process personas sequentially to stay within API rate limits.
    // Qual + quant for each persona still run in parallel (2 concurrent calls max).
    const reports: CombinedTestReport[] = []
    for (const persona of resolvedPersonas) {
      const systemPrompt = buildSystemPrompt(persona)
      const [qualReport, quantReport] = await Promise.all([
        callClaude(systemPrompt, buildUserPrompt(ideaText, fileContent, context, 'qualitative'), persona.id, 'qualitative'),
        callClaude(systemPrompt, buildUserPrompt(ideaText, fileContent, context, 'quantitative'), persona.id, 'quantitative'),
      ])
      reports.push({ personaId: persona.id, ideaType: context.ideaType, qualReport, quantReport })
    }

    return NextResponse.json({ reports })
  } catch (err: unknown) {
    console.error('Anthropic API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `AI service error: ${message}` }, { status: 500 })
  }
}
