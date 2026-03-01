import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface WaterBottleCardProps {
  ml: number;
}

export function WaterBottleCard({ ml }: WaterBottleCardProps) {
  // 1 bottle = 500 mL
  const bottleCount = Math.floor(ml / 500);
  const useGrouped = bottleCount > 200;
  const displayCount = useGrouped ? Math.ceil(bottleCount / 5) : bottleCount;
  
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <Card className="shadow-sm border-slate-200 overflow-hidden md:col-span-3">
      <CardHeader className="pb-3 border-b border-slate-100 bg-white">
        <CardTitle className="text-xl flex items-center gap-2">
          Water Used Today
        </CardTitle>
        <CardDescription>
          Equivalent to {bottleCount.toLocaleString()} standard water bottles (500 mL each)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-slate-50 min-h-[200px]" ref={containerRef}>
        {useGrouped && (
          <div className="mb-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-sm font-medium border border-blue-100">
            <BottleIcon className="w-4 h-6 text-blue-500 drop-shadow-none" />
            <span>= 5 bottles</span>
          </div>
        )}
        
        {bottleCount === 0 ? (
          <div className="text-slate-400 flex flex-col items-center justify-center py-8">
            <p>No full bottles used today!</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-2 gap-y-3 items-center justify-start">
            {Array.from({ length: displayCount }).map((_, i) => (
              <div 
                key={i}
                className={`transition-all duration-300 transform motion-reduce:!transition-none motion-reduce:!opacity-100 motion-reduce:!scale-100 motion-reduce:!translate-y-0
                  ${hasAnimated ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-4'}
                `}
                style={{
                  // Fast stagger up to 100 icons (20ms each), cap at 2s max delay so it doesn't take forever
                  transitionDelay: hasAnimated ? `${Math.min(i * 15, 2000)}ms` : '0ms'
                }}
              >
                <BottleIcon />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BottleIcon({ className = "" }: { className?: string }) {
  return (
    <svg 
      width="20" 
      height="32" 
      viewBox="0 0 24 32" 
      className={`text-blue-400 overflow-visible ${className}`} 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* Body */}
      <path d="M6 10v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10" />
      {/* Shoulders */}
      <path d="M6 10c0-2 2-4 4-4h4c2 0 4 2 4 4" />
      {/* Neck & Cap */}
      <path d="M10 6V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" className="fill-blue-500" />
      {/* Ridge */}
      <path d="M6 10h12" />
      {/* Water fill effect */}
      <path d="M6.5 14v12a1.5 1.5 0 0 0 1.5 1.5h8a1.5 1.5 0 0 0 1.5-1.5V14z" className="fill-blue-100 stroke-none" />
    </svg>
  );
}
