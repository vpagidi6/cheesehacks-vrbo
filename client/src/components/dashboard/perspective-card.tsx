import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, Droplets, Car } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { waterTiers, milesTiers, getBestEquivalence } from "@/lib/equivalences";

interface PerspectiveCardProps {
  waterLiters: number;
  milesDrivenString: string | null | undefined;
}

export function PerspectiveCard({ waterLiters, milesDrivenString }: PerspectiveCardProps) {
  // Extract number from milesDrivenString (e.g., "equivalent to 5 miles driven" -> 5)
  let milesDriven = 0;
  if (milesDrivenString) {
    const match = milesDrivenString.match(/([\d.]+)/);
    if (match) {
      milesDriven = parseFloat(match[1]);
    }
  }

  const waterEq = getBestEquivalence(waterLiters, waterTiers);
  const milesEq = getBestEquivalence(milesDriven, milesTiers);

  // Formatting helpers
  const formatCount = (count: number) => {
    if (count < 0.1) return "< 0.1";
    return count.toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  const waterLabel = waterEq.count === 1 ? waterEq.tier.nameSingular : waterEq.tier.namePlural;
  const milesLabel = milesEq.count === 1 ? milesEq.tier.nameSingular : milesEq.tier.namePlural;

  // For miles track animation
  // If count is say 20, and limit is 30, it fills 20/30 = 66% of the track
  const maxMilesCount = 30; // Based on our target range
  const carPosition = Math.min((milesEq.count / maxMilesCount) * 100, 100);

  return (
    <Card className="shadow-sm border-slate-200 overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-100 bg-white">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Everyday Perspective
            </CardTitle>
            <CardDescription>Putting your AI usage into real-world terms</CardDescription>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-help">
                  <Info size={16} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p className="font-semibold mb-1">Unit Assumptions:</p>
                <ul className="space-y-1 text-slate-300">
                  <li>Soda can: ~355mL</li>
                  <li>Water bottle: 500mL</li>
                  <li>Gallon jug: ~3.78L</li>
                  <li>Bathtub: ~150L</li>
                  <li>Football field: ~0.057 mi</li>
                  <li>5K run: ~3.1 mi</li>
                  <li>Marathon: 26.2 mi</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* Water Section */}
          <div className="p-6 bg-blue-50/30 flex flex-col justify-center min-h-[140px]">
            <div className="flex items-center gap-2 text-blue-600 mb-3">
              <Droplets size={18} />
              <span className="text-sm font-semibold uppercase tracking-wider">Water Equivalence</span>
            </div>
            
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-slate-800">
                ≈ {formatCount(waterEq.count)}
              </div>
              <div className="text-lg text-slate-600 font-medium mb-0.5">
                {waterLabel}
              </div>
            </div>

            {/* Water Micro-animation */}
            <div className="mt-4 flex items-center gap-3">
               <div className="relative w-8 h-12 border-2 border-blue-300 rounded-b-md rounded-t-sm overflow-hidden bg-white/50">
                  {/* Water fill animation - always full since it's "1 unit x N" */}
                  <div className="absolute bottom-0 w-full bg-blue-400 h-full animate-[pulse_3s_ease-in-out_infinite] origin-bottom" />
               </div>
               <div className="text-xl font-bold text-blue-700/80">
                 × {formatCount(waterEq.count)}
               </div>
            </div>
          </div>

          {/* Miles Section */}
          <div className="p-6 bg-slate-50 flex flex-col justify-center min-h-[140px]">
            <div className="flex items-center gap-2 text-slate-600 mb-3">
              <Car size={18} />
              <span className="text-sm font-semibold uppercase tracking-wider">Distance Equivalence</span>
            </div>
            
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-slate-800">
                ≈ {formatCount(milesEq.count)}
              </div>
              <div className="text-lg text-slate-600 font-medium mb-0.5">
                {milesLabel}
              </div>
            </div>

            {/* Miles Micro-animation */}
            <div className="mt-6 relative w-full h-8 flex items-center">
              {/* Track */}
              <div className="absolute w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-slate-300 w-full" 
                     style={{ 
                       backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.8) 10px, rgba(255,255,255,0.8) 20px)'
                     }} 
                />
              </div>
              
              {/* Moving Car */}
              <div 
                className="absolute text-slate-700 transition-all duration-1000 ease-out z-10"
                style={{ 
                  left: `max(0%, min(calc(${carPosition}% - 24px), 100% - 24px))` 
                }}
              >
                <Car size={24} className="fill-slate-700 bg-slate-50 relative -top-1" />
              </div>

              {/* Start/End Markers */}
              <div className="absolute left-0 top-6 text-[10px] text-slate-400 font-medium">0</div>
              <div className="absolute right-0 top-6 text-[10px] text-slate-400 font-medium">{maxMilesCount}</div>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}