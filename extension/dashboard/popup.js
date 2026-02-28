const GRAM_CO2_PER_TOKEN = 0.01;
const GRAM_CO2_PER_MILE_DRIVING = 400;
const GRAM_CO2_PER_TREE_YEAR = 21000;

function formatNumber(n) {
  return new Intl.NumberFormat().format(Math.round(n));
}

function formatCO2(g) {
  if (g < 1000) return `${formatNumber(g)} g`;
  return `${(g / 1000).toFixed(2)} kg`;
}

function getEquivalence(gramsCO2) {
  if (gramsCO2 < 1) return "—";
  const miles = gramsCO2 / GRAM_CO2_PER_MILE_DRIVING;
  if (miles < 0.01) return "~10 m driven";
  if (miles < 1) return `~${(miles * 5280).toFixed(0)} ft driven`;
  if (miles < 10) return `~${miles.toFixed(1)} mi driven`;
  const treeYears = gramsCO2 / GRAM_CO2_PER_TREE_YEAR;
  if (treeYears >= 0.01) return `~${(treeYears * 365).toFixed(0)} days to offset`;
  return `~${miles.toFixed(1)} mi driven`;
}

function render(history) {
  const totalTokens = history.reduce((s, h) => s + (h.totalTokens || 0), 0);
  const totalCO2 = totalTokens * GRAM_CO2_PER_TOKEN;

  document.getElementById("total-tokens").textContent = formatNumber(totalTokens);
  document.getElementById("total-co2").textContent = formatCO2(totalCO2);
  document.getElementById("equivalence").textContent = getEquivalence(totalCO2);

  const byProvider = {};
  history.forEach((h) => {
    const p = h.provider || "unknown";
    if (!byProvider[p]) byProvider[p] = 0;
    byProvider[p] += h.totalTokens || 0;
  });

  const providerGrid = document.getElementById("provider-grid");
  providerGrid.innerHTML = "";
  for (const [provider, tokens] of Object.entries(byProvider)) {
    const row = document.createElement("div");
    row.className = "provider-row";
    row.innerHTML = `
      <span class="provider-name">
        <span class="provider-dot ${provider}"></span>
        ${provider}
      </span>
      <span class="provider-tokens">${formatNumber(tokens)} tokens</span>
    `;
    providerGrid.appendChild(row);
  }

  const historyList = document.getElementById("history-list");
  historyList.innerHTML = "";
  const recent = history.slice(-20).reverse();
  if (recent.length === 0) {
    historyList.innerHTML = `<div class="empty-state">Send prompts on ChatGPT, Claude, or Gemini – tokens are estimated from text.</div>`;
  } else {
    recent.forEach((h) => {
      const item = document.createElement("div");
      item.className = "history-item";
      const time = new Date(h.timestamp).toLocaleString();
      item.innerHTML = `
        <span class="history-provider">${h.provider || "?"}</span>
        <span class="history-details">${formatNumber(h.totalTokens || 0)} tokens · ${time}</span>
      `;
      historyList.appendChild(item);
    });
  }
}

function showScreen(screenId) {
  document.getElementById("login-screen").hidden = screenId !== "login-screen";
  document.getElementById("signup-screen").hidden = screenId !== "signup-screen";
  document.getElementById("dashboard-screen").hidden = screenId !== "dashboard-screen";
}

function setAuthError(elId, message) {
  const el = document.getElementById(elId);
  el.textContent = message || "";
  el.hidden = !message;
}

async function apiFetch(baseUrl, path, options = {}) {
  const url = (baseUrl.replace(/\/$/, "") + path).replace(/\/\/+/g, "/");
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = res.ok ? await res.json().catch(() => ({})) : null;
  if (!res.ok) {
    const err = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(err);
  }
  return data;
}

function loadAndRender() {
  chrome.storage.local.get(["usageHistory"], (r) => render(r.usageHistory || []));
}

function initAuth() {
  chrome.storage.local.get(["authToken", "userEmail", "apiBaseUrl"], (st) => {
    if (st.authToken && st.userEmail) {
      document.getElementById("user-email").textContent = st.userEmail;
      showScreen("dashboard-screen");
      loadAndRender();
      return;
    }
    showScreen("login-screen");
    if (st.apiBaseUrl) {
      document.getElementById("api-url").value = st.apiBaseUrl;
      document.getElementById("signup-api-url").value = st.apiBaseUrl;
    }
  });
}

document.getElementById("btn-show-signup").addEventListener("click", () => {
  setAuthError("auth-error", "");
  document.getElementById("signup-api-url").value = document.getElementById("api-url").value;
  showScreen("signup-screen");
});

document.getElementById("btn-show-login").addEventListener("click", () => {
  setAuthError("signup-error", "");
  showScreen("login-screen");
});

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  setAuthError("auth-error", "");
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const apiBaseUrl = document.getElementById("api-url").value.trim();
  if (!apiBaseUrl) {
    setAuthError("auth-error", "Enter your API URL.");
    return;
  }
  const btn = document.getElementById("btn-login");
  btn.disabled = true;
  try {
    const data = await apiFetch(apiBaseUrl, "/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const token = data.token || data.accessToken || data.access_token;
    if (!token) throw new Error("No token in response");
    chrome.storage.local.set({
      authToken: token,
      userEmail: data.user?.email || email,
      apiBaseUrl,
    });
    document.getElementById("user-email").textContent = data.user?.email || email;
    showScreen("dashboard-screen");
    loadAndRender();
  } catch (err) {
    setAuthError("auth-error", err.message || "Login failed");
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  setAuthError("signup-error", "");
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const apiBaseUrl = document.getElementById("signup-api-url").value.trim();
  if (!apiBaseUrl) {
    setAuthError("signup-error", "Enter your API URL.");
    return;
  }
  const btn = document.getElementById("btn-signup");
  btn.disabled = true;
  try {
    const data = await apiFetch(apiBaseUrl, "/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const token = data.token || data.accessToken || data.access_token;
    if (token) {
      chrome.storage.local.set({
        authToken: token,
        userEmail: data.user?.email || email,
        apiBaseUrl,
      });
      document.getElementById("user-email").textContent = data.user?.email || email;
      showScreen("dashboard-screen");
      loadAndRender();
    } else {
      setAuthError("signup-error", "Account created. Please log in.");
      document.getElementById("api-url").value = apiBaseUrl;
      document.getElementById("login-email").value = email;
      showScreen("login-screen");
    }
  } catch (err) {
    setAuthError("signup-error", err.message || "Sign up failed");
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("btn-logout").addEventListener("click", () => {
  chrome.storage.local.remove(["authToken", "userEmail"], () => {
    showScreen("login-screen");
    setAuthError("auth-error", "");
  });
});

document.getElementById("btn-clear").addEventListener("click", () => {
  if (confirm("Clear all usage data?")) {
    chrome.storage.local.set({ usageHistory: [] }, () => render([]));
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.usageHistory) loadAndRender();
});

initAuth();
