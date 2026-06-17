// Stimulus templates v2 — three idea types, each with per-type field schema.
// Single source of truth for: field keys, labels, descriptions, value kind
// (string vs string-array), and the rendering function that turns a filled
// template into the natural-language prose AS receives as the idea text.

export type IdeaType = 'insight' | 'proposition' | 'campaign'

export type FieldKind = 'string' | 'list'

export interface FieldDef {
  key: string
  label: string
  description: string
  kind: FieldKind
}

// ── Insight template (4 fields) ──────────────────────────────────────
export const INSIGHT_FIELDS: FieldDef[] = [
  {
    key: 'situation',
    label: 'Situation',
    description: 'When or where the insight appears.',
    kind: 'string',
  },
  {
    key: 'tension',
    label: 'Tension',
    description: 'The conflict, frustration, unmet need, or hidden desire.',
    kind: 'string',
  },
  {
    key: 'insight_statement',
    label: 'Insight statement',
    description: 'The distilled human truth.',
    kind: 'string',
  },
  {
    key: 'opportunity',
    label: 'Opportunity',
    description: 'What this insight could unlock for a product, brand, service, or communication.',
    kind: 'string',
  },
]

// ── Product proposition template (15 fields, 2 lists) ────────────────
export const PROPOSITION_FIELDS: FieldDef[] = [
  {
    key: 'product_idea',
    label: 'Product idea',
    description: 'What the product, service, feature, or solution is.',
    kind: 'string',
  },
  {
    key: 'category',
    label: 'Category',
    description: 'The market or competitive space the idea belongs to.',
    kind: 'string',
  },
  {
    key: 'use_occasion',
    label: 'Use occasion',
    description: 'When, where, or why people would use it.',
    kind: 'string',
  },
  {
    key: 'consumer_problem',
    label: 'Consumer problem',
    description: 'The need, frustration, pain point, or job the idea addresses.',
    kind: 'string',
  },
  {
    key: 'underlying_insight',
    label: 'Underlying insight',
    description: 'The deeper human truth behind the problem.',
    kind: 'string',
  },
  {
    key: 'existing_alternatives',
    label: 'Existing alternatives',
    description: 'What people currently use, buy, or do instead.',
    kind: 'string',
  },
  {
    key: 'core_proposition',
    label: 'Core proposition',
    description: 'The central product promise in one clear sentence.',
    kind: 'string',
  },
  {
    key: 'functional_benefit',
    label: 'Functional benefit',
    description: 'The practical outcome the product delivers.',
    kind: 'string',
  },
  {
    key: 'emotional_benefit',
    label: 'Emotional benefit',
    description: 'How the product makes people feel.',
    kind: 'string',
  },
  {
    key: 'key_features',
    label: 'Key features',
    description: 'Attributes, mechanisms, ingredients, design choices, or service elements that deliver the benefit.',
    kind: 'list',
  },
  {
    key: 'reason_to_believe',
    label: 'Reason to believe',
    description: 'Why people should believe the product can deliver the promise.',
    kind: 'string',
  },
  {
    key: 'differentiation',
    label: 'Differentiation',
    description: 'What makes the idea meaningfully different from alternatives.',
    kind: 'string',
  },
  {
    key: 'price_value_position',
    label: 'Price / value position',
    description: 'How the value should be understood (premium, affordable, accessible, good value, luxury, everyday).',
    kind: 'string',
  },
  {
    key: 'barriers',
    label: 'Barriers',
    description: 'What might stop people from wanting, believing, or buying the idea.',
    kind: 'list',
  },
  {
    key: 'desired_action',
    label: 'Desired action',
    description: 'The behaviour the proposition should drive (try, buy, switch, subscribe, recommend, pay more).',
    kind: 'string',
  },
]

// ── Campaign idea template (7 fields, 1 list) ────────────────────────
export const CAMPAIGN_FIELDS: FieldDef[] = [
  {
    key: 'brand_or_product',
    label: 'Brand or product',
    description: 'What the campaign promotes.',
    kind: 'string',
  },
  {
    key: 'insight',
    label: 'Insight',
    description: 'The human truth or tension the campaign is built on.',
    kind: 'string',
  },
  {
    key: 'campaign_idea',
    label: 'Campaign idea',
    description: 'The creative platform or organising thought.',
    kind: 'string',
  },
  {
    key: 'main_message',
    label: 'Main message',
    description: 'The one thing people should understand or remember.',
    kind: 'string',
  },
  {
    key: 'channels',
    label: 'Channels',
    description: 'Where the campaign would appear (social, OOH, TV, digital, in-store, influencer, packaging, landing page).',
    kind: 'list',
  },
  {
    key: 'execution',
    label: 'Execution',
    description: 'How the idea comes to life creatively.',
    kind: 'string',
  },
  {
    key: 'call_to_action',
    label: 'Call to action',
    description: 'What the audience is asked to do next.',
    kind: 'string',
  },
]

export function fieldsFor(type: IdeaType): FieldDef[] {
  return type === 'insight'
    ? INSIGHT_FIELDS
    : type === 'campaign'
      ? CAMPAIGN_FIELDS
      : PROPOSITION_FIELDS
}

export function typeLabel(type: IdeaType): string {
  return type === 'insight' ? 'Insight'
       : type === 'campaign' ? 'Campaign idea'
       : 'Product proposition'
}

/** Per-type stimulus value — strings, or string-array for `kind: 'list'` fields. */
export type StimulusFields = Record<string, string | string[] | null>

// ── Renderer ──────────────────────────────────────────────────────────

function asString(v: string | string[] | null | undefined): string | null {
  if (v == null) return null
  if (Array.isArray(v)) {
    const cleaned = v.map((x) => String(x).trim()).filter(Boolean)
    return cleaned.length ? cleaned.join(', ') : null
  }
  const s = String(v).trim()
  return s.length ? s : null
}

function strip(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

/**
 * Builds the natural-language prose AS receives as the idea text. Empty fields
 * are skipped gracefully so partial briefs still produce a coherent stimulus.
 */
export function renderStimulus(
  type: IdeaType,
  ideaText: string,
  fields: StimulusFields,
): string {
  if (type === 'insight') return renderInsight(ideaText, fields)
  if (type === 'campaign') return renderCampaign(ideaText, fields)
  return renderProposition(ideaText, fields)
}

function renderInsight(ideaText: string, f: StimulusFields): string {
  const situation = asString(f.situation)
  const tension = asString(f.tension)
  const insight = asString(f.insight_statement)
  const opportunity = asString(f.opportunity)

  const parts: string[] = []
  if (situation && tension) {
    parts.push(`When ${situation}, people face a tension: ${tension}.`)
  } else if (tension) {
    parts.push(`The tension: ${tension}.`)
  } else if (situation) {
    parts.push(`Context: ${situation}.`)
  }
  if (insight) parts.push(`This reveals that ${insight}.`)
  if (opportunity) parts.push(`The opportunity is to ${opportunity}.`)
  const composed = parts.join(' ').trim()
  return composed || ideaText
}

function renderCampaign(ideaText: string, f: StimulusFields): string {
  const brand = asString(f.brand_or_product)
  const insight = asString(f.insight)
  const idea = asString(f.campaign_idea)
  const message = asString(f.main_message)
  const channels = asString(f.channels)
  const execution = asString(f.execution)
  const cta = asString(f.call_to_action)

  const parts: string[] = []
  if (brand) parts.push(`This campaign promotes ${brand}.`)
  if (insight) parts.push(`It is based on the insight that ${insight}.`)
  if (idea) parts.push(`The campaign idea is ${idea}.`)
  if (message) parts.push(`The main message is ${message}.`)
  if (channels) parts.push(`It would run across ${channels}.`)
  if (execution) parts.push(`The execution would show ${execution}.`)
  if (cta) parts.push(`The audience is asked to ${cta}.`)
  const composed = parts.join(' ').trim()
  return composed || ideaText
}

function renderProposition(ideaText: string, f: StimulusFields): string {
  const idea = asString(f.product_idea)
  const category = asString(f.category)
  const occasion = asString(f.use_occasion)
  const problem = asString(f.consumer_problem)
  const insight = asString(f.underlying_insight)
  const alternatives = asString(f.existing_alternatives)
  const proposition = asString(f.core_proposition)
  const fnBenefit = asString(f.functional_benefit)
  const emBenefit = asString(f.emotional_benefit)
  const features = asString(f.key_features)
  const rtb = asString(f.reason_to_believe)
  const diff = asString(f.differentiation)
  const price = asString(f.price_value_position)
  const barriers = asString(f.barriers)
  const action = asString(f.desired_action)

  const paragraphs: string[] = []

  // Identity paragraph: what it is + category + use occasion.
  const idParts: string[] = []
  if (idea && category) idParts.push(`${idea} — a ${category} idea.`)
  else if (idea) idParts.push(`${idea}.`)
  else if (category) idParts.push(`A ${category} idea.`)
  if (occasion) idParts.push(`People use it ${occasion}.`)
  if (idParts.length) paragraphs.push(strip(idParts.join(' ')))

  // Problem / insight / alternatives paragraph.
  const probParts: string[] = []
  if (problem) probParts.push(`It addresses: ${problem}.`)
  if (insight) probParts.push(`The deeper truth: ${insight}.`)
  if (alternatives) probParts.push(`Today, people ${alternatives}.`)
  if (probParts.length) paragraphs.push(strip(probParts.join(' ')))

  // Proposition + benefits paragraph.
  const propParts: string[] = []
  if (proposition) propParts.push(`Core proposition: "${proposition.replace(/^["']|["']$/g, '')}".`)
  if (fnBenefit) propParts.push(`Functional benefit: ${fnBenefit}.`)
  if (emBenefit) propParts.push(`Emotional benefit: ${emBenefit}.`)
  if (propParts.length) paragraphs.push(strip(propParts.join(' ')))

  // Features / RTB / differentiation paragraph.
  const featParts: string[] = []
  if (features) featParts.push(`Key features: ${features}.`)
  if (rtb) featParts.push(`Reason to believe: ${rtb}.`)
  if (diff) featParts.push(`What makes it different: ${diff}.`)
  if (featParts.length) paragraphs.push(strip(featParts.join(' ')))

  // Price / barriers / desired action paragraph.
  const tailParts: string[] = []
  if (price) tailParts.push(`Price / value position: ${price}.`)
  if (barriers) tailParts.push(`Barriers to adoption: ${barriers}.`)
  if (action) tailParts.push(`Desired action: ${action}.`)
  if (tailParts.length) paragraphs.push(strip(tailParts.join(' ')))

  const composed = paragraphs.join('\n\n').trim()
  return composed || ideaText
}
