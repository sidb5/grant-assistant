import SignInButton from '@/components/SignInButton'

export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ background: '#f8f9fc', color: '#1e2a3a' }}>
      {/* Hero */}
      <section
        className="flex flex-col items-center justify-center text-center px-6"
        style={{ minHeight: '100vh' }}
      >
        {/* Logo mark above the title */}
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #4f6ef7 0%, #7c8ff5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(79,110,247,0.35)', marginBottom: 24 }}>
          <svg width="34" height="34" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 3.5A1.5 1.5 0 015.5 2h6.086a1.5 1.5 0 011.06.44l2.915 2.914A1.5 1.5 0 0116 6.414V16.5A1.5 1.5 0 0114.5 18h-9A1.5 1.5 0 014 16.5v-13z" fill="white" fillOpacity="0.25"/>
            <path d="M5.5 2H11.5V6.5H16" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 3.5A1.5 1.5 0 015.5 2h6.086a1.5 1.5 0 011.06.44l2.915 2.914A1.5 1.5 0 0116 6.414V16.5A1.5 1.5 0 0114.5 18h-9A1.5 1.5 0 014 16.5v-13z" stroke="white" strokeWidth="1.3" strokeLinejoin="round"/>
            <path d="M10.5 8.5L9 12H11L9.5 15.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1
          className="text-5xl md:text-7xl font-bold mb-6"
          style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em', color: '#1e2a3a' }}
        >
          GrantAssistant
        </h1>
        <p
          className="text-xl md:text-2xl mb-3"
          style={{ color: '#6b7a99', fontFamily: 'var(--font-mono)' }}
        >
          The compliance layer for NIH grant submissions.
        </p>
        <p
          className="text-lg md:text-xl mb-12"
          style={{ color: '#4f6ef7', fontFamily: 'var(--font-mono)' }}
        >
          Keep the science yours. Prove it.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 rounded-md font-medium text-sm"
            style={{
              background: '#4f6ef7',
              color: '#fff',
              fontFamily: 'var(--font-mono)',
              border: '1px solid #3b5bdb',
              textDecoration: 'none',
            }}
          >
            Add to Chrome — Free
          </a>
          <SignInButton />
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            title="Character-Perfect Trimming"
            body="AI removes filler words to hit SciENcv character limits. Your scientific claims stay untouched."
            icon="✂"
          />
          <FeatureCard
            title="Intelligent Citation Selection"
            body="Paste your grant title. We rank your publications by relevance and highlight the best 4 for each Contribution to Science."
            icon="🎯"
          />
          <FeatureCard
            title="Proof of Originality"
            body="Every AI action is logged with a before/after diff. Export a compliance PDF if NIH ever asks."
            icon="📋"
          />
        </div>
      </section>

      <footer
        className="text-center py-8 text-sm"
        style={{ color: '#a0aec0', fontFamily: 'var(--font-mono)', borderTop: '1px solid #dde3f0' }}
      >
        © 2025 GrantAssistant — grantassistant.app
      </footer>
    </main>
  )
}

function FeatureCard({ title, body, icon }: { title: string; body: string; icon: string }) {
  return (
    <div
      className="rounded-xl p-6"
      style={{ background: '#ffffff', border: '1px solid #dde3f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      <div className="text-3xl mb-4">{icon}</div>
      <h3
        className="text-lg font-semibold mb-3"
        style={{ fontFamily: 'var(--font-serif)', color: '#1e2a3a' }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: '#6b7a99', fontFamily: 'var(--font-mono)' }}>
        {body}
      </p>
    </div>
  )
}
