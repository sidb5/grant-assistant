import { NextResponse } from 'next/server'
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import path from 'path'
import fs from 'fs'

// ── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', fontSize: 10, color: '#1e2a3a', backgroundColor: '#ffffff' },

  // Header
  header:      { backgroundColor: '#1a2540', padding: '48 40 40 40' },
  headerTitle: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: '#ffffff', marginBottom: 6 },
  headerSub:   { fontSize: 11, color: '#b8c8f0', lineHeight: 1.5, marginBottom: 16 },
  headerTag:   { fontSize: 9.5, color: '#8aa4de' },

  // Social proof
  proofSection:  { backgroundColor: '#f8f9fb', padding: '28 40', borderBottom: '1 solid #e2e6ef' },
  proofLabel:    { fontSize: 8, color: '#8a96aa', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' },
  proofLogos:    { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 14 },
  proofLogo:     { height: 40, width: 178, borderRadius: 5, border: '1 solid #e2e6ef' },
  proofText:     { fontSize: 9.5, color: '#5a6a82', textAlign: 'center', lineHeight: 1.55 },

  // Body
  body:        { padding: '0 40' },
  section:     { paddingTop: 28, paddingBottom: 4 },
  sectionAlt:  { paddingTop: 28, paddingBottom: 4, backgroundColor: '#f8f9fb', marginHorizontal: -40, paddingHorizontal: 40 },

  h2:          { fontSize: 17, fontFamily: 'Helvetica-Bold', color: '#1a2540', marginBottom: 5 },
  h3:          { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1a2540', marginBottom: 4, marginTop: 12 },
  p:           { fontSize: 10, color: '#4f5e78', lineHeight: 1.65, marginBottom: 8 },
  sub:         { fontSize: 10, color: '#5a6a82', marginBottom: 18, lineHeight: 1.55 },
  divider:     { borderBottom: '1 solid #e2e6ef', marginVertical: 16 },

  // Steps
  stepRow:     { flexDirection: 'row', gap: 14, marginBottom: 20 },
  stepNum:     { width: 28, height: 28, borderRadius: 14, backgroundColor: '#4f6ef7', color: '#fff', fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'center', paddingTop: 6, flexShrink: 0 },
  stepBody:    { flex: 1 },

  // Callouts
  calloutGreen: { backgroundColor: '#f0fdf4', borderLeft: '3 solid #22c55e', padding: '10 14', borderRadius: 6, marginVertical: 10 },
  calloutBlue:  { backgroundColor: '#eff4ff', borderLeft: '3 solid #4f6ef7', padding: '10 14', borderRadius: 6, marginVertical: 10 },
  calloutAmber: { backgroundColor: '#fffbeb', borderLeft: '3 solid #f59e0b', padding: '10 14', borderRadius: 6, marginVertical: 10 },
  calloutText:  { fontSize: 9.5, lineHeight: 1.6 },

  // Pain cards
  cardRow:     { flexDirection: 'row', gap: 12, marginBottom: 20 },
  card:        { flex: 1, backgroundColor: '#fff', border: '1 solid #e2e6ef', borderRadius: 8, padding: '14 12' },
  cardIcon:    { fontSize: 18, marginBottom: 6 },
  cardTitle:   { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1a2540', marginBottom: 4 },
  cardBody:    { fontSize: 9, color: '#5a6a82', lineHeight: 1.55 },

  // Screenshot
  screenshot:  { width: '100%', borderRadius: 6, border: '1 solid #dde3f0', marginVertical: 10 },
  caption:     { fontSize: 8, color: '#8a96aa', textAlign: 'center', marginBottom: 10 },

  // Feature chips
  chipRow:     { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 18 },
  chip:        { backgroundColor: '#eff4ff', border: '1 solid #c7d7fc', borderRadius: 6, padding: '5 10', fontSize: 8.5, color: '#2d4baa', fontFamily: 'Helvetica-Bold' },

  // FAQ
  faqQ:        { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1a2540', marginBottom: 3, marginTop: 12 },
  faqA:        { fontSize: 9.5, color: '#4f5e78', lineHeight: 1.6, marginBottom: 4 },

  // Footer
  footer:      { backgroundColor: '#1a2540', padding: '24 40', marginTop: 20 },
  footerText:  { fontSize: 9, color: '#8899bb', textAlign: 'center', lineHeight: 1.8 },
  footerTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#ffffff', textAlign: 'center', marginBottom: 4 },
})

// ── Image loader — returns a base64 data URI so @react-pdf can render it ──────
// Using file paths directly is unreliable in the Next.js runtime; base64 is not.
function img(filename: string): string {
  const abs = path.join(process.cwd(), 'public', filename)
  const buf = fs.readFileSync(abs)
  return `data:image/png;base64,${buf.toString('base64')}`
}

// Pre-load all images once at request time (not at module load time)
function loadImages() {
  return {
    ucsd:     img('logos/uc-san-diego.png'),
    ucsf:     img('logos/uc-san-francisco.png'),
    uci:      img('logos/uc-irvine.png'),
    salk:     img('logos/salk-institute.png'),
    sbp:      img('logos/sanford-burnham.png'),
    step1:    img('screenshots/install-step1-search.png'),
    step2:    img('screenshots/install-step2-add.png'),
    step3:    img('screenshots/install-step3-confirm.png'),
    trimBefore: img('screenshots/trim-before.png'),
    trimAfter:  img('screenshots/trim-after.png'),
    citEmpty:   img('screenshots/citations-empty.png'),
    citResult:  img('screenshots/citations-results.png'),
    dashboard:  img('screenshots/dashboard.png'),
  }
}

// ── PDF Document ─────────────────────────────────────────────────────────────
function GuidePDF({ imgs }: { imgs: ReturnType<typeof loadImages> }) {
  return (
    <Document title="GrantAssistant — User Guide" author="GrantAssistant">

      {/* ════════════════════════════════════════════
          PAGE 1  –  Cover + Social Proof + Why
      ════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <Text style={S.headerTitle}>GrantAssistant</Text>
          <Text style={S.headerSub}>
            AI-powered text trimming and citation ranking for NIH SciENcv —{'\n'}
            with a built-in compliance audit trail.
          </Text>
          <Text style={S.headerTag}>Free  ·  NIH Compliant  ·  Works inside SciENcv  ·  Audit PDF included</Text>
        </View>

        {/* Social proof */}
        <View style={S.proofSection}>
          <Text style={S.proofLabel}>Trusted by researchers at leading institutions</Text>
          <View style={S.proofLogos}>
            <Image style={S.proofLogo} src={imgs.ucsd} />
            <Image style={S.proofLogo} src={imgs.ucsf} />
            <Image style={S.proofLogo} src={imgs.uci} />
            <Image style={S.proofLogo} src={imgs.salk} />
            <Image style={S.proofLogo} src={imgs.sbp} />
          </View>
          <Text style={S.proofText}>
            Researchers across Southern California's leading biomedical institutions use GrantAssistant
            to streamline NIH biosketch preparation for R01, R21, and K-award submissions.
          </Text>
        </View>

        {/* Why section */}
        <View style={[S.section, S.body]}>
          <Text style={S.h2}>Built for researchers preparing NIH grants</Text>
          <Text style={S.sub}>SciENcv enforces strict formatting rules. GrantAssistant handles the tedious parts so you can focus on the science.</Text>
          <View style={S.cardRow}>
            <View style={S.card}>
              <Text style={S.cardIcon}>✂</Text>
              <Text style={S.cardTitle}>Character limits are brutal</Text>
              <Text style={S.cardBody}>The Personal Statement allows only 2,500 characters. Cutting your own writing without losing key scientific claims takes hours.</Text>
            </View>
            <View style={S.card}>
              <Text style={S.cardIcon}>📚</Text>
              <Text style={S.cardTitle}>Choosing 4 citations is hard</Text>
              <Text style={S.cardBody}>Each Contribution to Science entry allows up to 4 citations. Picking the most relevant from dozens of papers is time-consuming.</Text>
            </View>
            <View style={S.card}>
              <Text style={S.cardIcon}>📝</Text>
              <Text style={S.cardTitle}>NIH requires AI disclosure</Text>
              <Text style={S.cardBody}>NIH's NOT-OD-23-149 requires documentation when AI is used. GrantAssistant generates a compliance PDF automatically.</Text>
            </View>
          </View>
        </View>

        <View style={[S.body, { paddingBottom: 28 }]}>
          <View style={S.divider} />
          <Text style={[S.p, { color: '#8a96aa', fontSize: 9, textAlign: 'center' }]}>
            GrantAssistant — grant-assistant-omega.vercel.app  ·  Free & Open Source
          </Text>
        </View>
      </Page>

      {/* ════════════════════════════════════════════
          PAGE 2  –  Installation + Sign-in
      ════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={[S.header, { padding: '24 40' }]}>
          <Text style={[S.headerTitle, { fontSize: 18 }]}>Installation &amp; Sign In</Text>
        </View>

        <View style={S.body}>
          <View style={S.section}>
            <Text style={S.h2}>Installing the Chrome Extension</Text>
            <Text style={S.sub}>Installs in under two minutes from the Chrome Web Store. No configuration needed before install.</Text>

            <View style={S.stepRow}>
              <Text style={S.stepNum}>1</Text>
              <View style={S.stepBody}>
                <Text style={S.h3}>Open the Chrome Web Store</Text>
                <Text style={S.p}>Go to chromewebstore.google.com in Chrome. Type "GrantAssistant" in the search box and press Enter.</Text>
                <Image style={S.screenshot} src={imgs.step1} />
              </View>
            </View>

            <View style={S.stepRow}>
              <Text style={S.stepNum}>2</Text>
              <View style={S.stepBody}>
                <Text style={S.h3}>Click "Add to Chrome"</Text>
                <Text style={S.p}>Select GrantAssistant — SciENcv Assistant from results and click the blue Add to Chrome button.</Text>
                <Image style={S.screenshot} src={imgs.step2} />
              </View>
            </View>

            <View style={S.stepRow}>
              <Text style={S.stepNum}>3</Text>
              <View style={S.stepBody}>
                <Text style={S.h3}>Confirm &amp; Sign In</Text>
                <Text style={S.p}>Click "Add extension" in the confirmation dialog. Then click the GrantAssistant icon in your toolbar and sign in with Google.</Text>
                <Image style={S.screenshot} src={imgs.step3} />
              </View>
            </View>

            <View style={S.calloutGreen}>
              <Text style={[S.calloutText, { color: '#14532d' }]}>
                ✓ Privacy: GrantAssistant stores only a short-lived session token (1-hour expiry). Your credentials and API keys are never stored in the extension. It only injects UI on ncbi.nlm.nih.gov pages.
              </Text>
            </View>
          </View>
        </View>
      </Page>

      {/* ════════════════════════════════════════════
          PAGE 3  –  Text Trimming
      ════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={[S.header, { padding: '24 40' }]}>
          <Text style={[S.headerTitle, { fontSize: 18 }]}>⚡ Text Trimming</Text>
        </View>

        <View style={S.body}>
          <View style={S.section}>
            <Text style={S.sub}>When your Personal Statement or Contribution description exceeds the character limit, GrantAssistant condenses it — removing redundant phrasing while preserving every scientific claim, number, and citation.</Text>

            <View style={S.chipRow}>
              <Text style={S.chip}>⚡ Trim — condense to fit the limit</Text>
              <Text style={S.chip}>⎘ Copy — copy to clipboard</Text>
              <Text style={S.chip}>↩ Revert — undo the trim instantly</Text>
            </View>

            <View style={S.stepRow}>
              <Text style={S.stepNum}>1</Text>
              <View style={S.stepBody}>
                <Text style={S.h3}>Open your biosketch and click "edit"</Text>
                <Text style={S.p}>Navigate to ncbi.nlm.nih.gov/myncbi. Click "edit" next to the Personal Statement or any Contribution description.</Text>
              </View>
            </View>

            <View style={S.stepRow}>
              <Text style={S.stepNum}>2</Text>
              <View style={S.stepBody}>
                <Text style={S.h3}>The Trim toolbar appears below the text area</Text>
                <Image style={S.screenshot} src={imgs.trimBefore} />
                <Text style={S.caption}>The Trim toolbar appears automatically below any editable text field</Text>
              </View>
            </View>

            <View style={S.stepRow}>
              <Text style={S.stepNum}>3</Text>
              <View style={S.stepBody}>
                <Text style={S.h3}>Click ⚡ Trim and review the result</Text>
                <Image style={S.screenshot} src={imgs.trimAfter} />
                <Text style={S.caption}>Success tooltip confirms the character reduction — ↩ Revert activates in case you need to undo</Text>
              </View>
            </View>

            <View style={S.calloutGreen}>
              <Text style={[S.calloutText, { color: '#14532d' }]}>
                ✓ Removes wordy phrases and redundant transitions{'\n'}
                ✓ Shortens multi-clause sentences{'\n'}
                ✗ Never changes a number, p-value, gene name, or citation{'\n'}
                ✗ Never introduces a new claim or idea
              </Text>
            </View>

            <View style={S.calloutAmber}>
              <Text style={[S.calloutText, { color: '#78350f' }]}>
                Always review the trimmed text before saving. Use ↩ Revert to restore the original instantly if anything looks wrong.
              </Text>
            </View>
          </View>
        </View>
      </Page>

      {/* ════════════════════════════════════════════
          PAGE 4  –  Citation Ranker + Audit
      ════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={[S.header, { padding: '24 40' }]}>
          <Text style={[S.headerTitle, { fontSize: 18 }]}>🎯 Citation Ranker &amp; 📄 Audit Trail</Text>
        </View>

        <View style={S.body}>
          <View style={S.section}>
            <Text style={S.h2}>🎯 Citation Ranker</Text>
            <Text style={S.sub}>Each Contribution to Science entry allows up to four citations. Given your grant title, GrantAssistant ranks your My Bibliography papers and highlights the best four with relevance reasons.</Text>

            <Image style={S.screenshot} src={imgs.citEmpty} />
            <Text style={S.caption}>The GrantAssistant panel appears above each Contribution to Science entry</Text>

            <Image style={S.screenshot} src={imgs.citResult} />
            <Text style={S.caption}>Top 4 papers ranked by relevance with one-sentence explanations for each</Text>

            <View style={S.calloutBlue}>
              <Text style={[S.calloutText, { color: '#1a2a5e' }]}>
                No papers yet? Go to My Bibliography to add your publications first. You can also connect your ORCiD account directly from the Citations tab.
              </Text>
            </View>
          </View>

          <View style={S.divider} />

          <View style={S.section}>
            <Text style={S.h2}>📄 Compliance Audit Trail</Text>
            <Text style={S.sub}>Every Trim and Citation action is automatically logged. Export signed PDFs for your grants office.</Text>

            <Image style={S.screenshot} src={imgs.dashboard} />
            <Text style={S.caption}>The dashboard — every action logged with one-click PDF export</Text>

            <View style={S.calloutBlue}>
              <Text style={[S.calloutText, { color: '#1a2a5e' }]}>
                NIH NOT-OD-23-149 requires AI disclosure. Each PDF certifies that AI was used only for formatting/ranking — not for writing new science. Generated automatically with every action.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={S.footer}>
          <Text style={S.footerTitle}>GrantAssistant</Text>
          <Text style={S.footerText}>
            Free & Open Source  ·  grant-assistant-omega.vercel.app{'\n'}
            Built for university researchers navigating NIH grant season.
          </Text>
        </View>
      </Page>

    </Document>
  )
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const imgs = loadImages()
    const buffer = await renderToBuffer(<GuidePDF imgs={imgs} />)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="GrantAssistant-Guide.pdf"',
      },
    })
  } catch (err) {
    console.error('Guide PDF generation failed:', err)
    return new NextResponse(JSON.stringify({ error: 'PDF generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
