import { SummaryResponse, EstimationMode } from "./types";
import { auth } from "@/lib/firebase";

const USE_MOCK = true;
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export function getUser(): string | null {
  return auth.currentUser?.uid ?? null;
}

export function setUser(_email: string): void {
  // No-op: auth is managed by Firebase
}

export function clearUser(): void {
  // No-op: use signOut from useAuth
}

export async function fetchSummary(month: string): Promise<SummaryResponse> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400)); // fake loading delay
    return mockSummary;
  }

  const user = getUser();
  if (!user) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/api/summary?user=${encodeURIComponent(user)}&month=${month}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch summary: ${res.statusText}`);
  }
  return res.json();
}

export async function saveSettings(
  dailyLimitMl: number,
  estimationMode: EstimationMode
): Promise<void> {
  if (USE_MOCK) {
    // optionally update the mock so UI feels real
    mockSummary.dailyLimitMl = dailyLimitMl;
    mockSummary.estimationMode = estimationMode;
    await new Promise((r) => setTimeout(r, 300));
    return;
  }

  const user = getUser();
  if (!user) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, dailyLimitMl, estimationMode }),
  });

  if (!res.ok) {
    throw new Error(`Failed to save settings: ${res.statusText}`);
  }
}

const mockSummary: SummaryResponse = {
  today: {
    ml: 320,
    tokens: 5400,
    date: "2026-02-28"
  },
  dailyLimitMl: 500,
  estimationMode: "range",
  monthDays: Array.from({ length: 28 }, (_, i) => ({
    date: `2026-02-${String(i + 1).padStart(2, "0")}`,
    ml: Math.floor(Math.random() * 600),
    tokens: Math.floor(Math.random() * 8000)
  })),
  byProvider: {
    chatgpt: 4200,
    claude: 2800,
    gemini: 1900
  }
};
