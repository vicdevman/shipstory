import React from 'react';

export function LogoStrip() {
  const partners = [
    { name: 'GitHub', desc: 'Code Ingress' },
    { name: 'Slack', desc: 'Alert Sync' },
    { name: 'Vercel', desc: 'Deploy Hook' },
    { name: 'Linear', desc: 'Issue Tracker' },
    { name: 'OpenAI', desc: 'Core LLM' },
    { name: 'Anthropic', desc: 'Model Hub' }
  ];

  return (
    <section className="py-8 bg-white border-y border-[#E8E8E3]/40">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8C8C86] mb-5">
          Orchestrates and integrates seamlessly with
        </p>
        
        {/* Horizontal scroll on mobile, flex row on desktop */}
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 opacity-65">
          {partners.map((p) => (
            <div 
              key={p.name}
              className="flex flex-col items-center justify-center grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-200 cursor-default group"
            >
              <span className="text-sm font-bold tracking-tight text-[#1A1A18] group-hover:text-[#2B3324]">
                {p.name}
              </span>
              <span className="text-[9px] font-medium tracking-wide uppercase text-[#8C8C86] mt-0.5">
                {p.desc}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
