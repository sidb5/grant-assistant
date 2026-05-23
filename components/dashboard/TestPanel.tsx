'use client'

import { useState } from 'react'

interface Props {
  token: string | null
  onSuccess: () => void
}

const SAMPLE_TEXT = `The long-term goal of our research program is to understand the molecular mechanisms underlying neurodegeneration in Alzheimer's disease (AD). The objective of this application, which is the next step in pursuit of that goal, is to determine how tau protein aggregation initiates synaptic dysfunction and ultimately drives neuronal cell death in the hippocampus. Our central hypothesis, which has been formulated on the basis of our preliminary data, is that aberrant tau phosphorylation at Ser202/Thr205 disrupts axonal transport machinery, leading to mitochondrial dysfunction and eventual apoptotic cell death. The rationale for the proposed research is that once we understand the precise sequence of molecular events linking tau phosphorylation to synaptic failure, it will be possible to develop targeted therapeutic interventions that interrupt this pathological cascade before irreversible neuronal loss occurs, potentially benefiting the more than six million Americans currently living with Alzheimer's disease and the estimated fourteen million who will be affected by 2060.`

const SAMPLE_PUBLICATIONS = [
  { pmid: '33641718', title: 'Tau aggregation and neurodegeneration', abstract: '' },
  { pmid: '34234567', title: 'Synaptic plasticity in Alzheimer disease', abstract: '' },
  { pmid: '31234567', title: 'mTOR signaling in cancer metabolism', abstract: '' },
  { pmid: '32134567', title: 'CRISPR-Cas9 genome editing in neurons', abstract: '' },
  { pmid: '30234567', title: 'Mitochondrial dynamics and apoptosis', abstract: '' },
  { pmid: '29134567', title: 'Phosphorylation cascades in tau pathology', abstract: '' },
  { pmid: '28234567', title: 'Hippocampal memory consolidation mechanisms', abstract: '' },
]

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} style={{
      fontFamily: 'var(--font-mono)', fontSize: '0.68rem', padding: '3px 10px', borderRadius: 4,
      cursor: 'pointer', border: '1px solid #bbf7d0',
      background: copied ? '#dcfce7' : '#f0fdf4',
      color: copied ? '#15803d' : '#16a34a',
      whiteSpace: 'nowrap' as const,
    }}>
      {copied ? '✓ Copied!' : `📋 ${label}`}
    </button>
  )
}

export default function TestPanel({ token, onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'trim' | 'citations'>('trim')

  const [trimText, setTrimText] = useState(SAMPLE_TEXT)
  const [preEditText, setPreEditText] = useState<string | null>(null)
  const [charLimit, setCharLimit] = useState(2500)
  const [grantTitle, setGrantTitle] = useState('Tau Phosphorylation and Synaptic Dysfunction in Alzheimer Disease')
  const [trimResult, setTrimResult] = useState<null | { trimmed_text: string; char_count_before: number; char_count_after: number; char_limit: number; diff_summary: string; audit_id: string }>(null)
  const [trimLoading, setTrimLoading] = useState(false)
  const [trimError, setTrimError] = useState('')

  const [citGrant, setCitGrant] = useState('Tau Phosphorylation and Synaptic Dysfunction in Alzheimer Disease')
  const [citResult, setCitResult] = useState<null | { selected: Array<{ pmid: string; title: string; reason: string }>; audit_id: string }>(null)
  const [citLoading, setCitLoading] = useState(false)
  const [citError, setCitError] = useState('')

  async function runTrim() {
    if (!token) return
    setTrimLoading(true); setTrimError(''); setTrimResult(null)
    const snapshot = trimText
    try {
      const res = await fetch('/api/trim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: trimText, char_limit: charLimit, grant_title: grantTitle }),
      })
      const data = await res.json()
      if (!res.ok) { setTrimError(data.error || 'Request failed'); return }
      setPreEditText(snapshot)
      setTrimText(data.trimmed_text)
      setTrimResult(data)
      onSuccess()
    } catch { setTrimError('Network error — is the dev server running?') }
    finally { setTrimLoading(false) }
  }

  function revertTrim() {
    if (!preEditText) return
    setTrimText(preEditText); setPreEditText(null); setTrimResult(null); setTrimError('')
  }

  async function runCitations() {
    if (!token) return
    setCitLoading(true); setCitError(''); setCitResult(null)
    try {
      const res = await fetch('/api/citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ grant_title: citGrant, publications: SAMPLE_PUBLICATIONS }),
      })
      const data = await res.json()
      if (!res.ok) { setCitError(data.error || 'Request failed'); return }
      setCitResult(data)
      onSuccess()
    } catch { setCitError('Network error — is the dev server running?') }
    finally { setCitLoading(false) }
  }

  const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)' }
  const inputStyle: React.CSSProperties = { display: 'block', width: '100%', marginTop: 4, padding: '6px 10px', background: '#fff', border: '1px solid #dde3f0', borderRadius: 6, color: '#1e2a3a', ...mono, fontSize: '0.75rem' }

  return (
    <div style={{ marginBottom: 20 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        ...mono, fontSize: '0.75rem', background: open ? '#eef1f8' : '#fff',
        border: '1px solid #dde3f0', color: '#4f6ef7', padding: '6px 16px',
        borderRadius: 6, cursor: 'pointer', marginBottom: open ? 14 : 0,
      }}>
        {open ? '▾' : '▸'} API Test Panel
      </button>

      {open && (
        <div style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <p style={{ ...mono, fontSize: '0.7rem', color: '#6b7a99', marginBottom: 16 }}>
            Test the backend API directly — no SciENcv account needed. Results appear in the audit table below.
          </p>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {(['trim', 'citations'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                ...mono, fontSize: '0.7rem', padding: '4px 14px', borderRadius: 4, cursor: 'pointer',
                border: '1px solid #dde3f0',
                background: activeTab === tab ? '#e8ecfd' : '#f8f9fc',
                color: activeTab === tab ? '#3b5bdb' : '#6b7a99',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Trim Tab */}
          {activeTab === 'trim' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ ...mono, fontSize: '0.68rem', color: '#a0aec0', background: '#f8f9fc', border: '1px solid #dde3f0', borderRadius: 6, padding: '8px 10px', lineHeight: 1.7 }}>
                Simulates <strong style={{ color: '#4f6ef7' }}>Section A — Personal Statement</strong><br />
                Element: <code>&lt;textarea id=&quot;previewAreaMarkdown&quot;&gt;</code><br />
                Parent: <code>&lt;div class=&quot;fortextarea&quot;&gt;</code> inside <code>&lt;div id=&quot;pStatement&quot;&gt;</code>
              </div>
              <label style={{ ...mono, fontSize: '0.7rem', color: '#6b7a99' }}>
                Grant title (optional — for audit record)
                <input value={grantTitle} onChange={e => setGrantTitle(e.target.value)} style={inputStyle} />
              </label>
              <label style={{ ...mono, fontSize: '0.7rem', color: '#6b7a99' }}>
                Character limit — NIH Personal Statement: <strong>2500</strong>
                <input type="number" value={charLimit} onChange={e => setCharLimit(Number(e.target.value))} style={{ ...inputStyle, width: 120 }} />
              </label>
              <label style={{ ...mono, fontSize: '0.7rem', color: '#6b7a99' }}>
                Personal Statement text ({trimText.length} chars → target {charLimit})
                <textarea value={trimText} onChange={e => setTrimText(e.target.value)} rows={6}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
              </label>
              <button onClick={runTrim} disabled={trimLoading || !token} style={{
                ...mono, fontSize: '0.75rem', padding: '8px 20px', borderRadius: 6,
                cursor: trimLoading ? 'wait' : 'pointer', background: '#4f6ef7', color: '#fff',
                border: 'none', width: 'fit-content', opacity: trimLoading ? 0.6 : 1,
              }}>
                {trimLoading ? 'Calling Claude…' : '⚡ Run Trim'}
              </button>

              {trimError && <p style={{ ...mono, fontSize: '0.72rem', color: '#dc2626' }}>✗ {trimError}</p>}

              {trimResult && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 14 }}>
                  <p style={{ ...mono, fontSize: '0.7rem', color: '#15803d', marginBottom: 4 }}>
                    ✓ {trimResult.char_count_before} → {trimResult.char_count_after} chars (limit: {trimResult.char_limit}) · audit_id: {trimResult.audit_id?.substring(0, 8)}…
                  </p>
                  <p style={{ ...mono, fontSize: '0.68rem', color: '#16a34a', marginBottom: 12 }}>{trimResult.diff_summary}</p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' as const }}>
                    <CopyButton text={trimResult.trimmed_text} label="Copy trimmed text" />
                    <button onClick={revertTrim} style={{
                      ...mono, fontSize: '0.68rem', padding: '3px 10px', borderRadius: 4,
                      cursor: 'pointer', border: '1px solid #fecaca', background: '#fef2f2',
                      color: '#dc2626', whiteSpace: 'nowrap' as const,
                    }}>
                      ↩ Revert to original
                    </button>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: 6, padding: '10px 12px' }}>
                    <p style={{ ...mono, fontSize: '0.65rem', color: '#a0aec0', marginBottom: 6 }}>TRIMMED TEXT (now in textarea above):</p>
                    <p style={{ ...mono, fontSize: '0.72rem', color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' as const }}>{trimResult.trimmed_text}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Citations Tab */}
          {activeTab === 'citations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ ...mono, fontSize: '0.68rem', color: '#a0aec0', background: '#f8f9fc', border: '1px solid #dde3f0', borderRadius: 6, padding: '8px 10px', lineHeight: 1.7 }}>
                Simulates <strong style={{ color: '#4f6ef7' }}>Section C — Contribution to Science</strong><br />
                Element: <code>&lt;div class=&quot;citationUIContainer mybib&quot;&gt;</code><br />
                Items in: <code>&lt;div class=&quot;citationstabsplaceholder smallTab&quot;&gt;</code><br />
                Parent: <code>&lt;div id=&quot;sectionCitations&quot; class=&quot;cv_body_section&quot;&gt;</code><br />
                SciENcv limit: up to <strong style={{ color: '#1e2a3a' }}>4 citations</strong> per contribution tab (<code>div#tabcontribution-N</code>)
              </div>
              <label style={{ ...mono, fontSize: '0.7rem', color: '#6b7a99' }}>
                Grant title — used to rank which papers are most relevant
                <input value={citGrant} onChange={e => setCitGrant(e.target.value)} style={inputStyle} />
              </label>
              <div style={{ ...mono, fontSize: '0.7rem', color: '#6b7a99' }}>
                My Bibliography (sample — {SAMPLE_PUBLICATIONS.length} papers, abstracts fetched live from PubMed):
                <ul style={{ marginTop: 6, paddingLeft: 16, color: '#a0aec0', fontSize: '0.68rem' }}>
                  {SAMPLE_PUBLICATIONS.map(p => <li key={p.pmid}>{p.title} <span style={{ color: '#c4cada' }}>PMID {p.pmid}</span></li>)}
                </ul>
              </div>
              <button onClick={runCitations} disabled={citLoading || !token} style={{
                ...mono, fontSize: '0.75rem', padding: '8px 20px', borderRadius: 6,
                cursor: citLoading ? 'wait' : 'pointer', background: '#4f6ef7', color: '#fff',
                border: 'none', width: 'fit-content', opacity: citLoading ? 0.6 : 1,
              }}>
                {citLoading ? 'Fetching abstracts + calling Claude…' : '🎯 Run Citation Selection'}
              </button>

              {citError && <p style={{ ...mono, fontSize: '0.72rem', color: '#dc2626' }}>✗ {citError}</p>}

              {citResult && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <p style={{ ...mono, fontSize: '0.7rem', color: '#15803d', margin: 0 }}>
                      ✓ Top 4 selected · audit_id: {citResult.audit_id?.substring(0, 8)}…
                    </p>
                    <CopyButton label="Copy all 5" text={citResult.selected.map((s, i) =>
                      `${i + 1}. ${s.title}\n   PMID: ${s.pmid}\n   Relevance: ${s.reason}`).join('\n\n')} />
                  </div>
                  {citResult.selected.map((s, i) => (
                    <div key={s.pmid} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < 4 ? '1px solid #bbf7d0' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <p style={{ ...mono, fontSize: '0.72rem', color: '#15803d', margin: 0 }}>{i + 1}. {s.title}</p>
                        <CopyButton label="Copy" text={`${s.title}\nPMID: ${s.pmid}\nRelevance: ${s.reason}`} />
                      </div>
                      <p style={{ ...mono, fontSize: '0.68rem', color: '#6b7a99', marginTop: 2 }}>PMID: {s.pmid}</p>
                      <p style={{ ...mono, fontSize: '0.68rem', color: '#374151', fontStyle: 'italic', marginTop: 2 }}>{s.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
