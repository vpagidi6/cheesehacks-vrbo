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
          ["firebaseUid", "pendingFirestore"],
          (r) => {
            const uid = r.firebaseUid;
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

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.sendMessage(activeInfo.tabId, { type: "TAB_ACTIVATED" }).catch(() => {});
});
