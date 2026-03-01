import { useEffect, useRef } from "react";

export function InteractiveWater({ percentage, isWarning }: { percentage: number, isWarning: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  
  const reqRef = useRef<number>();
  const currentPercentage = useRef(0);
  const mouse = useRef({ x: -1, y: -1, isHovering: false, vY: 0, lastY: -1 });
  const inactivityTimer = useRef(0);

  const NUM_POINTS = 50; 
  const springs = useRef(Array.from({ length: NUM_POINTS }, () => ({ p: 0, v: 0 })));

  const numFishes = 6;
  const fishes = useRef(Array.from({ length: numFishes }, () => ({
    x: Math.random() * 500,
    y: Math.random() * 500,
    vx: 0,
    vy: 0,
    targetX: Math.random() * 500,
    targetY: Math.random() * 500,
    angle: Math.random() * Math.PI * 2,
    speedMod: 0.5 + Math.random() * 1.0,
    tailAngle: 0,
    scale: 0.4 + Math.random() * 0.3,
    color: ['#f97316', '#fb923c', '#fdba74', '#ea580c'][Math.floor(Math.random() * 4)] // Orange hues
  })));
  const fishRefs = useRef<(SVGGElement | null)[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        mouse.current.isHovering = false;
        mouse.current.lastY = -1;
        return;
      }

      inactivityTimer.current = 0;
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
    const TENSION = 0.015; // lower tension for more fluid, loose water
    const DAMPENING = 0.04; // higher dampening to settle down faster
    const SPREAD = 0.25;
    let lastTime = performance.now();

    const tick = (time: number) => {
      if (!containerRef.current || !path1Ref.current || !path2Ref.current) {
        reqRef.current = requestAnimationFrame(tick);
        return;
      }
      
      const dt = Math.min(time - lastTime, 32);
      lastTime = time;
      inactivityTimer.current += dt;

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
          const appliedVelocity = Math.max(-15, Math.min(15, vY * 0.4));
          springs.current[index].v += appliedVelocity;
          mouse.current.vY *= 0.5; // Dampen the applied velocity quickly
        }
      }

      // Ambient wave decays when inactive
      const timeSec = time / 1000;
      const ambientAmplitude = Math.max(0.1, 0.8 - inactivityTimer.current / 3000);
      springs.current[0].p += Math.sin(timeSec * 2.5) * ambientAmplitude;
      springs.current[NUM_POINTS - 1].p += Math.cos(timeSec * 2.1) * ambientAmplitude;

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
        
        const p2 = -p * 0.4 + Math.sin(i * 0.3 + timeSec * 2) * 3 * (ambientAmplitude / 0.8);
        d2 += ` L ${x1} ${surfaceY + p2}`;
      }
      d1 += ` L ${w} ${h} Z`;
      d2 += ` L ${w} ${h} Z`;

      path1Ref.current.setAttribute("d", d1);
      path2Ref.current.setAttribute("d", d2);
      
      // Update Fishes
      const fishYMin = surfaceY + 20; 
      const fishYMax = Math.max(surfaceY + 20, h - 20); // ensure max is >= min
      
      fishes.current.forEach((fish, i) => {
        const isVisible = fillH > 40;
        
        // Target seeking behavior
        const dx = fish.targetX - fish.x;
        const dy = fish.targetY - fish.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Assign new target if reached or randomly
        if (dist < 20 || Math.random() < 0.005) {
          fish.targetX = 20 + Math.random() * (w - 40);
          fish.targetY = fishYMin + Math.random() * (fishYMax - fishYMin);
          fish.speedMod = 0.5 + Math.random() * 1.0;
        }

        const targetAngle = Math.atan2(fish.targetY - fish.y, fish.targetX - fish.x);
        
        // Smooth angle interpolation
        let angleDiff = targetAngle - fish.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Max turn rate
        const turnSpeed = 0.03;
        if (Math.abs(angleDiff) > 0.01) {
          fish.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed);
        }

        // Keep angle normalized
        while (fish.angle > Math.PI) fish.angle -= Math.PI * 2;
        while (fish.angle < -Math.PI) fish.angle += Math.PI * 2;

        // Calculate velocity
        const speed = 0.8 * (fish.speedMod || 1);
        fish.vx = Math.cos(fish.angle) * speed;
        fish.vy = Math.sin(fish.angle) * speed;

        fish.x += fish.vx;
        fish.y += fish.vy;

        // Keep inside bounds gracefully
        if (fish.y < fishYMin - 10) { fish.targetY = fishYMin + 20; }
        if (fish.y > fishYMax + 10) { fish.targetY = fishYMax - 20; }
        if (fish.x < -20) { fish.x = w + 20; fish.targetX = w / 2; }
        if (fish.x > w + 20) { fish.x = -20; fish.targetX = w / 2; }

        // Tail Wiggle
        const tailFreq = 15 + speed * 5;
        fish.tailAngle = Math.sin(timeSec * tailFreq) * 20;

        const fishEl = fishRefs.current[i];
        if (fishEl) {
           const displayOpacity = isVisible ? (isWarning ? 0.2 : 0.7) : 0;
           const rotDeg = fish.angle * (180 / Math.PI);
           
           // Flip vertically if swimming left to prevent upside down
           const flipScaleY = Math.cos(fish.angle) < 0 ? -1 : 1;
           
           fishEl.setAttribute('transform', `translate(${fish.x}, ${fish.y}) rotate(${rotDeg}) scale(${fish.scale}, ${fish.scale * flipScaleY})`);
           fishEl.setAttribute('opacity', displayOpacity.toString());
           
           const tailEl = fishEl.querySelector('.fish-tail');
           if (tailEl) {
             tailEl.setAttribute('transform', `rotate(${fish.tailAngle})`);
           }
        }
      });

      reqRef.current = requestAnimationFrame(tick);
    };

    reqRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(reqRef.current!);
  }, [percentage, isWarning]);

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
        
        {/* Fishes */}
        {fishes.current.map((fish, i) => (
          <g key={i} ref={(el) => { if (el) fishRefs.current[i] = el; }} className="transition-opacity duration-1000">
             <path className="fish-tail" d="M 0 0 L -10 -6 L -10 6 Z" fill={fish.color} />
             <path d="M 0 0 C 10 -8 20 -4 25 0 C 20 4 10 8 0 0 Z" fill={fish.color} />
             <circle cx="18" cy="-1.5" r="1.5" fill="white" />
             <circle cx="18.5" cy="-1.5" r="0.8" fill="black" />
          </g>
        ))}
      </svg>
    </div>
  );
}