'use client'

interface Props {
  loading: boolean
  disabled: boolean
  onClick: () => void
}

export default function RunTestButton({ loading, disabled, onClick }: Props) {
  const isDisabled = disabled || loading

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      style={{
        width: '100%',
        height: '56px',
        borderRadius: '9999px',
        fontSize: '16px',
        fontWeight: 700,
        fontFamily: 'inherit',
        letterSpacing: '-0.01em',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        border: 'none',
        transition: 'all 150ms',
        background: isDisabled
          ? 'var(--border)'
          : 'var(--primary)',
        color: isDisabled ? 'var(--text-tertiary)' : '#fff',
        boxShadow: isDisabled ? 'none' : '0 4px 16px rgba(74,127,248,0.30)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
      }}
    >
      {loading ? (
        <>
          <span style={{
            width: '16px',
            height: '16px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff',
            borderRadius: '9999px',
            animation: 'spin 0.7s linear infinite',
            flexShrink: 0,
          }} />
          Generating report...
        </>
      ) : isDisabled ? (
        'Complete steps 01–03 to run'
      ) : (
        'Run Persona Test →'
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </button>
  )
}
