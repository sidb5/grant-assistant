const APP_URL = 'http://localhost:3000'; // REPLACE BEFORE DEPLOY

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STORE_AUTH_TOKEN') {
    chrome.storage.local.set({
      ga_token: message.token,
      ga_token_expiry: Date.now() + (3600 * 1000)
    }, () => sendResponse({ success: true }));
    return true;
  }

  if (message.type === 'GET_AUTH_TOKEN') {
    chrome.storage.local.get(['ga_token', 'ga_token_expiry'], (result) => {
      if (result.ga_token && result.ga_token_expiry > Date.now()) {
        sendResponse({ token: result.ga_token });
      } else {
        chrome.storage.local.remove(['ga_token', 'ga_token_expiry']);
        sendResponse({ token: null });
      }
    });
    return true;
  }

  if (message.type === 'CLEAR_AUTH_TOKEN') {
    chrome.storage.local.remove(['ga_token', 'ga_token_expiry']);
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_APP_URL') {
    sendResponse({ url: APP_URL });
    return true;
  }
});
