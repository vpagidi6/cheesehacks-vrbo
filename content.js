function estimateTokens(text) {
  if (!text || typeof text !== "string") return 0;
  return Math.ceil(text.length / 5);
}

function getText(el) {
  if (!el) return "";
  return (el.innerText || el.textContent || "").trim();
}

function observeChat() {
  let lastArticleCount = 0;
  let lastTextLen = 0;
  let stableCount = 0;
  const processedArticleCounts = new Set();

  const checkMessages = () => {
    let articles = document.querySelectorAll("article");
    if (articles.length === 0) {
      articles = document.querySelectorAll('[data-message-author-role="assistant"]');
      if (articles.length === 0) articles = document.querySelectorAll('[class*="markdown"]');
    }
    if (articles.length === 0) return;

    const lastArticle = articles[articles.length - 1];
    const text = getText(lastArticle);
    const textLen = text.length;

    if (textLen < 30) return;

    if (articles.length > lastArticleCount) {
      lastArticleCount = articles.length;
      lastTextLen = textLen;
      stableCount = 0;
      return;
    }

    if (Math.abs(textLen - lastTextLen) < 50) {
      stableCount++;
    } else {
      lastTextLen = textLen;
      stableCount = 0;
    }

    if (stableCount < 3) return;
    if (processedArticleCounts.has(lastArticleCount)) return;
    processedArticleCounts.add(lastArticleCount);
    if (processedArticleCounts.size > 200) processedArticleCounts.clear();

    let userText = "";
    if (articles.length >= 2) {
      userText = getText(articles[articles.length - 2]);
    }

    const inputTokens = estimateTokens(userText);
    const outputTokens = estimateTokens(text);
    const totalTokens = inputTokens + outputTokens;
    if (totalTokens < 10) return;

    chrome.storage.local.get(["usageHistory"], (r) => {
      const history = r.usageHistory || [];
      history.push({
        provider: "chatgpt",
        model: "estimated",
        inputTokens,
        outputTokens,
        totalTokens,
        timestamp: Date.now(),
        url: "",
      });
      chrome.storage.local.set({ usageHistory: history.slice(-10000) });
    });

    stableCount = 0;
  };

  const startObserving = () => {
    const container = document.querySelector("main") || document.querySelector("#__next") || document.body;
    const obs = new MutationObserver(() => {
      setTimeout(checkMessages, 500);
    });
    obs.observe(container, { childList: true, subtree: true });
    setInterval(checkMessages, 2000);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserving);
  } else {
    setTimeout(startObserving, 2000);
  }
}

observeChat();
