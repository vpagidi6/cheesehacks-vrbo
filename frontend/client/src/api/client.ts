import { SummaryResponse, EstimationMode, BackendStatsResponse } from "./types";
import { auth } from "@/lib/firebase";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const API_BASE = import.meta.env.VITE_API_BASE || "https://eco-backend-316882873742.us-central1.run.app";

const ML_PER_TOKEN = 0.5;
const DEFAULT_DAILY_LIMIT_ML = 500;
const DEFAULT_ESTIMATION_MODE: EstimationMode = "conservative";
const SETTINGS_STORAGE_PREFIX = "sustain_settings_v1";

type LocalSettings = {
  dailyLimitMl: number;
  estimationMode: EstimationMode;
};

function toValidDailyLimit(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : DEFAULT_DAILY_LIMIT_ML;
}

function settingsStorageKey(userId: string): string {
  return `${SETTINGS_STORAGE_PREFIX}:${userId}`;
}

function readLocalSettings(userId: string): LocalSettings {
  try {
    const raw = localStorage.getItem(settingsStorageKey(userId));
    if (!raw) {
      return {
        dailyLimitMl: DEFAULT_DAILY_LIMIT_ML,
        estimationMode: DEFAULT_ESTIMATION_MODE,
      };
    }
    const parsed = JSON.parse(raw) as Partial<LocalSettings>;
    const estimationMode = parsed.estimationMode;
    return {
      dailyLimitMl: toValidDailyLimit(Number(parsed.dailyLimitMl)),
      estimationMode:
        estimationMode === "low" || estimationMode === "conservative" || estimationMode === "range"
          ? estimationMode
          : DEFAULT_ESTIMATION_MODE,
    };
  } catch {
    return {
      dailyLimitMl: DEFAULT_DAILY_LIMIT_ML,
      estimationMode: DEFAULT_ESTIMATION_MODE,
    };
  }
}

function writeLocalSettings(userId: string, settings: LocalSettings): void {
  localStorage.setItem(settingsStorageKey(userId), JSON.stringify(settings));
}

function applyLocalSettings(summary: SummaryResponse, userId: string): SummaryResponse {
  const local = readLocalSettings(userId);
  return {
    ...summary,
    dailyLimitMl: local.dailyLimitMl,
    estimationMode: local.estimationMode,
  };
}

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
    dailyLimitMl: DEFAULT_DAILY_LIMIT_ML,
    estimationMode: DEFAULT_ESTIMATION_MODE,
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
    const userId = auth.currentUser?.uid;
    return userId ? applyLocalSettings(mockSummary, userId) : mockSummary;
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
  return applyLocalSettings(mapBackendStatsToSummary(data), user.uid);
}

export async function saveSettings(
  dailyLimitMl: number,
  estimationMode: EstimationMode
): Promise<void> {
  const validatedDailyLimitMl = toValidDailyLimit(dailyLimitMl);
  if (USE_MOCK) {
    // optionally update the mock so UI feels real
    mockSummary.dailyLimitMl = validatedDailyLimitMl;
    mockSummary.estimationMode = estimationMode;
    const userId = auth.currentUser?.uid;
    if (userId) {
      writeLocalSettings(userId, {
        dailyLimitMl: validatedDailyLimitMl,
        estimationMode,
      });
    }
    await new Promise((r) => setTimeout(r, 300));
    return;
  }

  const userId = getUser();
  if (!userId) throw new Error("Not logged in");

  // Current backend is read-only for stats, so settings are stored client-side per user.
  writeLocalSettings(userId, {
    dailyLimitMl: validatedDailyLimitMl,
    estimationMode,
  });
}

const mockSummary: SummaryResponse = {
  today: {
    ml: 320,
    tokens: 5400,
    date: "2026-02-28"
  },
  dailyLimitMl: DEFAULT_DAILY_LIMIT_ML,
  estimationMode: DEFAULT_ESTIMATION_MODE,
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
