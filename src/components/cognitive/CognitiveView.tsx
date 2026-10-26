import React from 'react';
import {
  Brain,
  AlertCircle,
  Zap,
  Eye,
  Target,
  Clock,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react';
import { AstronautProfile } from '../../types';

interface CognitiveViewProps {
  astronaut: AstronautProfile;
}

export const CognitiveView: React.FC<CognitiveViewProps> = ({ astronaut }) => {
  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Planned Module Banner */}
      <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 flex items-start gap-3.5 shadow-sm">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-amber-300">
              Future Research Module — Demonstration Only
            </h3>
            <span className="text-[10px] font-mono uppercase bg-amber-900/80 text-amber-200 px-2 py-0.5 rounded border border-amber-700">
              Simulated Battery
            </span>
          </div>
          <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
            Astronaut Cognitive & Neuro-Performance Assessment is planned for upcoming development.
            This module will monitor neurological readiness, circadian fatigue, and fine-motor reaction times
            during lunar approach and surface EVAs. All scores shown below are <strong>simulated demonstration records</strong>.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#152347]">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              Astronaut Cognitive & Neuro-Performance Battery
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Psychomotor vigilance (PVT), spatial memory, and executive processing stability under microgravity.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Battery: NASA Cognition Suite v3</span>
          <span>·</span>
          <span>Flight Day 12</span>
        </div>
      </div>

      {/* 3 Core Cognitive Domains */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Domain 1: Processing Speed (DSST) */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#16234b]">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Processing Speed</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">DSST 90s</span>
          </div>

          <div className="pt-1">
            <div className="text-3xl font-bold font-mono text-cyan-300">
              68 <span className="text-xs font-normal text-slate-400">symbols</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-300 mt-1 font-mono">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>-4.2% vs pre-flight baseline (71 symbols)</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Digit Symbol Substitution Test evaluates mental speed, visuomotor coordination, and rapid associative recall.
          </p>

          <div className="p-2.5 rounded-lg bg-[#0e1838] border border-[#192b5b] text-xs flex justify-between items-center font-mono">
            <span className="text-slate-400">Readiness Score:</span>
            <span className="text-emerald-400 font-semibold">96% (Nominal)</span>
          </div>
        </div>

        {/* Domain 2: Visual Working Memory (N-Back) */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#16234b]">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Visual Working Memory</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">2-Back Spatial</span>
          </div>

          <div className="pt-1">
            <div className="text-3xl font-bold font-mono text-white">
              94.2 <span className="text-xs font-normal text-slate-400">%</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1 font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+0.8% vs pre-flight baseline (93.4%)</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Spatial working memory accuracy evaluating short-term maintenance and manipulation of navigational cues.
          </p>

          <div className="p-2.5 rounded-lg bg-[#0e1838] border border-[#192b5b] text-xs flex justify-between items-center font-mono">
            <span className="text-slate-400">Error Rate:</span>
            <span className="text-emerald-400 font-semibold">5.8% (Target &lt; 10%)</span>
          </div>
        </div>

        {/* Domain 3: Sustained Attention (PVT) */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#16234b]">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Sustained Attention</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">PVT 10-min</span>
          </div>

          <div className="pt-1">
            <div className="text-3xl font-bold font-mono text-emerald-300">
              214 <span className="text-xs font-normal text-slate-400">ms</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1 font-mono">
              <span>Mean Reaction Time (0 lapses &gt; 500 ms)</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Psychomotor Vigilance Task measuring vigilant attention and detecting micro-sleep tendencies or cognitive slowing.
          </p>

          <div className="p-2.5 rounded-lg bg-[#0e1838] border border-[#192b5b] text-xs flex justify-between items-center font-mono">
            <span className="text-slate-400">Lapses:</span>
            <span className="text-emerald-400 font-semibold">0 Detected</span>
          </div>
        </div>
      </div>

      {/* Baseline Comparisons Table */}
      <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Cognitive Performance Baseline Deviations (Simulated)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#17254d] text-slate-400 font-mono text-[11px]">
                <th className="pb-2">Test Battery</th>
                <th className="pb-2">1G Baseline</th>
                <th className="pb-2">FD 12 Score</th>
                <th className="pb-2">Relative Change</th>
                <th className="pb-2">Clinical Threshold</th>
                <th className="pb-2 text-right">Fitness Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#142146]">
              <tr>
                <td className="py-2.5 font-medium text-slate-200">PVT Median Reaction Time</td>
                <td className="py-2.5 font-mono text-slate-400">208 ms</td>
                <td className="py-2.5 font-mono text-white">214 ms</td>
                <td className="py-2.5 font-mono text-cyan-400">+2.8%</td>
                <td className="py-2.5 font-mono text-slate-400">&lt; 250 ms</td>
                <td className="py-2.5 text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Ready
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-slate-200">DSST Symbol Throughput</td>
                <td className="py-2.5 font-mono text-slate-400">71 symbols</td>
                <td className="py-2.5 font-mono text-white">68 symbols</td>
                <td className="py-2.5 font-mono text-amber-300">-4.2%</td>
                <td className="py-2.5 font-mono text-slate-400">&gt; 60 symbols</td>
                <td className="py-2.5 text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Ready
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-slate-200">Spatial N-Back Precision</td>
                <td className="py-2.5 font-mono text-slate-400">93.4%</td>
                <td className="py-2.5 font-mono text-white">94.2%</td>
                <td className="py-2.5 font-mono text-emerald-400">+0.8%</td>
                <td className="py-2.5 font-mono text-slate-400">&gt; 85.0%</td>
                <td className="py-2.5 text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Ready
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-slate-200">Subjective Fatigue Index</td>
                <td className="py-2.5 font-mono text-slate-400">1.8 / 10</td>
                <td className="py-2.5 font-mono text-white">2.6 / 10</td>
                <td className="py-2.5 font-mono text-slate-400">+0.8</td>
                <td className="py-2.5 font-mono text-slate-400">&lt; 5.0</td>
                <td className="py-2.5 text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Optimal
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
