chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "TOKEN_USAGE" && msg.payload) {
    chrome.storage.local.get(["usageHistory"], (result) => {
      const history = result.usageHistory || [];
      history.push(msg.payload);
      // Keep last 10,000 entries
      const trimmed = history.slice(-10000);
      chrome.storage.local.set({ usageHistory: trimmed }, () => {
        sendResponse({ ok: true });
      });
    });
    return true;
  }
});
