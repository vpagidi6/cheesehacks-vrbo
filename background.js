chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  var payload = msg.type === "LLM_USAGE" && msg.payload ? msg.payload : (msg.type === "TOKEN_USAGE" && msg.payload ? msg.payload : null);
  if (payload) {
    chrome.storage.local.get(["usageHistory", "authToken", "apiBaseUrl"], function (r) {
      var history = r.usageHistory || [];
      history.push(payload);
      chrome.storage.local.set({ usageHistory: history.slice(-10000) });
      if (r.authToken && r.apiBaseUrl) {
        var url = (r.apiBaseUrl.replace(/\/$/, "") + "/usage").replace(/\/\/+/g, "/");
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + r.authToken,
          },
          body: JSON.stringify({
            provider: payload.provider,
            model: payload.model || "estimated",
            inputTokens: payload.inputTokens || 0,
            outputTokens: payload.outputTokens || 0,
            totalTokens: payload.totalTokens || 0,
            timestamp: payload.timestamp || Date.now(),
            url: payload.url || "",
          }),
        }).catch(function () {});
      }
      sendResponse({ ok: true });
    });
    return true;
  }
});
