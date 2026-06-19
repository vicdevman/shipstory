import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WalkthroughModalProps {
  onClose: () => void;
  onProceed?: () => void;
  proceedText?: string;
  isDashboardMode?: boolean;
}

export function WalkthroughModal({ 
  onClose, 
  onProceed, 
  proceedText = "Enter Dashboard", 
  isDashboardMode = false 
}: WalkthroughModalProps) {
  const [videoStarted, setVideoStarted] = useState(false);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      
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
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-[#8C8C86] hover:text-[#1A1A18] transition-colors cursor-pointer"
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
            {isDashboardMode ? (
              <Button 
                variant="pill" 
                onClick={onClose}
                className="px-6 h-10 text-sm font-semibold tracking-tight shadow-md flex items-center gap-1.5 hover:scale-105 hover:bg-[#A9C17D] active:scale-95 transition-all"
              >
                Close Walkthrough
              </Button>
            ) : (
              <>
                <button 
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-[#5C5C57] hover:text-[#1A1A18] transition-colors cursor-pointer"
                >
                  Skip and Enter
                </button>
                {onProceed && (
                  <Button 
                    variant="pill" 
                    onClick={onProceed}
                    className="px-6 h-10 text-sm font-semibold tracking-tight shadow-md flex items-center gap-1.5 hover:scale-105 hover:bg-[#A9C17D] active:scale-95 transition-all"
                  >
                    {proceedText}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
