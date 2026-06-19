import React from 'react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onEnterDashboard: () => void;
}

export function Navbar({ onEnterDashboard }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E8E8E3]/60 shadow-[0_1px_3px_rgba(0,0,0,0.01)] backdrop-blur-md bg-white/90">
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <img src="/logo-nobg.png" alt="ShipStory Logo" className="w-6 h-6 object-contain" />
          <span className="text-lg font-semibold tracking-tight text-[#1A1A18]">ShipStory</span>
        </div>
        
        <div className="hidden gap-8 md:flex items-center">
          <a href="#pipeline" className="text-sm font-medium text-[#5C5C57] hover:text-[#1A1A18] transition-colors">Pipeline</a>
          <a href="#features" className="text-sm font-medium text-[#5C5C57] hover:text-[#1A1A18] transition-colors">Agents</a>
          <a href="#about" className="text-sm font-medium text-[#5C5C57] hover:text-[#1A1A18] transition-colors">Platform</a>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="pill"
            onClick={onEnterDashboard}
            className="px-5 h-9 text-sm font-semibold tracking-tight hover:scale-[1.02] transition-transform duration-200"
          >
            Enter Dashboard
          </Button>
        </div>
      </nav>
    </header>
  );
}
