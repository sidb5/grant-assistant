# BiotechOS SciENcv Suite

AI-powered text trimming and citation selection for NIH's SciENcv tool, with a full compliance audit trail.

---

## 1. Local Development Setup

**Prerequisites:** Node.js 18+, npm

```bash
npm install
cp .env.local.example .env.local
# Fill in the values in .env.local (see section 3 below)
npm run dev
```

**Supabase setup:**
1. Create a new project at [supabase.com](https://supabase.com)
2. In the Supabase SQL Editor, run the contents of `supabase/schema.sql`
3. Go to **Authentication → Providers** and enable **Google**
4. Add the OAuth callback URL to your Google Cloud Console OAuth app:
   `https://<your-project>.supabase.co/auth/v1/callback`
5. Also add `http://localhost:3000/api/auth/callback` to your Supabase **Redirect URLs** (Auth → URL Configuration)
6. Copy your project URL, anon key, and service role key into `.env.local`

---

## 2. Loading the Chrome Extension

1. Open `chrome://extensions` in Chrome
2. Enable **Developer Mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `/extension` folder from this project
5. Before using, update the `APP_URL` constant in both `extension/background.js` and `extension/content.js` to match your local (`http://localhost:3000`) or deployed URL

**During development:** `APP_URL = 'http://localhost:3000'` — the manifest already includes `http://localhost:3000/*` in `host_permissions` and the `auth-listener` content script matches for local development.

---

## 3. Required Environment Variables

| Variable | Description | Where to find it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | Supabase dashboard → Settings → API |
| `ANTHROPIC_API_KEY` | Anthropic API key | [console.anthropic.com](https://console.anthropic.com) |
| `NEXT_PUBLIC_APP_URL` | Full URL of this app | `http://localhost:3000` locally, your Vercel URL in production |

**Never commit `.env.local` to version control.** The service role key and Anthropic API key must remain server-side only.

---

## 4. Deploying to Vercel

```bash
vercel deploy
```

After deploying:
1. Set all environment variables in the Vercel dashboard (Settings → Environment Variables)
2. Update `APP_URL` in `extension/background.js` and `extension/content.js` to your production Vercel URL (e.g. `https://biotechos.vercel.app`)
3. Update `host_permissions` and the `auth-listener` content script `matches` in `extension/manifest.json` to include your production URL
4. Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to your production URL
5. Add your production URL to Supabase Auth → URL Configuration → Redirect URLs:
   `https://your-app.vercel.app/api/auth/callback`
6. Reload the extension from `chrome://extensions`

---

## 5. Architecture Notes

### Why the Anthropic API key lives only in the backend

The Anthropic API key grants full billing access to your account. Exposing it in client-side code or the Chrome extension would allow any visitor to extract it and incur charges. All AI calls flow through Next.js API routes (`/api/trim`, `/api/citations`) which run server-side on Vercel and never transmit the key to the browser.

### Why tokens are stored in `chrome.storage.local` (not API keys)

The Chrome extension stores only the user's Supabase session token — a short-lived JWT that grants access only to that user's own data. If extracted, it expires within 1 hour and can only access that user's records. It cannot be used to call the Anthropic API directly. The token is never stored in `localStorage` (accessible to any page script) — only in `chrome.storage.local` (accessible only to this extension).

### How the audit trail provides NIH compliance documentation

Every call to `/api/trim` or `/api/citations` inserts a row into the `audit_records` table recording what was submitted, what AI returned, and a diff summary. Users can export individual records or all records as a signed PDF from the dashboard. The PDF includes a certification statement clarifying that AI was used only for formatting/ranking — not for generating scientific content. This provides a defensible paper trail if NIH ever questions the use of AI assistance in grant preparation.

### Auth flow for the Chrome extension

1. User clicks "Sign in with Google" in the popup
2. Extension opens `APP_URL/auth/extension-login` in a new tab
3. The page redirects to Google OAuth via Supabase
4. After approval, Google redirects to `/api/auth/callback`, which exchanges the code, upserts the user profile, and redirects back to `/auth/extension-login`
5. The page now has a valid session; it calls `window.postMessage({ type: 'BIOTECH_OS_AUTH', token })` 
6. An `auth-listener.js` content script (injected on that page by the extension) forwards the token to the background service worker via `chrome.runtime.sendMessage`
7. The background stores the token in `chrome.storage.local` with a 1-hour expiry
8. The popup polls `chrome.storage.local` every 500ms (up to 60s) and updates its UI when the token appears

---

## Known Limitations

- **Institution field not populated from Google OAuth:** Google's OAuth profile does not include institution/affiliation. The `institution` field in user profiles will be blank until a profile editing UI is added. Users can update it directly in the Supabase dashboard for now.

- **SciENcv DOM selectors may drift:** The content script's selectors for detecting textarea fields and publication list containers (`[class*="bibliography"]`, etc.) are based on current SciENcv markup. If NIH changes their DOM structure, the injection points may need to be updated.

- **PDF export requires Node.js runtime:** The `/api/audit/export` route uses `@react-pdf/renderer` which requires the Node.js runtime (not Edge). This is the Next.js App Router default, but note that this route cannot be moved to the Edge Runtime.

- **Citation selector requires PMID in the page text:** The citation highlighting logic works by matching `PMID: XXXXXXXX` patterns in the DOM. Publications without visible PMIDs will receive a randomly-generated local ID and cannot be reliably highlighted after selection.
