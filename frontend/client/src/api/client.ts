import { SummaryResponse, EstimationMode, BackendStatsResponse } from "./types";
import { auth } from "@/lib/firebase";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const API_BASE = import.meta.env.VITE_API_BASE || "https://eco-backend-316882873742.us-central1.run.app";

const ML_PER_TOKEN = 0.5;

export function getUser(): string | null {
  return auth.currentUser?.uid ?? null;
}

export function setUser(_email: string): void {
  // No-op: auth is managed by Firebase
}

export function clearUser(): void {
  // No-op: use signOut from useAuth
}

function mapBackendStatsToSummary(stats: BackendStatsResponse): SummaryResponse {
  const today = new Date().toISOString().slice(0, 10);
  const totalTokens = stats.totalTokens ?? 0;
  const todayMl = Math.round(totalTokens * ML_PER_TOKEN);
  return {
    today: {
      ml: todayMl,
      tokens: totalTokens,
      date: today,
    },
    dailyLimitMl: 500,
    estimationMode: "range",
    monthDays: [],
    byProvider: stats.totalByProvider ?? {},
    totalCO2: stats.totalCO2,
    totalWater: stats.totalWater,
    equivalence: stats.equivalence,
  };
}

export async function fetchSummary(_month: string): Promise<SummaryResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return mockSummary;
  }

  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");

  const idToken = await user.getIdToken();
  const res = await fetch(`${API_BASE}/users/me/stats`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Failed to fetch stats: ${res.statusText}`);
  }
  const data: BackendStatsResponse = await res.json();
  return mapBackendStatsToSummary(data);
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
