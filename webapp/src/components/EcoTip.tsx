type EcoTipProps = {
  tokens: number;
};

function getTip(tokens: number): string {
  if (tokens < 5000) return "You're in the green. Efficient usage today.";
  if (tokens <= 15000) return "Consider summarizing long threads to reduce repeated context.";
  return "Try smaller models or reduce context windows to lower water usage.";
}

export default function EcoTip({ tokens }: EcoTipProps) {
  return (
    <section className="card" aria-live="polite" aria-label="Eco mode tip">
      <h2>Eco Mode Tip</h2>
      <p className="muted">{getTip(tokens)}</p>
    </section>
  );
}
