chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  var payload = msg.type === "LLM_USAGE" && msg.payload ? msg.payload : (msg.type === "TOKEN_USAGE" && msg.payload ? msg.payload : null);
  if (payload) {
    chrome.storage.local.get(["usageHistory"], function (r) {
      var history = r.usageHistory || [];
      history.push(payload);
      chrome.storage.local.set({ usageHistory: history.slice(-10000) });
      sendResponse({ ok: true });
    });
    return true;
  }
});
