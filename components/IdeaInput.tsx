'use client'

import { useCallback, useRef, useState } from 'react'
import { extractTextFromFile } from '@/lib/fileParser'

interface Props {
  value: string
  onChange: (text: string) => void
  fileContent: string | undefined
  onFileContent: (content: string | undefined, fileName?: string | undefined) => void
  /** When true, renders only the file upload + button (no textarea) */
  toolbarOnly?: boolean
}

export default function IdeaInput({ value, onChange, fileContent, onFileContent, toolbarOnly }: Props) {
  const [fileName, setFileName] = useState<string | undefined>()
  const [extracting, setExtracting] = useState(false)
  const [fileError, setFileError] = useState<string | undefined>()
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    setFileError(undefined)
    setExtracting(true)
    try {
      const text = await extractTextFromFile(file)
      setFileName(file.name)
      onFileContent(text, file.name)
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Failed to extract file content')
      onFileContent(undefined, undefined)
    } finally {
      setExtracting(false)
    }
  }, [onFileContent])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }, [processFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }, [])

  const removeFile = () => {
    setFileName(undefined)
    setFileError(undefined)
    onFileContent(undefined, undefined)
  }

  // ── Toolbar-only mode (just file upload button) ─────────────
  if (toolbarOnly) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input ref={fileInputRef} type="file" accept=".txt,.pdf,.doc,.docx" onChange={handleFileInput} className="hidden" />
        {fileContent ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
              <path d="M8 1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L8 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M8 1v5h5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {fileContent.split(/\s+/).length.toLocaleString()}w
            </span>
            <button
              type="button"
              onClick={removeFile}
              style={{
                width: '16px', height: '16px', borderRadius: '9999px',
                background: 'var(--border)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', fontSize: '11px', lineHeight: 1, padding: 0,
              }}
            >×</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file (.txt, .pdf, .docx)"
            style={{
              width: '30px', height: '30px', borderRadius: '50%',
              border: '1.5px solid #d1d1d1', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#888', flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1a1a1a'; (e.currentTarget as HTMLElement).style.color = '#1a1a1a' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#d1d1d1'; (e.currentTarget as HTMLElement).style.color = '#888' }}
          >
            {extracting ? (
              <div style={{ width: '10px', height: '10px', border: '1.5px solid #888', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div>
      {/* Input area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          background: dragging ? 'var(--primary-light)' : '#fff',
          borderRadius: '16px',
          border: `1.5px ${dragging ? 'dashed' : 'solid'} ${dragging ? 'var(--primary)' : 'var(--border)'}`,
          padding: '20px 24px',
          boxShadow: dragging ? '0 0 0 3px var(--primary-light)' : '0 2px 8px rgba(0,0,0,0.05)',
          transition: 'all 150ms',
          cursor: 'text',
        }}
        onClick={() => document.getElementById('idea-textarea')?.focus()}
      >
        <textarea
          id="idea-textarea"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="What is the idea? Who is it for? What problem does it solve? What's the price point?"
          rows={5}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '16px',
            lineHeight: 1.6,
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
          }}
          className="placeholder:text-[color:var(--text-tertiary)]"
        />

        {/* Attached file pill */}
        {fileContent && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: 'var(--text-tertiary)' }}>
              <path d="M8 1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L8 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M8 1v5h5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fileName} · {fileContent.split(/\s+/).length.toLocaleString()} words
            </span>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeFile() }}
              style={{
                flexShrink: 0,
                width: '18px',
                height: '18px',
                borderRadius: '9999px',
                background: 'var(--border)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Below-field info row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '10px',
        padding: '0 4px',
      }}>
        {/* Char count hint */}
        <span style={{ fontSize: '12px', color: 'var(--orange)' }}>
          {value.length > 0 && value.length < 20 ? `${20 - value.length} more characters needed` : ''}
        </span>

        {/* File info */}
        {!fileContent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {extracting ? (
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Extracting...</span>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
                  <path d="M6 1v7M3 5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  Drop a file or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: '12px',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px',
                    }}
                  >
                    browse
                  </button>
                  {' '}to attach context (.txt, .pdf, .docx)
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {fileError && (
        <p style={{ fontSize: '12px', color: 'var(--orange)', marginTop: '8px', padding: '0 4px' }}>{fileError}</p>
      )}

      <input ref={fileInputRef} type="file" accept=".txt,.pdf,.doc,.docx" onChange={handleFileInput} className="hidden" />
    </div>
  )
}
