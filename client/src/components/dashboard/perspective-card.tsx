import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, Droplets, Car } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PerspectiveCardProps {
  waterLiters: number;
  milesDrivenString: string | null | undefined;
  dailyLimitMl: number;
}

export function PerspectiveCard({ waterLiters, milesDrivenString, dailyLimitMl }: PerspectiveCardProps) {
  // Extract number from milesDrivenString (e.g., "equivalent to 5 miles driven" -> 5)
  let milesDriven = 0;
  if (milesDrivenString) {
    const match = milesDrivenString.match(/([\d.]+)/);
    if (match) {
      milesDriven = parseFloat(match[1]);
    }
  }

  // --- Water Equivalency (Gallon Jugs) ---
  const gallons = waterLiters / 3.785;
  const gallonsFormatted = gallons < 0.1 && gallons > 0 
    ? "< 0.1" 
    : gallons.toLocaleString(undefined, { maximumFractionDigits: 1 });
  const gallonsLabel = gallons === 1 ? "gallon jug" : "gallon jugs";

  // --- Distance Equivalency & Animation ---
  // Dynamically calculate track limit based on daily limit in miles
  // Example: 500ml -> 50 miles track limit
  const milesLimitTrack = Math.max((dailyLimitMl / 10), 10); // Minimum 10 miles track

  const loops = Math.floor(milesDriven / milesLimitTrack);
  const remainderProgress = (milesDriven % milesLimitTrack) / milesLimitTrack;
  const totalPercentage = (loops + remainderProgress) * 100;
  
  const [hasAnimated, setHasAnimated] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          // Add a tiny delay before starting animation for better visual effect
          setTimeout(() => setHasAnimated(true), 300);
        }
      },
      { threshold: 0.5 }
    );

    if (trackRef.current) {
      observer.observe(trackRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  // Determine text to show inside track
  const steps = Math.round(milesDriven * 2000);
  const showDrivingTime = steps > 20000;
  const drivingMinutes = Math.round((milesDriven / 30) * 60);

  // Use useMemo to keep animation name stable across renders
  const animName = useMemo(() => `drive-${Math.random().toString(36).substr(2, 9)}`, []);

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
                  <li>Gallon jug: ~3.785L</li>
                  <li>Walking steps: ~2,000 steps/mile</li>
                  <li>Driving speed: ~30 mph average</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <style>
          {`
            @keyframes ${animName} {
              0% { offset-distance: 0%; }
              100% { offset-distance: ${totalPercentage}%; }
            }
          `}
        </style>
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* Water Section */}
          <div className="p-6 bg-blue-50/30 flex flex-col justify-center min-h-[160px]">
            <div className="flex items-center gap-2 text-blue-600 mb-3">
              <Droplets size={18} />
              <span className="text-sm font-semibold uppercase tracking-wider">Water Equivalence</span>
            </div>
            
            <div className="flex items-end gap-3 mt-2">
              <div className="text-4xl font-bold text-slate-800">
                ≈ {gallonsFormatted}
              </div>
              <div className="text-xl text-slate-600 font-medium mb-1">
                {gallonsLabel}
              </div>
            </div>
          </div>

          {/* Miles Section */}
          <div className="p-6 bg-slate-50 flex flex-col justify-center items-center min-h-[160px] relative overflow-hidden">
            
            {/* The Oval Track */}
            <div 
              ref={trackRef}
              className="relative w-[280px] h-[100px] border-[3px] border-dashed border-slate-300 rounded-[50px] flex items-center justify-center bg-white/50"
            >
              {/* Inner Text */}
              <div className="text-center z-10 px-4 py-2 bg-slate-50/90 backdrop-blur-sm rounded-full shadow-sm border border-slate-100">
                {showDrivingTime ? (
                  <>
                    <div className="text-2xl font-bold text-slate-800">≈ {drivingMinutes.toLocaleString()}</div>
                    <div className="text-sm text-slate-600 font-medium">min of driving</div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-slate-800">≈ {steps.toLocaleString()}</div>
                    <div className="text-sm text-slate-600 font-medium">steps</div>
                  </>
                )}
              </div>

              {/* Animated Car on Perimeter */}
              <div className="absolute inset-[-14px] pointer-events-none overflow-visible">
                {/* 
                  Using SVG path for offsetPath. The track is w=280, h=100.
                  We draw an oval path matching those dimensions roughly.
                  We give the wrapper div inset-[-14px] to make space for the car to hang over the edge.
                */}
                <div 
                  className="absolute w-8 h-8 flex items-center justify-center bg-white rounded-full shadow border border-slate-200 text-slate-700 z-20 motion-reduce:!animate-none motion-reduce:!transition-none"
                  style={{
                    offsetPath: "path('M 154 14 L 154 14 A 50 50 0 0 1 294 64 A 50 50 0 0 1 294 64 L 14 64 A 50 50 0 0 1 14 14 A 50 50 0 0 1 154 14 Z')",
                    // The path is roughly matched to the oval border taking into account the container inset.
                    // Center coordinates: 154 (140+14), Y: 14. 
                    // To keep it simple, we use a slightly larger oval matching the track dimensions 280x100.
                    // Actually, a simpler path mapping to the exact 0,0 to 280,100 dimensions of the parent relative to the inset:
                    // Inset -14px makes container 308 x 128.
                    // Track is centered in this container.
                  }}
                />
              </div>

              {/* Simplified Path Animation */}
              <svg className="absolute inset-0 pointer-events-none w-full h-full" overflow="visible">
                <path id={`track-path-${animName}`} d="M 50 0 L 230 0 A 50 50 0 0 1 280 50 A 50 50 0 0 1 230 100 L 50 100 A 50 50 0 0 1 0 50 A 50 50 0 0 1 50 0 Z" fill="none" stroke="none" />
              </svg>

              <div 
                className="absolute w-7 h-7 flex items-center justify-center bg-white rounded-full shadow border border-slate-200 text-slate-700 z-20 motion-reduce:!animate-none motion-reduce:!transition-none"
                style={{
                  offsetPath: `path('M 50 0 L 230 0 A 50 50 0 0 1 280 50 A 50 50 0 0 1 230 100 L 50 100 A 50 50 0 0 1 0 50 A 50 50 0 0 1 50 0 Z')`,
                  offsetDistance: hasAnimated ? `${totalPercentage}%` : "0%",
                  marginLeft: "-14px",
                  marginTop: "-14px",
                  left: "0",
                  top: "0",
                  transformOrigin: "center",
                  animation: hasAnimated ? `${animName} ${Math.min(Math.max(2, (loops + remainderProgress) * 2), 10)}s ease-out forwards` : "none",
                }}
              >
                <Car size={16} className="fill-slate-700 relative" />
              </div>

            </div>

          </div>

        </div>
      </CardContent>
    </Card>
  );
}