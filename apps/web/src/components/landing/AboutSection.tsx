import React from 'react';
import { ShieldCheck, Sparkles, Terminal, BarChart2, Compass, Layers } from 'lucide-react';

export function AboutSection() {
  const agents = [
    {
      name: 'Devin',
      role: 'Lead Software Engineer',
      desc: 'Parses raw code commits, reads file diffs, and synthesizes technical business summaries.',
      icon: Terminal,
      color: 'bg-orange-50 border-orange-200 text-orange-600',
      tag: 'Devin Eng'
    },
    {
      name: 'Priscilla',
      role: 'Compliance & Product Manager',
      desc: 'Grades features on business impact, intercepts IP leaks, and enforces copywriting guidelines.',
      icon: ShieldCheck,
      color: 'bg-green-50 border-green-200 text-green-600',
      tag: 'Priscilla PM'
    },
    {
      name: 'Gigi',
      role: 'Creative Copywriter',
      desc: 'Drafts newsletters, changelogs, and tweets optimized for developer-to-developer audiences.',
      icon: Layers,
      color: 'bg-purple-50 border-purple-200 text-purple-600',
      tag: 'Gigi Marketing'
    },
    {
      name: 'Marshall',
      role: 'VP of Growth & Research',
      desc: 'Monitors competitor roadmap updates and parses community sentiment for strategic inputs.',
      icon: Compass,
      color: 'bg-cyan-50 border-cyan-200 text-cyan-600',
      tag: 'Marshall Research'
    },
    {
      name: 'Vinci',
      role: 'Art Director & Designer',
      desc: 'Generates graphic asset prompts matching Gigi\'s approved copywriting drafts.',
      icon: Sparkles,
      color: 'bg-pink-50 border-pink-200 text-pink-600',
      tag: 'Vinci Design'
    },
    {
      name: 'Connie',
      role: 'Chief of Staff & Assistant',
      desc: 'Coordinates the agents, updates the Company Brain, and manages interactive public Q&As.',
      icon: BarChart2,
      color: 'bg-blue-50 border-blue-200 text-blue-600',
      tag: 'Connie CoS'
    }
  ];

  return (
    <section 
      id="about" 
      className="relative py-20 px-6 overflow-hidden bg-white 
                 bg-[radial-gradient(circle_at_bottom_left,#E4EDD9_0%,transparent_40%),radial-gradient(circle_at_bottom_right,#E4EDD9_0%,transparent_40%)]"
    >
      
      {/* Floating decorative elements/avatars in corners */}
      <div className="absolute left-8 top-12 hidden lg:flex items-center gap-3 bg-white p-3 rounded-2xl border border-[#E8E8E3] shadow-[0_4px_12px_rgba(0,0,0,0.03)] select-none">
        <span className="h-2 w-2 rounded-full bg-[#B7CE8F] animate-ping" />
        <span className="text-xs font-mono font-bold text-[#1A1A18]">Devin is coding...</span>
      </div>

      <div className="absolute right-8 top-16 hidden lg:flex items-center gap-3 bg-white p-3 rounded-2xl border border-[#E8E8E3] shadow-[0_4px_12px_rgba(0,0,0,0.03)] select-none">
        <span className="h-2 w-2 rounded-full bg-[#B7CE8F]" />
        <span className="text-xs font-mono font-bold text-[#1A1A18]">Priscilla audited copy</span>
      </div>

      <div className="mx-auto max-w-4xl text-center">
        {/* Uppercase ABOUT pill badge */}
        <div className="inline-block px-3.5 py-1 rounded-full bg-[#ECECE8] text-[#5C5C57] text-[11px] font-bold uppercase tracking-wider mb-6">
          The Virtual Department
        </div>

        {/* Faded partial text & Underlined phrase */}
        <h2 className="text-3xl md:text-[38px] font-medium leading-[1.2] text-[#1A1A18] tracking-tight max-w-3xl mx-auto text-pretty">
          One commit triggers your entire growth cycle,{' '}
          <span className="text-[#1A1A18]/45">
            running autonomous reviews, drafts, and{' '}
            <span className="underline underline-offset-4 decoration-1 decoration-[#B7CE8F] text-[#1A1A18]">
              collaborative team approvals
            </span>{' '}
            before anything goes public.
          </span>
        </h2>

        {/* Supporting subhead */}
        <p className="mt-6 max-w-lg mx-auto text-sm md:text-base text-[#5C5C57] leading-relaxed">
          Startups fail when marketing stays silent. ShipStory ensures your engineering progress is instantly converted into high-impact growth assets.
        </p>
      </div>

      {/* Grid of the 6 agents representing the pipeline */}
      <div className="mx-auto max-w-5xl mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <div 
              key={agent.name}
              className="bg-white border border-[#ECECE7] p-6 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl border ${agent.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-[#5C5C57]">
                    {agent.tag}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-[#1A1A18] tracking-tight">
                  {agent.name}
                </h3>
                <p className="text-xs text-[#8C8C86] font-medium mt-0.5 mb-3">
                  {agent.role}
                </p>
                <p className="text-xs text-[#5C5C57] leading-relaxed">
                  {agent.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
}
