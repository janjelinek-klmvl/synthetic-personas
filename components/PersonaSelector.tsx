'use client'

import { personas } from '@/lib/personas'
import PersonaCard from './PersonaCard'

interface Props {
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function PersonaSelector({ selectedId, onSelect }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
      {personas.map(persona => (
        <PersonaCard
          key={persona.id}
          persona={persona}
          selected={selectedId === persona.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
