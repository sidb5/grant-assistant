'use client'

import { createBrowserSupabaseClient } from '@/lib/supabase'

export default function SignInButton() {
  async function handleSignIn() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
  }

  return (
    <button
      onClick={handleSignIn}
      style={{
        background: '#ffffff',
        color: '#4f6ef7',
        fontFamily: 'var(--font-mono)',
        border: '1px solid #c5cff5',
        padding: '12px 32px',
        borderRadius: '6px',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      Sign In
    </button>
  )
}
