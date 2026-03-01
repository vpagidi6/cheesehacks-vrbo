import React from "react";
import { useInView } from "@/hooks/use-in-view";

interface ScrollRevealProps {
  children: React.ReactNode | ((props: { entryCount: number }) => React.ReactNode);
  threshold?: number;
  className?: string;
}

export function ScrollReveal({ children, threshold = 0.25, className = "" }: ScrollRevealProps) {
  const { ref, inView, entryCount } = useInView({ threshold });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none motion-reduce:transform-none ${
        inView 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-6"
      } ${className}`}
    >
      {typeof children === "function" ? children({ entryCount }) : children}
    </div>
  );
}
