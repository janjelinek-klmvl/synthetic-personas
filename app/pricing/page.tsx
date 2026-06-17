import { redirect } from 'next/navigation'

// Legacy /pricing route — the credits view lives at /credits now.
export default function PricingPage() {
  redirect('/credits')
}
