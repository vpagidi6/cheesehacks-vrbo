(function () {
  "use strict";

  var SITES = {
    chatgpt: {
      hostnames: ["chatgpt.com", "chat.openai.com"],
      assistantSelector: "[data-message-author-role='assistant']",
      userPromptSelector: "[data-message-author-role='user']",
      provider: "chatgpt",
    },
    claude: {
      hostnames: ["claude.ai"],
      assistantSelector: "div.font-claude-message, [data-test-render-count], div[class*='claude-message']",
      userPromptSelector: "[data-testid='user-message']",
      provider: "claude",
    },
    gemini: {
      hostnames: ["gemini.google.com", "aistudio.google.com"],
      assistantSelector: "[role='article'], [class*='model-response'], [class*='markdown'], [class*='assistant-message'], [class*='bot-message'], [data-message-type='model']",
      userPromptSelector: "[class*='user-message'], [data-message-type='user']",
      provider: "gemini",
    },
  };

  function getConfig() {
    var host = (typeof location !== "undefined" && location.hostname) || "";
    for (var key in SITES) {
      var cfg = SITES[key];
      if (cfg.hostnames.some(function (h) { return host.indexOf(h) !== -1; })) return cfg;
    }
    return null;
  }

  function estimateTokens(text) {
    if (!text || typeof text !== "string") return 0;
    return Math.ceil(text.length / 4);
  }

  function getText(el) {
    if (!el) return "";
    var t = el.innerText || el.textContent || "";
    return (typeof t === "string" ? t : "").trim();
  }

  function getLastUserMessageText(config) {
    if (!config.userPromptSelector) return "";
    try {
      var nodes = document.querySelectorAll(config.userPromptSelector);
      var last = nodes[nodes.length - 1];
      return last ? getText(last) : "";
    } catch (_) {
      return "";
    }
  }

  var lastSentKey = null;
  var lastSentTime = 0;
  var DEDUPE_MS = 3000;

  function handleAssistantMessage(node, config) {
    if (node.dataset && node.dataset.aiTokenProcessed === "true") return;

    var text = getText(node);
    if (!text || text.length < 10) return;

    var outputTokens = estimateTokens(text);
    var inputText = getLastUserMessageText(config);
    var inputTokens = estimateTokens(inputText);
    var key = config.provider + "|" + outputTokens + "|" + (outputTokens + inputTokens);
    var now = Date.now();
    if (key === lastSentKey && (now - lastSentTime) < DEDUPE_MS) return;
    lastSentKey = key;
    lastSentTime = now;

    try {
      chrome.runtime.sendMessage({
        type: "LLM_USAGE",
        payload: {
          provider: config.provider,
          model: "estimated",
          inputTokens: inputTokens,
          outputTokens: outputTokens,
          totalTokens: inputTokens + outputTokens,
          timestamp: Date.now(),
          url: (typeof location !== "undefined" && location.href) || "",
        },
      });
    } catch (_) {}

    if (node.dataset) node.dataset.aiTokenProcessed = "true";
  }

  function waitForStability(node, config, callback) {
    var lastLength = getText(node).length;
    var stableCount = 0;
    var interval = setInterval(function () {
      var currentLength = getText(node).length;
      if (currentLength === lastLength) {
        stableCount++;
      } else {
        stableCount = 0;
        lastLength = currentLength;
      }
      if (stableCount >= 5) {
        clearInterval(interval);
        callback(node, config);
      }
    }, 200);
  }

  function findAssistantNodes(root, selector) {
    var selectors = selector.split(",").map(function (s) { return s.trim(); });
    var out = [];
    function collect(el) {
      if (!el || el.nodeType !== 1) return;
      for (var i = 0; i < selectors.length; i++) {
        try {
          if (el.matches && el.matches(selectors[i])) {
            out.push(el);
            return;
          }
        } catch (_) {}
      }
      for (var j = 0; j < el.children.length; j++) collect(el.children[j]);
    }
    for (var i = 0; i < selectors.length; i++) {
      try {
        var list = root.querySelectorAll(selectors[i]);
        for (var k = 0; k < list.length; k++) out.push(list[k]);
      } catch (_) {}
    }
    return out;
  }

  function isInAddedTree(node, addedNode) {
    var p = node;
    while (p) {
      if (p === addedNode) return true;
      p = p.parentElement;
    }
    return false;
  }

  function run(config) {
    var watching = new Set();

    function hasProcessedOrWatchedAncestor(el) {
      var p = el.parentElement;
      while (p) {
        if (p.dataset && p.dataset.aiTokenProcessed === "true") return true;
        if (watching.has(p)) return true;
        p = p.parentElement;
      }
      return false;
    }

    function processCandidate(el) {
      if (!el || el.nodeType !== 1) return;
      if (el.dataset && el.dataset.aiTokenProcessed === "true") return;
      if (watching.has(el)) return;
      if (hasProcessedOrWatchedAncestor(el)) return;
      var parts = config.assistantSelector.split(",").map(function (s) { return s.trim(); });
      var matches = false;
      for (var p = 0; p < parts.length; p++) {
        try {
          if (el.matches && el.matches(parts[p])) { matches = true; break; }
        } catch (_) {}
      }
      if (!matches) return;
      var partsSel = config.assistantSelector.split(",").map(function (s) { return s.trim(); });
      for (var q = 0; q < partsSel.length; q++) {
        var inner = el.querySelector && el.querySelector(partsSel[q]);
        if (inner && inner !== el) return;
      }

      watching.add(el);
      waitForStability(el, config, function (node, cfg) {
        watching.delete(node);
        handleAssistantMessage(node, cfg);
      });
    }

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        for (var i = 0; i < mutation.addedNodes.length; i++) {
          var node = mutation.addedNodes[i];
          if (!node || node.nodeType !== 1) continue;
          processCandidate(node);
          if (node.querySelectorAll) {
            try {
              var parts = config.assistantSelector.split(",").map(function (s) { return s.trim(); });
              for (var p = 0; p < parts.length; p++) {
                var list = node.querySelectorAll(parts[p]);
                for (var k = 0; k < list.length; k++) processCandidate(list[k]);
              }
            } catch (_) {}
          }
        }
      });
    });

    function startObserving() {
      observer.observe(document.body, { childList: true, subtree: true });
    }
    if (config.provider === "claude" || config.provider === "gemini") {
      setTimeout(startObserving, 500);
    } else {
      startObserving();
    }
  }

  var config = getConfig();
  if (config) run(config);
})();
