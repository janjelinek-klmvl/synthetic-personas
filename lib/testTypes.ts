import { TestType } from './types'

export const testTypes: TestType[] = [
  {
    id: 'qualitative',
    label: 'General Feedback',
    description: 'Overall rating, pros & cons, and recommendations to improve.',
    scoreLabel: 'Overall reaction',
    hasScore: false,
  },
  {
    id: 'quantitative',
    label: 'Concept Validation',
    description: 'Scored metrics: purchase intent, uniqueness, emotional resonance, relevancy.',
    scoreLabel: 'Concept score',
    hasScore: true,
  },
]

export function getTestTypeById(id: string): TestType | undefined {
  return testTypes.find((t) => t.id === id)
}
