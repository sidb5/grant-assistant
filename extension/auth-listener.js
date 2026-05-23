// Injected on the extension-login page after successful OAuth.
// Writes the token directly to chrome.storage.local — no background
// service worker needed, so it works even if the SW has been terminated.
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GRANT_ASSISTANT_AUTH' && event.data.token) {
    chrome.storage.local.set({
      ga_token: event.data.token,
      ga_token_expiry: Date.now() + (3600 * 1000)
    });
  }
});
