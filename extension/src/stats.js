import { auth, db } from "./firebase-config.js";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";

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
  if (treeYears >= 0.01)
    return `~${(treeYears * 365).toFixed(0)} days to offset`;
  return `~${miles.toFixed(1)} mi driven`;
}

function render(totals, events, localHistory) {
  const totalTokens = totals?.totalTokens ?? 0;
  const totalCO2 = totalTokens * GRAM_CO2_PER_TOKEN;

  const totalEl = document.getElementById("total-tokens");
  const co2El = document.getElementById("total-co2");
  const equivEl = document.getElementById("equivalence");
  if (totalEl) totalEl.textContent = formatNumber(totalTokens);
  if (co2El) co2El.textContent = formatCO2(totalCO2);
  if (equivEl) equivEl.textContent = getEquivalence(totalCO2);

  const byProvider = { ...(totals?.totalByProvider || {}) };
  (localHistory || []).forEach((h) => {
    const p = (h.provider || "unknown").trim().toLowerCase();
    if (!byProvider[p]) byProvider[p] = 0;
    byProvider[p] += h.totalTokens || 0;
  });

  const providerGrid = document.getElementById("provider-grid");
  if (providerGrid) {
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
  }

  const historyList = document.getElementById("history-list");
  if (!historyList) return;
  historyList.innerHTML = "";
  const combined = [
    ...(events || []).map((e) => ({
      provider: e.provider,
      totalTokens: e.totalTokens,
      timestamp:
        (typeof e.timestamp === "number" && e.timestamp) ||
        (e.timestamp?.toMillis && e.timestamp.toMillis()) ||
        (e.createdAt?.toMillis && e.createdAt.toMillis()) ||
        0,
    })),
    ...(localHistory || []).map((h) => ({
      provider: h.provider,
      totalTokens: h.totalTokens,
      timestamp: h.timestamp || 0,
    })),
  ].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const recent = combined.slice(0, 20);

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

async function syncPendingToFirestore(user) {
  if (!user) return;
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) {
      resolve();
      return;
    }
    chrome.storage.local.get(["pendingFirestore"], async (r) => {
      const pending = r.pendingFirestore || [];
      if (pending.length === 0) {
        resolve();
        return;
      }
      const uid = user.uid;
      try {
        let totalSum = 0;
        const byProvider = {};
        for (const ev of pending) {
          const totalTokens = Number(ev.totalTokens) || 0;
          const provider = (ev.provider || "unknown").trim().toLowerCase();
          totalSum += totalTokens;
          byProvider[provider] = (byProvider[provider] || 0) + totalTokens;
        }
        const updates = {
          totalTokens: increment(totalSum),
          updatedAt: serverTimestamp(),
        };
        for (const [provider, sum] of Object.entries(byProvider)) {
          updates[`totalByProvider.${provider}`] = increment(sum);
        }
        await updateDoc(doc(db, "users", uid), updates);
        chrome.storage.local.set({ pendingFirestore: [] });
      } catch (err) {
        console.error("[sustAIn] Sync to Firestore failed:", err);
      }
      resolve();
    });
  });
}

async function loadDashboard(user) {
  if (!user) return;
  const emailEl = document.getElementById("user-email");
  if (emailEl) emailEl.textContent = user.email || "";

  let totals = { totalTokens: 0, totalByProvider: {} };
  let events = [];

  try {
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (userSnap.exists()) totals = userSnap.data();
  } catch (_) {}

  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["usageHistory"], (r) => {
        render(totals, events, r.usageHistory || []);
        resolve();
      });
    } else {
      render(totals, events, []);
      resolve();
    }
  });
}

function showLoggedOut() {
  const out = document.getElementById("logged-out-view");
  const dash = document.getElementById("dashboard-screen");
  if (out) out.classList.remove("hidden");
  if (dash) dash.classList.add("hidden");
}

function showDashboard() {
  const out = document.getElementById("logged-out-view");
  const dash = document.getElementById("dashboard-screen");
  if (out) out.classList.add("hidden");
  if (dash) dash.classList.remove("hidden");
}

document.getElementById("btn-logout")?.addEventListener("click", async () => {
  await signOut(auth);
  showLoggedOut();
});

document.getElementById("btn-clear")?.addEventListener("click", async () => {
  if (!confirm("Clear local usage data? (Cloud data is kept.)")) return;
  if (typeof chrome === "undefined" || !chrome.storage?.local) return;
  const user = auth.currentUser;
  chrome.storage.local.set({ usageHistory: [], pendingFirestore: [] });
  if (user) {
    await loadDashboard(user);
  } else {
    render({ totalTokens: 0, totalByProvider: {} }, [], []);
  }
});

if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.usageHistory && auth.currentUser) loadDashboard(auth.currentUser);
    if (changes.pendingFirestore && auth.currentUser) {
      const pending = changes.pendingFirestore.newValue || [];
      if (pending.length > 0) syncPendingToFirestore(auth.currentUser).then(() => loadDashboard(auth.currentUser));
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    showDashboard();
    document.getElementById("user-email").textContent = user.email || "";
    await syncPendingToFirestore(user);
    await loadDashboard(user);
  } else {
    showLoggedOut();
  }
});
