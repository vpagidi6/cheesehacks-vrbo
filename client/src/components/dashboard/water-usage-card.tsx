import React from "react";
import { InteractiveWater } from "./interactive-water";
import { Droplet } from "lucide-react";

interface WaterUsageCardProps {
  ml: number;
  limitMl: number;
}

export function WaterUsageCard({ ml, limitMl }: WaterUsageCardProps) {
  const percentage = Math.min(100, Math.max(0, (ml / limitMl) * 100));
  const isWarning = ml >= limitMl;

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-slate-200 isolation-isolate">
      {/* Background Interactive Water tank */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <InteractiveWater 
          percentage={percentage} 
          isWarning={isWarning}
        />
      </div>
      
      {/* Data Overlay on top of water */}
      <div className="absolute top-0 left-0 w-full p-4 z-20 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-white/40 shadow-sm inline-block pointer-events-auto">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Droplet size={14} className="text-blue-500" /> Water Consumed
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">{ml.toLocaleString()}</span>
            <span className="text-sm font-medium text-slate-600">mL</span>
          </div>
          {limitMl > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              {Math.round((ml / limitMl) * 100)}% of {limitMl} mL limit
            </p>
          )}
        </div>
      </div>
    </div>
  );
}