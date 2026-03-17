export interface Persona {
  id: string
  name: string
  tagline: string
  emoji: string
  accentColor: string
  accentBorder: string
  accentBg: string
  traits: string[]
  demographics: {
    age: string
    income?: string
    location?: string
  }
  promptContext: string
  decisionDrivers: string[]
  painPoints: string[]
  tone: string
}

export interface TestType {
  id: string
  label: string
  description: string
  scoreLabel: string
  hasScore: boolean
}

export interface QuantitativeMetric {
  score: number       // 0–100 percentage
  evaluation: string  // ~20 word evaluation
}

export interface TestReport {
  personaId: string
  testType: 'qualitative' | 'quantitative'

  // ── Qualitative ──────────────────────────────────────
  overallScore?: number
  summary?: string
  resonates?: string[]
  doesNotResonate?: string[]
  quotes?: {          // 4 quotes from simulated real people matching the persona
    text:   string
    name:   string
    age:    number
    gender: string
    area:   string    // e.g. "big city" | "town" | "village"
  }[]
  irl?: {
    problemSolving:     string[]
    howAndWhenUsed:     string[]
    whatWouldStopThem:  string[]
    lifestyleMatch:     string[]
  }
  recommendations?: { title: string; description: string }[]

  // ── Quantitative ─────────────────────────────────────
  compositeScore?: number   // 0–100 average of all metrics
  verdict?: string          // one punchy sentence in persona's voice
  metrics?: {
    purchaseIntent:        QuantitativeMetric
    desirability:          QuantitativeMetric
    uniqueness:            QuantitativeMetric
    valuePerception:       QuantitativeMetric
    emotionalResonance:    QuantitativeMetric
    trustAdoptionBarrier:  QuantitativeMetric
    relevancy:             QuantitativeMetric
    brandFit:              QuantitativeMetric
  }
  pushOver?: string[]       // 2–3 things that would push them over the line
  riskFlag?: {
    metric: string          // which metric is the weakest
    explanation: string     // why this is dangerous for this persona
  }
  culturalRelevance?: {
    trendiness:               number  // 0–100
    shareability:             number  // 0–100
    newsworthiness:           number  // 0–100
    recommendationLikelihood: number  // 0–100
  }
}

export interface TestRequest {
  ideaText: string
  fileContent?: string
  personaId: string
  testType: string
}

export interface TestResponse {
  report?: TestReport
  error?: string
}
