import type { Metadata } from 'next'
import { IBM_Plex_Mono, DM_Serif_Display } from 'next/font/google'
import './globals.css'

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
})

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: 'GrantAssistant — SciENcv Suite',
  description: 'The compliance layer for NIH grant submissions. AI-powered trimming and citation selection with a full audit trail.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ibmPlexMono.variable} ${dmSerifDisplay.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
