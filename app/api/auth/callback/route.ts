import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL('/', url.origin))
  }

  // Create the redirect response first so we can attach Set-Cookie headers to it.
  // @supabase/ssr writes session cookies by calling the `set` handler below —
  // those writes must go onto the *response*, not cookieStore, or the browser
  // never receives them and every subsequent request looks unauthenticated.
  const response = NextResponse.redirect(new URL(next, url.origin))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value, ...(options as object) })
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value: '', ...(options as object) })
        },
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !session) {
    return NextResponse.redirect(new URL('/?auth_error=1', url.origin))
  }

  // Upsert profile row — service role bypasses RLS during first account creation
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { user } = session
  await serviceClient.from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? '',
      full_name:
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        '',
      institution: user.user_metadata?.institution ?? '',
    },
    { onConflict: 'id' }
  )

  // Return the response — it now carries the Supabase session cookies in its
  // Set-Cookie headers, so the middleware will see an authenticated user on
  // the very next request.
  return response
}
