// Inverse-positive metrics — for these the AS model scores HIGHER = WORSE
// (more risk / more friction). The rest of the report is reception-positive
// (higher = better), so we flip these to `100 - raw` for display and relabel
// them to their positive pole. Detection has no structured flag from the API,
// so it's an explicit set here.
//
// NOTE: when AS adds a new inverse-positive metric, add its id + positive
// label here. We deliberately do NOT auto-invert unknown metrics, since they
// would have no positive label and could mislead.
export const INVERSE_METRICS: Record<string, string> = {
  'perceived-risk': 'Safety',
  'switching-effort': 'Switching Ease',
}

export const isInverseMetric = (id: string): boolean => id in INVERSE_METRICS

// Reception-positive display score (higher = better) for any metric.
export const displayScore = (id: string, raw: number): number =>
  isInverseMetric(id) ? 100 - raw : raw

// Positive display name; falls back to the metric's own name.
export const displayMetricName = (id: string, fallback: string): string =>
  INVERSE_METRICS[id] ?? fallback
