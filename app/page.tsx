'use client'

import Image from 'next/image'
import SignInButton from '@/components/SignInButton'

// ── Logo SVG (matches existing app icon) ─────────────────────────────────────
function LogoIcon({ size = 52 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.round(size * 0.22),
      background: 'linear-gradient(135deg, #4f6ef7 0%, #7c8ff5 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 20px rgba(79,110,247,0.35)',
      flexShrink: 0,
    }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 20 20" fill="none">
        <path d="M4 3.5A1.5 1.5 0 015.5 2h6.086a1.5 1.5 0 011.06.44l2.915 2.914A1.5 1.5 0 0116 6.414V16.5A1.5 1.5 0 0114.5 18h-9A1.5 1.5 0 014 16.5v-13z" fill="white" fillOpacity="0.25"/>
        <path d="M5.5 2H11.5V6.5H16" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 3.5A1.5 1.5 0 015.5 2h6.086a1.5 1.5 0 011.06.44l2.915 2.914A1.5 1.5 0 0116 6.414V16.5A1.5 1.5 0 0114.5 18h-9A1.5 1.5 0 014 16.5v-13z" stroke="white" strokeWidth="1.3" strokeLinejoin="round"/>
        <path d="M10.5 8.5L9 12H11L9.5 15.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

// ── Reusable screenshot wrapper ───────────────────────────────────────────────
function Screenshot({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <div style={{ margin: '20px 0' }}>
      <Image
        src={src} alt={alt} width={1600} height={900}
        style={{ width: '100%', height: 'auto', borderRadius: 10, border: '1px solid #dde3f0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
      />
      {caption && (
        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#8a96aa', marginTop: 8 }}>{caption}</p>
      )}
    </div>
  )
}

// ── Step list item ────────────────────────────────────────────────────────────
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 24, marginBottom: 40 }}>
      {/* number + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', background: '#4f6ef7',
          color: '#fff', fontWeight: 700, fontSize: '1.1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>{n}</div>
        <div style={{ width: 2, flex: 1, background: '#e2e6ef', marginTop: 6 }} />
      </div>
      {/* content */}
      <div style={{ paddingTop: 8, paddingBottom: 8, flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6, color: '#1a2540' }}>{title}</h3>
        {children}
      </div>
    </div>
  )
}

// ── Callout box ───────────────────────────────────────────────────────────────
function Callout({ color, children }: { color: 'blue' | 'green' | 'amber'; children: React.ReactNode }) {
  const styles = {
    blue:  { background: '#eff4ff', borderLeft: '4px solid #4f6ef7', color: '#1a2a5e' },
    green: { background: '#f0fdf4', borderLeft: '4px solid #22c55e', color: '#14532d' },
    amber: { background: '#fffbeb', borderLeft: '4px solid #f59e0b', color: '#78350f' },
  }
  return (
    <div style={{ ...styles[color], borderRadius: 10, padding: '16px 20px', margin: '20px 0', fontSize: '0.93rem', lineHeight: 1.65 }}>
      {children}
    </div>
  )
}

// ── Pain card ─────────────────────────────────────────────────────────────────
function PainCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e6ef', borderRadius: 12, padding: '24px 22px' }}>
      <div style={{ fontSize: '2rem', marginBottom: 10 }}>{icon}</div>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6, color: '#1a2540' }}>{title}</h3>
      <p style={{ fontSize: '0.9rem', color: '#5a6a82', lineHeight: 1.6 }}>{body}</p>
    </div>
  )
}

// ── FAQ item ──────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div style={{ borderBottom: '1px solid #e2e6ef', padding: '20px 0' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6, color: '#1a2540' }}>{q}</h3>
      <p style={{ fontSize: '0.93rem', color: '#4f5e78', lineHeight: 1.65 }}>{a}</p>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ id, alt, children }: { id: string; alt?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} style={{ padding: '72px 0', background: alt ? '#fff' : '#f8f9fb' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
        {children}
      </div>
    </section>
  )
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1a2540', marginBottom: 8 }}>{title}</h2>
      <p style={{ color: '#5a6a82', fontSize: '1rem', maxWidth: 620 }}>{sub}</p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', color: '#1e2a3a', background: '#f8f9fb' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header style={{
        background: 'linear-gradient(135deg,#1a2540 0%,#2d3f6b 60%,#3d5a9e 100%)',
        color: '#fff', padding: '72px 24px 64px', textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 20 }}>
          <LogoIcon size={52} />
          <h1 style={{ fontSize: '2.4rem', fontWeight: 700, letterSpacing: '-0.5px' }}>GrantAssistant</h1>
        </div>
        <p style={{ fontSize: '1.15rem', color: '#b8c8f0', maxWidth: 560, margin: '0 auto 10px' }}>
          AI-powered text trimming and citation ranking for NIH SciENcv —
          with a built-in compliance audit trail.
        </p>
        <p style={{ fontSize: '1rem', color: '#8aa4de', marginBottom: 28 }}>
          Keep the science yours. Prove it.
        </p>

        {/* CTA row */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
          <a
            href="https://chromewebstore.google.com"
            target="_blank" rel="noopener noreferrer"
            style={{
              background: '#4f6ef7', color: '#fff',
              padding: '12px 28px', borderRadius: 8, fontWeight: 600,
              fontSize: '0.95rem', textDecoration: 'none',
              border: '1px solid #3b5bdb',
            }}
          >
            Add to Chrome — Free
          </a>
          <SignInButton />
          <a
            href="/api/guide-pdf"
            target="_blank" rel="noopener noreferrer"
            style={{
              background: 'rgba(255,255,255,0.1)', color: '#d0dcf8',
              padding: '12px 28px', borderRadius: 8, fontWeight: 600,
              fontSize: '0.95rem', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            ⬇ Download PDF Guide
          </a>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['🆓 Free', '🔒 NIH Compliant', '⚡ Works inside SciENcv', '📄 Audit PDF included'].map(b => (
            <span key={b} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 20, padding: '5px 16px', fontSize: '0.83rem', color: '#d0dcf8',
            }}>{b}</span>
          ))}
        </div>
      </header>

      {/* ── SOCIAL PROOF ────────────────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '48px 24px', borderBottom: '1px solid #e2e6ef' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', color: '#8a96aa', textTransform: 'uppercase', marginBottom: 28 }}>
            Trusted by researchers at leading institutions
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, alignItems: 'center', marginBottom: 28 }}>
            {[
              { src: '/logos/uc-san-diego.png',     alt: 'UC San Diego' },
              { src: '/logos/uc-san-francisco.png', alt: 'UC San Francisco' },
              { src: '/logos/uc-irvine.png',        alt: 'UC Irvine' },
              { src: '/logos/salk-institute.png',   alt: 'Salk Institute' },
              { src: '/logos/sanford-burnham.png',  alt: 'Sanford Burnham Prebys' },
            ].map(({ src, alt }) => (
              <Image key={alt} src={src} alt={alt} width={280} height={100}
                style={{ height: 64, width: 'auto', borderRadius: 8, border: '1px solid #e2e6ef', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              />
            ))}
          </div>
          <p style={{ fontSize: '0.9rem', color: '#5a6a82', maxWidth: 520, margin: '0 auto' }}>
            Researchers across Southern California's leading biomedical institutions use
            GrantAssistant to streamline NIH biosketch preparation for R01, R21, and K-award submissions.
          </p>
        </div>
      </section>

      {/* ── STICKY NAV ──────────────────────────────────────────────────────── */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e2e6ef',
        position: 'sticky', top: 0, zIndex: 100,
        overflowX: 'auto',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex' }}>
          {[
            ['#why',       'Why GrantAssistant'],
            ['#install',   'Installation'],
            ['#signin',    'Sign In'],
            ['#trim',      'Text Trimming'],
            ['#citations', 'Citation Ranker'],
            ['#audit',     'Audit Trail'],
            ['#faq',       'FAQ'],
          ].map(([href, label]) => (
            <a key={href} href={href} style={{
              display: 'block', padding: '14px 18px',
              textDecoration: 'none', color: '#4f5e78',
              fontSize: '0.88rem', fontWeight: 500, whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = '#4f6ef7' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = '#4f5e78' }}
            >{label}</a>
          ))}
        </div>
      </nav>

      {/* ── WHY ─────────────────────────────────────────────────────────────── */}
      <Section id="why">
        <SectionHeader
          title="Built for researchers preparing NIH grants"
          sub="SciENcv enforces strict formatting rules. GrantAssistant handles the tedious parts so you can focus on the science."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
          <PainCard icon="✂️" title="Character limits are brutal"
            body="The Personal Statement allows only 2,500 characters. Cutting your own writing without losing key scientific claims takes hours." />
          <PainCard icon="📚" title="Choosing 4 citations is hard"
            body="Each Contribution to Science entry allows up to 4 citations. Picking the most relevant from dozens of papers is subjective and time-consuming." />
          <PainCard icon="📝" title="NIH requires AI disclosure"
            body="If you use any AI assistance, NIH expects documentation. GrantAssistant generates a compliance PDF automatically — no extra work." />
        </div>
      </Section>

      {/* ── INSTALL ─────────────────────────────────────────────────────────── */}
      <Section id="install" alt>
        <SectionHeader
          title="Installing the Chrome Extension"
          sub="Installs in under two minutes directly from the Chrome Web Store. No configuration needed before install."
        />

        <Step n={1} title="Open the Chrome Web Store">
          <p style={{ fontSize: '0.95rem', color: '#4f5e78', marginBottom: 14 }}>
            Go to <a href="https://chromewebstore.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4f6ef7' }}>chromewebstore.google.com</a> in Chrome.
            Type <strong>GrantAssistant</strong> in the search box and press Enter.
          </p>
          <Screenshot src="/screenshots/install-step1-search.png" alt="Searching for GrantAssistant in the Chrome Web Store" caption='Type "GrantAssistant" in the search bar' />
        </Step>

        <Step n={2} title='Find the extension and click "Add to Chrome"'>
          <p style={{ fontSize: '0.95rem', color: '#4f5e78', marginBottom: 14 }}>
            Select <strong>GrantAssistant — SciENcv Assistant</strong> from the results.
            On the detail page, click the blue <strong>Add to Chrome</strong> button.
          </p>
          <Screenshot src="/screenshots/install-step2-add.png" alt="GrantAssistant listing on the Chrome Web Store" caption='Click "Add to Chrome" on the extension listing' />
        </Step>

        <Step n={3} title="Confirm the installation">
          <p style={{ fontSize: '0.95rem', color: '#4f5e78', marginBottom: 14 }}>
            Chrome will show a permissions dialog. Click <strong>Add extension</strong> to confirm.
            The extension only requests access to <code style={{ background: '#f0f4ff', padding: '1px 6px', borderRadius: 4 }}>ncbi.nlm.nih.gov</code> — it cannot read any other website.
          </p>
          <Screenshot src="/screenshots/install-step3-confirm.png" alt="Chrome confirmation dialog for adding GrantAssistant" caption='Click "Add extension" to confirm' />
        </Step>

        <Step n={4} title="The GrantAssistant icon appears in your toolbar">
          <p style={{ fontSize: '0.95rem', color: '#4f5e78', marginBottom: 14 }}>
            After installation you'll see the GrantAssistant icon in the Chrome toolbar.
            If you don't see it, click the puzzle-piece <strong>Extensions</strong> menu and pin it.
          </p>
          <Callout color="green">
            <strong>✓ Done!</strong> The extension is installed. Next, sign in with your Google account to activate the AI features.
          </Callout>
        </Step>
      </Section>

      {/* ── SIGN IN ──────────────────────────────────────────────────────────── */}
      <Section id="signin">
        <SectionHeader
          title="Signing In"
          sub="Sign in once with Google. GrantAssistant remembers your session for 1 hour — no repeated logins during a working session."
        />
        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Image
            src="/screenshots/signin-popup.png" alt="GrantAssistant sign-in popup"
            width={440} height={520}
            style={{ width: 240, height: 'auto', borderRadius: 12, border: '1px solid #dde3f0', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 6 }}>1. Click the toolbar icon</h3>
              <p style={{ fontSize: '0.93rem', color: '#4f5e78' }}>
                Click the GrantAssistant icon in your Chrome toolbar to open the popup.
              </p>
            </div>
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 6 }}>2. Click "Sign in with Google"</h3>
              <p style={{ fontSize: '0.93rem', color: '#4f5e78' }}>
                A new tab opens with Google OAuth. Sign in with any Google account — no university email required.
              </p>
            </div>
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 6 }}>3. The popup updates automatically</h3>
              <p style={{ fontSize: '0.93rem', color: '#4f5e78' }}>
                Once you complete sign-in, the popup shows your email address. You're ready to use GrantAssistant on any SciENcv page.
              </p>
            </div>
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 6 }}>4. Or sign in here to access your dashboard</h3>
              <p style={{ fontSize: '0.93rem', color: '#4f5e78', marginBottom: 12 }}>
                You can also sign in directly on this page to view your audit trail and export compliance PDFs.
              </p>
              <SignInButton />
            </div>
            <Callout color="blue">
              <strong>Privacy:</strong> GrantAssistant stores only a short-lived session token (1-hour expiry). Your credentials and API keys are never stored in the extension.
            </Callout>
          </div>
        </div>
      </Section>

      {/* ── TRIM ─────────────────────────────────────────────────────────────── */}
      <Section id="trim" alt>
        <SectionHeader
          title="⚡ Text Trimming"
          sub="When your Personal Statement or Contribution description is over the character limit, GrantAssistant condenses it — removing redundant phrasing while preserving every scientific claim, number, and citation."
        />

        {/* Feature chips */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
          {[
            '⚡ Trim — condense to fit the limit',
            '⎘ Copy — copy text to clipboard',
            '↩ Revert — undo the trim instantly',
          ].map(chip => (
            <span key={chip} style={{
              display: 'inline-flex', alignItems: 'center',
              background: '#eff4ff', border: '1px solid #c7d7fc',
              borderRadius: 8, padding: '10px 16px',
              fontSize: '0.88rem', fontWeight: 600, color: '#2d4baa',
            }}>{chip}</span>
          ))}
        </div>

        <Step n={1} title='Open your SciENcv biosketch and click "edit" on any section'>
          <p style={{ fontSize: '0.95rem', color: '#4f5e78' }}>
            Navigate to your biosketch at <a href="https://www.ncbi.nlm.nih.gov/myncbi/" target="_blank" rel="noopener noreferrer" style={{ color: '#4f6ef7' }}>ncbi.nlm.nih.gov/myncbi</a>.
            Click <strong>edit</strong> next to the Personal Statement or any Contribution to Science description.
          </p>
        </Step>

        <Step n={2} title="The Trim toolbar appears below the text area">
          <p style={{ fontSize: '0.95rem', color: '#4f5e78', marginBottom: 14 }}>
            As soon as the text area becomes visible, GrantAssistant injects a toolbar with three buttons:
            <strong> ⚡ Trim</strong>, <strong>⎘ Copy</strong>, and <strong>↩ Revert</strong>.
          </p>
          <Screenshot src="/screenshots/trim-before.png" alt="Personal Statement with Trim toolbar" caption="The Trim toolbar appears automatically below any editable text field" />
        </Step>

        <Step n={3} title="Click ⚡ Trim">
          <p style={{ fontSize: '0.95rem', color: '#4f5e78', marginBottom: 14 }}>
            GrantAssistant sends your text to the AI, which removes words to bring it under the character limit.
            A success tooltip confirms exactly how many characters were removed.
          </p>
          <Screenshot src="/screenshots/trim-after.png" alt="Personal Statement after trimming showing 7678 to 822 chars" caption="After trimming — tooltip confirms the reduction and ↩ Revert activates" />
          <Callout color="amber">
            <strong>Always review the trimmed text before saving.</strong> AI is excellent at removing filler
            but you know your science best. Use <strong>↩ Revert</strong> to restore the original instantly if anything looks wrong.
          </Callout>
        </Step>

        <Step n={4} title="Save in SciENcv as usual">
          <p style={{ fontSize: '0.95rem', color: '#4f5e78' }}>
            Click the green ✔ in SciENcv to save. The trim action is automatically logged to your audit trail.
          </p>
        </Step>

        <Callout color="green">
          <strong>What the AI does and doesn't change:</strong><br />
          ✓ Removes wordy phrases, hedges, and redundant transitions<br />
          ✓ Shortens multi-clause sentences<br />
          ✗ Never changes a number, p-value, gene name, drug name, or citation<br />
          ✗ Never introduces a new claim or idea
        </Callout>
      </Section>

      {/* ── CITATIONS ───────────────────────────────────────────────────────── */}
      <Section id="citations">
        <SectionHeader
          title="🎯 Citation Ranker"
          sub="Each Contribution to Science entry allows up to four citations. Given your grant title, GrantAssistant ranks your My Bibliography papers and highlights the best four — with a plain-English relevance reason for each."
        />

        <Step n={1} title="Go to Section C — Contribution to Science">
          <p style={{ fontSize: '0.95rem', color: '#4f5e78', marginBottom: 14 }}>
            Scroll to the <strong>C. Contribution to Science</strong> section of your biosketch.
            The GrantAssistant citation panel appears automatically above each contribution's citation list.
          </p>
          <Screenshot src="/screenshots/citations-empty.png" alt="Citation panel with empty input" caption="The 🎯 GrantAssistant panel appears above each Contribution to Science entry" />
        </Step>

        <Step n={2} title='Enter your grant title and click "Find Best 4"'>
          <p style={{ fontSize: '0.95rem', color: '#4f5e78' }}>
            Type the title of the grant you are applying for (e.g. <em>"Tau phosphorylation and synaptic dysfunction in Alzheimer's disease"</em>) and click <strong>Find Best 4</strong>.
          </p>
        </Step>

        <Step n={3} title="Review the ranked results">
          <p style={{ fontSize: '0.95rem', color: '#4f5e78', marginBottom: 14 }}>
            GrantAssistant returns the four most relevant papers, each with a one-sentence explanation.
            Papers are also highlighted directly in your bibliography list below.
          </p>
          <Screenshot src="/screenshots/citations-results.png" alt="Citation ranker showing 4 ranked papers with reasons" caption="Results showing the top 4 papers ranked by relevance, with reasons" />
        </Step>

        <Step n={4} title="Select the citations manually in SciENcv">
          <p style={{ fontSize: '0.95rem', color: '#4f5e78', marginBottom: 14 }}>
            Use GrantAssistant's ranking as your guide, then check the papers in SciENcv's own citation selector and click <strong>Save citations</strong>.
          </p>
          <Callout color="blue">
            <strong>No papers in My Bibliography yet?</strong> Click{' '}
            <a href="https://www.ncbi.nlm.nih.gov/myncbi/" target="_blank" rel="noopener noreferrer" style={{ color: '#4f6ef7' }}>Go to My Bibliography</a>{' '}
            to add your publications first, then return here. You can also connect your ORCiD account directly from the Citations tab.
          </Callout>
        </Step>
      </Section>

      {/* ── AUDIT ────────────────────────────────────────────────────────────── */}
      <Section id="audit" alt>
        <SectionHeader
          title="📄 Compliance Audit Trail"
          sub="Every Trim and Citation action is automatically logged. Export individual records or your full history as a signed PDF — ready to share with your grants office."
        />

        <Screenshot src="/screenshots/dashboard.png" alt="GrantAssistant audit dashboard" caption="The dashboard — every action logged with one-click PDF export" />

        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>What each PDF certifies</h3>
          <Callout color="green">
            <strong>For Trim actions:</strong><br />
            "This document certifies that the scientific content, claims, citations, and numerical values in the text above were authored by the researcher. AI assistance was limited solely to removing words to meet a formatting character limit imposed by NIH SciENcv. No new scientific ideas, claims, or data were introduced by AI."
          </Callout>
          <Callout color="green">
            <strong>For Citation Ranking actions:</strong><br />
            "The researcher selected publications from their own publication record for inclusion in an NIH biosketch. AI was used only to rank relevance based on the grant title provided. All listed publications are original works by the researcher."
          </Callout>
        </div>

        <Callout color="blue">
          <strong>NIH NOT-OD-23-149</strong> asks researchers to acknowledge AI use in grant applications.
          Your GrantAssistant audit PDFs serve as that documentation — generated automatically, no extra work required.
        </Callout>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <Section id="faq">
        <SectionHeader title="Frequently Asked Questions" sub="Common questions from researchers." />
        <div>
          <FaqItem
            q="Does GrantAssistant change the scientific content of my text?"
            a="No. The AI is instructed to remove words and shorten sentences only. It will not add new claims, change statistics, rename genes, or alter citations. Always review the output — use the ↩ Revert button instantly if anything looks wrong."
          />
          <FaqItem
            q="Is this allowed under NIH policy?"
            a="Yes, with disclosure. NIH's guidance (NOT-OD-23-149) permits AI use for administrative and formatting tasks when disclosed. GrantAssistant generates a compliance PDF for every action so you have that documentation ready."
          />
          <FaqItem
            q="Does GrantAssistant read my other browser tabs or history?"
            a="No. The extension only injects UI on ncbi.nlm.nih.gov pages and the GrantAssistant sign-in page. It has no access to any other website you visit."
          />
          <FaqItem
            q="Where is my text sent?"
            a="Text you trim is sent to GrantAssistant's secure server (hosted on Vercel) which calls the Anthropic Claude API. Your text is used only to perform the trim and is stored in your audit record so you can export it. It is never used to train AI models."
          />
          <FaqItem
            q="What if I don't have papers in My Bibliography yet?"
            a="The citation panel will still appear. When you click Find Best 4, GrantAssistant will let you know your bibliography is empty and prompt you to add papers. Once you add papers, come back and run the ranker."
          />
          <FaqItem
            q="Does it work on the Contributions to Science description text as well?"
            a='Yes. The ⚡ Trim button appears on any visible text area in SciENcv — including the description field for each Contribution to Science entry when you click "edit" on it.'
          />
          <FaqItem
            q="Is GrantAssistant free?"
            a={<>Yes, it is free and open source. The source code is available on <a href="https://github.com/sidb5/grant-assistant" target="_blank" rel="noopener noreferrer" style={{ color: '#4f6ef7' }}>GitHub</a>.</>}
          />
        </div>
      </Section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#1a2540', color: '#8899bb', textAlign: 'center', padding: '40px 24px', fontSize: '0.88rem' }}>
        <p style={{ marginBottom: 8 }}>
          <strong style={{ color: '#fff' }}>GrantAssistant</strong> — AI copilot for NIH SciENcv
        </p>
        <p style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/dashboard" style={{ color: '#6d8ef0', textDecoration: 'none' }}>Dashboard</a>
          <a href="https://github.com/sidb5/grant-assistant" target="_blank" rel="noopener noreferrer" style={{ color: '#6d8ef0', textDecoration: 'none' }}>GitHub</a>
          <a href="https://chromewebstore.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#6d8ef0', textDecoration: 'none' }}>Chrome Web Store</a>
        </p>
        <p style={{ marginTop: 12, fontSize: '0.8rem', color: '#5a6e99' }}>Built for university researchers navigating NIH grant season.</p>
      </footer>

    </div>
  )
}
