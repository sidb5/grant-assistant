import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, validateToken } from '@/lib/supabase'

const PAGE_SIZE = 20

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await validateToken(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
  const typeFilter = url.searchParams.get('type') ?? ''

  const supabase = createServiceRoleClient()

  // Base query scoped to this user
  let query = supabase
    .from('audit_records')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (typeFilter === 'trim' || typeFilter === 'citation_select') {
    query = query.eq('action_type', typeFilter)
  }

  const { data: records, count, error } = await query
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch audit records' }, { status: 500 })
  }

  // Compute month stats — fetch all records for the current calendar month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: monthRecords } = await supabase
    .from('audit_records')
    .select('action_type, char_count_before, char_count_after')
    .eq('user_id', user.id)
    .gte('created_at', monthStart)

  const stats = (monthRecords ?? []).reduce(
    (acc, r) => {
      if (r.action_type === 'trim') {
        acc.trims_this_month++
        acc.chars_saved_this_month += (r.char_count_before ?? 0) - (r.char_count_after ?? 0)
      }
      if (r.action_type === 'citation_select') {
        acc.citations_this_month++
      }
      return acc
    },
    { trims_this_month: 0, citations_this_month: 0, chars_saved_this_month: 0 }
  )

  return NextResponse.json({
    records: records ?? [],
    total: count ?? 0,
    page,
    stats,
  })
}
