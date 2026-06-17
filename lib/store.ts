// Per-company storage for propositions + runs, persisted in Supabase.
// All reads/writes are scoped to a single company via supabaseAdmin (we trust
// the calling route to have resolved the company via getCurrentCompany()).
//
// Replaces the earlier filesystem JSON store under `./data/`.

import { randomUUID } from 'crypto'
import { supabaseAdmin } from './supabase-server'
import type { IdeaBrief, IdeaType } from './types'
import type { RunResultPayload } from './types-as'

// ── Propositions ─────────────────────────────────────────────

export interface PropositionRecord {
  id: string
  idea: string
  idea_type: IdeaType
  brief: IdeaBrief
  file_content?: string
  created_at: string
}

interface PropositionRow {
  id: string
  company_id: string
  idea: string
  idea_type: string
  brief: IdeaBrief
  file_content: string | null
  created_at: string
}

function propRowToRecord(r: PropositionRow): PropositionRecord {
  return {
    id: r.id,
    idea: r.idea,
    idea_type: r.idea_type as IdeaType,
    brief: r.brief ?? {},
    file_content: r.file_content ?? undefined,
    created_at: r.created_at,
  }
}

export async function saveProposition(
  ctx: { companyId: string; userId: string },
  input: Omit<PropositionRecord, 'id' | 'created_at'>,
): Promise<PropositionRecord> {
  const id = randomUUID()
  const { data, error } = await supabaseAdmin
    .from('sp_propositions')
    .insert({
      id,
      company_id: ctx.companyId,
      created_by: ctx.userId,
      idea: input.idea,
      idea_type: input.idea_type,
      brief: input.brief,
      file_content: input.file_content ?? null,
    })
    .select('id, company_id, idea, idea_type, brief, file_content, created_at')
    .single<PropositionRow>()
  if (error || !data) throw new Error(`saveProposition: ${error?.message ?? 'no row'}`)
  return propRowToRecord(data)
}

export async function loadProposition(
  ctx: { companyId: string },
  id: string,
): Promise<PropositionRecord | null> {
  const { data } = await supabaseAdmin
    .from('sp_propositions')
    .select('id, company_id, idea, idea_type, brief, file_content, created_at')
    .eq('id', id)
    .eq('company_id', ctx.companyId)
    .maybeSingle<PropositionRow>()
  return data ? propRowToRecord(data) : null
}

// ── Runs ─────────────────────────────────────────────────────

export type SpRunStatus = 'running' | 'succeeded' | 'failed' | 'partial'

export interface PerAudienceState {
  as_run_id: string
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  progress_step: string | null
  result?: RunResultPayload | null
  error?: { code: string | null; message: string | null } | null
  latency_ms?: number | null
}

export interface RunRecord {
  run_id: string
  proposition_id: string
  proposition_snapshot: PropositionRecord
  audience_ids: string[]
  per_audience: Record<string, PerAudienceState>
  overall_status: SpRunStatus
  created_at: string
  updated_at: string
}

interface RunRow {
  id: string
  company_id: string
  proposition_id: string | null
  proposition: PropositionRecord
  audience_ids: string[]
  per_audience: Record<string, PerAudienceState>
  overall_status: SpRunStatus
  created_at: string
  updated_at: string
}

function runRowToRecord(r: RunRow): RunRecord {
  return {
    run_id: r.id,
    proposition_id: r.proposition_id ?? r.proposition.id,
    proposition_snapshot: r.proposition,
    audience_ids: r.audience_ids,
    per_audience: r.per_audience ?? {},
    overall_status: r.overall_status,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

export async function saveRun(
  ctx: { companyId: string; userId: string },
  record: RunRecord,
): Promise<void> {
  const row = {
    id: record.run_id,
    company_id: ctx.companyId,
    created_by: ctx.userId,
    proposition_id: record.proposition_id,
    proposition: record.proposition_snapshot,
    audience_ids: record.audience_ids,
    per_audience: record.per_audience,
    overall_status: record.overall_status,
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabaseAdmin.from('sp_runs').upsert(row, { onConflict: 'id' })
  if (error) throw new Error(`saveRun: ${error.message}`)
}

export async function loadRun(
  ctx: { companyId: string },
  id: string,
): Promise<RunRecord | null> {
  const { data } = await supabaseAdmin
    .from('sp_runs')
    .select('id, company_id, proposition_id, proposition, audience_ids, per_audience, overall_status, created_at, updated_at')
    .eq('id', id)
    .eq('company_id', ctx.companyId)
    .maybeSingle<RunRow>()
  return data ? runRowToRecord(data) : null
}

export async function updateRun(
  ctx: { companyId: string; userId: string },
  id: string,
  patch: (current: RunRecord) => RunRecord,
): Promise<RunRecord | null> {
  const current = await loadRun(ctx, id)
  if (!current) return null
  const next = patch(current)
  next.updated_at = new Date().toISOString()
  await saveRun(ctx, next)
  return next
}

export async function listRuns(ctx: { companyId: string }): Promise<RunRecord[]> {
  const { data } = await supabaseAdmin
    .from('sp_runs')
    .select('id, company_id, proposition_id, proposition, audience_ids, per_audience, overall_status, created_at, updated_at')
    .eq('company_id', ctx.companyId)
    .order('created_at', { ascending: false })
  return (data ?? []).map((r: RunRow) => runRowToRecord(r))
}

export async function deleteRun(
  ctx: { companyId: string },
  id: string,
): Promise<boolean> {
  const { error, count } = await supabaseAdmin
    .from('sp_runs')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('company_id', ctx.companyId)
  if (error) throw new Error(`deleteRun: ${error.message}`)
  return (count ?? 0) > 0
}

export function newRunId(): string {
  return randomUUID()
}
