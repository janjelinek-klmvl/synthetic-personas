import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-server'
import AcceptForm from './AcceptForm'

interface CompanyInviteRow {
  kind: 'company'
  id: string
  company_id: string
  email: string
  role: 'admin' | 'member'
  token: string
  expires_at: string
  accepted_at: string | null
}

interface BntInviteRow {
  kind: 'bnt'
  id: string
  email: string
  token: string
  expires_at: string
  accepted_at: string | null
}

type Loaded =
  | { invite: CompanyInviteRow; companyName: string }
  | { invite: BntInviteRow }

async function loadInvite(token: string): Promise<Loaded | null> {
  // Try company invitation first.
  const { data: companyInvite } = await supabaseAdmin
    .from('invitations')
    .select('id, company_id, email, role, token, expires_at, accepted_at')
    .eq('token', token)
    .maybeSingle<{
      id: string
      company_id: string
      email: string
      role: 'admin' | 'member'
      token: string
      expires_at: string
      accepted_at: string | null
    }>()
  if (companyInvite) {
    const { data: company } = await supabaseAdmin
      .from('api_clients')
      .select('id, org_name')
      .eq('id', companyInvite.company_id)
      .single<{ id: string; org_name: string }>()
    if (!company) return null
    return {
      invite: { kind: 'company', ...companyInvite },
      companyName: company.org_name,
    }
  }

  // Otherwise try BNT-admin invitation.
  const { data: bntInvite } = await supabaseAdmin
    .from('bnt_admin_invitations')
    .select('id, email, token, expires_at, accepted_at')
    .eq('token', token)
    .maybeSingle<{
      id: string
      email: string
      token: string
      expires_at: string
      accepted_at: string | null
    }>()
  if (bntInvite) {
    return { invite: { kind: 'bnt', ...bntInvite } }
  }

  return null
}

interface Props {
  params: { token: string }
}

export default async function AcceptInvitePage({ params }: Props) {
  const loaded = await loadInvite(params.token)
  if (!loaded) return notFound()

  const { invite } = loaded
  const expired = new Date(invite.expires_at).getTime() < Date.now()
  const accepted = invite.accepted_at != null

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface)',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          borderRadius: 20,
          padding: 28,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Synthetic<span style={{ color: '#FF7648' }}>.</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {invite.kind === 'company' && 'companyName' in loaded ? (
              <>
                You&apos;ve been invited to{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{loaded.companyName}</strong> as{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{invite.role}</strong>.
              </>
            ) : (
              <>
                You&apos;ve been invited as a{' '}
                <strong style={{ color: 'var(--text-primary)' }}>BNT super-admin</strong>. You&apos;ll
                be able to view any company.
              </>
            )}
          </div>
        </div>

        {expired ? (
          <Notice tone="warn">
            This invitation expired on {new Date(invite.expires_at).toLocaleDateString()}. Ask BNT
            for a fresh one.
          </Notice>
        ) : accepted ? (
          <Notice tone="info">
            This invitation has already been accepted.{' '}
            <a href="/login" style={{ color: '#1a1a1a', fontWeight: 600 }}>
              Sign in
            </a>{' '}
            instead.
          </Notice>
        ) : (
          <AcceptForm token={invite.token} email={invite.email} kind={invite.kind} />
        )}
      </div>
    </div>
  )
}

function Notice({ tone, children }: { tone: 'warn' | 'info'; children: React.ReactNode }) {
  const palette =
    tone === 'warn'
      ? { bg: 'var(--orange-light, #FFE8DF)', fg: '#8A4520' }
      : { bg: '#EEF3FE', fg: '#2E63E0' }
  return (
    <div
      style={{
        padding: '12px 14px',
        background: palette.bg,
        color: palette.fg,
        fontSize: 13,
        borderRadius: 10,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  )
}
