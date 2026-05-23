# BiotechOS SciENcv Suite — Full Build Task List

## Overview
A two-part product:
1. A Next.js web backend + dashboard (deployed to Vercel, database on Supabase)
2. A Chrome Extension (Manifest V3) that injects into SciENcv pages and calls your backend

The product helps university researchers using NIH's SciENcv tool by adding two AI-powered features: semantic text trimming with a compliance audit trail, and intelligent citation selection. The backend holds all secrets. The extension holds none.

---

## Tech Stack — Do Not Deviate

- **Framework:** Next.js 14 (App Router)
- **Database + Auth:** Supabase (Postgres + Google OAuth)
- **Styling:** Tailwind CSS
- **AI:** Anthropic Claude API (`claude-sonnet-4-20250514`)
- **PDF Generation:** `@react-pdf/renderer`
- **Chrome Extension:** Manifest V3, vanilla JS content scripts, no bundler needed
- **Deployment target:** Vercel (structure accordingly)

---

## PART 1: Backend (Next.js App)

### Task 1.1 — Project Scaffold

Create the following directory and file structure before writing any logic:

```
/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # Landing page
│   ├── dashboard/
│   │   └── page.tsx                    # Authenticated user dashboard
│   └── api/
│       ├── auth/
│       │   └── callback/route.ts
│       ├── trim/
│       │   └── route.ts
│       ├── citations/
│       │   └── route.ts
│       └── audit/
│           ├── route.ts                # GET: fetch user's audit records
│           └── export/route.ts         # GET: export audit PDF
├── lib/
│   ├── supabase.ts
│   ├── anthropic.ts
│   └── pubmed.ts
├── components/
│   └── dashboard/
│       ├── AuditTable.tsx
│       └── ExportButton.tsx
├── extension/                          # Chrome extension lives here
│   ├── manifest.json
│   ├── content.js
│   ├── content.css
│   ├── background.js
│   ├── popup.html
│   └── popup.js
├── supabase/
│   └── schema.sql
├── middleware.ts                       # Protect /dashboard route
├── .env.local.example
├── CLAUDE.md
├── TASKS.md
└── README.md
```

---

### Task 1.2 — Supabase Schema

Create `supabase/schema.sql` with the following exact schema. This file must be runnable from scratch to recreate the entire database:

```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  institution text,
  created_at timestamptz default now()
);

create table audit_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  action_type text not null,
  grant_title text,
  original_text text,
  modified_text text,
  diff_summary text,
  char_count_before integer,
  char_count_after integer,
  char_limit integer,
  citations_selected jsonb,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table audit_records enable row level security;

create policy "Users can only see their own profile"
  on profiles for all using (auth.uid() = id);

create policy "Users can only see their own audit records"
  on audit_records for all using (auth.uid() = user_id);
```

---

### Task 1.3 — Environment Variables

Create `.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### Task 1.4 — Supabase Client (`lib/supabase.ts`)

Create two clients:
- A browser client using `createClientComponentClient` for use in client components
- A server client using the service role key for use in API routes (never exposed to client)

---

### Task 1.5 — Auth Flow

- Use Supabase Google OAuth
- `middleware.ts` must redirect unauthenticated users away from `/dashboard` to `/`
- `app/api/auth/callback/route.ts` handles the OAuth callback, exchanges code for session, upserts a row into `profiles` if one does not exist
- Create `app/auth/extension-login/page.tsx`:
  - Initiates Google OAuth on page load
  - On success, calls `window.postMessage({ type: 'BIOTECH_OS_AUTH', token: session.access_token }, '*')`
  - Renders: "Authentication successful. You can close this tab."

---

### Task 1.6 — API Route: `/api/trim`

**Method:** POST
**Auth:** Validate Bearer token from Authorization header using Supabase service role client. Return 401 if invalid.

**Request body:**
```json
{
  "text": "string",
  "char_limit": 2500,
  "grant_title": "optional string"
}
```

**Logic (in order):**

1. Validate auth token — return 401 if invalid
2. If `text.length <= char_limit`, return the text as-is with no AI call and `{ already_within_limit: true }`
3. Call Claude API (`claude-sonnet-4-20250514`) with:

System prompt:
```
You are a scientific editing assistant. Your ONLY job is to shorten the provided text to fit within a character limit.

Rules you must never break:
- Never add new scientific claims, data, or ideas
- Never change the meaning of any existing scientific claim
- Never remove citations or specific numerical values (effect sizes, p-values, sample sizes)
- Only remove filler phrases, redundant clauses, and verbose transitions
- Preserve the author's voice and terminology
- Return ONLY the trimmed text, nothing else — no explanation, no preamble
```

User message: `"Trim the following text to strictly under {char_limit} characters. Current length: {text.length} characters.\n\n{text}"`

4. If returned text is still over `char_limit`, make one retry with added instruction: `"The previous attempt was still over the limit. Be more aggressive with removing filler. Return ONLY the text, strictly under {char_limit} characters."`
5. If still over after retry, return HTTP 422 with `{ error: "Could not trim to target length. Try removing some sentences manually first." }`
6. Compute `diff_summary` string: `"Removed {wordsBefore - wordsAfter} words. Character count reduced from {before} to {after}. All scientific claims and numerical values preserved."`
7. Insert row into `audit_records` with `action_type: 'trim'`
8. Return:
```json
{
  "trimmed_text": "string",
  "char_count_before": 2601,
  "char_count_after": 2498,
  "char_limit": 2500,
  "diff_summary": "string",
  "audit_id": "uuid",
  "already_within_limit": false
}
```

---

### Task 1.7 — API Route: `/api/citations`

**Method:** POST
**Auth:** Same Bearer token validation

**Request body:**
```json
{
  "grant_title": "string",
  "grant_aims": "optional string",
  "publications": [
    { "pmid": "12345678", "title": "string", "abstract": "string or empty" }
  ]
}
```

**Logic (in order):**

1. Validate auth
2. For any publication with an empty or missing abstract, fetch from PubMed using `lib/pubmed.ts`:
   - Endpoint: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id={pmids_comma_separated}&retmode=xml`
   - Parse `AbstractText` from the XML response
   - Batch up to 20 PMIDs per request
   - If abstract unavailable, use empty string — do not block
3. Call Claude with:

System prompt:
```
You are a scientific grant advisor. Given a grant title and list of publications, identify the 5 most relevant publications. Relevance means: direct methodological overlap, same disease area, same biological target, or foundational citations the reviewer would expect to see. Return ONLY a valid JSON array, no other text, no markdown fences:
[{"pmid": "string", "title": "string", "reason": "one sentence why this is relevant"}]
```

User message: `"Grant title: {grant_title}\n\nAims: {grant_aims}\n\nPublications:\n{numbered list of pmid + title + abstract}"`

4. Parse the JSON response. If parsing fails, return 422.
5. Insert row into `audit_records` with `action_type: 'citation_select'`, store the selected array in `citations_selected` jsonb column
6. Return:
```json
{
  "selected": [{"pmid": "string", "title": "string", "reason": "string"}],
  "audit_id": "uuid"
}
```

---

### Task 1.8 — API Route: `/api/audit` (GET)

- Auth required
- Query params: `?page=1` (default 1), `?type=trim|citation_select` (optional filter)
- Returns 20 records per page, ordered by `created_at DESC`
- Response: `{ records: [...], total: number, page: number }`

---

### Task 1.9 — API Route: `/api/audit/export` (GET)

- Auth required
- Query param: `?id={audit_id}` — single record
- Query param: `?all=true` — all records for user
- Generates and streams a PDF using `@react-pdf/renderer`

**PDF structure for trim records:**
```
BIOTECH OS — EDITING COMPLIANCE REPORT
Generated: {timestamp}
Researcher: {full_name}, {institution}
─────────────────────────────────────────
Grant Context: {grant_title or "Not specified"}

ACTION TYPE: Text Trimming (Formatting Assistance Only)
Date: {created_at}

CHARACTER COUNT
Before: {char_count_before}  |  After: {char_count_after}  |  Limit: {char_limit}

SUMMARY
{diff_summary}

ORIGINAL TEXT
{original_text}

MODIFIED TEXT
{modified_text}

─────────────────────────────────────────
CERTIFICATION
This document certifies that the scientific content, claims, citations, and
numerical values in the text above were authored by the researcher. AI assistance
was limited solely to removing words to meet a formatting character limit imposed
by NIH SciENcv. No new scientific ideas, claims, or data were introduced by AI.

Generated by BiotechOS | biotechos.app
```

**PDF structure for citation_select records:**
```
BIOTECH OS — CITATION SELECTION REPORT
Generated: {timestamp}
Researcher: {full_name}, {institution}
─────────────────────────────────────────
Grant Context: {grant_title}
Action Date: {created_at}

SELECTED PUBLICATIONS (5 of {total_submitted})

1. {title}
   PMID: {pmid}
   Relevance: {reason}

[repeat for each]

─────────────────────────────────────────
CERTIFICATION
The researcher selected 5 publications from their own publication record for
inclusion in an NIH biosketch. AI was used only to rank relevance based on the
grant title provided. All listed publications are original works by the researcher.

Generated by BiotechOS | biotechos.app
```

---

### Task 1.10 — Dashboard UI (`/dashboard/page.tsx`)

Dark-accented scientific aesthetic. Think mission control, not SaaS startup. Use `IBM Plex Mono` for data fields and `DM Serif Display` for headings. Dark navy background (`#0a0f1e`), electric blue accents (`#2563eb`), muted text (`#94a3b8`).

**Layout sections (in order):**

**Top Navigation:**
- Left: "BiotechOS" wordmark in monospace
- Right: user full name + institution + "Sign Out" button

**Stats Row (3 cards):**
- Total Trims this month
- Total Citation Selections this month
- Total Characters Saved this month
- Fetch these by aggregating from `/api/audit`

**Audit Table:**
Columns: Date | Type | Grant Title | Summary | Export
- Date: formatted as `MMM DD, YYYY HH:mm`
- Type: pill badge — "Trim" (blue) or "Citations" (green)
- Grant Title: truncated to 40 chars with tooltip
- Summary: the `diff_summary` field, truncated to 80 chars
- Export: small button triggering `GET /api/audit/export?id={id}` as a file download

**Table controls:**
- Type filter dropdown (All / Trim / Citations)
- Pagination (Previous / Next)
- "Export All Records" button at top right

---

### Task 1.11 — Landing Page (`/page.tsx`)

Dark background. Clean. Two lines of copy. Two CTAs.

**Above the fold:**
```
BiotechOS
The compliance layer for NIH grant submissions.

Keep the science yours. Prove it.

[Add to Chrome — Free]     [Sign In]
```

**Below the fold — three feature cards:**

Card 1 — Trim
Title: "Character-Perfect Trimming"
Body: "AI removes filler words to hit SciENcv character limits. Your scientific claims stay untouched."

Card 2 — Citations
Title: "Intelligent Citation Selection"
Body: "Paste your grant title. We rank your publications by relevance and highlight the best 5."

Card 3 — Audit Trail
Title: "Proof of Originality"
Body: "Every AI action is logged with a before/after diff. Export a compliance PDF if NIH ever asks."

---

## PART 2: Chrome Extension

### Task 2.1 — `extension/manifest.json`

```json
{
  "manifest_version": 3,
  "name": "BiotechOS — SciENcv Assistant",
  "version": "1.0.0",
  "description": "AI-powered trimming and citation selection for NIH SciENcv. Compliance audit trail included.",
  "permissions": ["storage", "activeTab"],
  "host_permissions": [
    "https://www.ncbi.nlm.nih.gov/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://www.ncbi.nlm.nih.gov/sciencv/*"],
      "js": ["content.js"],
      "css": ["content.css"]
    }
  ],
  "action": {
    "default_popup": "popup.html"
  }
}
```

Replace `YOUR_APP_URL` with the actual Vercel URL in `host_permissions` once known. During development use `http://localhost:3000/*` as an additional entry.

---

### Task 2.2 — `extension/background.js`

Handle token storage and retrieval:

```javascript
const APP_URL = 'https://YOUR_VERCEL_URL'; // Replace before deploy

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STORE_AUTH_TOKEN') {
    chrome.storage.local.set({
      biotech_token: message.token,
      biotech_token_expiry: Date.now() + (3600 * 1000)
    }, () => sendResponse({ success: true }));
    return true;
  }

  if (message.type === 'GET_AUTH_TOKEN') {
    chrome.storage.local.get(['biotech_token', 'biotech_token_expiry'], (result) => {
      if (result.biotech_token && result.biotech_token_expiry > Date.now()) {
        sendResponse({ token: result.biotech_token });
      } else {
        chrome.storage.local.remove(['biotech_token', 'biotech_token_expiry']);
        sendResponse({ token: null });
      }
    });
    return true;
  }

  if (message.type === 'CLEAR_AUTH_TOKEN') {
    chrome.storage.local.remove(['biotech_token', 'biotech_token_expiry']);
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_APP_URL') {
    sendResponse({ url: APP_URL });
    return true;
  }
});
```

---

### Task 2.3 — `extension/popup.html` + `extension/popup.js`

**popup.html:** A minimal HTML file, 320px wide. Two states controlled by JS:

State A (not authenticated):
```
BiotechOS
Sign in to activate SciENcv features.
[Sign in with Google]
```

State B (authenticated):
```
BiotechOS  ✓ Connected
{user_email}

[View Dashboard ↗]
[Sign Out]
```

**popup.js logic:**
1. On load, send `GET_AUTH_TOKEN` message to background
2. If token exists, fetch `{APP_URL}/api/audit?page=1` with the token to verify it's still valid and get the user email from the response headers or a `/api/me` endpoint — add `GET /api/me` route to the Next.js app that returns `{ email, full_name, institution }` from the authenticated user's profile
3. Render State A or B accordingly
4. Sign in button: opens `{APP_URL}/auth/extension-login` in a new tab, then listens for the tab to post back the token using a polling mechanism on `chrome.storage.local` (poll every 500ms for up to 60 seconds, stop when token appears)
5. Sign out: send `CLEAR_AUTH_TOKEN`, re-render State A
6. View Dashboard: `chrome.tabs.create({ url: APP_URL + '/dashboard' })`

---

### Task 2.4 — `extension/content.js`

This is the core injection script. Structure it in clearly labelled sections:

#### Section A: Utilities

```javascript
const APP_URL = 'https://YOUR_VERCEL_URL';

async function getToken() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_AUTH_TOKEN' }, (response) => {
      resolve(response?.token || null);
    });
  });
}

async function apiCall(endpoint, body) {
  const token = await getToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');
  const response = await fetch(`${APP_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  if (response.status === 401) throw new Error('NOT_AUTHENTICATED');
  if (!response.ok) throw new Error('API_ERROR');
  return response.json();
}

function showTooltip(anchorEl, message, type = 'success') {
  const tip = document.createElement('div');
  tip.className = `bioos-tooltip bioos-tooltip--${type}`;
  tip.textContent = message;
  anchorEl.parentNode.insertBefore(tip, anchorEl.nextSibling);
  setTimeout(() => tip.remove(), 3500);
}
```

#### Section B: Character Limit Parser

```javascript
function parseCharLimit(textareaEl) {
  // Look for adjacent text showing "X / 2500" or "2500 characters remaining"
  // Search parent containers up to 3 levels for counter text
  // Return integer or null if not found
  const parent = textareaEl.closest('[class*="char"], [class*="count"], [class*="limit"]')
    || textareaEl.parentElement?.parentElement;
  if (!parent) return null;
  const text = parent.textContent;
  const match = text.match(/[\/\s](\d{3,4})\s*(characters?)?/) 
    || text.match(/(\d{3,4})\s*characters?\s*(remaining|max|limit)/i);
  return match ? parseInt(match[1]) : null;
}
```

#### Section C: Trim Button Injection

```javascript
function injectTrimButton(textareaEl) {
  if (textareaEl.dataset.biotechosInjected) return;
  textareaEl.dataset.biotechosInjected = 'true';

  const btn = document.createElement('button');
  btn.className = 'bioos-btn bioos-trim-btn';
  btn.textContent = '⚡ BiotechOS Trim';
  btn.title = 'Trim text to character limit while preserving scientific content';

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const text = textareaEl.value || textareaEl.textContent;
    const charLimit = parseCharLimit(textareaEl);

    if (!charLimit) {
      showTooltip(btn, 'Could not detect character limit for this field.', 'error');
      return;
    }

    if (text.length <= charLimit) {
      showTooltip(btn, `Already within limit (${text.length}/${charLimit} chars).`, 'info');
      return;
    }

    btn.textContent = 'Processing...';
    btn.disabled = true;

    try {
      const result = await apiCall('/api/trim', { text, char_limit: charLimit });
      if (textareaEl.tagName === 'TEXTAREA') {
        textareaEl.value = result.trimmed_text;
      } else {
        textareaEl.textContent = result.trimmed_text;
      }
      textareaEl.dispatchEvent(new Event('input', { bubbles: true }));
      textareaEl.dispatchEvent(new Event('change', { bubbles: true }));
      showTooltip(btn, `✓ Trimmed: ${result.char_count_before} → ${result.char_count_after} chars. Audit saved.`, 'success');
    } catch (err) {
      if (err.message === 'NOT_AUTHENTICATED') {
        showTooltip(btn, 'Sign in to BiotechOS to use this feature.', 'error');
      } else {
        showTooltip(btn, 'Trim failed. Try removing some sentences manually first.', 'error');
      }
    } finally {
      btn.textContent = '⚡ BiotechOS Trim';
      btn.disabled = false;
    }
  });

  textareaEl.insertAdjacentElement('afterend', btn);
}
```

#### Section D: Citation Selector Injection

```javascript
function injectCitationSelector(listContainer) {
  if (listContainer.dataset.biotechosInjected) return;
  listContainer.dataset.biotechosInjected = 'true';

  const panel = document.createElement('div');
  panel.className = 'bioos-citation-panel';
  panel.innerHTML = `
    <span class="bioos-citation-label">🎯 BiotechOS</span>
    <input class="bioos-citation-input" type="text" placeholder="Enter grant title to select best 5 citations..." />
    <button class="bioos-btn bioos-citation-btn">Find Best 5</button>
  `;

  const input = panel.querySelector('.bioos-citation-input');
  const btn = panel.querySelector('.bioos-citation-btn');

  btn.addEventListener('click', async () => {
    const grantTitle = input.value.trim();
    if (!grantTitle) {
      showTooltip(btn, 'Please enter a grant title first.', 'error');
      return;
    }

    // Scrape publications from the DOM
    const pubItems = listContainer.querySelectorAll('[class*="pub"], [class*="citation"], li');
    const publications = Array.from(pubItems).map(el => {
      const pmidMatch = el.textContent.match(/PMID[:\s]+(\d{7,8})/i);
      return {
        pmid: pmidMatch ? pmidMatch[1] : `local_${Math.random()}`,
        title: el.querySelector('[class*="title"], strong, b')?.textContent?.trim()
          || el.textContent.trim().substring(0, 120),
        abstract: ''
      };
    }).filter(p => p.title.length > 10);

    if (publications.length === 0) {
      showTooltip(btn, 'Could not detect publications on this page. Try scrolling to load them first.', 'error');
      return;
    }

    btn.textContent = 'Analyzing...';
    btn.disabled = true;

    try {
      const result = await apiCall('/api/citations', { grant_title: grantTitle, publications });
      const selectedPmids = new Set(result.selected.map(s => s.pmid));
      const reasonMap = Object.fromEntries(result.selected.map(s => [s.pmid, s.reason]));

      // Clear previous highlights
      listContainer.querySelectorAll('.bioos-highlight').forEach(el => {
        el.classList.remove('bioos-highlight');
        el.querySelector('.bioos-reason-badge')?.remove();
      });

      // Highlight selected items
      Array.from(pubItems).forEach(el => {
        const pmidMatch = el.textContent.match(/PMID[:\s]+(\d{7,8})/i);
        if (pmidMatch && selectedPmids.has(pmidMatch[1])) {
          el.classList.add('bioos-highlight');
          const badge = document.createElement('span');
          badge.className = 'bioos-reason-badge';
          badge.textContent = `ℹ ${reasonMap[pmidMatch[1]]}`;
          el.appendChild(badge);
        }
      });

      showTooltip(btn, `✓ Top 5 highlighted. Audit saved.`, 'success');
    } catch (err) {
      if (err.message === 'NOT_AUTHENTICATED') {
        showTooltip(btn, 'Sign in to BiotechOS to use this feature.', 'error');
      } else {
        showTooltip(btn, 'Selection failed. Please try again.', 'error');
      }
    } finally {
      btn.textContent = 'Find Best 5';
      btn.disabled = false;
    }
  });

  listContainer.insertAdjacentElement('beforebegin', panel);
}
```

#### Section E: DOM Observer (Main Entry Point)

```javascript
function scanAndInject() {
  // Inject trim buttons on all qualifying textareas
  document.querySelectorAll('textarea, [contenteditable="true"]').forEach(el => {
    if (el.dataset.biotechosInjected) return;
    injectTrimButton(el);
  });

  // Inject citation selector on bibliography/publication list containers
  const citationContainers = document.querySelectorAll(
    '[class*="bibliography"], [class*="publication"], [class*="citation-list"], [id*="pub"]'
  );
  citationContainers.forEach(container => {
    if (container.querySelectorAll('li, [class*="pub"]').length >= 3) {
      injectCitationSelector(container);
    }
  });
}

// Initial scan
scanAndInject();

// Watch for dynamic content loads
const observer = new MutationObserver((mutations) => {
  const relevant = mutations.some(m =>
    Array.from(m.addedNodes).some(n => n.nodeType === 1)
  );
  if (relevant) scanAndInject();
});

observer.observe(document.body, { childList: true, subtree: true });
```

---

### Task 2.5 — `extension/content.css`

All class names must be prefixed with `bioos-` to prevent style conflicts:

```css
.bioos-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 4px 0 0 4px;
  padding: 3px 10px;
  background: #1a2744;
  color: #7eb8f7;
  border: 1px solid #2d4a8a;
  border-radius: 4px;
  font-family: 'IBM Plex Mono', 'Courier New', monospace;
  font-size: 11px;
  cursor: pointer;
  z-index: 99999;
  position: relative;
}

.bioos-btn:hover {
  background: #2d4a8a;
  color: #bfdbfe;
}

.bioos-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bioos-tooltip {
  display: inline-block;
  margin-left: 8px;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  animation: bioos-fade 3.5s forwards;
}

.bioos-tooltip--success { background: #052e16; color: #4ade80; border: 1px solid #166534; }
.bioos-tooltip--error   { background: #450a0a; color: #f87171; border: 1px solid #991b1b; }
.bioos-tooltip--info    { background: #172554; color: #93c5fd; border: 1px solid #1e40af; }

@keyframes bioos-fade {
  0% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}

.bioos-citation-panel {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: #0f1729;
  border: 1px solid #1e3a5f;
  border-radius: 6px;
  font-family: 'IBM Plex Mono', monospace;
}

.bioos-citation-label {
  font-size: 11px;
  color: #7eb8f7;
  white-space: nowrap;
}

.bioos-citation-input {
  flex: 1;
  padding: 4px 8px;
  background: #0a0f1e;
  border: 1px solid #2d4a8a;
  border-radius: 3px;
  color: #e2e8f0;
  font-family: inherit;
  font-size: 11px;
}

.bioos-highlight {
  border-left: 3px solid #f59e0b !important;
  padding-left: 8px !important;
  background: rgba(245, 158, 11, 0.06) !important;
}

.bioos-reason-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 6px;
  background: #1c1400;
  color: #fbbf24;
  border: 1px solid #78350f;
  border-radius: 3px;
  font-size: 10px;
  font-family: 'IBM Plex Mono', monospace;
}
```

---

## PART 3: Supporting Routes and Files

### Task 3.1 — Add `/api/me` Route

**Method:** GET
**Auth:** Bearer token required
**Returns:**
```json
{
  "email": "string",
  "full_name": "string",
  "institution": "string"
}
```

Used by the extension popup to verify the token is still valid and display the user's name.

---

### Task 3.2 — `lib/pubmed.ts`

```typescript
export async function fetchAbstracts(pmids: string[]): Promise<Record<string, string>> {
  if (pmids.length === 0) return {};
  const batches = [];
  for (let i = 0; i < pmids.length; i += 20) {
    batches.push(pmids.slice(i, i + 20));
  }
  const results: Record<string, string> = {};
  for (const batch of batches) {
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${batch.join(',')}&retmode=xml`;
    const response = await fetch(url);
    const xml = await response.text();
    // Parse AbstractText from each PubmedArticle block
    // Use regex on the XML string — no XML parser dependency needed
    const articleBlocks = xml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];
    articleBlocks.forEach(block => {
      const pmidMatch = block.match(/<PMID[^>]*>(\d+)<\/PMID>/);
      const abstractMatch = block.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
      if (pmidMatch && abstractMatch) {
        results[pmidMatch[1]] = abstractMatch[1].replace(/<[^>]+>/g, '').trim();
      }
    });
  }
  return results;
}
```

---

### Task 3.3 — `README.md`

Must include all of the following sections:

**1. Local Development Setup**
- Prerequisites (Node 18+, npm)
- `npm install`
- Copy `.env.local.example` to `.env.local` and fill in values
- Supabase setup instructions (create project, run `supabase/schema.sql` in SQL editor, enable Google OAuth provider, add callback URL)
- `npm run dev`

**2. Loading the Chrome Extension**
- Open `chrome://extensions`
- Enable Developer Mode
- Click "Load unpacked"
- Select the `/extension` folder
- Note: Update `APP_URL` in `background.js` and `content.js` to match your local or deployed URL

**3. Required Environment Variables**
- Description of each variable and where to find it

**4. Deploying to Vercel**
- `vercel deploy`
- Set all env vars in Vercel dashboard
- Update extension `APP_URL` constants to production URL

**5. Architecture Notes**
- Why the Anthropic API key lives only in the backend
- Why tokens are stored in `chrome.storage.local` (not API keys)
- How the audit trail provides NIH compliance documentation

---

## PART 4: Final Verification Checklist

Do not consider the build complete until every item below passes:

**Backend**
- [ ] `POST /api/trim` returns correctly trimmed text under the char limit
- [ ] `POST /api/trim` with text already under limit returns `already_within_limit: true` with no AI call
- [ ] `POST /api/trim` inserts a row into `audit_records`
- [ ] `POST /api/citations` fetches PubMed abstracts for publications with missing abstracts
- [ ] `POST /api/citations` returns exactly 5 items
- [ ] `POST /api/citations` inserts a row into `audit_records`
- [ ] `GET /api/audit` returns paginated records for authenticated user only
- [ ] `GET /api/audit/export?id=X` returns a downloadable PDF with correct structure
- [ ] `GET /api/audit/export?all=true` returns a PDF with all user records
- [ ] `GET /api/me` returns authenticated user profile
- [ ] All routes return 401 for missing or expired tokens
- [ ] Supabase RLS policies prevent any cross-user data access
- [ ] Anthropic API key is never referenced in any client-side code

**Dashboard**
- [ ] `/dashboard` redirects to `/` when not authenticated
- [ ] Stats cards show correct aggregated counts
- [ ] Audit table renders with correct columns and pagination
- [ ] Type filter works correctly
- [ ] Single record export downloads a PDF
- [ ] "Export All" downloads a PDF with all records

**Extension**
- [ ] Extension loads without errors in `chrome://extensions`
- [ ] Popup shows sign-in state correctly
- [ ] Sign-in flow opens extension-login page and stores token on completion
- [ ] Sign-out clears token and resets popup to unauthenticated state
- [ ] Content script injects Trim button adjacent to SciENcv textarea fields
- [ ] Trim button calls backend, updates field content, fires input/change events
- [ ] Trim button shows correct character counts in tooltip
- [ ] Trim button shows auth error if not signed in
- [ ] Citation panel injects above bibliography section
- [ ] Citation selection highlights correct rows with reason badges
- [ ] Citation panel shows auth error if not signed in
- [ ] No BiotechOS styles leak into or conflict with SciENcv's own styles
- [ ] No API keys or secrets exist anywhere in the extension folder
