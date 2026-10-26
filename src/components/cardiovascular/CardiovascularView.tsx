import React, { useState, useEffect } from 'react';
import {
  Activity,
  Heart,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';
import { AstronautProfile } from '../../types';

interface CardiovascularViewProps {
  astronaut: AstronautProfile;
}

export const CardiovascularView: React.FC<CardiovascularViewProps> = ({ astronaut }) => {
  const [ecgPhase, setEcgPhase] = useState(0);

  // Animate ECG waveform
  useEffect(() => {
    const timer = setInterval(() => {
      setEcgPhase((p) => (p + 1) % 100);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // ECG points generator for standard P-Q-R-S-T wave
  const generateEcgPath = () => {
    const points: string[] = [];
    const width = 600;
    const height = 120;
    const mid = height / 2;

    for (let x = 0; x < width; x += 4) {
      const cyclePos = (x + ecgPhase * 6) % 150;
      let y = mid;

      if (cyclePos > 20 && cyclePos < 35) {
        // P wave
        y = mid - 8 * Math.sin(((cyclePos - 20) / 15) * Math.PI);
      } else if (cyclePos >= 45 && cyclePos < 50) {
        // Q wave
        y = mid + 6;
      } else if (cyclePos >= 50 && cyclePos < 60) {
        // R peak
        y = mid - 52 * Math.sin(((cyclePos - 50) / 10) * Math.PI);
      } else if (cyclePos >= 60 && cyclePos < 65) {
        // S wave
        y = mid + 14;
      } else if (cyclePos > 75 && cyclePos < 105) {
        // T wave
        y = mid - 14 * Math.sin(((cyclePos - 75) / 30) * Math.PI);
      }

      points.push(`${x},${y}`);
    }

    return points.join(' ');
  };

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
              Simulated Telemetry
            </span>
          </div>
          <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
            Cardiovascular Monitoring with foundation model ECG-FM is currently in planned development for
            the Artemis mission medical stack. All vital measurements, rhythm strips, and baseline deviations
            presented on this demonstration page are <strong>simulated research telemetry</strong> and do not
            reflect active automated clinical diagnostics.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#152347]">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              Cardiovascular & Hemodynamic Monitoring
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            ECG morphological telemetry, arterial pressure wave analysis, and microgravity vascular adaptation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Subject: {astronaut.name} ({astronaut.id})</span>
          <span>·</span>
          <span>Lead II Telemetry</span>
        </div>
      </div>

      {/* Live ECG Rhythm Strip Simulation */}
      <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Simulated ECG Waveform — Lead II (50 mm/s, 10 mm/mV)
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded">
            Sinus Rhythm · Nominal
          </span>
        </div>

        <div className="h-32 bg-[#060a17] rounded-lg border border-[#152349] relative overflow-hidden bg-grid-pattern flex items-center">
          <svg viewBox="0 0 600 120" className="w-full h-full preserve-3d">
            {/* Grid references */}
            <line x1="0" y1="60" x2="600" y2="60" stroke="#152347" strokeDasharray="2 2" />
            {/* Active ECG Polyline */}
            <polyline
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={generateEcgPath()}
            />
          </svg>
          <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-500">
            HR: 72 BPM · PR: 154 ms · QRS: 88 ms · QTc: 418 ms
          </div>
        </div>
      </div>

      {/* 4 Core Cardiovascular Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Heart Rate */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Heart Rate</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            72 <span className="text-xs font-normal text-slate-400">bpm</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300 mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14 bpm vs 1G baseline ({astronaut.restingHeartRateBaseline} bpm)</span>
          </div>
        </div>

        {/* Blood Pressure */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Blood Pressure</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            118/76 <span className="text-xs font-normal text-slate-400">mmHg</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 mt-2">
            <span>Mean Arterial: 90 mmHg (Nominal)</span>
          </div>
        </div>

        {/* Blood Oxygen SpO2 */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Oxygen Saturation (SpO₂)</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            98.5 <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 mt-2">
            <span>Cabin O₂ partial pressure stable</span>
          </div>
        </div>

        {/* Heart Rate Variability HRV */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>HR Variability (RMSSD)</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            42 <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-300 mt-2">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>-8% from pre-flight baseline (46 ms)</span>
          </div>
        </div>
      </div>

      {/* Baseline Comparisons Table */}
      <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <span>Pre-Flight 1G Baseline vs Artemis III In-Flight Comparison (Simulated)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#17254d] text-slate-400 font-mono text-[11px]">
                <th className="pb-2">Parameter</th>
                <th className="pb-2">Pre-Flight Baseline</th>
                <th className="pb-2">Current Flight Day 12</th>
                <th className="pb-2">Deviation</th>
                <th className="pb-2 text-right">Medical Protocol Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#142146]">
              <tr>
                <td className="py-2.5 font-medium text-slate-200">Resting Heart Rate</td>
                <td className="py-2.5 font-mono text-slate-400">{astronaut.restingHeartRateBaseline} bpm</td>
                <td className="py-2.5 font-mono text-white">58 bpm</td>
                <td className="py-2.5 font-mono text-emerald-400">0%</td>
                <td className="py-2.5 text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Nominal
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-slate-200">Systolic Blood Pressure</td>
                <td className="py-2.5 font-mono text-slate-400">116 mmHg</td>
                <td className="py-2.5 font-mono text-white">118 mmHg</td>
                <td className="py-2.5 font-mono text-cyan-400">+1.7%</td>
                <td className="py-2.5 text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Nominal
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-slate-200">PR Interval</td>
                <td className="py-2.5 font-mono text-slate-400">152 ms</td>
                <td className="py-2.5 font-mono text-white">154 ms</td>
                <td className="py-2.5 font-mono text-slate-400">+1.3%</td>
                <td className="py-2.5 text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Nominal
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-slate-200">QTc Bazett Interval</td>
                <td className="py-2.5 font-mono text-slate-400">412 ms</td>
                <td className="py-2.5 font-mono text-white">418 ms</td>
                <td className="py-2.5 font-mono text-cyan-400">+1.4%</td>
                <td className="py-2.5 text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Nominal
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-slate-200">Central Venous Engorgement</td>
                <td className="py-2.5 font-mono text-slate-400">151.2 mm² (IJV)</td>
                <td className="py-2.5 font-mono text-amber-300">190.8 mm²</td>
                <td className="py-2.5 font-mono text-amber-300">+26.2%</td>
                <td className="py-2.5 text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Expected Fluid Shift
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
