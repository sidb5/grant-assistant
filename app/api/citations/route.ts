import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, validateToken } from '@/lib/supabase'
import { getAnthropic, TRIM_MODEL } from '@/lib/anthropic'
import { fetchAbstracts } from '@/lib/pubmed'

interface Publication {
  pmid: string
  title: string
  abstract?: string
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await validateToken(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { grant_title: string; grant_aims?: string; publications: Publication[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { grant_title, grant_aims, publications } = body

  if (!grant_title || typeof grant_title !== 'string') {
    return NextResponse.json({ error: 'grant_title is required' }, { status: 400 })
  }
  if (!publications || !Array.isArray(publications) || publications.length === 0) {
    return NextResponse.json({ error: 'publications array is required' }, { status: 400 })
  }

  // Fetch missing abstracts from PubMed
  const pmidsNeedingAbstracts = publications
    .filter(p => !p.abstract || p.abstract.trim() === '')
    .map(p => p.pmid)
    .filter(id => /^\d{7,8}$/.test(id))

  let abstractMap: Record<string, string> = {}
  if (pmidsNeedingAbstracts.length > 0) {
    abstractMap = await fetchAbstracts(pmidsNeedingAbstracts)
  }

  const enrichedPubs = publications.map(p => ({
    ...p,
    abstract: p.abstract?.trim() || abstractMap[p.pmid] || '',
  }))

  const pubList = enrichedPubs
    .map((p, i) => `${i + 1}. PMID: ${p.pmid}\nTitle: ${p.title}\nAbstract: ${p.abstract || '(not available)'}`)
    .join('\n\n')

  // SciENcv allows up to 4 citations per Contribution to Science entry.
  const systemPrompt = `You are a scientific grant advisor. Given a grant title and list of publications, identify the 4 most relevant publications. Relevance means: direct methodological overlap, same disease area, same biological target, or foundational citations the reviewer would expect to see. Return ONLY a valid JSON array of exactly 4 items, no other text, no markdown fences:
[{"pmid": "string", "title": "string", "reason": "one sentence why this is relevant"}]`

  const userMessage = `Grant title: ${grant_title}\n\nAims: ${grant_aims ?? 'Not provided'}\n\nPublications:\n${pubList}`

  let responseText = ''
  try {
    const response = await getAnthropic().messages.create({
      model: TRIM_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })
    responseText = response.content[0].type === 'text' ? response.content[0].text : ''
  } catch {
    return NextResponse.json({ error: 'AI service error. Please try again.' }, { status: 502 })
  }

  let selected: Array<{ pmid: string; title: string; reason: string }>
  try {
    // Strip any accidental markdown fences before parsing
    const cleaned = responseText.replace(/```(?:json)?/g, '').trim()
    selected = JSON.parse(cleaned)
    if (!Array.isArray(selected)) throw new Error('Not an array')
  } catch {
    return NextResponse.json(
      { error: 'AI returned malformed response. Please try again.' },
      { status: 422 }
    )
  }

  const supabase = createServiceRoleClient()
  const { data: auditRow, error: dbError } = await supabase
    .from('audit_records')
    .insert({
      user_id: user.id,
      action_type: 'citation_select',
      grant_title,
      citations_selected: selected,
    })
    .select('id')
    .single()

  if (dbError) {
    console.error('[citations] audit insert error:', dbError)
  }

  return NextResponse.json({
    selected,
    audit_id: auditRow?.id ?? null,
  })
}
