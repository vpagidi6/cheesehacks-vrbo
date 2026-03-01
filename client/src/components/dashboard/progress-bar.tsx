export function ProgressBar({ value, max }: { value: number; max: number }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const isOver = value >= max;
  
  return (
    <div className="w-full">
      <div className="flex justify-between mb-2 text-sm text-slate-600 font-medium">
        <span>{value.toLocaleString()} mL</span>
        <span>{max.toLocaleString()} mL Limit</span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}