import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getPersonaById } from '@/lib/personas'
import { IdeaType, IdeaBrief, BriefQuestion, PROPOSITION_PARAMS, CAMPAIGN_PARAMS } from '@/lib/types'

const client = new Anthropic()

// ── Fallback when API fails ───────────────────────────

const FALLBACK_BRIEF: IdeaBrief = {}

const FALLBACK_QUESTIONS: BriefQuestion[] = [
  {
    id: 'fallback-1',
    parameter: 'coreBenefit',
    question: 'What is the core benefit for your target user?',
    type: 'text',
    hint: 'e.g. saves time, reduces cost, removes friction',
  },
  {
    id: 'fallback-2',
    parameter: 'revenueModel',
    question: 'What stage is this at?',
    type: 'choice',
    choices: ['Just an idea', 'MVP / prototype', 'Ready to launch'],
  },
]

// ── Parameter metadata ────────────────────────────────

const PARAM_LABELS: Record<string, string> = {
  // Proposition
  problem:         'User problem / unmet need',
  solution:        'Solution',
  offer:           'Offer (what exactly is being sold)',
  coreBenefit:     'Core benefit for the user',
  differentiator:  'Differentiator / reason to believe',
  contextOfUse:    'Context of use (when/where/how)',
  adoptionBarrier: 'Adoption barrier (main reason to hesitate)',
  revenueModel:    'Revenue model / pricing',
  // Campaign
  mainMessage:     'Main single-minded message',
  rtbs:            'RTBs (reasons to believe)',
  differentiation: 'Differentiation from competitors',
  emotionalImpact: 'Emotional impact / feeling it creates',
  insight:         'Insight it is based on',
  cta:             'CTA / pay-off',
}

function buildExtractionPrompt(
  ideaText: string,
  ideaType: IdeaType,
  personaName: string,
  personaTagline: string
): string {
  const params = ideaType === 'proposition'
    ? [...PROPOSITION_PARAMS]
    : [...CAMPAIGN_PARAMS]

  const briefType = ideaType === 'proposition' ? 'Product Proposition' : 'Marketing Campaign'

  const paramList = params
    .map(p => `  "${p}": "${PARAM_LABELS[p]}"`)
    .join(',\n')

  return `You are helping prepare a ${briefType} for evaluation by a persona: "${personaName}" (${personaTagline}).

THE IDEA:
"${ideaText}"

YOUR TASK:
1. Read the idea text carefully.
2. For each brief parameter below, extract a concise value (1–2 sentences max) if it is clearly stated or strongly inferable from the idea text. Return null if the parameter is missing or unclear.
3. For parameters you returned null, generate a targeted question to ask the user. Maximum 4 questions total — prioritise the most important gaps.
4. For questions with a natural small answer set (e.g. stage, pricing model, geography), use type "choice" with 3–4 options.
5. Keep question text concise (under 12 words ideally). Reference specific details from the idea if it makes the question sharper.

PARAMETERS:
{
${paramList}
}

Return strict JSON only. No markdown. No preamble.

{
  "brief": {
    ${params.map(p => `"${p}": <extracted string or null>`).join(',\n    ')}
  },
  "questions": [
    {
      "id": "q1",
      "parameter": "<parameter key>",
      "question": "<question text>",
      "type": "text",
      "hint": "<optional placeholder>"
    },
    {
      "id": "q2",
      "parameter": "<parameter key>",
      "question": "<question text>",
      "type": "choice",
      "choices": ["<option 1>", "<option 2>", "<option 3>"]
    }
  ]
}`
}

export async function POST(req: NextRequest) {
  let body: { ideaText: string; ideaType: IdeaType; personaId: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ brief: FALLBACK_BRIEF, questions: FALLBACK_QUESTIONS })
  }

  const { ideaText, ideaType, personaId } = body

  if (!ideaText || !ideaType || !personaId) {
    return NextResponse.json({ brief: FALLBACK_BRIEF, questions: FALLBACK_QUESTIONS })
  }

  const persona = getPersonaById(personaId)
  if (!persona) {
    return NextResponse.json({ brief: FALLBACK_BRIEF, questions: FALLBACK_QUESTIONS })
  }

  const prompt = buildExtractionPrompt(ideaText, ideaType, persona.name, persona.tagline)

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawContent = message.content[0]
    if (rawContent.type !== 'text') {
      return NextResponse.json({ brief: FALLBACK_BRIEF, questions: FALLBACK_QUESTIONS })
    }

    const cleaned = rawContent.text
      .replace(/^```(?:json)?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim()

    const parsed = JSON.parse(cleaned)

    const brief: IdeaBrief = parsed.brief ?? {}
    const questions: BriefQuestion[] = Array.isArray(parsed.questions) ? parsed.questions : []

    return NextResponse.json({ brief, questions })
  } catch (err) {
    console.error('Brief generation error:', err)
    return NextResponse.json({ brief: FALLBACK_BRIEF, questions: FALLBACK_QUESTIONS })
  }
}
