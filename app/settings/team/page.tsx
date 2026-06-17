import { redirect } from 'next/navigation'
import {
  getCurrentCompany,
  NotAuthenticatedError,
  NoActiveCompanyError,
  NoCompanyError,
} from '@/lib/currentCompany'
import SettingsShell from '@/components/settings/SettingsShell'
import TeamClient from './TeamClient'

export default async function TeamSettingsPage() {
  try {
    const ctx = await getCurrentCompany()
    if (ctx.role !== 'admin') {
      redirect('/settings/profile')
    }
    return (
      <SettingsShell
        active="team"
        isAdmin={true}
        companyName={ctx.companyName}
        role={ctx.role}
        title="Team"
        subtitle="Members and invitations."
      >
        <TeamClient />
      </SettingsShell>
    )
  } catch (e) {
    if (e instanceof NotAuthenticatedError) redirect('/login')
    if (e instanceof NoActiveCompanyError) redirect('/')
    if (e instanceof NoCompanyError) redirect('/login?reason=no_profile')
    throw e
  }
}
