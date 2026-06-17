import { redirect } from 'next/navigation'
import CreditsClient from './CreditsClient'
import {
  getCurrentCompany,
  NoActiveCompanyError,
  NoCompanyError,
  NotAuthenticatedError,
} from '@/lib/currentCompany'

export const dynamic = 'force-dynamic'

export default async function CreditsPage() {
  try {
    await getCurrentCompany()
  } catch (e) {
    if (e instanceof NotAuthenticatedError) redirect('/login')
    if (e instanceof NoActiveCompanyError) redirect('/') // BNT super-admin → pick a company first
    if (e instanceof NoCompanyError) redirect('/login?reason=no_profile')
    throw e
  }

  // CreditsClient renders AppHeader internally.
  return <CreditsClient />
}
