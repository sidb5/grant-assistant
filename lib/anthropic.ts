import Anthropic from '@anthropic-ai/sdk'

export const TRIM_MODEL = 'claude-sonnet-4-20250514'

// Create the client lazily so process.env is read at request time, not at
// module-load time (which can run before Next.js injects .env.local values).
export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in environment')
  return new Anthropic({ apiKey })
}
