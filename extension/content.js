// ─── Section A: Utilities ────────────────────────────────────────────────────

const APP_URL = 'https://grant-assistant-omega.vercel.app';

async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['ga_token', 'ga_token_expiry'], (result) => {
      if (result.ga_token && result.ga_token_expiry > Date.now()) {
        resolve(result.ga_token);
      } else {
        resolve(null);
      }
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
  // Remove any existing tooltip in the same toolbar/parent
  const container = anchorEl.closest('.ga-toolbar') || anchorEl.parentNode;
  container?.querySelectorAll('.ga-tooltip').forEach(t => t.remove());
  const tip = document.createElement('span');
  tip.className = `ga-tooltip ga-tooltip--${type}`;
  tip.textContent = message;
  // Append after the anchor button within the toolbar
  anchorEl.insertAdjacentElement('afterend', tip);
  setTimeout(() => tip.remove(), 3500);
}

// ─── Section B: Character Limit Parser ───────────────────────────────────────

// Known NIH Biosketch field char limits by textarea id (fallback if counter
// text isn't found in the DOM).
const KNOWN_LIMITS = {
  previewAreaMarkdown: 2500,  // Personal Statement
};

function parseCharLimit(textareaEl) {
  // 1. Check hardcoded known limits first
  if (textareaEl.id && KNOWN_LIMITS[textareaEl.id]) {
    return KNOWN_LIMITS[textareaEl.id];
  }

  // 2. Walk up to the nearest named section container and search for counter text
  //    e.g. "450 / 2500" or "2500 characters remaining"
  const section = textareaEl.closest('[id]') || textareaEl.parentElement?.parentElement;
  if (!section) return null;
  const text = section.textContent;
  const match = text.match(/\/\s*(\d{3,5})/)           // "450 / 2500"
    || text.match(/(\d{3,5})\s*characters?\s*(remaining|max|limit)/i);
  return match ? parseInt(match[1]) : null;
}

// ─── Section C: Trim Button Injection ────────────────────────────────────────

function setFieldText(el, text) {
  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
    el.value = text;
  } else {
    el.textContent = text;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function injectTrimButton(textareaEl) {
  if (textareaEl.dataset.gaInjected) return;
  textareaEl.dataset.gaInjected = 'true';

  // Toolbar wrapper keeps buttons on one row
  const toolbar = document.createElement('div');
  toolbar.className = 'ga-toolbar';

  const trimBtn = document.createElement('button');
  trimBtn.className = 'ga-btn';
  trimBtn.textContent = '⚡ Trim';
  trimBtn.title = 'Trim text to character limit while preserving scientific content';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'ga-btn ga-btn--secondary';
  copyBtn.textContent = '⎘ Copy';
  copyBtn.title = 'Copy current text to clipboard';

  const revertBtn = document.createElement('button');
  revertBtn.className = 'ga-btn ga-btn--secondary';
  revertBtn.textContent = '↩ Revert';
  revertBtn.title = 'Restore text to what it was before the last trim';
  revertBtn.disabled = true;

  let lastOriginal = null; // snapshot before each trim

  // ── Copy ──
  copyBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const text = textareaEl.value || textareaEl.textContent || '';
    try {
      await navigator.clipboard.writeText(text);
      showTooltip(copyBtn, '✓ Copied!', 'success');
    } catch {
      showTooltip(copyBtn, 'Copy failed — try selecting and Ctrl+C.', 'error');
    }
  });

  // ── Revert ──
  revertBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (lastOriginal === null) return;
    setFieldText(textareaEl, lastOriginal);
    lastOriginal = null;
    revertBtn.disabled = true;
    showTooltip(revertBtn, '✓ Reverted to original.', 'info');
  });

  // ── Trim ──
  trimBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const text = textareaEl.value || textareaEl.textContent || '';
    const charLimit = parseCharLimit(textareaEl);

    if (!charLimit) {
      showTooltip(trimBtn, 'Could not detect character limit for this field.', 'error');
      return;
    }

    if (text.length <= charLimit) {
      showTooltip(trimBtn, `Already within limit (${text.length}/${charLimit} chars).`, 'info');
      return;
    }

    lastOriginal = text;          // save before we overwrite
    revertBtn.disabled = true;    // disable while processing

    trimBtn.textContent = 'Trimming…';
    trimBtn.disabled = true;

    try {
      const result = await apiCall('/api/trim', { text, char_limit: charLimit });
      setFieldText(textareaEl, result.trimmed_text);
      revertBtn.disabled = false; // enable now that trim succeeded
      showTooltip(trimBtn, `✓ ${result.char_count_before} → ${result.char_count_after} chars`, 'success');
    } catch (err) {
      lastOriginal = null; // nothing was changed
      if (err.message === 'NOT_AUTHENTICATED') {
        showTooltip(trimBtn, 'Sign in to GrantAssistant to use this feature.', 'error');
      } else {
        showTooltip(trimBtn, 'Trim failed. Try shortening manually first.', 'error');
      }
    } finally {
      trimBtn.textContent = '⚡ Trim';
      trimBtn.disabled = false;
    }
  });

  toolbar.appendChild(trimBtn);
  toolbar.appendChild(copyBtn);
  toolbar.appendChild(revertBtn);
  textareaEl.insertAdjacentElement('afterend', toolbar);
}

// ─── Section D: Citation Selector Injection ──────────────────────────────────

function injectCitationSelector(listContainer) {
  if (listContainer.dataset.gaInjected) return;
  listContainer.dataset.gaInjected = 'true';

  const panel = document.createElement('div');
  panel.className = 'ga-citation-panel';
  panel.style.flexWrap = 'wrap';
  panel.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;width:100%;">
      <span class="ga-citation-label">🎯 GrantAssistant</span>
      <input class="ga-citation-input" type="text" placeholder="Enter grant title to rank citations..." />
      <button class="ga-btn ga-citation-btn">Find Best 4</button>
    </div>
  `;

  const input = panel.querySelector('.ga-citation-input');
  const btn = panel.querySelector('.ga-citation-btn');
  let resultsList = null;

  function refreshButtonState() { /* no-op — button always enabled */ }

  btn.addEventListener('click', async () => {
    const grantTitle = input.value.trim();
    if (!grantTitle) {
      showTooltip(btn, 'Please enter a grant title first.', 'error');
      return;
    }

    const pubItems = listContainer.querySelectorAll('li, tr.citrow, [class*="cit"]');
    const publications = Array.from(pubItems).map(el => {
      const pmidMatch = el.textContent.match(/PMID[:\s]+(\d{7,8})/i);
      return {
        pmid: pmidMatch ? pmidMatch[1] : null,
        title: el.querySelector('[class*="title"], strong, b')?.textContent?.trim()
          || el.textContent.trim().substring(0, 120),
        abstract: ''
      };
    }).filter(p => p.pmid && p.title.length > 10);

    if (publications.length === 0) {
      showTooltip(btn, 'Add papers to your NCBI My Bibliography first, then come back to rank them.', 'info');
      return;
    }

    btn.textContent = 'Analyzing…';
    btn.disabled = true;
    if (resultsList) { resultsList.remove(); resultsList = null; }

    try {
      const result = await apiCall('/api/citations', { grant_title: grantTitle, publications });

      // Highlight papers in the bibliography list
      const selectedPmids = new Set(result.selected.map(s => s.pmid));
      const reasonMap = Object.fromEntries(result.selected.map(s => [s.pmid, s.reason]));
      listContainer.querySelectorAll('.ga-highlight').forEach(el => {
        el.classList.remove('ga-highlight');
        el.querySelector('.ga-reason-badge')?.remove();
      });
      Array.from(pubItems).forEach(el => {
        const pmidMatch = el.textContent.match(/PMID[:\s]+(\d{7,8})/i);
        if (pmidMatch && selectedPmids.has(pmidMatch[1])) {
          el.classList.add('ga-highlight');
          const badge = document.createElement('span');
          badge.className = 'ga-reason-badge';
          badge.textContent = `ℹ ${reasonMap[pmidMatch[1]]}`;
          el.appendChild(badge);
        }
      });

      // Render ranked results inside the panel
      resultsList = document.createElement('div');
      resultsList.style.cssText = 'width:100%;margin-top:8px;font-size:11px;font-family:sans-serif;';
      result.selected.forEach((s, i) => {
        const row = document.createElement('div');
        row.style.cssText = 'padding:5px 0;border-bottom:1px solid #dde3f0;display:flex;gap:8px;align-items:flex-start;';
        row.innerHTML = `
          <span style="color:#4f6ef7;font-weight:600;flex-shrink:0;">${i + 1}.</span>
          <div>
            <div style="color:#1e2a3a;font-weight:500;">${s.title}</div>
            <div style="color:#6b7a99;margin-top:2px;">PMID ${s.pmid} &mdash; <em>${s.reason}</em></div>
          </div>
        `;
        resultsList.appendChild(row);
      });
      panel.appendChild(resultsList);

      showTooltip(btn, '✓ Top 4 highlighted. Audit saved.', 'success');
    } catch (err) {
      if (err.message === 'NOT_AUTHENTICATED') {
        showTooltip(btn, 'Sign in to GrantAssistant to use this feature.', 'error');
      } else {
        showTooltip(btn, 'Selection failed. Please try again.', 'error');
      }
    } finally {
      btn.textContent = 'Find Best 4';
      refreshButtonState();
    }
  });

  listContainer.insertAdjacentElement('beforebegin', panel);
}

// ─── Section E: DOM Observer (Main Entry Point) ───────────────────────────────

// Returns true only if the element is visible on screen (not hidden via CSS)
function isVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function scanAndInject() {
  // ── Trim buttons ──────────────────────────────────────────────────────────
  // Only inject on textareas that are currently visible. The MutationObserver
  // will re-run scanAndInject when SciENcv shows a hidden textarea (e.g. when
  // the user clicks "edit" on a Contribution to Science description).

  document.querySelectorAll('textarea').forEach(el => {
    if (!el.dataset.gaInjected && isVisible(el)) injectTrimButton(el);
  });

  // ── Citation selector ─────────────────────────────────────────────────────
  // Target the My Bibliography container in Section C. Try multiple selectors
  // since SciENcv may render slightly different class names.
  const citSelectors = [
    '.citationUIContainer.mybib',
    '.citationUIContainer',
    '[class*="citationUI"]',
    '#contribProducts .mybib',
  ];
  let foundCit = false;
  for (const sel of citSelectors) {
    document.querySelectorAll(sel).forEach(container => {
      if (!container.dataset.gaInjected) {
        foundCit = true;
        injectCitationSelector(container);
      }
    });
    if (foundCit) break;
  }
}

scanAndInject();

const observer = new MutationObserver((mutations) => {
  const relevant = mutations.some(m =>
    Array.from(m.addedNodes).some(n => n.nodeType === 1)
  );
  if (relevant) scanAndInject();
});

observer.observe(document.body, { childList: true, subtree: true });
