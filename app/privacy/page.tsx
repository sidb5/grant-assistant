export const metadata = {
  title: 'Privacy Policy — GrantAssistant',
  description: 'Privacy policy for GrantAssistant and the GrantAssistant Chrome Extension.',
}

export default function PrivacyPage() {
  return (
    <main style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', background: '#f8f9fb', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#1a2540 0%,#2d3f6b 60%,#3d5a9e 100%)', color: '#fff', padding: '48px 24px 40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: '#b8c8f0', fontSize: '0.95rem' }}>GrantAssistant — Last updated May 2026</p>
      </header>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>

        <Section title="Overview">
          <P>GrantAssistant is a free, open-source tool that helps researchers prepare NIH grant biosketches using AI. This policy describes what data we collect, how we use it, and what we do not do with it.</P>
          <P>We do not sell, rent, or share your data with any third party for advertising or commercial purposes.</P>
        </Section>

        <Section title="What we collect">
          <P><strong>Account information.</strong> When you sign in with Google, we store your email address, display name, and a profile row in our database. This is used only to identify your audit records and personalise the PDF exports.</P>
          <P><strong>Text you trim.</strong> When you use the Trim feature, the text you submit and the trimmed result are stored in your audit record. This gives you a permanent before/after log you can export at any time.</P>
          <P><strong>Grant titles and publication metadata.</strong> When you use the Citation Ranker, the grant title you type and the list of publications you submit (title, PMID) are passed to the AI and stored in your audit record.</P>
          <P><strong>We do not collect</strong> browsing history, the content of pages you visit other than the text you explicitly submit, or any data outside of ncbi.nlm.nih.gov.</P>
        </Section>

        <Section title="How we use your data">
          <P><strong>To provide the service.</strong> Text is sent to Anthropic's Claude API solely to perform the trim or citation ranking you requested. It is not used to train AI models.</P>
          <P><strong>To generate compliance PDFs.</strong> Your stored audit records are used to generate the before/after compliance PDFs you can download from the dashboard.</P>
          <P><strong>To display your history.</strong> Your audit records are shown in the dashboard so you can review and export them.</P>
        </Section>

        <Section title="The Chrome Extension">
          <P>The GrantAssistant Chrome Extension requests the following permissions:</P>
          <ul style={{ paddingLeft: 24, color: '#4f5e78', lineHeight: 1.9, fontSize: '0.95rem' }}>
            <li><strong>storage</strong> — stores your session token locally so you stay signed in across browser sessions.</li>
            <li><strong>activeTab / tabs</strong> — opens the sign-in tab when you click "Sign in with Google" in the popup.</li>
            <li><strong>Host permission: ncbi.nlm.nih.gov</strong> — injects the Trim toolbar and Citation Ranker UI into SciENcv pages only.</li>
            <li><strong>Host permission: grant-assistant-omega.vercel.app</strong> — communicates with the GrantAssistant backend for AI calls and auth.</li>
          </ul>
          <P style={{ marginTop: 12 }}>The extension does not read the content of any other website you visit. It only activates on <code style={{ background: '#eef2ff', padding: '2px 6px', borderRadius: 4 }}>ncbi.nlm.nih.gov</code> pages and the GrantAssistant sign-in page.</P>
          <P>Your session token is stored in <code style={{ background: '#eef2ff', padding: '2px 6px', borderRadius: 4 }}>chrome.storage.local</code> with a 1-hour expiry. It is never written to <code style={{ background: '#eef2ff', padding: '2px 6px', borderRadius: 4 }}>localStorage</code> or any location accessible to web pages.</P>
        </Section>

        <Section title="Data retention">
          <P>Audit records are retained indefinitely so you can access your compliance history at any time. You can delete individual records or your entire account by contacting us.</P>
        </Section>

        <Section title="Third-party services">
          <ul style={{ paddingLeft: 24, color: '#4f5e78', lineHeight: 1.9, fontSize: '0.95rem' }}>
            <li><strong>Supabase</strong> — database and authentication. Data is stored in the US. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#4f6ef7' }}>Supabase Privacy Policy</a></li>
            <li><strong>Anthropic Claude API</strong> — AI model used for text trimming and citation ranking. Text submitted is not used for model training. <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#4f6ef7' }}>Anthropic Privacy Policy</a></li>
            <li><strong>Vercel</strong> — hosting for the web application. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#4f6ef7' }}>Vercel Privacy Policy</a></li>
            <li><strong>Google OAuth</strong> — used for sign-in. We receive only your email and display name. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#4f6ef7' }}>Google Privacy Policy</a></li>
          </ul>
        </Section>

        <Section title="Your rights">
          <P>You may request deletion of all your data at any time. To do so, email us or open a GitHub issue at <a href="https://github.com/sidb5/grant-assistant" target="_blank" rel="noopener noreferrer" style={{ color: '#4f6ef7' }}>github.com/sidb5/grant-assistant</a>. We will delete your account and all associated audit records within 30 days.</P>
        </Section>

        <Section title="Contact">
          <P>For privacy questions, open an issue on <a href="https://github.com/sidb5/grant-assistant" target="_blank" rel="noopener noreferrer" style={{ color: '#4f6ef7' }}>GitHub</a> or reach out through the repository.</P>
        </Section>

      </div>

      <footer style={{ background: '#1a2540', color: '#8899bb', textAlign: 'center', padding: '28px 24px', fontSize: '0.85rem' }}>
        <p><strong style={{ color: '#fff' }}>GrantAssistant</strong> — <a href="/" style={{ color: '#6d8ef0', textDecoration: 'none' }}>Home</a> · <a href="/dashboard" style={{ color: '#6d8ef0', textDecoration: 'none' }}>Dashboard</a></p>
      </footer>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a2540', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #e2e6ef' }}>{title}</h2>
      {children}
    </section>
  )
}

function P({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ fontSize: '0.95rem', color: '#4f5e78', lineHeight: 1.75, marginBottom: 10, ...style }}>{children}</p>
}
