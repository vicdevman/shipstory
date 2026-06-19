import React from 'react';

export function LogoStrip() {
  const partners = [
    { name: 'Band SDK', desc: 'Universal Intranet', highlight: true },
    { name: 'Lablab.ai', desc: 'Hackathon Host' },
    { name: 'AI/ML API', desc: 'Multi-LLM Router' },
    { name: 'Featherless', desc: 'Serverless GPU' },
    { name: 'Groq', desc: 'Fast Inference' },
    { name: 'GitHub', desc: 'Code Ingress' },
  
  ];

  return (
    <section className="py-10 bg-white border-y border-[#E8E8E3]/40">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8C8C86] mb-8">
          Orchestrated by Band SDK and integrated with leading AI & developer infrastructure
        </p>
        
        {/* Horizontal scroll on mobile, flex row on desktop with wrapping */}
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
          {partners.map((p) => {
            if (p.highlight) {
              return (
                <div 
                  key={p.name}
                  className="flex flex-col items-center justify-center px-4 py-2 bg-[#B7CE8F]/10 border border-[#B7CE8F] rounded-lg shadow-[0_2px_8px_rgba(183,206,143,0.15)] hover:scale-105 transition-all duration-200 cursor-default"
                >
                  <span className="text-sm font-extrabold tracking-tight text-[#2B3324]">
                    {p.name}
                  </span>
                  <span className="text-[9px] font-bold tracking-wide uppercase text-[#2b3324]/80 mt-0.5">
                    {p.desc}
                  </span>
                </div>
              );
            }

            return (
              <div 
                key={p.name}
                className="flex flex-col items-center justify-center opacity-65 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-200 cursor-default group"
              >
                <span className="text-sm font-bold tracking-tight text-[#1A1A18] group-hover:text-[#2B3324]">
                  {p.name}
                </span>
                <span className="text-[9px] font-medium tracking-wide uppercase text-[#8C8C86] mt-0.5">
                  {p.desc}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
