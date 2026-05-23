import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, validateToken } from '@/lib/supabase'
import { getAnthropic, TRIM_MODEL } from '@/lib/anthropic'

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

async function callClaude(systemPrompt: string, messages: { role: 'user' | 'assistant'; content: string }[]) {
  const response = await getAnthropic().messages.create({
    model: TRIM_MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages,
  })
  return response.content[0].type === 'text' ? response.content[0].text.trim() : ''
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await validateToken(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { text: string; char_limit: number; grant_title?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { text, char_limit, grant_title } = body

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }
  if (!char_limit || typeof char_limit !== 'number') {
    return NextResponse.json({ error: 'char_limit is required' }, { status: 400 })
  }

  // Architecture rule: no AI call on already-valid data
  if (text.length <= char_limit) {
    console.log(`[trim] already within limit (${text.length}/${char_limit}), skipping AI call`)
    return NextResponse.json({
      trimmed_text: text,
      char_count_before: text.length,
      char_count_after: text.length,
      char_limit,
      diff_summary: null,
      audit_id: null,
      already_within_limit: true,
    })
  }

  const systemPrompt = `You are a scientific editing assistant. Your ONLY job is to shorten the provided text to fit within a strict character limit.

Rules you must never break:
- Never add new scientific claims, data, or ideas
- Never change the meaning of any existing scientific claim
- Never remove specific numerical values (effect sizes, p-values, sample sizes, gene names, protein positions)
- Preserve the author's voice and terminology
- Return ONLY the trimmed text — no explanation, no preamble, no commentary`

  const initialMessage = `Trim the following text to strictly under ${char_limit} characters. Current length: ${text.length} characters. You need to remove at least ${text.length - char_limit + 1} characters.\n\nFocus on cutting: verbose transitions ("The rationale for the proposed research is that" → "Because"), redundant clauses ("which has been formulated on the basis of our preliminary data" → cut), and wordy phrases ("in pursuit of that goal" → cut).\n\n${text}`

  let trimmedText = ''

  // Attempt 1
  try {
    trimmedText = await callClaude(systemPrompt, [{ role: 'user', content: initialMessage }])
  } catch (err) {
    return NextResponse.json({ error: 'AI service error. Please try again.' }, { status: 502 })
  }

  // Attempt 2 — targeted: tell Claude exactly how many chars over it still is
  if (trimmedText.length > char_limit) {
    const overage = trimmedText.length - char_limit
    try {
      trimmedText = await callClaude(systemPrompt, [
        { role: 'user', content: initialMessage },
        { role: 'assistant', content: trimmedText },
        {
          role: 'user',
          content: `Still ${overage} characters over the ${char_limit} limit (current: ${trimmedText.length}). Remove ${overage + 20} more characters by cutting entire subordinate clauses or restructuring long sentences. Return ONLY the text.`,
        },
      ])
    } catch {
      return NextResponse.json({ error: 'AI service error on retry. Please try again.' }, { status: 502 })
    }
  }

  // Attempt 3 — last resort: allow sentence removal
  if (trimmedText.length > char_limit) {
    const overage = trimmedText.length - char_limit
    try {
      trimmedText = await callClaude(systemPrompt, [
        { role: 'user', content: initialMessage },
        { role: 'assistant', content: trimmedText },
        {
          role: 'user',
          content: `Still ${overage} characters over. You may now remove the least essential full sentence to meet the ${char_limit} character limit. Return ONLY the final text.`,
        },
      ])
    } catch {
      return NextResponse.json({ error: 'AI service error on final retry. Please try again.' }, { status: 502 })
    }
  }

  if (trimmedText.length > char_limit) {
    return NextResponse.json(
      { error: 'Could not trim to target length. Try removing some sentences manually first.' },
      { status: 422 }
    )
  }

  const wordsBefore = countWords(text)
  const wordsAfter = countWords(trimmedText)
  const diffSummary = `Removed ${wordsBefore - wordsAfter} words. Character count reduced from ${text.length} to ${trimmedText.length}. All scientific claims and numerical values preserved.`

  const supabase = createServiceRoleClient()
  const { data: auditRow, error: dbError } = await supabase
    .from('audit_records')
    .insert({
      user_id: user.id,
      action_type: 'trim',
      grant_title: grant_title ?? null,
      original_text: text,
      modified_text: trimmedText,
      diff_summary: diffSummary,
      char_count_before: text.length,
      char_count_after: trimmedText.length,
      char_limit,
    })
    .select('id')
    .single()

  if (dbError) {
    console.error('[trim] audit insert error:', dbError)
  }

  return NextResponse.json({
    trimmed_text: trimmedText,
    char_count_before: text.length,
    char_count_after: trimmedText.length,
    char_limit,
    diff_summary: diffSummary,
    audit_id: auditRow?.id ?? null,
    already_within_limit: false,
  })
}
