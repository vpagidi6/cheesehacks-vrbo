(() => {
  // src/background.js
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    const payload = msg.type === "LLM_USAGE" && msg.payload || msg.type === "TOKEN_USAGE" && msg.payload || null;
    if (!payload) return;
    chrome.storage.local.get(
      ["usageHistory", "firebaseUid", "pendingFirestore"],
      (r) => {
        const history = r.usageHistory || [];
        history.push(payload);
        chrome.storage.local.set({ usageHistory: history.slice(-1e4) });
        const uid = r.firebaseUid;
        if (uid) {
          const totalTokens = Number(payload.totalTokens) || Number(payload.inputTokens) + Number(payload.outputTokens) || 0;
          const provider = (payload.provider || "unknown").trim().toLowerCase();
          const pending = r.pendingFirestore || [];
          pending.push({
            provider,
            model: payload.model || "estimated",
            inputTokens: Number(payload.inputTokens) || 0,
            outputTokens: Number(payload.outputTokens) || 0,
            totalTokens,
            timestamp: payload.timestamp || Date.now(),
            url: payload.url || ""
          });
          chrome.storage.local.set({
            pendingFirestore: pending.slice(-500)
          });
        }
        sendResponse({ ok: true });
      }
    );
    return true;
  });
})();
