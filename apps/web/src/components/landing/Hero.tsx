import React from 'react';
import { Button } from '@/components/ui/button';
import { HatGlasses, Sparkles } from 'lucide-react';

interface HeroProps {
  onEnterDashboard: () => void;
}

export function Hero({ onEnterDashboard }: HeroProps) {
  return (
    <section className="relative pt-16 pb-12 px-6 overflow-hidden">
      {/* Decorative subtle background bleed */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#E4EDD9_0%,transparent_50%)] pointer-events-none" />
      
      <div className="mx-auto max-w-3xl text-center relative z-10">
        
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECECE8] border border-[#E8E8E3] text-[#5C5C57] text-[11px] font-semibold uppercase tracking-wider mb-6 animate-fade-in">
          <HatGlasses className="w-3.5 h-3.5 text-[#B7CE8F] animate-pulse" />
          Autonomous Growth Department on Band
        </div>

        {/* H1 Headline */}
        <h1 className="text-4xl md:text-[54px] font-medium leading-[1.12] text-[#1A1A18] tracking-tight max-w-2xl mx-auto text-pretty">
          AI-Powered Shipping,
          <br />
          Built for <span className="font-serif italic text-[#6faecf] md:text-[58px]">Codebases</span>
        </h1>

        {/* Supporting subhead */}
        <p className="mt-5 max-w-lg mx-auto text-base md:text-lg text-[#5C5C57] leading-relaxed">
          Purpose-built for developer teams who ship fast and want high-fidelity changelogs, marketing campaigns, and competitive roadmap updates generated directly from raw commits.
        </p>

        {/* Primary CTA button */}
        <div className="mt-8 flex justify-center gap-4">
          <Button 
            variant="pill" 
            onClick={onEnterDashboard}
            className="px-8 h-11 text-base font-semibold tracking-tight hover:scale-105 hover:bg-[#A9C17D] active:scale-95 transition-all duration-150"
          >
            Launch Platform Dashboard
          </Button>
        </div>

      </div>
    </section>
  );
}
