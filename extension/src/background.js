// No Firebase in the service worker — sync to Firestore when popup/stats page opens
let processQueue = Promise.resolve();

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const payload =
    (msg.type === "LLM_USAGE" && msg.payload) ||
    (msg.type === "TOKEN_USAGE" && msg.payload) ||
    null;
  if (!payload) return;

  processQueue = processQueue
    .then(() => {
      return new Promise((resolve) => {
        chrome.storage.local.get(
          ["usageHistory", "firebaseUid", "pendingFirestore"],
          (r) => {
            const history = r.usageHistory || [];
            history.push(payload);
            const uid = r.firebaseUid;

            const onHistoryWritten = () => {
              if (!uid) {
                resolve();
                return;
              }
              const totalTokens =
                Number(payload.totalTokens) ||
                Number(payload.inputTokens) + Number(payload.outputTokens) ||
                0;
              const provider = (payload.provider || "unknown").trim().toLowerCase();
              const pending = r.pendingFirestore || [];
              pending.push({
                provider,
                model: payload.model || "estimated",
                inputTokens: Number(payload.inputTokens) || 0,
                outputTokens: Number(payload.outputTokens) || 0,
                totalTokens,
                timestamp: payload.timestamp || Date.now(),
                url: payload.url || "",
              });
              chrome.storage.local.set(
                { pendingFirestore: pending.slice(-500) },
                () => resolve()
              );
            };

            chrome.storage.local.set(
              { usageHistory: history.slice(-10000) },
              onHistoryWritten
            );
          }
        );
      });
    })
    .then(() => {
      sendResponse({ ok: true });
    })
    .catch((err) => {
      console.error("[sustAIn] Background store error:", err);
      sendResponse({ ok: false });
    });

  return true;
});
