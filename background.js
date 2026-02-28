chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "TOKEN_USAGE" && msg.payload) {
    chrome.storage.local.get(["usageHistory"], (r) => {
      const history = r.usageHistory || [];
      history.push(msg.payload);
      chrome.storage.local.set({ usageHistory: history.slice(-10000) });
      sendResponse({ ok: true });
    });
    return true;
  }
});
