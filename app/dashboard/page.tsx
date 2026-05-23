'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import AuditTable from '@/components/dashboard/AuditTable'
import ExportButton from '@/components/dashboard/ExportButton'
import TestPanel from '@/components/dashboard/TestPanel'

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

interface Stats {
  trims_this_month: number
  citations_this_month: number
  chars_saved_this_month: number
}

interface Profile {
  email: string
  full_name: string
  institution: string
}

export default function DashboardPage() {
  const [records, setRecords] = useState<AuditRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ trims_this_month: 0, citations_this_month: 0, chars_saved_this_month: 0 })

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/'; return }
      setToken(session.access_token)
    })
  }, [])

  useEffect(() => {
    if (!token) return
    fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => setProfile(data)).catch(() => null)
  }, [token])

  const fetchRecords = useCallback(() => {
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (typeFilter) params.set('type', typeFilter)
    fetch(`/api/audit?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setRecords(data.records ?? [])
        setTotal(data.total ?? 0)
        if (data.stats) setStats(data.stats)
      })
      .finally(() => setLoading(false))
  }, [token, page, typeFilter])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const totalPages = Math.max(1, Math.ceil(total / 20))

  const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)' }

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fc', color: '#1e2a3a' }}>
      {/* Navigation */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #dde3f0', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Logo mark — matches extension popup icon */}
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #4f6ef7 0%, #7c8ff5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(79,110,247,0.28)', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 3.5A1.5 1.5 0 015.5 2h6.086a1.5 1.5 0 011.06.44l2.915 2.914A1.5 1.5 0 0116 6.414V16.5A1.5 1.5 0 0114.5 18h-9A1.5 1.5 0 014 16.5v-13z" fill="white" fillOpacity="0.25"/>
              <path d="M5.5 2H11.5V6.5H16" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 3.5A1.5 1.5 0 015.5 2h6.086a1.5 1.5 0 011.06.44l2.915 2.914A1.5 1.5 0 0116 6.414V16.5A1.5 1.5 0 0114.5 18h-9A1.5 1.5 0 014 16.5v-13z" stroke="white" strokeWidth="1.3" strokeLinejoin="round"/>
              <path d="M10.5 8.5L9 12H11L9.5 15.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ ...mono, fontSize: '1rem', color: '#1e2a3a', fontWeight: 600 }}>GrantAssistant</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, ...mono, fontSize: '0.8rem' }}>
          {profile && (
            <span style={{ color: '#6b7a99' }}>
              {profile.full_name}{profile.institution && ` · ${profile.institution}`}
            </span>
          )}
          <button onClick={handleSignOut} style={{ background: 'transparent', border: '1px solid #dde3f0', color: '#6b7a99', padding: '4px 14px', borderRadius: 6, cursor: 'pointer', ...mono, fontSize: '0.75rem' }}>
            Sign Out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          <StatCard label="Trims This Month" value={stats.trims_this_month} />
          <StatCard label="Citation Selections This Month" value={stats.citations_this_month} />
          <StatCard label="Characters Saved This Month" value={stats.chars_saved_this_month.toLocaleString()} />
        </div>

        {/* Test Panel */}
        <TestPanel token={token} onSuccess={fetchRecords} />

        {/* Table Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ ...mono, fontSize: '0.72rem', color: '#6b7a99' }}>Filter:</label>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
              style={{ background: '#fff', border: '1px solid #dde3f0', color: '#1e2a3a', padding: '4px 10px', borderRadius: 6, ...mono, fontSize: '0.75rem', cursor: 'pointer' }}
            >
              <option value="">All</option>
              <option value="trim">Trim</option>
              <option value="citation_select">Citations</option>
            </select>
          </div>
          <ExportButton token={token} all />
        </div>

        {/* Audit Table */}
        <AuditTable records={records} loading={loading} token={token} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, ...mono, fontSize: '0.75rem', color: '#6b7a99' }}>
            <span>Page {page} of {totalPages} · {total} total records</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <PaginationBtn label="← Previous" disabled={page <= 1} onClick={() => setPage(p => p - 1)} />
              <PaginationBtn label="Next →" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #dde3f0', borderRadius: 10, padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', color: '#4f6ef7', fontWeight: 600, marginBottom: 6 }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#6b7a99', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
    </div>
  )
}

function PaginationBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: '#fff', border: '1px solid #dde3f0', color: disabled ? '#a0aec0' : '#4f6ef7', padding: '4px 14px', borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', opacity: disabled ? 0.5 : 1 }}>
      {label}
    </button>
  )
}
