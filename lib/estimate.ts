// Client-safe cost estimator. Mirrors AS's lib/pricing.ts:estimateCredits but
// takes the formula coefficients as input so AS remains the source of truth.

import type { EstimateFormula } from './types-as'

export interface EstimateBreakdown {
  base: number
  quant: number
  qual: number
  respondents: number
  idea: number
}

export interface EstimateResult {
  total: number
  breakdown: EstimateBreakdown
}

// Per the design (Credits card on /credits), "≈ N reports left" is computed
// from the full-spec run: every metric + every module + 6 respondents +
// 1 k of idea text. Gives a sense of the cheapest realistic future run.
export function reportsLeftAtAverageRun(
  balance: number,
  formula: EstimateFormula,
  quantCount: number,
  qualCount: number,
): number {
  const respBillable = qualCount > 0 ? 6 : 0
  const fullSpec =
    formula.base +
    formula.per_quant_metric * quantCount +
    formula.per_qual_module * qualCount +
    formula.per_respondent * respBillable +
    formula.per_idea_kchar * 1
  if (fullSpec <= 0) return 0
  return Math.floor(balance / fullSpec)
}

export function estimateCredits(
  formula: EstimateFormula,
  input: {
    quant_metric_count: number
    qual_module_count: number
    respondent_count: number
    idea_char_length: number
  },
): EstimateResult {
  const qualCount = Math.max(0, input.qual_module_count)
  // Respondents only generate cost when qual modules are present — they exist
  // to feed qual evaluation. Mirrors AS lib/pricing.ts.
  const respondentBillable = qualCount > 0 ? Math.max(0, input.respondent_count) : 0
  const breakdown: EstimateBreakdown = {
    base: formula.base,
    quant: formula.per_quant_metric * Math.max(0, input.quant_metric_count),
    qual: formula.per_qual_module * qualCount,
    respondents: formula.per_respondent * respondentBillable,
    idea: formula.per_idea_kchar * Math.ceil(Math.max(0, input.idea_char_length) / 1000),
  }
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0)
  return { total, breakdown }
}
