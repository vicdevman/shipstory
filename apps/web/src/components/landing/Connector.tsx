import React from 'react';
import { cn } from '@/lib/utils';

interface ConnectorProps {
  mirrored?: boolean;
  className?: string;
  delayMs?: number;
}

export function Connector({ mirrored = false, className, delayMs = 0 }: ConnectorProps) {
  const d = mirrored 
    ? "M0 32 C 16 32, 16 32, 16 20 C 16 8, 16 8, 32 8" 
    : "M0 8 C 16 8, 16 8, 16 20 C 16 32, 16 32, 32 32";

  return (
    <svg
      className={cn("w-8 md:w-16 shrink-0 self-center overflow-visible", className)}
      viewBox="0 0 32 40"
      fill="none"
    >
      <style>{`
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-draw-line {
          animation: draw 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
      <path
        className="stroke-[1.5] stroke-[#D8D8D2] animate-draw-line"
        d={d}
        style={{
          strokeDasharray: 60,
          strokeDashoffset: 60,
          animationDelay: `${delayMs}ms`
        }}
      />
    </svg>
  );
}
