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

const LLM_URL_PATTERNS = [
  "chatgpt.com",
  "chat.openai.com",
  "claude.ai",
  "gemini.google.com",
  "aistudio.google.com"
];

function isLLMTab(url) {
  if (!url) return false;
  return LLM_URL_PATTERNS.some(pattern => url.includes(pattern));
}

function notifyTabActivated(tabId, retries = 3) {
  chrome.tabs.sendMessage(tabId, { type: "TAB_ACTIVATED" })
    .then(() => {})
    .catch(() => {
      if (retries > 0) {
        setTimeout(() => notifyTabActivated(tabId, retries - 1), 200);
      }
    });
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    if (tab && isLLMTab(tab.url)) {
      notifyTabActivated(activeInfo.tabId);
    }
  });
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
    if (chrome.runtime.lastError) return;
    if (tabs && tabs[0] && isLLMTab(tabs[0].url)) {
      notifyTabActivated(tabs[0].id);
    }
  });
});
