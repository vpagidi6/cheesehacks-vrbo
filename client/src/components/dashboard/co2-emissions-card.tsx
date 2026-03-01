import React, { useMemo } from 'react';
import { Cloud, Factory } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CO2EmissionsCardProps {
  co2Grams: number;
  co2Limit: number;
}

export function CO2EmissionsCard({ co2Grams, co2Limit }: CO2EmissionsCardProps) {
  // Normalize CO2 level relative to limit (cap at 1.5 to not completely black out the screen)
  // Ensure we don't divide by zero
  const safeLimit = co2Limit > 0 ? co2Limit : 1000;
  const rawRatio = co2Grams / safeLimit;
  const ratio = Math.min(Math.max(rawRatio, 0), 1.0); // Clamp 0 to 1

  // Map effects based on ratio
  // Smoke intensity (0.1 to 1.0)
  const smokeIntensity = 0.1 + (0.9 * ratio);
  
  // Sky darkness / haze (0.0 to 0.75)
  const skyDarkness = 0.75 * ratio;
  
  // Bird count (8 down to 0)
  const birdCount = Math.round(8 * (1 - ratio));

  // Generate bird positions so they stay consistent per render
  const birds = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      // Random starting vertical positions in the top half
      top: 10 + Math.random() * 40,
      // Random animation delay so they don't fly in sync
      delay: Math.random() * 10,
      // Random animation duration for speed variance
      duration: 15 + Math.random() * 15,
      // Scale based on distance
      scale: 0.5 + Math.random() * 0.5
    }));
  }, []);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden bg-sky-200 isolation-isolate">
      {/* Sky Background with Haze Overlay */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out z-10"
        style={{ 
          backgroundColor: '#475569', // slate-600 
          opacity: skyDarkness 
        }}
      />

      {/* Sun/Moon */}
      <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-yellow-100 blur-[2px] z-0" />

      {/* Animated Clouds */}
      <div className="absolute top-0 left-0 w-full h-full z-0 opacity-60 pointer-events-none overflow-hidden">
        <Cloud className="absolute text-white/80 animate-[float_40s_linear_infinite]" size={48} style={{ top: '10%', animationDelay: '0s' }} />
        <Cloud className="absolute text-white/80 animate-[float_55s_linear_infinite]" size={64} style={{ top: '30%', animationDelay: '-15s' }} />
        <Cloud className="absolute text-white/60 animate-[float_35s_linear_infinite]" size={40} style={{ top: '5%', animationDelay: '-25s' }} />
      </div>

      {/* Animated Birds (disappear as CO2 rises) */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {birds.map((bird, i) => (
          <div 
            key={bird.id}
            className="absolute left-[-50px] transition-opacity duration-1000"
            style={{
              top: `${bird.top}%`,
              opacity: i < birdCount ? 1 : 0,
              animation: `fly ${bird.duration}s linear infinite`,
              animationDelay: `${bird.delay}s`,
              transform: `scale(${bird.scale})`
            }}
          >
            {/* Simple CSS Bird */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 12C2 12 6 8 12 12C18 8 22 12 22 12" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        ))}
      </div>

      {/* Ground/City/Factory Silhouette */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-slate-800 z-30 flex items-end">
        {/* Abstract city shapes */}
        <div className="absolute bottom-0 left-4 w-12 h-24 bg-slate-900 rounded-t-sm" />
        <div className="absolute bottom-0 left-20 w-16 h-16 bg-slate-700 rounded-t-sm" />
        <div className="absolute bottom-0 right-8 w-20 h-32 bg-slate-900 rounded-t-sm" />
        
        {/* Main Factory Container */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-slate-800 rounded-t-lg border-t border-slate-700 flex items-end justify-center pb-2 z-40">
          <Factory className="text-slate-500 mb-2" size={32} />
          
          {/* Smokestacks */}
          <div className="absolute -top-16 left-6 w-4 h-16 bg-slate-700 rounded-t-sm" />
          <div className="absolute -top-24 right-12 w-6 h-24 bg-slate-700 rounded-t-sm" />
          <div className="absolute -top-12 right-4 w-3 h-12 bg-slate-700 rounded-t-sm" />

          {/* Animated Smoke Particles */}
          <div className="absolute -top-16 left-6 w-4 h-4 z-50">
            <div className="absolute w-8 h-8 bg-slate-400 rounded-full blur-md animate-[smoke_3s_ease-out_infinite]" style={{ opacity: smokeIntensity, animationDelay: '0s' }} />
            <div className="absolute w-12 h-12 bg-slate-500 rounded-full blur-md animate-[smoke_4s_ease-out_infinite]" style={{ opacity: smokeIntensity * 0.8, animationDelay: '1.2s' }} />
          </div>
          
          <div className="absolute -top-24 right-12 w-6 h-4 z-50">
            <div className="absolute w-16 h-16 bg-slate-400 rounded-full blur-lg animate-[smoke_4s_ease-out_infinite]" style={{ opacity: smokeIntensity, animationDelay: '0.5s' }} />
            <div className="absolute w-20 h-20 bg-slate-600 rounded-full blur-xl animate-[smoke_5s_ease-out_infinite]" style={{ opacity: smokeIntensity * 0.9, animationDelay: '2.1s' }} />
            <div className="absolute w-24 h-24 bg-slate-500 rounded-full blur-xl animate-[smoke_4.5s_ease-out_infinite]" style={{ opacity: smokeIntensity * 0.7, animationDelay: '3.5s' }} />
          </div>
        </div>
      </div>

      {/* Data Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 z-50 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-white/40 shadow-sm inline-block">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Carbon Footprint</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">{co2Grams.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
            <span className="text-sm font-medium text-slate-600">g CO₂</span>
          </div>
          {co2Limit > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              {Math.round(rawRatio * 100)}% of limit
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
