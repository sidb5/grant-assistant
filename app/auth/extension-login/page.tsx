'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'

export default function ExtensionLoginPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    async function handleAuth() {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.access_token) {
        // Token ready — broadcast to the extension content script via postMessage
        window.postMessage(
          { type: 'GRANT_ASSISTANT_AUTH', token: session.access_token },
          '*'
        )
        setStatus('success')
        return
      }

      // No session yet — kick off Google OAuth
      const redirectTo = `${window.location.origin}/api/auth/callback?next=/auth/extension-login`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })

      if (error) {
        setStatus('error')
      }
    }

    handleAuth()
  }, [])

  if (status === 'success') {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0f1e',
          fontFamily: "'IBM Plex Mono', monospace",
          color: '#4ade80',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✓</div>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            Authentication successful. You can close this tab.
          </p>
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0f1e',
          fontFamily: "'IBM Plex Mono', monospace",
          color: '#f87171',
        }}
      >
        <p>Authentication failed. Please close this tab and try again.</p>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0f1e',
        fontFamily: "'IBM Plex Mono', monospace",
        color: '#94a3b8',
      }}
    >
      <p>Signing in with Google…</p>
    </main>
  )
}
