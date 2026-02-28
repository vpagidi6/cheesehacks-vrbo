type ProgressBarProps = {
  value: number;
  max: number;
  label: string;
};

export default function ProgressBar({ value, max, label }: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const percent = Math.min(100, Math.max(0, (value / safeMax) * 100));

  return (
    <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={safeMax} aria-valuenow={Math.round(value)}>
      <span className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
