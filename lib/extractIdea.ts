// Server-side idea extraction. The source can be already-extracted text
// (TXT/DOCX/MD) or a base64-encoded PDF / image (Claude reads it natively).

import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages'
import { anthropic } from './anthropic'
import { extractJsonObject } from './json'
import {
  fieldsFor,
  typeLabel,
  type FieldDef,
  type IdeaType,
  type StimulusFields,
} from './stimulus'
import type { ExtractIdeaRequest, ExtractOutcome, IdeaBrief } from './types'

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TEXT_CHARS = 200_000
const MAX_TOKENS = 3000

function schemaForType(type: IdeaType): string {
  const fields = fieldsFor(type)
  return fields
    .map((f) =>
      f.kind === 'list'
        ? `    "${f.key}": <array of strings, empty if unknown>`
        : `    "${f.key}": <string or null>`,
    )
    .join(',\n')
}

function describeFields(type: IdeaType): string {
  return fieldsFor(type)
    .map((f) => `  - "${f.key}" (${f.kind === 'list' ? 'array' : 'string'}): ${f.label}. ${f.description}`)
    .join('\n')
}

function buildInstructions(req: ExtractIdeaRequest): string {
  const followup = req.prior
    ? `\n\nPRIOR OUTCOME (you returned this earlier; the user has now resolved it):\n${JSON.stringify(req.prior)}`
    : ''

  const pick = req.pick
    ? `\n\nThe user picked candidate id "${req.pick}" — return single_idea for that one.`
    : ''

  const answers = req.clarifications && Object.keys(req.clarifications).length > 0
    ? `\n\nThe user answered your clarifying questions:\n${Object.entries(req.clarifications)
        .map(([qid, a]) => `- ${qid}: ${a}`)
        .join('\n')}\nNow return single_idea using these answers.`
    : ''

  return `You are reading a document a user has dropped into a product-research tool. Your job is to identify the SPECIFIC STIMULUS they want to test against an audience.

The tool supports three types of stimuli — pick the one that fits:

1. **Insight** — a human truth or tension. Fields:
${describeFields('insight')}

2. **Product proposition** — a new product, service, or feature concept. Fields:
${describeFields('proposition')}

3. **Campaign idea** — a creative campaign or marketing message. Fields:
${describeFields('campaign')}

DOCUMENT NAME: "${req.filename}"${followup}${pick}${answers}

Return strict JSON only. No markdown, no preamble. Exactly one of these four shapes:

1. SINGLE IDEA (the document contains one clear, testable stimulus):
{
  "kind": "single_idea",
  "idea_text": "<1–3 sentences distilling the stimulus to test>",
  "idea_type": "insight" | "proposition" | "campaign",
  "brief": {
    // Use the field set for the chosen idea_type:
    // For "insight":
${schemaForType('insight')}
    // For "proposition":
${schemaForType('proposition')}
    // For "campaign":
${schemaForType('campaign')}
  },
  "confidence": "high" | "medium" | "low",
  "source_hint": "<e.g. 'page 2 — section The Offer' or 'paragraph 3'>"
}

Notes:
- For "brief", include ONLY the keys that match the chosen idea_type. Do not mix.
- String fields → concise value if clear/inferable, else null.
- List fields → array of strings (empty if unknown).

2. MULTIPLE IDEAS (2–5 distinct testable ideas in the same document):
{
  "kind": "multiple_ideas",
  "candidates": [
    { "id": "1", "summary": "<≤200 chars>", "source_hint": "<where in doc>" }
  ]
}

Use only when the document genuinely contains separable stimuli — not when one idea has multiple features.

3. AMBIGUOUS (one fuzzy idea — you can guess but need clarification):
{
  "kind": "ambiguous",
  "partial_idea": "<your best 1-sentence guess>",
  "clarifying_questions": [
    { "id": "q1", "parameter": "<best-guess type & field>", "question": "<short question>", "type": "text" | "choice" | "list", "choices": ["..."] }
  ]
}

Max 3 questions, sharpest gaps first.

4. NO IDEA FOUND (truly nothing testable):
{
  "kind": "no_idea_found",
  "reason": "<short reason>"
}

Decide carefully. Most documents fit "single_idea". Use "multiple_ideas" only when the stimuli are clearly separate. Use "ambiguous" when you have a partial read but need a fact or two to lock it.`
}

function buildContent(req: ExtractIdeaRequest): ContentBlockParam[] {
  const blocks: ContentBlockParam[] = []
  const src = req.source

  if (src.kind === 'document') {
    blocks.push({
      type: 'document',
      source: { type: 'base64', media_type: src.media_type, data: src.data_b64 },
    })
  } else if (src.kind === 'image') {
    blocks.push({
      type: 'image',
      source: { type: 'base64', media_type: src.media_type, data: src.data_b64 },
    })
  }

  let instructions = buildInstructions(req)
  if (src.kind === 'text') {
    const text = src.text.length > MAX_TEXT_CHARS
      ? src.text.slice(0, MAX_TEXT_CHARS) + '\n\n[…document truncated at 200,000 characters…]'
      : src.text
    instructions += `\n\nDOCUMENT CONTENT:\n---\n${text}\n---`
  }
  blocks.push({ type: 'text', text: instructions })
  return blocks
}

function normalizeBriefForType(raw: unknown, type: IdeaType): StimulusFields {
  const fields = fieldsFor(type)
  const result: StimulusFields = {}
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  for (const f of fields) {
    const v = r[f.key]
    if (f.kind === 'list') {
      if (Array.isArray(v)) {
        result[f.key] = v
          .map((x) => (typeof x === 'string' ? x.trim() : ''))
          .filter((x) => x.length > 0)
      } else if (typeof v === 'string' && v.trim().length > 0) {
        result[f.key] = v.split(',').map((s) => s.trim()).filter(Boolean)
      } else {
        result[f.key] = []
      }
    } else {
      result[f.key] = typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
    }
  }
  return result
}

function normalize(outcome: ExtractOutcome): ExtractOutcome {
  if (outcome.kind === 'single_idea') {
    if (!outcome.idea_text || outcome.idea_text.trim().length === 0) {
      return { kind: 'no_idea_found', reason: 'Empty idea text returned' }
    }
    const type: IdeaType =
      outcome.idea_type === 'insight' || outcome.idea_type === 'campaign'
        ? outcome.idea_type
        : 'proposition'
    return {
      ...outcome,
      idea_type: type,
      brief: normalizeBriefForType((outcome as { brief?: unknown }).brief, type) as IdeaBrief,
    }
  }
  if (outcome.kind === 'multiple_ideas') {
    const candidates = (outcome.candidates ?? []).slice(0, 5).filter((c) => c?.id && c?.summary)
    if (candidates.length < 2) {
      return { kind: 'no_idea_found', reason: 'multiple_ideas with <2 valid candidates' }
    }
    return { kind: 'multiple_ideas', candidates }
  }
  if (outcome.kind === 'ambiguous') {
    const questions = (outcome.clarifying_questions ?? []).slice(0, 3).filter((q) => q?.question)
    if (questions.length === 0) {
      return { kind: 'no_idea_found', reason: 'ambiguous with no questions' }
    }
    return {
      kind: 'ambiguous',
      partial_idea: outcome.partial_idea ?? '',
      clarifying_questions: questions,
    }
  }
  if (outcome.kind === 'no_idea_found') {
    return outcome
  }
  return { kind: 'no_idea_found', reason: 'Unknown response shape' }
}

export async function extractIdea(req: ExtractIdeaRequest): Promise<ExtractOutcome & { detail?: string }> {
  const client = anthropic()
  const content = buildContent(req)

  let raw: string
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.2,
      messages: [{ role: 'user', content }],
    })
    const block = message.content[0]
    if (!block || block.type !== 'text') {
      return { kind: 'no_idea_found', reason: 'EMPTY_CLAUDE_RESPONSE' }
    }
    raw = block.text
  } catch (err) {
    console.error('extractIdea: Claude error', err)
    const detail = err instanceof Error ? err.message : String(err)
    return { kind: 'no_idea_found', reason: 'CLAUDE_ERROR', detail }
  }

  const jsonBlock = extractJsonObject(raw)
  if (!jsonBlock) {
    console.error('extractIdea: no JSON block in response:', raw.slice(0, 400))
    return { kind: 'no_idea_found', reason: 'PARSE_ERROR' }
  }

  try {
    const parsed = JSON.parse(jsonBlock) as ExtractOutcome
    return normalize(parsed)
  } catch (err) {
    console.error('extractIdea: JSON.parse failed', err, jsonBlock.slice(0, 400))
    return { kind: 'no_idea_found', reason: 'PARSE_ERROR' }
  }
}

void typeLabel // silence unused warning until we surface labels in extraction UI
