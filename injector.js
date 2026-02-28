// Injected script - runs in page context to intercept fetch/XHR
(function () {
  "use strict";
  try {
    if (typeof document === "undefined") return;

    const pageHost = (typeof location !== "undefined" && location.hostname) || "";
    const isChatGPT = pageHost.includes("chatgpt.com") || pageHost.includes("openai.com");
    if (isChatGPT && navigator.serviceWorker) {
      navigator.serviceWorker.register = function () {
        return Promise.resolve({ scope: "/", updateViaCache: () => {}, unregister: () => Promise.resolve() });
      };
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
    }

    const DEBUG = false;
  function sendUsage(data) {
    try {
      if (DEBUG) console.log("[AI Token Tracker] Sending usage:", data.provider, data.totalTokens, "tokens");
      window.postMessage({ type: "__AI_TOKEN_TRACKER_USAGE__", payload: data }, "*");
    } catch (_) {}
  }

  function parseChatGPTResponse(body, url) {
    if (!body?.usage) return null;
    const u = body.usage;
    const input = u.prompt_tokens ?? 0;
    const output = u.completion_tokens ?? 0;
    const total = u.total_tokens ?? input + output;
    const model = body.model || "unknown";
    return {
      provider: "chatgpt",
      model,
      inputTokens: input,
      outputTokens: output,
      totalTokens: total,
      timestamp: Date.now(),
      url: url,
    };
  }

  function parseClaudeResponse(body, url) {
    if (!body?.usage) return null;
    const u = body.usage;
    const input = u.input_tokens ?? 0;
    const output = u.output_tokens ?? 0;
    return {
      provider: "claude",
      model: body.model || "unknown",
      inputTokens: input,
      outputTokens: output,
      totalTokens: input + output,
      timestamp: Date.now(),
      url: url,
    };
  }

  function findUsageMetadata(obj) {
    if (!obj) return null;
    const u = obj.usageMetadata || obj.usage_metadata;
    if (u) return u;
    if (obj.data) return findUsageMetadata(obj.data);
    if (obj.result) return findUsageMetadata(obj.result);
    if (obj.response) return findUsageMetadata(obj.response);
    return null;
  }

  function parseGeminiResponse(body, url) {
    const u = findUsageMetadata(body);
    if (!u) return null;
    const input = u.promptTokenCount ?? u.prompt_token_count ?? 0;
    const output = u.candidatesTokenCount ?? u.candidates_token_count ?? 0;
    const total = u.totalTokenCount ?? u.total_token_count ?? input + output;
    const model = body.modelVersion || body.model_version || "unknown";
    return {
      provider: "gemini",
      model,
      inputTokens: input,
      outputTokens: output,
      totalTokens: total,
      timestamp: Date.now(),
      url: url,
    };
  }

  function tryParseJson(text) {
    try {
      return JSON.parse(text);
    } catch (_) {
      return null;
    }
  }

  function findCountTokens(obj, seen, reqUrl, provider) {
    seen = seen || new Set();
    if (!obj || typeof obj !== "object" || seen.has(obj)) return null;
    seen.add(obj);
    const tokens = obj.count_tokens ?? obj.token_count ?? obj.total_tokens;
    if (typeof tokens === "number" && tokens > 0) {
      return {
        provider: provider || "gemini",
        model: obj.model || obj.model_name || "unknown",
        inputTokens: Math.floor(tokens / 2),
        outputTokens: tokens - Math.floor(tokens / 2),
        totalTokens: tokens,
        timestamp: Date.now(),
        url: reqUrl || "",
      };
    }
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const r = findCountTokens(obj[i], seen, reqUrl, provider);
        if (r) return r;
      }
    } else {
      for (const k of Object.keys(obj)) {
        const r = findCountTokens(obj[k], seen, reqUrl, provider);
        if (r) return r;
      }
    }
    return null;
  }

  function tryParseGoogleRpc(text) {
    if (typeof text !== "string" || !text.startsWith(")]}'\n")) return null;
    const rest = text.slice(5);
    const blocks = [];
    let pos = 0;
    while (pos < rest.length) {
      const nl = rest.indexOf("\n", pos);
      if (nl === -1) break;
      const len = parseInt(rest.slice(pos, nl), 10);
      if (isNaN(len) || len <= 0) break;
      pos = nl + 1;
      const block = rest.slice(pos, pos + len);
      pos += len;
      if (rest[pos] === "\n") pos++;
      const parsed = tryParseJson(block);
      if (parsed) blocks.push(parsed);
    }
    return blocks;
  }

    const SCRIPT_LOAD_TIME = Date.now();
    const recentSends = new Map();

  function processResponse(reqUrl, responseText) {
    const url = reqUrl || "";
    if (!responseText) return;
    if (url.includes("googleadservices.com") || url.includes("analytics") || url.includes("gstatic.com")) return;

    const pageHost = (typeof location !== "undefined" && location.hostname) || "";
    const isChatGPTPage = pageHost.includes("chatgpt.com") || pageHost.includes("openai.com");
    const isChatGPTUrl = url.includes("backend-api") || url.includes("openai.com") || url.includes("chatgpt.com") || (isChatGPTPage && (url.startsWith("/") || url.includes("/r")));
    if (isChatGPTPage && !url.includes("backend-api") && !url.includes("/r")) return;

    if (DEBUG && isChatGPTUrl) {
      console.log("[AI Token Tracker] Processing response from:", url.substring(0, 100) || "(relative)");
    }
    const body = tryParseJson(responseText);

    const openai = isChatGPTUrl;
    const anthropic = url.includes("anthropic.com") || url.includes("claude.ai");
    const gemini =
      url.includes("generativelanguage.googleapis.com") ||
      url.includes("gemini") ||
      url.includes("aistudio.google");

    let usage = null;

    if (openai) {
      const isChatGPT_r = url.includes("backend-api/lat/r") || /\/r(\?|$)/.test(url) || url.includes("backend-api");
      if (body?.usage) usage = parseChatGPTResponse(body, url);
      else if (isChatGPT_r && body && typeof body.count_tokens === "number") {
        usage = findCountTokens(body, new Set(), url, "chatgpt");
      } else if (isChatGPT_r && body) {
        usage = findCountTokens(body, new Set(), url, "chatgpt");
      } else if (typeof responseText === "string") {
        const lines = responseText.split("\n").filter((l) => l.startsWith("data: "));
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i];
          if (line === "data: [DONE]") continue;
          const json = tryParseJson(line.slice(6));
          if (json?.usage) {
            usage = parseChatGPTResponse(json, url);
            break;
          }
        }
      }
    } else if (anthropic && body?.usage) {
      usage = parseClaudeResponse(body, url);
    } else if (gemini && body) {
      const u = body?.usageMetadata || body?.usage_metadata;
      if (u) usage = parseGeminiResponse(body, url);
    }

    if (!usage) {
      const providerForCountTokens = openai ? "chatgpt" : (url.includes("gemini.google.com") || url.includes("aistudio.google.com") || url.includes("generativelanguage.googleapis.com") ? "gemini" : "gemini");
      if (body && (typeof body.count_tokens === "number" || typeof body.token_count === "number" || typeof body.total_tokens === "number")) {
        usage = findCountTokens(body, new Set(), url, providerForCountTokens);
      } else if (openai || url.includes("gemini.google.com") || url.includes("aistudio.google.com") || url.includes("google.com")) {
        const rpcBlocks = tryParseGoogleRpc(responseText);
        if (rpcBlocks) {
          for (const block of rpcBlocks) {
            usage = findCountTokens(block, new Set(), url, providerForCountTokens);
            if (usage) break;
          }
        }
        if (!usage && body) usage = findCountTokens(body, new Set(), url, providerForCountTokens);
      }
    }

    if (usage && (usage.inputTokens > 0 || usage.outputTokens > 0 || usage.totalTokens > 0)) {
      const key = usage.totalTokens + "_" + Date.now();
      const last = recentSends.get(usage.url);
      if (last && last.tokens === usage.totalTokens && Date.now() - last.ts < 800) return;
      recentSends.set(usage.url, { tokens: usage.totalTokens, ts: Date.now() });
      if (recentSends.size > 50) recentSends.clear();
      sendUsage(usage);
    }
  }

  // Intercept fetch - reapply periodically since ChatGPT may overwrite it
  const origFetch = window.fetch.bind(window);
  function installFetch() {
    window.fetch = function (...args) {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      if (DEBUG && url.includes("backend-api/lat/r")) {
        console.log("[AI Token Tracker] Intercepted fetch to lat/r");
      }
      return origFetch.apply(this, args).then((response) => {
        const respUrl = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
        const clone = response.clone();
        clone.text().then((text) => processResponse(respUrl, text)).catch(() => {});
        return response;
      });
    };
  }
  installFetch();
  setInterval(installFetch, 200);

  const NativeXHR = window.XMLHttpRequest;
  const PatchedXHR = function () {
    const xhr = new NativeXHR();
    const origOpen = xhr.open;
    const origSend = xhr.send;
    xhr.open = function (m, url) {
      xhr._trackUrl = url;
      return origOpen.apply(this, arguments);
    };
    xhr.send = function () {
      xhr.addEventListener("load", function () {
        if (xhr._trackUrl && xhr.responseText) processResponse(xhr._trackUrl, xhr.responseText);
      });
      return origSend.apply(this, arguments);
    };
    return xhr;
  };
  PatchedXHR.prototype = NativeXHR.prototype;
  function installXHR() {
    window.XMLHttpRequest = PatchedXHR;
  }
  installXHR();
  setInterval(installXHR, 200);
  } catch (e) {
    console.debug("[AI Token Tracker] Init error:", e);
  }
})();
