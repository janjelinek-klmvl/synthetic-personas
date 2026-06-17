// Type definitions mirroring Audience Studio's API response shapes.
// Kept narrow on purpose — only the fields SP actually reads.

export interface BehavioralAxis {
  key: string
  label: string
  description: string
  minLabel: string
  maxLabel: string
}

export interface SituationalState {
  key: string
  label: string
  description: string
  kind?: 'lifeStage' | 'momentary'
}

export interface AudienceSummary {
  id: string
  name: string
  short_definition: string | null
  core_tension: string | null
  why_it_matters: string | null
  description: string | null
  persona_count: number
  behavioral_axes: BehavioralAxis[]
  situational_states: SituationalState[]
}

export interface ScoringScale {
  min: number
  max: number
  high_means?: string
  low_means?: string
}

export interface ScoringBand {
  min: number
  max: number
  label: string
  meaning: string
}

export type StimulusType = 'insight' | 'proposition' | 'campaign'

export interface QuantMetricMeta {
  id: string
  name: string
  definition: string
  scoring_scale: ScoringScale | null
  scoring_bands: ScoringBand[]
  display: string | null
  applicable_stimulus_types?: StimulusType[]
}

export interface QualModuleMeta {
  id: string
  name: string
  definition: string
  output_format: string[]
  display: string | null
  applicable_stimulus_types?: StimulusType[]
}

export interface EstimateFormula {
  base: number
  per_quant_metric: number
  per_qual_module: number
  per_respondent: number
  per_idea_kchar: number
}

export interface PricingInfo {
  credit_unit_usd: number
  formula: EstimateFormula
}

export interface AudienceListResponse {
  audiences: AudienceSummary[]
  quant_metrics: QuantMetricMeta[]
  qual_modules: QualModuleMeta[]
  pricing?: PricingInfo
  balance?: number
}

export type RunStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export interface StartRunInput {
  audience_id: string
  idea: string
  idea_type?: string
  mode?: 'full-context' | 'rag'
  respondent_count?: number
  state_keys?: string[]
  persona_filter?: string[]
  quant_metric_ids?: string[]
  qual_module_ids?: string[]
}

// A verifiable research citation pointing at a real chunk by id (Phase C).
export interface ResearchCitation {
  chunk_id: string
  note?: string
}

// A research chunk surfaced as a citation "receipt".
export interface ReportChunk {
  id: string
  source_title: string
  topic: string
  content: string
  chunk_index: number
}

export interface AudienceQuantResult {
  metric_id: string
  score: number
  reasoning?: string
  // New runs: ResearchCitation[]. Legacy runs: string | string[] (model prose).
  research_evidence_cited?: ResearchCitation[] | string[] | string
  axis_logic?: string
  uncertainty?: string
}

// AS returns qual_outputs[moduleId] as a flat array of theme items (run.ts:276).
// Older / experimental shapes nest under `items` or carry `module_id`, so the
// renderer normalises via extractQualItems in ReportSection.tsx.
export type QualModuleOutput =
  | Array<Record<string, unknown>>
  | {
      module_id?: string
      items?: Array<Record<string, unknown>>
      [key: string]: unknown
    }

// Structured citation from a digest item back to the grounded data it
// compresses. Mirrors AS/lib/types.ts:EvidenceRef.
export type EvidenceRef =
  | { kind: 'metric'; id: string }
  | { kind: 'theme'; module_id: string; theme_index: number }
  | { kind: 'persona'; id: string }
  | { kind: 'chunk'; id: string }

export interface Takeaway {
  title: string
  body: string
  refs: EvidenceRef[]
}

export interface Move {
  title: string
  body: string
  quote?: string
  refs: EvidenceRef[]
}

// Customer-facing verdict copy. Generated AS-side by lib/verdict-synthesis.ts
// at the end of a run. Optional — pre-feature runs won't have it; SP falls
// back to an extractive (not fabricated) digest.
export interface VerdictCopy {
  kicker: string                       // 'Works' | 'Wobbles' | 'Fails'
  headline: string                     // ≤ 8 words punchy H1
  description: string                  // 1–2 sentence narrative
  overall_score: number                // 0–100 integer — canonical source of truth
  band: 'works' | 'wobbles' | 'fails'
  refs?: EvidenceRef[]                 // what drove the verdict
  takeaways?: Takeaway[]               // "three things to know"
  moves?: Move[]                       // "what we'd do next"
}

export interface MetricRunAggregate {
  /** Legacy debug headline (e.g. "Audience Quant prediction: Comprehension 52.0/100"). Do NOT render. */
  headline?: string
  /** Customer-facing verdict copy. Prefer this when present. */
  verdict_copy?: VerdictCopy
  per_metric?: Record<
    string,
    {
      mean?: number
      median?: number
      stddev?: number
      n?: number
      histogram?: number[]
    }
  >
  composites?: Record<string, { score: number; missing?: string[] }>
  risk_flags?: Array<{ metric_id?: string; message: string; severity?: string }>
}

export interface SyntheticRespondent {
  respondent_id: string
  persona_id: string
  /** Persona archetype display name (e.g. "Markéta"). Populated AS-side on new runs. */
  persona_name?: string
  /** Persona archetype sampling weight (e.g. 1.6). Populated AS-side on new runs. */
  persona_weight?: number
  state_key?: string | null
  axisValues?: Record<string, number>
}

export interface QueryUsage {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
}

export interface RunResultPayload {
  audience_id: string
  tested_at: string
  mode: string
  respondent_count: number
  quant_metric_count: number
  qual_module_count: number
  selected_quant_metric_ids?: string[]
  selected_qual_module_ids?: string[]
  failures: {
    evidence: number
    audience_quant: string[]
    qual_synthesis: string[]
  }
  aggregate: MetricRunAggregate
  respondents: SyntheticRespondent[]
  audience_quant_results: Record<string, AudienceQuantResult>
  qual_outputs: Record<string, QualModuleOutput>
  /** Citation receipts — actual research passages (Phase C). Absent on legacy runs. */
  retrieved_chunks?: ReportChunk[]
}

export interface RunStatusResponse {
  run_id: string
  status: RunStatus
  progress_step: string | null
  audience_id: string
  idea: string
  idea_type: string | null
  mode: string
  created_at: string
  started_at: string | null
  completed_at: string | null
  latency_ms: number | null
  usage: QueryUsage | null
  result: RunResultPayload | null
  error_code: string | null
  error_message: string | null
}

export interface StartRunResponse {
  run_id: string
  status: RunStatus
  poll_url: string
}

// ── Chat with the report ──────────────────────────────────────────────

export type ChatMode = 'report' | 'audience'

export interface ChatTurnAS {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatAudienceEvidence {
  respondent_id: string
  persona_name: string
  state_label: string | null
  answer: string
}

export interface ChatRunInput {
  mode: ChatMode
  question: string
  history: ChatTurnAS[]
  respondent_count?: number
}

export interface ChatRunResponse {
  chat_query_id: string | null
  mode: ChatMode
  content: string
  respondent_evidence: ChatAudienceEvidence[] | null
  usage: QueryUsage
  credits_charged: number
  balance: number
}
