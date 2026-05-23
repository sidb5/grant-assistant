'use client'

import { useState } from 'react'

interface Props { token: string | null; recordId?: string; all?: boolean }

export default function ExportButton({ token, recordId, all }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    if (!token) return
    setLoading(true)
    try {
      const params = all ? 'all=true' : `id=${recordId}`
      const response = await fetch(`/api/audit/export?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) { alert('Export failed. Please try again.'); return }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = all ? 'grantassistant-all-records.pdf' : `grantassistant-audit-${recordId?.substring(0, 8)}.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch { alert('Export failed. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <button onClick={handleExport} disabled={loading || !token} style={{
      background: loading ? '#eef1f8' : '#fff',
      border: '1px solid #dde3f0',
      color: loading ? '#a0aec0' : '#4f6ef7',
      padding: all ? '6px 16px' : '3px 10px',
      borderRadius: 6,
      cursor: loading || !token ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--font-mono)',
      fontSize: all ? '0.75rem' : '0.7rem',
      opacity: !token ? 0.5 : 1,
      whiteSpace: 'nowrap' as const,
    }}>
      {loading ? (all ? 'Generating…' : '…') : (all ? 'Export All Records' : 'PDF')}
    </button>
  )
}
