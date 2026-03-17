import { Persona } from './types'

export function buildSystemPrompt(persona: Persona): string {
  const drivers = persona.decisionDrivers.map((d) => `• ${d}`).join('\n')
  const pains = persona.painPoints.map((p) => `• ${p}`).join('\n')

  return `You are ${persona.name} — ${persona.tagline}.

IDENTITY:
${persona.promptContext}

YOUR DECISION DRIVERS:
${drivers}

YOUR PAIN POINTS:
${pains}

YOUR COMMUNICATION STYLE:
${persona.tone}

TASK:
Evaluate the idea or proposition presented to you authentically as this persona. Never break character. Respond exactly as this person would react — with their specific concerns, priorities, and emotional register.

RESPONSE FORMAT:
Return valid JSON only. No markdown fences. No preamble. No explanation outside the JSON.`
}

export function buildUserPrompt(
  ideaText: string,
  fileContent: string | undefined,
  testTypeId: string
): string {
  let prompt = `IDEA / PROPOSITION:\n${ideaText}`

  if (fileContent && fileContent.trim()) {
    prompt += `\n\nADDITIONAL CONTEXT FROM UPLOADED DOCUMENT:\n${fileContent}`
  }

  if (testTypeId === 'qualitative') {
    const schema = `{
  "personaId": "<string — the persona's id>",
  "testType": "qualitative",
  "overallScore": <number 0-10>,
  "summary": "<one-sentence verdict in the persona's voice>",
  "resonates": ["<string>", "<string>", "<string>"],
  "doesNotResonate": ["<string>", "<string>", "<string>"],
  "quotes": [
    { "text": "<short punchy quote 1 — 1–2 sentences max>", "name": "<first name>", "age": <number>, "gender": "<Male/Female/Non-binary>", "area": "<big city|town|village>" },
    { "text": "<short punchy quote 2 — different angle>",   "name": "<first name>", "age": <number>, "gender": "<Male/Female/Non-binary>", "area": "<big city|town|village>" },
    { "text": "<short punchy quote 3 — a concern or excitement>", "name": "<first name>", "age": <number>, "gender": "<Male/Female/Non-binary>", "area": "<big city|town|village>" },
    { "text": "<short punchy quote 4 — gut feeling or final take>", "name": "<first name>", "age": <number>, "gender": "<Male/Female/Non-binary>", "area": "<big city|town|village>" }
  ],
  "irl": {
    "problemSolving": [
      "<bullet: what specific problem this solves for you>",
      "<bullet>",
      "<bullet>"
    ],
    "howAndWhenUsed": [
      "<bullet: specific scenario of when/how you'd use it>",
      "<bullet>",
      "<bullet>"
    ],
    "whatWouldStopThem": [
      "<bullet: specific barrier, concern, or friction point>",
      "<bullet>",
      "<bullet>"
    ],
    "lifestyleMatch": [
      "<bullet: how it fits or clashes with your daily life>",
      "<bullet>",
      "<bullet>"
    ]
  },
  "recommendations": [
    { "title": "<string>", "description": "<string>" }
  ]
}`

    prompt += `

MODE: General Feedback (qualitative)

Instructions:
- overallScore: your holistic reaction (0–10) as this persona
- summary: one punchy sentence verdict in your own voice
- resonates: 3–5 things that genuinely appeal to you
- doesNotResonate: 3–5 things that don't land or concern you
- quotes: 4 short, punchy, distinct first-person quotes from 4 different simulated real people who match this persona archetype. Each quote 1–2 sentences max capturing a different angle (first reaction / a specific detail / a concern / gut feeling). For each person invent a realistic first name, age (within the persona's age range), gender, and area type (big city, town, or village). Make the people feel distinct from each other.
- irl.problemSolving: 3–5 bullets on what real problem this solves for you specifically
- irl.howAndWhenUsed: 3–5 bullets on concrete scenarios of when/how you'd use it (be specific — day, context, situation)
- irl.whatWouldStopThem: 3–5 bullets on specific barriers, friction points, or dealbreakers
- irl.lifestyleMatch: 3–5 bullets on how it fits or clashes with your actual daily routines and values
- recommendations: 3–5 concrete, actionable suggestions to improve the concept for people like you

Scoring guide:
0–3 = Strong negative reaction — irrelevant or off-putting
4–6 = Mixed — some appeal but significant reservations
7–9 = Genuinely compelling — would seriously consider
10 = Exceptional — exactly what you've been looking for

Respond using exactly this JSON structure:
${schema}`
  } else {
    const schema = `{
  "personaId": "<string — the persona's id>",
  "testType": "quantitative",
  "compositeScore": <number 0-100, average of all eight metric scores>,
  "verdict": "<one punchy sentence in your persona's voice — your gut reaction to this concept>",
  "metrics": {
    "purchaseIntent": {
      "score": <number 0-100>,
      "evaluation": "<max 20 words — specific reasoning as this persona>"
    },
    "desirability": {
      "score": <number 0-100>,
      "evaluation": "<max 20 words — specific reasoning as this persona>"
    },
    "uniqueness": {
      "score": <number 0-100>,
      "evaluation": "<max 20 words — specific reasoning as this persona>"
    },
    "valuePerception": {
      "score": <number 0-100>,
      "evaluation": "<max 20 words — specific reasoning as this persona>"
    },
    "emotionalResonance": {
      "score": <number 0-100>,
      "evaluation": "<max 20 words — specific reasoning as this persona>"
    },
    "trustAdoptionBarrier": {
      "score": <number 0-100>,
      "evaluation": "<max 20 words — specific reasoning as this persona>"
    },
    "relevancy": {
      "score": <number 0-100>,
      "evaluation": "<max 20 words — specific reasoning as this persona>"
    },
    "brandFit": {
      "score": <number 0-100>,
      "evaluation": "<max 20 words — specific reasoning as this persona>"
    }
  },
  "pushOver": [
    "<specific thing 1 that would meaningfully raise your scores>",
    "<specific thing 2>",
    "<specific thing 3>"
  ],
  "riskFlag": {
    "metric": "<camelCase key of your lowest-scoring metric>",
    "explanation": "<2–3 sentences explaining why this specific weakness is particularly dangerous for a persona like you>"
  },
  "culturalRelevance": {
    "trendiness": <number 0-100>,
    "shareability": <number 0-100>,
    "newsworthiness": <number 0-100>,
    "recommendationLikelihood": <number 0-100>
  }
}`

    prompt += `

MODE: Concept Validation (quantitative)

Score each of the 8 metrics from 0–100% as this persona. Be honest and specific.

Metrics:
- purchaseIntent: Would you actually pay for or sign up for this? How likely?
- desirability: Do you genuinely want this to exist? How much do you wish you had it?
- uniqueness: How differentiated is this from existing alternatives you know?
- valuePerception: Does the price or cost feel worth it relative to what you get?
- emotionalResonance: How strongly does this connect with your emotions and values?
- trustAdoptionBarrier: How much do you trust this product/brand? How easy is it to adopt? (100 = zero barrier, high trust)
- relevancy: How well does this fit your specific life, needs, and context?
- brandFit: Does the brand identity, tone, and positioning feel right for someone like you?

Scoring guide per metric:
0–30 = Very low — not relevant or compelling for you
31–50 = Low — some merit but significant issues
51–70 = Moderate — interesting but not a clear win
71–85 = High — genuinely appealing, fits your life well
86–100 = Very high — this is exactly what you need

Additional fields:
- compositeScore: the straight average of all eight metric scores
- verdict: one punchy honest sentence as this persona — your gut take on the concept
- pushOver: 3 concrete, specific changes that would meaningfully raise your scores — not generic advice
- riskFlag: identify your single lowest-scoring metric (use its camelCase key) and explain in 2–3 sentences why that gap is particularly risky for personas like you
- culturalRelevance.trendiness: Is this concept on-trend or ahead/behind the curve for someone like you? (0 = feels dated/irrelevant, 100 = perfectly timed / of-the-moment)
- culturalRelevance.shareability: How likely are you to mention, post, or talk about this with friends? (0 = never, 100 = instantly sharing with everyone)
- culturalRelevance.newsworthiness: Would this concept get buzz or coverage in media or social circles you follow? (0 = zero buzz, 100 = viral-worthy)
- culturalRelevance.recommendationLikelihood: NPS-style — how likely are you to actively recommend this to people like you? (0 = would warn people away, 100 = evangelist)

Each metric evaluation must be max 20 words, written in your persona's voice.

Respond using exactly this JSON structure:
${schema}`
  }

  return prompt
}
