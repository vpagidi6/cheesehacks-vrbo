import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type DayData = { date: string; ml: number; tokens: number };

export function CalendarHeatmap({ month, days }: { month: string; days: DayData[] }) {
  // Parse month
  const [year, m] = month.split('-').map(Number);
  const startDate = new Date(year, m - 1, 1);
  const startDayOfWeek = startDate.getDay(); // 0 is Sun, 6 is Sat
  const daysInMonth = new Date(year, m, 0).getDate();
  
  // Find max ml for color scaling
  const maxMl = Math.max(...days.map(d => d.ml), 1);
  
  // Fill leading empty cells
  const cells = Array(startDayOfWeek).fill(null);
  
  // Create day map for quick lookup
  const dayMap = new Map(days.map(d => {
    const dayNum = parseInt(d.date.split('-')[2], 10);
    return [dayNum, d];
  }));

  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(dayMap.get(i) || { date: `${month}-${i.toString().padStart(2, '0')}`, ml: 0, tokens: 0 });
  }
  
  const getIntensityClass = (ml: number) => {
    if (ml === 0) return "bg-slate-100 text-slate-400";
    const ratio = ml / maxMl;
    if (ratio < 0.25) return "bg-blue-200 text-blue-800 font-medium";
    if (ratio < 0.5) return "bg-blue-400 text-blue-900 font-semibold";
    if (ratio < 0.75) return "bg-blue-600 text-white font-semibold";
    return "bg-blue-800 text-white font-bold";
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <div className="grid grid-cols-7 gap-2 mb-3">
        {weekdays.map(w => <div key={w} className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, idx) => {
          if (!cell) return <div key={`empty-${idx}`} className="h-10 w-full rounded-md" />;
          
          const dayNum = parseInt(cell.date.split('-')[2], 10);
          
          return (
            <Tooltip key={cell.date}>
              <TooltipTrigger asChild>
                <div className={`h-10 sm:h-12 w-full rounded-md flex items-center justify-center text-sm transition-all hover:ring-2 hover:ring-offset-2 hover:ring-blue-400 cursor-pointer shadow-sm ${getIntensityClass(cell.ml)}`}>
                  {dayNum}
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white border-slate-800 p-3 shadow-lg">
                <div className="text-sm">
                  <div className="font-semibold text-blue-300 mb-1">{cell.date}</div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-300">Water:</span>
                    <span className="font-medium">{cell.ml.toLocaleString()} mL</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-300">Tokens:</span>
                    <span className="font-medium">{cell.tokens.toLocaleString()}</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}