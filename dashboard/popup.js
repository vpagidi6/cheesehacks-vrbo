// Environmental impact estimates (per token)
// Based on research: ~5-30 mg CO2 per token depending on model; using ~10 mg as avg
const GRAM_CO2_PER_TOKEN = 0.01;
// US grid: ~0.4 kg CO2 per kWh; avg car ~0.4 kg CO2 per mile
const GRAM_CO2_PER_MILE_DRIVING = 400;
// Trees absorb ~21 kg CO2/year
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
  if (treeYears >= 0.01) {
    return `~${(treeYears * 365).toFixed(0)} days to offset`;
  }
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
    historyList.innerHTML = `
      <div class="empty-state">
        No usage yet. Visit ChatGPT, Claude, or Gemini to start tracking.
      </div>
    `;
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

document.getElementById("btn-clear").addEventListener("click", () => {
  if (confirm("Clear all usage data?")) {
    chrome.storage.local.set({ usageHistory: [] }, () => {
      render([]);
    });
  }
});

chrome.storage.local.get(["usageHistory"], (result) => {
  render(result.usageHistory || []);
});
