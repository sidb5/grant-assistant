'use client'

import ExportButton from './ExportButton'

interface AuditRecord {
  id: string
  action_type: string
  grant_title: string | null
  diff_summary: string | null
  char_count_before: number | null
  char_count_after: number | null
  citations_selected: unknown
  created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function truncate(str: string | null | undefined, n: number) {
  if (!str) return '—'
  return str.length > n ? str.substring(0, n) + '…' : str
}

export default function AuditTable({ records, loading, token }: { records: AuditRecord[]; loading: boolean; token: string | null }) {
  const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)' }

  const th: React.CSSProperties = {
    textAlign: 'left', padding: '10px 14px', ...mono, fontSize: '0.65rem',
    textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#6b7a99',
    borderBottom: '1px solid #dde3f0', background: '#f8f9fc', whiteSpace: 'nowrap' as const,
  }
  const td: React.CSSProperties = {
    padding: '10px 14px', ...mono, fontSize: '0.75rem', color: '#374151',
    borderBottom: '1px solid #eef1f8', verticalAlign: 'middle' as const,
  }

  if (loading) return (
    <div style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 10, padding: '40px', textAlign: 'center', ...mono, color: '#6b7a99', fontSize: '0.8rem' }}>
      Loading audit records…
    </div>
  )

  if (records.length === 0) return (
    <div style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 10, padding: '40px', textAlign: 'center', ...mono, color: '#6b7a99', fontSize: '0.8rem' }}>
      No audit records yet. Use the GrantAssistant Chrome extension or the test panel above to create your first record.
    </div>
  )

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #dde3f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Date', 'Type', 'Grant Title', 'Summary', 'Export'].map(h => <th key={h} style={th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {records.map(record => (
            <tr key={record.id} style={{ background: '#fff', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8f9fc')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              <td style={{ ...td, whiteSpace: 'nowrap' }}>{formatDate(record.created_at)}</td>
              <td style={td}><TypeBadge type={record.action_type} /></td>
              <td style={td}><span title={record.grant_title ?? ''}>{truncate(record.grant_title, 40)}</span></td>
              <td style={td}>{truncate(record.diff_summary, 80)}</td>
              <td style={td}><ExportButton token={token} recordId={record.id} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TypeBadge({ type }: { type: string }) {
  const isTrim = type === 'trim'
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem',
      fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.05em',
      background: isTrim ? '#e8ecfd' : '#f0fdf4',
      color: isTrim ? '#3b5bdb' : '#16a34a',
      border: `1px solid ${isTrim ? '#c5cff5' : '#bbf7d0'}`,
    }}>
      {isTrim ? 'TRIM' : 'CITATIONS'}
    </span>
  )
}
