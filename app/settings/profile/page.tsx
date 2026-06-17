import { redirect } from 'next/navigation'
import {
  getCurrentCompany,
  NotAuthenticatedError,
  NoActiveCompanyError,
  NoCompanyError,
} from '@/lib/currentCompany'
import SettingsShell from '@/components/settings/SettingsShell'
import ProfileForm from './ProfileForm'

export default async function ProfileSettingsPage() {
  try {
    const ctx = await getCurrentCompany()
    return (
      <SettingsShell
        active="profile"
        isAdmin={ctx.role === 'admin'}
        companyName={ctx.companyName}
        role={ctx.role}
        title="Profile"
        subtitle="Your account details and password."
      >
        <ProfileForm email={ctx.email ?? ''} initialDisplayName={ctx.displayName ?? ''} />
      </SettingsShell>
    )
  } catch (e) {
    if (e instanceof NotAuthenticatedError) redirect('/login')
    if (e instanceof NoActiveCompanyError) redirect('/')
    if (e instanceof NoCompanyError) redirect('/login?reason=no_profile')
    throw e
  }
}
