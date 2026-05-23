# CLAUDE.md — BiotechOS SciENcv Suite

This file is read by Claude Code at the start of every session. Follow all instructions here without asking for confirmation.

---

## Project Identity

**Product:** BiotechOS SciENcv Suite
**What it is:** A Next.js backend + Chrome Extension that adds AI-powered text trimming and citation selection to NIH's SciENcv tool, with a full compliance audit trail.
**Who it's for:** University researchers and PIs who use SciENcv for NIH grant submissions.

---

## Permissions

You have been granted full permissions by the project owner to:

- Scaffold files and directories without asking
- Install any npm packages required to complete tasks in TASKS.md
- Make architectural decisions when the task list is ambiguous — document your decisions in README.md
- Create, edit, and delete any file in this repository
- Write and run scripts to verify your work
- Choose sensible defaults (port numbers, timeouts, retry counts, error messages) without asking

You do not need to ask "shall I proceed?" before any step. Execute and document.

---

## Architecture Rules — Non-Negotiable

1. **The Anthropic API key lives only in `.env.local` and is only accessed server-side in Next.js API routes.** It must never appear in any client component, any file in `/extension`, or any browser-accessible endpoint.

2. **The Chrome extension stores only a Supabase session token in `chrome.storage.local`.** Never an API key. Never a service role key.

3. **All API routes must validate the Bearer token** from the Authorization header using the Supabase service role client before doing anything else. Return 401 immediately if invalid.

4. **Supabase Row Level Security is mandatory.** Every table must have RLS enabled. Users must never be able to read or write another user's records. Do not disable RLS for convenience.

5. **No AI calls on already-valid data.** If text is already under the character limit, return it immediately without calling Claude. Log this case but do not insert an audit record.

---

## Tech Stack — Do Not Deviate

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database + Auth | Supabase (Postgres + Google OAuth) |
| Styling | Tailwind CSS |
| AI Model | `claude-sonnet-4-20250514` |
| PDF Generation | `@react-pdf/renderer` |
| Extension | Manifest V3, vanilla JS, no bundler |
| Deployment | Vercel |

Do not substitute alternatives (no Prisma instead of Supabase, no Drizzle, no Firebase, no Express).

---

## Build Order

Always build in this sequence. Do not jump ahead:

1. Supabase schema (`supabase/schema.sql`)
2. Environment variable template (`.env.local.example`)
3. Next.js project scaffold (all files and folders from TASKS.md Task 1.1)
4. `lib/supabase.ts`, `lib/anthropic.ts`, `lib/pubmed.ts`
5. Auth flow (`middleware.ts`, callback route, extension-login page)
6. API routes (trim → citations → audit → audit/export → me)
7. Dashboard UI
8. Landing page
9. Chrome extension (`manifest.json` → `background.js` → `popup.html/js` → `content.js` → `content.css`)
10. `README.md`
11. Run through verification checklist in TASKS.md Part 4

---

## Code Style

- TypeScript for all Next.js files (`.ts`, `.tsx`)
- Vanilla JavaScript for the extension (no TypeScript, no bundler — it must load as an unpacked extension)
- Use `async/await` not `.then()` chains
- All API routes must have explicit error handling with appropriate HTTP status codes
- All user-facing error messages must be plain English, not stack traces
- CSS class names in `content.css` must all be prefixed `bioos-` to avoid conflicts with SciENcv

---

## Claude API Usage

Use this exact pattern for all Claude API calls:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  system: '...',
  messages: [{ role: 'user', content: '...' }]
});

const text = response.content[0].type === 'text' ? response.content[0].text : '';
```

---

## Supabase Usage

**Server-side (API routes) — use service role client:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

**Validating a Bearer token in an API route:**
```typescript
const authHeader = request.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '');
if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

---

## Extension Specifics

- The extension must work when loaded as an unpacked extension from the `/extension` folder
- The `APP_URL` constant appears in both `background.js` and `content.js` — use a comment flagging it for replacement: `// REPLACE BEFORE DEPLOY`
- Content script uses a `MutationObserver` to handle SciENcv's dynamically loaded content
- All injected UI elements use `z-index: 99999` to appear above SciENcv's own overlays
- Never inject more than one BiotechOS button per field — check for `data-biotech-os-injected` before injecting

---

## What "Done" Means

The build is complete when every checkbox in TASKS.md Part 4 (Final Verification Checklist) is confirmed. Do not stop before that. If a feature cannot be fully implemented, document the gap clearly in README.md under a "Known Limitations" section rather than silently skipping it.

---

## If You Are Resuming a Session

1. Read this file
2. Read TASKS.md
3. Check which Part 4 checklist items are not yet passing
4. Continue from the first failing item

Do not re-do work that is already complete. Do not ask the user what to do next — determine it from the checklist.
