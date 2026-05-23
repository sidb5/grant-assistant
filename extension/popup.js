// Popup reads/writes chrome.storage.local directly — no background message
// needed for token access. MV3 service workers can be terminated at any time,
// making message-based token retrieval unreliable from the popup.

const APP_URL = 'https://grant-assistant-omega.vercel.app';

// ── Storage helpers ──────────────────────────────────────────────────────────

function readToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['ga_token', 'ga_token_expiry'], (result) => {
      if (result.ga_token && result.ga_token_expiry > Date.now()) {
        resolve(result.ga_token);
      } else {
        chrome.storage.local.remove(['ga_token', 'ga_token_expiry']);
        resolve(null);
      }
    });
  });
}

function clearToken() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['ga_token', 'ga_token_expiry'], resolve);
  });
}

// ── API ───────────────────────────────────────────────────────────────────────

async function fetchProfile(token) {
  try {
    const res = await fetch(`${APP_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── UI state ─────────────────────────────────────────────────────────────────

const elLoading  = document.getElementById('state-loading');
const elUnauth   = document.getElementById('state-unauthenticated');
const elAuth     = document.getElementById('state-authenticated');
const elEmail    = document.getElementById('user-email');

function showState(state) {
  elLoading.style.display = state === 'loading'         ? 'block' : 'none';
  elUnauth.style.display  = state === 'unauthenticated' ? 'block' : 'none';
  elAuth.style.display    = state === 'authenticated'   ? 'block' : 'none';
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  showState('loading');
  const token = await readToken();

  if (!token) {
    showState('unauthenticated');
    return;
  }

  const profile = await fetchProfile(token);
  if (!profile || profile.error) {
    await clearToken();
    showState('unauthenticated');
    return;
  }

  elEmail.textContent = profile.email || '';
  showState('authenticated');
}

// ── Sign in ───────────────────────────────────────────────────────────────────

document.getElementById('btn-signin').addEventListener('click', () => {
  // Open the login page in a new tab
  chrome.tabs.create({ url: `${APP_URL}/auth/extension-login` });

  // Poll storage every 500 ms — auth-listener.js will write the token once
  // the OAuth flow completes and the page posts GRANT_ASSISTANT_AUTH
  let attempts = 0;
  const poll = setInterval(async () => {
    attempts++;
    if (attempts > 120) { clearInterval(poll); return; } // 60 s timeout

    const token = await readToken();
    if (!token) return;

    clearInterval(poll);
    const profile = await fetchProfile(token);
    if (profile && !profile.error) {
      elEmail.textContent = profile.email || '';
      showState('authenticated');
    }
  }, 500);
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

document.getElementById('btn-dashboard').addEventListener('click', () => {
  chrome.tabs.create({ url: `${APP_URL}/dashboard` });
});

// ── Sign out ──────────────────────────────────────────────────────────────────

document.getElementById('btn-signout').addEventListener('click', async () => {
  await clearToken();
  showState('unauthenticated');
});

// ── Go ────────────────────────────────────────────────────────────────────────

init();
