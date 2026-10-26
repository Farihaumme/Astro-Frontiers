import React from 'react';
import { Activity } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="h-10 border-t border-[#152347] bg-[#060a17] px-6 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
      <div className="flex items-center gap-3">
        <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span className="font-semibold text-slate-300">Aither Kairos</span>
        <span className="text-slate-600">|</span>
        <span>Astronaut Health Monitoring System</span>
        <span className="text-slate-600">|</span>
        <span className="text-cyan-400/90">NASA Space Apps Challenge 2026</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[10px] text-slate-500">IJV SegThy Research Pipeline</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">v0.1.0</span>
      </div>
    </footer>
  );
};
