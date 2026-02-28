import { DEFAULT_STORAGE } from "../types";
import type { StorageData } from "../types";

const STORAGE_KEY = "eco-ai-tracker-storage";

let memoryStore: StorageData = structuredClone(DEFAULT_STORAGE);

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function mergeWithDefaults(raw: Partial<StorageData> | null | undefined): StorageData {
  const input = raw ?? {};
  return {
    dailyTotals: input.dailyTotals ?? structuredClone(DEFAULT_STORAGE.dailyTotals),
    allTimeTotals: {
      ...DEFAULT_STORAGE.allTimeTotals,
      ...input.allTimeTotals,
      byTool: {
        ...DEFAULT_STORAGE.allTimeTotals.byTool,
        ...(input.allTimeTotals?.byTool ?? {}),
      },
    },
    settings: {
      ...DEFAULT_STORAGE.settings,
      ...(input.settings ?? {}),
    },
  };
}

export async function getStorage(): Promise<StorageData> {
  if (!canUseLocalStorage()) {
    return mergeWithDefaults(memoryStore);
  }

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) {
      const defaults = mergeWithDefaults(DEFAULT_STORAGE);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }

    return mergeWithDefaults(JSON.parse(value) as Partial<StorageData>);
  } catch {
    return mergeWithDefaults(memoryStore);
  }
}

export async function setStorage(patch: Partial<StorageData>): Promise<void> {
  const current = await getStorage();
  const next = mergeWithDefaults({ ...current, ...patch });

  if (!canUseLocalStorage()) {
    memoryStore = next;
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
