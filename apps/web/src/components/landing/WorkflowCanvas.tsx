import React from 'react';
import { MoreHorizontal, MicOff, Activity } from 'lucide-react';
import { NodeCard } from './NodeCard';
import { Connector } from './Connector';
import { TOKENS } from '@/lib/tokens';

export function WorkflowCanvas() {
  return (
    <div className="w-full max-w-5xl mx-auto mt-12">
      {/* Outer canvas wrapper with gradient and border */}
      <div 
        className="relative rounded-[24px] bg-[#EFEFEA] p-6 md:p-10 border border-[#E8E8E3] shadow-[0_1px_3px_rgba(0,0,0,0.02)]
                   bg-[radial-gradient(ellipse_at_bottom_right,#E4EDD9_40%,transparent_80%)] overflow-hidden"
      >
        
        {/* Floating status pill, top right */}
        <div className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center 
                        rounded-full bg-[#B7CE8F] shadow-[0_1px_2px_rgba(0,0,0,0.06)] z-10">
          <MicOff className="h-4 w-4 text-[#2B3324]" />
        </div>

        {/* Workflow container with horizontal scroll wrapper for mobile, flex layout for desktop */}
        <div className="w-full overflow-x-auto no-scrollbar scroll-smooth">
          <div className="min-w-[840px] md:min-w-0 relative flex items-stretch justify-between gap-2 md:gap-4 py-4 px-2">
            
            {/* NODE 1 — Pipeline Queue */}
            <NodeCard className="w-[260px] shrink-0 animate-fade-up">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8C8C86]">
                    Pipeline Queue
                  </span>
                  <MoreHorizontal className="h-4 w-4 text-[#8C8C86] cursor-pointer hover:text-[#1A1A18]" />
                </div>

                <div className="mt-4 rounded-xl bg-[#F5F5F2] p-4 border border-[#ECECE7]">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[#8C8C86]">Commits to process</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[28px] font-medium text-[#1A1A18]">6</span>
                    <span className="rounded-full bg-[#ECECE8] px-2.5 py-1 text-[11px] text-[#5C5C57] font-medium">
                      Pulled from GitHub
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-1.5 text-xs text-[#5C5C57]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B7CE8F] animate-pulse" />
                All agents matching
              </div>
            </NodeCard>

            {/* CONNECTOR 1 */}
            <Connector delayMs={150} />

            {/* NODE 2 — Active Agent (Devin) */}
            <NodeCard className="flex w-[280px] shrink-0 flex-col items-center justify-center text-center p-6 border-2 border-white/60">
              <div className="h-16 w-16 overflow-hidden rounded-xl bg-[#F5F5F2] border border-[#ECECE7] flex items-center justify-center font-bold text-xl text-[#5C5C57] shadow-sm">
                Dev
              </div>
              <h3 className="mt-3 text-lg font-medium text-[#1A1A18] tracking-tight">Devin</h3>
              <p className="text-xs text-[#5C5C57] font-medium">ShipStory Trigger Agent</p>

              {/* Waves waveform circle */}
              <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#1F1F1D] text-white shadow-md animate-pulse">
                <Activity className="h-5 w-5 text-[#B7CE8F]" />
              </div>

              <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-[#8C8C86]">
                Watching — git push detected
              </p>
            </NodeCard>

            {/* CONNECTOR 2 */}
            <Connector mirrored delayMs={300} />

            {/* NODE 3 — Result / Output Card */}
            <NodeCard className="w-[260px] shrink-0 animate-fade-up">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#B7CE8F] animate-ping" />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#1A1A18]">
                      New content drafted
                    </span>
                  </div>
                  <MoreHorizontal className="h-4 w-4 text-[#8C8C86] cursor-pointer hover:text-[#1A1A18]" />
                </div>

                <div className="mt-4 space-y-3.5">
                  <Row label="Repo" value="shipstory/core" />
                  <Row label="Commit" value="feat: agent handoff v2" />
                  <Row label="Branch" value="main" />
                  <Row label="Assigned to" value="Priscilla" avatar />
                </div>
              </div>

              <div className="mt-4 text-[10px] text-right font-semibold text-[#8C8C86] uppercase tracking-wider">
                Waiting for approval
              </div>
            </NodeCard>

          </div>
        </div>

        {/* Scroll hint indicator for mobile */}
        <div className="block md:hidden text-center mt-2 text-[10px] text-[#8C8C86] uppercase tracking-wider font-semibold">
          ← Swipe to explore pipeline →
        </div>

      </div>

      {/* Slide pagination indicator dots below canvas */}
      <div className="mt-6 flex justify-center gap-1.5">
        <span className="h-1 w-6 rounded-full bg-[#1A1A18]" />
        <span className="h-1 w-6 rounded-full bg-[#D8D8D2]" />
      </div>
    </div>
  );
}

// Row helper inside Node 3
interface RowProps {
  label: string;
  value: string;
  avatar?: boolean;
}

function Row({ label, value, avatar = false }: RowProps) {
  return (
    <div className="flex items-center justify-between border-b border-[#F5F5F2] pb-1.5 last:border-0 last:pb-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C8C86]">{label}</span>
      <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#1A1A18]">
        {avatar && (
          <span className="h-4 w-4 rounded-full bg-[#DCE8C8] flex items-center justify-center text-[8px] font-bold text-[#2B3324] border border-[#B7CE8F]">
            P
          </span>
        )}
        {value}
      </span>
    </div>
  );
}
