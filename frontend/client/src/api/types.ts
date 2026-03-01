export type EstimationMode = "low" | "conservative" | "range";

export type SummaryResponse = {
  today: { ml: number; tokens: number; date: string };
  dailyLimitMl: number;
  estimationMode: EstimationMode;
  monthDays: Array<{ date: string; ml: number; tokens: number }>;
  byProvider: Record<string, number>;
  totalCO2?: string;
  totalWater?: string;
  equivalence?: string;
};

export type BackendStatsResponse = {
  totalTokens: number;
  totalByProvider: Record<string, number>;
  totalCO2: string;
  totalWater: string;
  equivalence: string;
};
