'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, ArrowRight, X, Sparkles, Check, Flame, MessageSquare, Terminal } from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { WorkflowCanvas } from '@/components/landing/WorkflowCanvas';
import { LogoStrip } from '@/components/landing/LogoStrip';
import { AboutSection } from '@/components/landing/AboutSection';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const router = useRouter();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);

  const handleEnterDashboard = () => {
    setShowVideoModal(true);
  };

  const handleProceedToDashboard = () => {
    setShowVideoModal(false);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white text-[#1A1A18] font-sans selection:bg-[#B7CE8F]/40 selection:text-[#2B3324]">
      
      {/* Navbar */}
      <Navbar onEnterDashboard={handleEnterDashboard} />

      {/* Hero Header */}
      <Hero onEnterDashboard={handleEnterDashboard} />

      {/* Centerpiece: The connected Workflow Canvas */}
      <section id="pipeline" className="px-6 pb-20">
        <WorkflowCanvas />
      </section>

      {/* Partners / Logo strip */}
      <LogoStrip />

      {/* About & The 6-Agent Department */}
      <AboutSection />

      {/* Highlight Features: What Makes Us Standout (Judges Focus) */}
      <section id="features" className="py-20 bg-gray-50 border-t border-gray-100 px-6">
        <div className="mx-auto max-w-5xl">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block px-3 py-1 rounded-full bg-[#ECECE8] text-[#5C5C57] text-[11px] font-bold uppercase tracking-wider mb-4">
              Core Innovations
            </div>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-[#1A1A18]">
              Why ShipStory wins hackathons
            </h2>
            <p className="text-[#5C5C57] mt-4 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              We built more than simple wrappers. ShipStory leverages advanced multi-agent coordination with full adversarial loop validation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
              <div className="p-3 bg-[#B7CE8F]/10 text-[#2B3324] rounded-xl h-fit border border-[#B7CE8F]/25">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1A1A18] tracking-tight">Adversarial Handoff Loops</h3>
                <p className="text-xs text-[#5C5C57] mt-2 leading-relaxed">
                  Agents don't just execute blindly; they debate. Gigi's copy drafts are reviewed by Priscilla. If a draft violates copywriting constraints (like exceeding emoji limits or leaking raw code), it is rejected and sent back for automated revision.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
              <div className="p-3 bg-[#B7CE8F]/10 text-[#2B3324] rounded-xl h-fit border border-[#B7CE8F]/25">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1A1A18] tracking-tight">Adaptive Feedback Loop</h3>
                <p className="text-xs text-[#5C5C57] mt-2 leading-relaxed">
                  ShipStory closes the product cycle. Marshall tracks competitor pivots and user feedback, synthesizing strategic recommendations. In one click, you approve and update your active roadmap context automatically.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
              <div className="p-3 bg-[#B7CE8F]/10 text-[#2B3324] rounded-xl h-fit border border-[#B7CE8F]/25">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1A1A18] tracking-tight">Connie Chief of Staff Chat</h3>
                <p className="text-xs text-[#5C5C57] mt-2 leading-relaxed">
                  A central assistant that provides real-time updates on active epics, tracks milestone progress, and answers technical questions about the codebase context, bridging human founders with the virtual team.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
              <div className="p-3 bg-[#B7CE8F]/10 text-[#2B3324] rounded-xl h-fit border border-[#B7CE8F]/25">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1A1A18] tracking-tight">Secure Data Isolation on Band</h3>
                <p className="text-xs text-[#5C5C57] mt-2 leading-relaxed">
                  Built on the Band framework, we enforce strict boundary checks. Public-facing agent replies are verified and audited by Priscilla's compliance filter, shielding internal database references and secret keys.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Clean Embedded Video Section (Double Coverage for Judges) */}
      <section className="py-20 px-6 bg-white border-t border-gray-100 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block px-3 py-1 rounded-full bg-[#ECECE8] text-[#5C5C57] text-[11px] font-bold uppercase tracking-wider mb-4">
            Video Demo
          </div>
          <h2 className="text-3xl font-medium tracking-tight text-[#1A1A18]">
            See the pipeline in action
          </h2>
          <p className="text-[#5C5C57] mt-3 mb-10 text-sm max-w-md mx-auto">
            Watch how a single git push triggers code summaries, content drafting, compliance audits, and asset generation.
          </p>

          <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-[#EFEFEA] aspect-video max-w-3xl mx-auto group">
            <video 
              src="/walkthrough.mp4" 
              controls 
              className="w-full h-full object-cover"
              poster="/logo-curved.png"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-[#E8E8E3] text-center text-xs text-[#8C8C86]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo-nobg.png" alt="Logo" className="w-5 opacity-60" />
              <span className="font-bold text-[#1A1A18]">ShipStory</span>
              <span>— Powered by Band SDK</span>
            </div>
            <p>© 2026 ShipStory. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Video Modal (Hackathon Walkthrough Focus) */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          
          <div className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-[#1A1A18] tracking-tight">
                  ShipStory Video Walkthrough
                </h3>
                <p className="text-xs text-[#8C8C86] font-medium">
                  Watch this quick 3-minute video to understand the multi-agent execution loop.
                </p>
              </div>
              <button 
                onClick={() => setShowVideoModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-[#8C8C86] hover:text-[#1A1A18] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Video Body */}
            <div className="flex-1 min-h-0 bg-black relative flex items-center justify-center">
              <video 
                src="/walkthrough.mp4" 
                controls 
                autoPlay 
                onPlay={() => setVideoStarted(true)}
                className="w-full max-h-[50vh] md:max-h-[60vh] object-contain"
              />
            </div>

            {/* Modal Footer / Navigation Controls */}
            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B7CE8F] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B7CE8F]"></span>
                </span>
                <span className="text-xs text-[#5C5C57] font-semibold">
                  {!videoStarted ? 'Click play to watch the demonstration' : 'Enjoy the walkthrough demonstration'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowVideoModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5C5C57] hover:text-[#1A1A18] transition-colors"
                >
                  Skip and Enter
                </button>
                <Button 
                  variant="pill" 
                  onClick={handleProceedToDashboard}
                  className="px-6 h-10 text-sm font-semibold tracking-tight shadow-md flex items-center gap-1.5 hover:scale-105 hover:bg-[#A9C17D] active:scale-95 transition-all"
                >
                  Enter Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}