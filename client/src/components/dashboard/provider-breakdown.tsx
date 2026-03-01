import React from "react";
import { Bot, Sparkles, BrainCircuit } from "lucide-react";

const PROVIDER_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  unknown: "Other",
};

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  chatgpt: <Bot size={20} />,
  claude: <Sparkles size={20} />,
  gemini: <BrainCircuit size={20} />,
};

const PROVIDER_STYLES: Record<string, string> = {
  chatgpt: "bg-green-100 text-green-600",
  claude: "bg-orange-100 text-orange-600",
  gemini: "bg-blue-100 text-blue-600",
};

export function ProviderBreakdown({ byProvider }: { byProvider: Record<string, number> }) {
  const entries = Object.entries(byProvider).filter(([, v]) => Number(v) > 0);
  const total = entries.reduce((sum, [, v]) => sum + Number(v), 0);
  const getPercent = (val: number) => (total > 0 ? Math.round((val / total) * 100) : 0);

  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">No provider data yet.</p>;
  }

  return (
    <div className="space-y-4">
      {entries.map(([key, val]) => (
        <div
          key={key}
          className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 transition-colors hover:border-slate-200"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${PROVIDER_STYLES[key] ?? "bg-slate-100 text-slate-600"}`}>
              {PROVIDER_ICONS[key] ?? <Bot size={20} />}
            </div>
            <div>
              <div className="font-medium text-slate-900 capitalize">
                {PROVIDER_LABELS[key] ?? key}
              </div>
              <div className="text-xs text-slate-500">{getPercent(val)}% of total</div>
            </div>
          </div>
          <div className="text-right">
            <span className="font-bold text-slate-900">{Number(val).toLocaleString()}</span>
            <span className="text-sm text-slate-500 ml-1">tokens</span>
          </div>
        </div>
      ))}
    </div>
  );
}