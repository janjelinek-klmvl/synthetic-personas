// SP-local types. Audience and result shapes live in `types-as.ts`.
// Per-type field schemas + the renderStimulus() helper live in `stimulus.ts`.

export type { IdeaType, StimulusFields, FieldDef, FieldKind } from './stimulus'
import type { IdeaType as IdeaTypeImport, StimulusFields as StimulusFieldsImport } from './stimulus'

/**
 * Back-compat alias for the brief shape. Now a per-type stimulus container
 * (strings + string-arrays for list fields).
 */
export type IdeaBrief = StimulusFieldsImport

export interface BriefQuestion {
  id: string
  parameter: string
  question: string
  // Design has 4 canonical types. `choice` is a back-compat alias for `single`.
  type: 'text' | 'list' | 'choice' | 'multi' | 'single'
  choices?: string[]
  hint?: string
}

export interface TestContext {
  ideaType: IdeaTypeImport
  brief?: IdeaBrief
}

export type BriefErrorCode =
  | 'NO_BODY'
  | 'MISSING_FIELDS'
  | 'EMPTY_CLAUDE_RESPONSE'
  | 'CLAUDE_ERROR'
  | 'PARSE_ERROR'

export interface BriefResponse {
  brief: IdeaBrief
  questions: BriefQuestion[]
  generated: boolean
  error?: BriefErrorCode
}

// ── File-drop idea extraction ─────────────────────────────────────────

export interface ExtractCandidate {
  id: string
  summary: string
  source_hint: string
}

export type ExtractOutcome =
  | {
      kind: 'single_idea'
      idea_text: string
      idea_type: IdeaTypeImport
      brief: IdeaBrief
      confidence: 'high' | 'medium' | 'low'
      source_hint: string
    }
  | {
      kind: 'multiple_ideas'
      candidates: ExtractCandidate[]
    }
  | {
      kind: 'ambiguous'
      partial_idea: string
      clarifying_questions: BriefQuestion[]
    }
  | {
      kind: 'no_idea_found'
      reason: string
    }

export type ExtractIdeaSource =
  | { kind: 'text'; text: string }
  | { kind: 'document'; data_b64: string; media_type: 'application/pdf' }
  | {
      kind: 'image'
      data_b64: string
      media_type: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'
    }

export interface ExtractIdeaRequest {
  filename: string
  source: ExtractIdeaSource
  /** When previous outcome was multiple_ideas, the candidate id picked. */
  pick?: string
  /** When previous outcome was ambiguous, the user's answers keyed by question id. */
  clarifications?: Record<string, string>
  /** Previous outcome (echoed back so the model has context for resolution). */
  prior?: ExtractOutcome
}
