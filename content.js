// Content script: bridge from page context (MAIN world) to extension
document.addEventListener("__AI_TOKEN_TRACKER_USAGE__", (e) => {
  if (e.detail) {
    chrome.runtime.sendMessage({ type: "TOKEN_USAGE", payload: e.detail });
  }
});
