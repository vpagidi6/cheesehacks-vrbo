export type EstimationMode = "low" | "conservative" | "range";

export type SummaryResponse = {
  today: { ml: number; tokens: number; date: string };
  dailyLimitMl: number;
  estimationMode: EstimationMode;
  monthDays: Array<{ date: string; ml: number; tokens: number }>;
  byProvider: { chatgpt: number; claude: number; gemini: number };
};
