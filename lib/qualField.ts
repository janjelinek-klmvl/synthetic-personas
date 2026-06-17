// Interprets arbitrary qual-module item objects into the semantic slots the
// ThemeCard / DetailDrawer render. Audience Studio modules each declare their
// own `outputFormat: string[]`, but field names converge on a small set of
// idioms — we map known aliases to a slot and let the renderer stay generic.

export type Slot =
  | 'title'
  | 'severity'
  | 'body'
  | 'quote'
  | 'affected'
  | 'evidence'
  | 'mitigation'

const ALIASES: Record<Slot, string[]> = {
  title:      ['theme_name', 'title', 'name', 'headline'],
  severity:   ['strategic_severity', 'severity', 'priority', 'importance'],
  body:       ['explanation', 'description', 'detail', 'summary'],
  quote:      ['representative_quote', 'quote', 'verbatim'],
  affected:   ['affected_audience_slices', 'affected', 'who_affected', 'audience_slices'],
  evidence:   ['evidence_pointer', 'evidence', 'sources', 'supporting_evidence'],
  mitigation: ['mitigation_hypothesis', 'mitigation', 'recommendation', 'what_to_do'],
}

function toText(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'string') return v.trim() || null
  if (Array.isArray(v)) {
    const parts = v.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).filter(Boolean)
    return parts.length ? parts.join(', ') : null
  }
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return null
}

export function pickField(item: Record<string, unknown>, slot: Slot): string | null {
  for (const key of ALIASES[slot]) {
    if (key in item) {
      const text = toText(item[key])
      if (text) return text
    }
  }
  return null
}

export function usedKeys(item: Record<string, unknown>, slots: Slot[]): Set<string> {
  const used = new Set<string>()
  for (const slot of slots) {
    for (const key of ALIASES[slot]) {
      if (key in item && toText(item[key])) {
        used.add(key)
        break
      }
    }
  }
  return used
}

export function remainingFields(
  item: Record<string, unknown>,
  usedSlots: Slot[],
): Array<[string, string]> {
  const used = usedKeys(item, usedSlots)
  const out: Array<[string, string]> = []
  for (const [k, v] of Object.entries(item)) {
    if (used.has(k)) continue
    const text = toText(v)
    if (text) out.push([k, text])
  }
  return out
}

export type SeverityTone = 'high' | 'med' | 'low' | 'neutral'

export function severityTone(s: string | null): SeverityTone {
  if (!s) return 'neutral'
  const v = s.toLowerCase()
  if (/(critical|severe|high|🔴)/.test(v)) return 'high'
  if (/(medium|moderate|🟠|🟡)/.test(v)) return 'med'
  if (/(low|minor|🟢)/.test(v)) return 'low'
  return 'neutral'
}

export function severityLabel(s: string | null): string | null {
  if (!s) return null
  // AS qual modules return severity as either a single label ("High") OR a
  // long descriptive paragraph that LEADS with the label
  // ("High as a design anchor for premium NoLo proposition…").
  // Try in order:
  // 1) Recognised band keyword at the start ("Low" / "Low-Medium" / "Medium" /
  //    "Medium-High" / "High" / "Critical") — case-insensitive.
  // 2) Anything before a dash/colon/period if the leading phrase is short (≤ 16 chars).
  // 3) Else null — we don't want to render a paragraph as a pill.
  const trimmed = s.trim()
  const bandMatch = trimmed.match(
    /^(critical|high(?:-medium)?|medium(?:-high|-low)?|low(?:-medium)?)\b/i,
  )
  if (bandMatch) {
    // Normalise capitalisation (HIGH / High → "High").
    return bandMatch[1]
      .split('-')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join('-')
  }
  const sepMatch = trimmed.match(/^[^—\-:|.\n]+/)
  if (sepMatch && sepMatch[0].length <= 16) return sepMatch[0].trim()
  return null
}

export function humanize(key: string): string {
  // Split camelCase ("craftFatigue" → "craft Fatigue") then snake_case →
  // spaces, then title-case word boundaries.
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}
