import ProgressBar from "./ProgressBar";
import type { ByToolTotals, ToolKey } from "../types";

type ToolBreakdownProps = {
  title: string;
  byTool: ByToolTotals;
  totalTokens: number;
};

const toolOrder: ToolKey[] = ["chatgpt", "claude", "gemini"];

const labels: Record<ToolKey, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
};

export default function ToolBreakdown({ title, byTool, totalTokens }: ToolBreakdownProps) {
  const safeTotal = Math.max(1, totalTokens);

  return (
    <section className="card" aria-label={title}>
      <h2>{title}</h2>
      <ul className="tool-list">
        {toolOrder.map((tool) => {
          const entry = byTool[tool];
          return (
            <li key={tool} className="tool-item">
              <div className="tool-row">
                <strong>{labels[tool]}</strong>
                <span>
                  {entry.tokens.toLocaleString()} tok · {entry.oz.toFixed(1)} oz
                </span>
              </div>
              <ProgressBar value={entry.tokens} max={safeTotal} label={`${labels[tool]} token usage`} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
