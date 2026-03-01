import { useEffect, useRef } from "react";

export function InteractiveWater({ percentage, isWarning }: { percentage: number, isWarning: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  
  const reqRef = useRef<number>();
  const currentPercentage = useRef(0);
  const mouse = useRef({ x: -1, y: -1, isHovering: false, vY: 0, lastY: -1 });

  const NUM_POINTS = 50; 
  const springs = useRef(Array.from({ length: NUM_POINTS }, () => ({ p: 0, v: 0 })));

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        mouse.current.isHovering = false;
        mouse.current.lastY = -1;
        return;
      }

      mouse.current.x = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      
      if (mouse.current.lastY !== -1) {
        mouse.current.vY = currentY - mouse.current.lastY;
      }
      
      mouse.current.y = currentY;
      mouse.current.lastY = currentY;
      mouse.current.isHovering = true;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const TENSION = 0.025;
    const DAMPENING = 0.025;
    const SPREAD = 0.25;
    let lastTime = performance.now();

    const tick = (time: number) => {
      if (!containerRef.current || !path1Ref.current || !path2Ref.current) {
        reqRef.current = requestAnimationFrame(tick);
        return;
      }
      
      const dt = Math.min(time - lastTime, 32);
      lastTime = time;

      // Animate fill up smoothly
      currentPercentage.current += (percentage - currentPercentage.current) * 0.03;

      const rect = containerRef.current.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const clampedPercentage = Math.min(100, Math.max(0, currentPercentage.current));
      const fillH = (clampedPercentage / 100) * h;
      const surfaceY = h - fillH;

      // Mouse interaction
      if (mouse.current.isHovering && w > 0) {
        const { x, y, vY } = mouse.current;
        const radius = 60;
        if (Math.abs(y - surfaceY) < radius) {
          const index = Math.max(0, Math.min(NUM_POINTS - 1, Math.floor((x / w) * NUM_POINTS)));
          const appliedVelocity = Math.max(-20, Math.min(20, vY * 0.5));
          springs.current[index].v += appliedVelocity;
          mouse.current.vY *= 0.5; // Dampen the applied velocity quickly
        }
      }

      // Continuous gentle ambient wave
      const timeSec = time / 1000;
      springs.current[0].p += Math.sin(timeSec * 2.5) * 0.8;
      springs.current[NUM_POINTS - 1].p += Math.cos(timeSec * 2.1) * 0.8;

      // Physics update
      for (let i = 0; i < NUM_POINTS; i++) {
        const s = springs.current[i];
        const a = -TENSION * s.p - DAMPENING * s.v;
        s.p += s.v;
        s.v += a;
      }

      // Spread
      const leftDeltas = new Array(NUM_POINTS).fill(0);
      const rightDeltas = new Array(NUM_POINTS).fill(0);

      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < NUM_POINTS; i++) {
          if (i > 0) {
            leftDeltas[i] = SPREAD * (springs.current[i].p - springs.current[i - 1].p);
            springs.current[i - 1].v += leftDeltas[i];
          }
          if (i < NUM_POINTS - 1) {
            rightDeltas[i] = SPREAD * (springs.current[i].p - springs.current[i + 1].p);
            springs.current[i + 1].v += rightDeltas[i];
          }
        }
        for (let i = 0; i < NUM_POINTS; i++) {
          if (i > 0) springs.current[i - 1].p += leftDeltas[i];
          if (i < NUM_POINTS - 1) springs.current[i + 1].p += rightDeltas[i];
        }
      }

      // Build SVG Paths
      const step = w / (NUM_POINTS - 1);
      let d1 = `M 0 ${h} L 0 ${surfaceY + springs.current[0].p}`;
      let d2 = `M 0 ${h} L 0 ${surfaceY - springs.current[0].p * 0.5}`;

      for (let i = 1; i < NUM_POINTS; i++) {
        const x1 = i * step;
        const p = springs.current[i].p;
        d1 += ` L ${x1} ${surfaceY + p}`;
        
        const p2 = -p * 0.4 + Math.sin(i * 0.3 + timeSec * 2) * 3;
        d2 += ` L ${x1} ${surfaceY + p2}`;
      }
      d1 += ` L ${w} ${h} Z`;
      d2 += ` L ${w} ${h} Z`;

      path1Ref.current.setAttribute("d", d1);
      path2Ref.current.setAttribute("d", d2);
      
      reqRef.current = requestAnimationFrame(tick);
    };

    reqRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(reqRef.current!);
  }, [percentage]);

  const baseColor = isWarning ? "text-red-500" : "text-blue-500";

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 z-0 pointer-events-none overflow-hidden ${baseColor}`}
    >
      <svg className="w-full h-full block">
        {/* Background wave (slower, phase shifted) */}
        <path 
          ref={path2Ref} 
          className="fill-current opacity-[0.08] transition-colors duration-500"
        />
        {/* Foreground wave */}
        <path 
          ref={path1Ref} 
          className="fill-current opacity-[0.15] stroke-current stroke-2 transition-colors duration-500"
          strokeOpacity="0.4"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}