export type ToolKey = "chatgpt" | "claude" | "gemini";

export interface ToolTotals {
  tokens: number;
  oz: number;
}

export interface ByToolTotals {
  chatgpt: ToolTotals;
  claude: ToolTotals;
  gemini: ToolTotals;
}

export interface DailyTotalsEntry {
  tokens: number;
  oz: number;
  turns: number;
  byTool: ByToolTotals;
}

export interface DailyTotals {
  [dateKey: string]: DailyTotalsEntry;
}

export interface AllTimeTotals {
  tokens: number;
  oz: number;
  turns: number;
  byTool: ByToolTotals;
}

export interface Settings {
  ecoMode: boolean;
  limitsEnabled: boolean;
  tokenLimit: number;
  ozLimit: number;
  hardBlock: boolean;
  waterIntensity: "low" | "typical" | "high";
}

export interface StorageData {
  dailyTotals: DailyTotals;
  allTimeTotals: AllTimeTotals;
  settings: Settings;
}

export const EMPTY_BY_TOOL: ByToolTotals = {
  chatgpt: { tokens: 0, oz: 0 },
  claude: { tokens: 0, oz: 0 },
  gemini: { tokens: 0, oz: 0 },
};

export const DEFAULT_STORAGE: StorageData = {
  dailyTotals: {
    [new Date().toISOString().slice(0, 10)]: {
      tokens: 4200,
      oz: 38.6,
      turns: 18,
      byTool: {
        chatgpt: { tokens: 2200, oz: 20.2 },
        claude: { tokens: 1300, oz: 12 },
        gemini: { tokens: 700, oz: 6.4 },
      },
    },
  },
  allTimeTotals: {
    tokens: 128900,
    oz: 1186.2,
    turns: 463,
    byTool: {
      chatgpt: { tokens: 62400, oz: 575.5 },
      claude: { tokens: 38600, oz: 355.1 },
      gemini: { tokens: 27900, oz: 255.6 },
    },
  },
  settings: {
    ecoMode: true,
    limitsEnabled: false,
    tokenLimit: 10000,
    ozLimit: 120,
    hardBlock: false,
    waterIntensity: "typical",
  },
};
