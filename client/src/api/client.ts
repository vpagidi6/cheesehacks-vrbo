import { SummaryResponse, EstimationMode } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export function getUser(): string | null {
  return localStorage.getItem("water_user");
}

export function setUser(email: string): void {
  localStorage.setItem("water_user", email);
}

export function clearUser(): void {
  localStorage.removeItem("water_user");
}

export async function fetchSummary(month: string): Promise<SummaryResponse> {
  const user = getUser();
  if (!user) throw new Error("Not logged in");
  
  const res = await fetch(`${API_BASE}/api/summary?user=${encodeURIComponent(user)}&month=${month}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch summary: ${res.statusText}`);
  }
  return res.json();
}

export async function saveSettings(dailyLimitMl: number, estimationMode: EstimationMode): Promise<void> {
  const user = getUser();
  if (!user) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/api/settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ user, dailyLimitMl, estimationMode })
  });
  
  if (!res.ok) {
    throw new Error(`Failed to save settings: ${res.statusText}`);
  }
}
