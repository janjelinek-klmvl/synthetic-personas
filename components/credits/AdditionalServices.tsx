'use client'

import { SX, FONT } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'
import { BtnGhost, BtnPrimary } from '@/components/design/Btn'

// Three commerce cards on /credits. Two ghost (request audience / add metric)
// + one dark (Upgrade to Premium). All actions are contact-admin mailtos.
export default function AdditionalServices() {
  return (
    <section>
      <Cap color={SX.soft} size={10} style={{ marginBottom: 14 }}>
        Additional services
      </Cap>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <ServiceCard
          title="Request a new audience"
          price="$2,000"
          body="Custom audience scaffolded from research you provide. ~10 working days."
          cta="Request"
          mailto="mailto:admin@bnt.agency?subject=Request%20new%20audience"
        />
        <ServiceCard
          title="Add a new metric"
          price="$100–$1,000"
          body="Bespoke quant primitive or qual module added to your library."
          cta="Request"
          mailto="mailto:admin@bnt.agency?subject=Request%20new%20metric"
        />
        <ServiceCard
          title="Upgrade to Premium"
          price="On Pro+"
          body="Unlimited audiences, priority synthesis, custom metrics included, dedicated support."
          cta="Upgrade"
          mailto="mailto:admin@bnt.agency?subject=Upgrade%20to%20Premium"
          dark
        />
      </div>
    </section>
  )
}

function ServiceCard({
  title,
  price,
  body,
  cta,
  mailto,
  dark,
}: {
  title: string
  price: string
  body: string
  cta: string
  mailto: string
  dark?: boolean
}) {
  const bg = dark ? SX.ink : SX.paper
  const fg = dark ? SX.paper : SX.ink
  const muted = dark ? 'rgba(251,250,247,0.65)' : SX.soft

  return (
    <div
      style={{
        border: `1px solid ${dark ? SX.ink : SX.hair}`,
        background: bg,
        color: fg,
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <Cap color={dark ? 'rgba(251,250,247,0.7)' : SX.faint} size={9.5}>
        {price}
      </Cap>
      <div
        style={{
          fontFamily: FONT.grotesque,
          fontSize: 18,
          fontWeight: 800,
          color: fg,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
        }}
      >
        {title}
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: FONT.grotesque,
          fontSize: 12.5,
          color: muted,
          lineHeight: 1.5,
          flex: 1,
        }}
      >
        {body}
      </p>
      <div style={{ marginTop: 4 }}>
        {dark ? (
          <BtnPrimary onClick={() => (window.location.href = mailto)}>{cta} →</BtnPrimary>
        ) : (
          <BtnGhost onClick={() => (window.location.href = mailto)}>{cta} →</BtnGhost>
        )}
      </div>
    </div>
  )
}
