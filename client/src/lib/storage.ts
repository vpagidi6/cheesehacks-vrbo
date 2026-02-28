// client/src/lib/storage.ts
export interface AppSettings {
  ecoMode: boolean;
  limitsEnabled: boolean;
  tokenLimit: number;
  ozLimit: number;
  hardBlock: boolean;
  waterIntensity: "low" | "typical" | "high";
}

export const defaultSettings: AppSettings = {
  ecoMode: true,
  limitsEnabled: false,
  tokenLimit: 15000,
  ozLimit: 16.9,
  hardBlock: false,
  waterIntensity: "typical"
};

export async function storageGet(keys: string[] | string | null): Promise<Record<string, any>> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise(resolve => {
      chrome.storage.local.get(keys, resolve);
    });
  }
  
  // Dev mock
  const result: Record<string, any> = {};
  const queryKeys = Array.isArray(keys) ? keys : keys ? [keys] : ["usageHistory", "settings"];
  
  queryKeys.forEach(key => {
    const val = localStorage.getItem(key);
    if (val) {
      try {
        result[key] = JSON.parse(val);
      } catch {
        result[key] = val;
      }
    }
  });
  
  return result;
}

export async function storageSet(obj: Record<string, any>): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise(resolve => {
      chrome.storage.local.set(obj, resolve);
    });
  }
  
  // Dev mock
  Object.entries(obj).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value));
  });
  
  // Dispatch custom event for mock reactivity
  window.dispatchEvent(new Event('mock-storage-changed'));
}

export function subscribeToStorage(callback: () => void) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(callback);
    return () => chrome.storage.onChanged.removeListener(callback);
  }
  
  window.addEventListener('mock-storage-changed', callback);
  return () => window.removeEventListener('mock-storage-changed', callback);
}

// Dev mock data seeder
export function seedMockData() {
  if (!localStorage.getItem('settings')) {
    localStorage.setItem('settings', JSON.stringify(defaultSettings));
  }
  if (!localStorage.getItem('usageHistory')) {
    const mockHistory = [
      { payload: { provider: "chatgpt", totalTokens: 1200, timestamp: Date.now() - 1000 * 60 * 5 } },
      { payload: { tool: "claude", prompt_tokens: 400, completion_tokens: 800, ts: Date.now() - 1000 * 60 * 60 } },
      { payload: { platform: "gemini", usage: { total_tokens: 3000 }, created: Math.floor(Date.now() / 1000) - 3600 * 2 } },
      { payload: { provider: "chatgpt", totalTokens: 8500, timestamp: Date.now() - 1000 * 60 * 60 * 24 } }
    ];
    localStorage.setItem('usageHistory', JSON.stringify(mockHistory));
  }
}
