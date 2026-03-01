import React from "react";

interface AnimatedLogoProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  textColor?: string;
}

export function AnimatedLogo({ 
  className = "", 
  width = "100%", 
  height = "100%",
  textColor = "#0f172a" // slate-900
}: AnimatedLogoProps) {
  // Using a viewBox that tightly fits the text "SustAIn"
  // Inter font, assuming standard width. "Sust" ~100, "AI" ~55, "n" ~30 -> total ~185.
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg 
        viewBox="0 0 190 50" 
        width={width} 
        height={height} 
        xmlns="http://www.w3.org/2000/svg" 
        className="overflow-visible block"
      >
        <defs>
          {/* Turbulence for shimmer effect */}
          <filter id="water-shimmer">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.02 0.1" 
              numOctaves="2" 
              result="noise"
            >
              <animate 
                attributeName="baseFrequency" 
                values="0.02 0.1; 0.025 0.12; 0.02 0.1" 
                dur="4s" 
                repeatCount="indefinite" 
              />
            </feTurbulence>
            <feColorMatrix type="hueRotate" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0" />
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="noise" 
              scale="2" 
              xChannelSelector="R" 
              yChannelSelector="G" 
            />
          </filter>

          {/* Water Gradients */}
          {/* Primary wave color (mid to dark blue) */}
          <linearGradient id="wave-gradient-1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" /> {/* blue-500 */}
            <stop offset="100%" stopColor="#1e3a8a" /> {/* blue-900 (darker bottom for depth) */}
          </linearGradient>

          {/* Secondary wave color (light blue to mid blue) */}
          <linearGradient id="wave-gradient-2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8"/> {/* blue-400 */}
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.9"/> {/* blue-600 */}
          </linearGradient>

          {/* Top highlight for a glossy, glassy edge */}
          <linearGradient id="water-highlight" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Wave pattern to fill the "AI" text */}
          {/* We make the pattern wide enough to animate seamlessly */}
          <pattern id="wave-pattern" width="100" height="50" patternUnits="userSpaceOnUse" x="0" y="0">
            {/* Background base fill for AI to ensure it's never empty */}
            <rect width="100" height="50" fill="#bfdbfe" /> {/* blue-200 */}
            
            {/* Back Wave (slower, slightly offset) */}
            <path d="M0,25 C15,15 35,35 50,25 C65,15 85,35 100,25 L100,50 L0,50 Z" fill="url(#wave-gradient-2)">
              <animateTransform 
                attributeName="transform" 
                type="translate" 
                values="0,0; -50,0" 
                dur="4s" 
                repeatCount="indefinite" 
              />
            </path>
            {/* Duplicate for seamless tiling */}
            <path d="M50,25 C65,15 85,35 100,25 C115,15 135,35 150,25 L150,50 L50,50 Z" fill="url(#wave-gradient-2)">
              <animateTransform 
                attributeName="transform" 
                type="translate" 
                values="0,0; -50,0" 
                dur="4s" 
                repeatCount="indefinite" 
              />
            </path>

            {/* Front Wave (faster) */}
            <path d="M0,28 C20,38 30,18 50,28 C70,38 80,18 100,28 L100,50 L0,50 Z" fill="url(#wave-gradient-1)">
              <animateTransform 
                attributeName="transform" 
                type="translate" 
                values="0,0; -50,0" 
                dur="2.5s" 
                repeatCount="indefinite" 
              />
            </path>
            {/* Duplicate for seamless tiling */}
            <path d="M50,28 C70,38 80,18 100,28 C120,38 130,18 150,28 L150,50 L50,50 Z" fill="url(#wave-gradient-1)">
              <animateTransform 
                attributeName="transform" 
                type="translate" 
                values="0,0; -50,0" 
                dur="2.5s" 
                repeatCount="indefinite" 
              />
            </path>
          </pattern>

          <clipPath id="ai-clip">
            <text x="0" y="40" fontFamily="inherit" fontWeight="800" fontSize="42">AI</text>
          </clipPath>
        </defs>

        {/* Global font-family inheritance */}
        <g fontFamily="inherit" fontWeight="800" fontSize="42">
          {/* Sust */}
          <text x="0" y="40" fill={textColor} letterSpacing="-1">Sust</text>
          
          {/* AI with Water effect */}
          {/* The x offset depends on the rendered width of "Sust", usually around 92-95px at size 42 */}
          <g transform="translate(94, 0)">
            {/* The animated wave fill */}
            <rect 
              x="0" 
              y="0" 
              width="50" 
              height="50" 
              fill="url(#wave-pattern)" 
              clipPath="url(#ai-clip)" 
              filter="url(#water-shimmer)"
            />
            {/* A slight top highlight inside the AI clip for 3D glassy depth */}
            <rect 
              x="0" 
              y="0" 
              width="50" 
              height="50" 
              fill="url(#water-highlight)" 
              clipPath="url(#ai-clip)" 
              style={{ mixBlendMode: 'overlay' }}
            />
          </g>

          {/* n */}
          {/* x offset for 'n' -> 94 + width of AI (~46) = 140 */}
          <text x="140" y="40" fill={textColor} letterSpacing="-1">n</text>
        </g>
      </svg>
    </div>
  );
}
