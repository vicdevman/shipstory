import React from 'react';
import { cn } from '@/lib/utils';
import { TOKENS } from '@/lib/tokens';

interface NodeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function NodeCard({ children, className, ...props }: NodeCardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-[#ECECE7] flex flex-col justify-between transition-all duration-300",
        TOKENS.radius.card,
        TOKENS.spacing.cardPad,
        TOKENS.shadows.card,
        TOKENS.shadows.cardHover,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
