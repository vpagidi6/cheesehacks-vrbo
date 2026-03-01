import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  updateDoc,
  increment,
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

function render(totals) {
  const totalTokens = totals?.totalTokens ?? 0;
  const totalCO2 = totalTokens * GRAM_CO2_PER_TOKEN;

  document.getElementById("total-tokens").textContent = formatNumber(totalTokens);
  document.getElementById("total-co2").textContent = formatCO2(totalCO2);
  document.getElementById("equivalence").textContent = getEquivalence(totalCO2);

  const byProvider = { ...(totals?.totalByProvider || {}) };

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
}

function showScreen(screenId) {
  const login = document.getElementById("login-screen");
  const signup = document.getElementById("signup-screen");
  const dashboard = document.getElementById("dashboard-screen");
  if (login) login.hidden = screenId !== "login-screen";
  if (signup) signup.hidden = screenId !== "signup-screen";
  if (dashboard) dashboard.hidden = screenId !== "dashboard-screen";
}

function setAuthError(elId, message) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = message || "";
  if (message) {
    el.removeAttribute("hidden");
    el.setAttribute("role", "alert");
  } else {
    el.setAttribute("hidden", "");
    el.removeAttribute("role");
  }
}

async function syncPendingToFirestore(user) {
  if (!user) return;
  return new Promise((resolve) => {
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

  try {
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (userSnap.exists()) totals = userSnap.data();
  } catch (_) {}

  chrome.storage.local.get(["pendingFirestore"], (r) => {
    const pending = r.pendingFirestore || [];
    if (pending.length > 0) {
      syncPendingToFirestore(user).then(() => loadDashboard(user));
      return;
    }
    render(totals);
  });
}

document.getElementById("btn-show-signup").addEventListener("click", () => {
  setAuthError("auth-error", "");
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
  const btn = document.getElementById("btn-login");
  const origText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Signing in…";
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    chrome.storage.local.set({ firebaseUid: userCred.user.uid });
    setAuthError("auth-error", "");
    showScreen("dashboard-screen");
    await syncPendingToFirestore(userCred.user);
    await loadDashboard(userCred.user);
  } catch (err) {
    const msg =
      err.code === "auth/invalid-credential" ||
      err.code === "auth/user-not-found"
        ? "Invalid email or password"
        : err.code === "auth/operation-not-allowed"
          ? "Email/Password sign-in is disabled in Firebase Console."
          : err.message || "Login failed";
    setAuthError("auth-error", msg);
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
});

document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  setAuthError("signup-error", "");
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const btn = document.getElementById("btn-signup");
  const origText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Creating account…";
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      createdAt: serverTimestamp(),
    });
    chrome.storage.local.set({ firebaseUid: cred.user.uid });
    setAuthError("signup-error", "");
    showScreen("dashboard-screen");
    await syncPendingToFirestore(cred.user);
    await loadDashboard(cred.user);
  } catch (err) {
    const msg =
      err.code === "auth/email-already-in-use"
        ? "Email already registered"
        : err.code === "auth/operation-not-allowed"
          ? "Enable Email/Password in Firebase Console → Authentication."
          : err.message || "Sign up failed";
    setAuthError("signup-error", msg);
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
});

document.getElementById("btn-logout").addEventListener("click", async () => {
  await signOut(auth);
  chrome.storage.local.remove(["firebaseUid"]);
  showScreen("login-screen");
  setAuthError("auth-error", "");
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.pendingFirestore && auth.currentUser) {
    const pending = changes.pendingFirestore.newValue || [];
    if (pending.length > 0) syncPendingToFirestore(auth.currentUser).then(() => loadDashboard(auth.currentUser));
  }
});

// Show login immediately so something is always visible
showScreen("login-screen");

onAuthStateChanged(auth, async (user) => {
  try {
    if (user) {
      chrome.storage.local.set({ firebaseUid: user.uid });
      const emailEl = document.getElementById("user-email");
      if (emailEl) emailEl.textContent = user.email || "";
      showScreen("dashboard-screen");
      await syncPendingToFirestore(user);
      loadDashboard(user);
    } else {
      chrome.storage.local.remove(["firebaseUid"]);
      showScreen("login-screen");
      setAuthError("auth-error", "");
      setAuthError("signup-error", "");
    }
  } catch (e) {
    showScreen("login-screen");
    setAuthError("auth-error", "Something went wrong. Try again.");
  }
});
