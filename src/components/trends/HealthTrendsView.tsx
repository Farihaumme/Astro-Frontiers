import React, { useState, useEffect } from 'react';
import {
  Activity,
  Heart,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Info,
  Calendar,
  Layers,
  TrendingUp,
  ScanLine,
} from 'lucide-react';
import { AstronautProfile } from '../../types';

interface HealthTrendsViewProps {
  astronaut: AstronautProfile;
}

export const HealthTrendsView: React.FC<HealthTrendsViewProps> = ({ astronaut }) => {
  const [ecgPhase, setEcgPhase] = useState(0);

  // Simulated ECG waveform animation
  useEffect(() => {
    const timer = setInterval(() => {
      setEcgPhase((p) => (p + 1) % 100);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  const generateEcgPath = () => {
    const points: string[] = [];
    const width = 600;
    const height = 120;
    const mid = height / 2;

    for (let x = 0; x < width; x += 4) {
      const cyclePos = (x + ecgPhase * 6) % 150;
      let y = mid;

      if (cyclePos > 20 && cyclePos < 35) {
        y = mid - 8 * Math.sin(((cyclePos - 20) / 15) * Math.PI);
      } else if (cyclePos >= 45 && cyclePos < 50) {
        y = mid + 6;
      } else if (cyclePos >= 50 && cyclePos < 60) {
        y = mid - 52 * Math.sin(((cyclePos - 50) / 10) * Math.PI);
      } else if (cyclePos >= 60 && cyclePos < 65) {
        y = mid + 14;
      } else if (cyclePos > 75 && cyclePos < 105) {
        y = mid - 14 * Math.sin(((cyclePos - 75) / 30) * Math.PI);
      }

      points.push(`${x},${y}`);
    }

    return points.join(' ');
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Prominent Simulated Demonstration Data Notice */}
      <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 flex items-start gap-3.5 shadow-sm">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-amber-300">
              SIMULATED — DEMONSTRATION ONLY
            </h3>
            <span className="text-[10px] font-mono uppercase bg-amber-900/80 text-amber-200 px-2 py-0.5 rounded border border-amber-700">
              Planned Long-Term Module
            </span>
          </div>
          <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
            Continuous autonomous cardiovascular and hemodynamic foundation model inference (ECG-FM) is under active
            development. All waveforms, intervals, and trend graphs displayed below are <strong>simulated demonstration telemetry</strong> intended
            to illustrate the astronaut-facing health baseline comparison workflow.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#152347]">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              Health Trends & Personal Baseline
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Longitudinal comparison of current mission indicators against pre-flight 1G baseline measurements.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Astronaut: {astronaut.name} ({astronaut.id})</span>
          <span>·</span>
          <span>Mission Transit Flight Day 12</span>
        </div>
      </div>

      {/* Primary Measured Indicators vs Recorded Baseline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Heart Rate */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Resting Heart Rate</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            72 <span className="text-xs font-normal text-slate-400">bpm</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300 mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+24.1% vs pre-flight 1G baseline ({astronaut.restingHeartRateBaseline} bpm)</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
            Mild upward shift is common during early adaptation and schedule activity.
          </p>
        </div>

        {/* Blood Pressure */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Brachial Blood Pressure</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            118/76 <span className="text-xs font-normal text-slate-400">mmHg</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 mt-2">
            <span>+1.7% from 1G baseline ({astronaut.bloodPressureBaseline})</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
            Mean arterial pressure (90 mmHg) remains stable within nominal bounds.
          </p>
        </div>

        {/* IJV Cross-Sectional Area */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>IJV Lumen Cross-Section</span>
            <ScanLine className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">
            190.8 <span className="text-xs font-normal text-slate-400">mm²</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300 mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+26.2% vs 1G baseline ({astronaut.ijvCrossSectionBaselineMm2} mm²)</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
            Measured via B-mode neck ultrasound; reflects cephalad fluid redistribution.
          </p>
        </div>

        {/* Heart Rate Variability HRV */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>HR Variability (RMSSD)</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            42 <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-300 mt-2">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>-8.7% from pre-flight baseline (46 ms)</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
            Autonomic tone shows steady recovery following mission launch stress.
          </p>
        </div>
      </div>

      {/* Simulated Waveform Rhythm Strip */}
      <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Lead II Rhythm Strip Simulation (50 mm/s, 10 mm/mV)
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded">
            SIMULATED — DEMONSTRATION ONLY
          </span>
        </div>

        <div className="h-28 bg-[#060a17] rounded-lg border border-[#152349] relative overflow-hidden bg-grid-pattern flex items-center">
          <svg viewBox="0 0 600 120" className="w-full h-full preserve-3d">
            <line x1="0" y1="60" x2="600" y2="60" stroke="#152347" strokeDasharray="2 2" />
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
            PR: 154 ms · QRS: 88 ms · QTc: 418 ms · Normal Sinus Morphology
          </div>
        </div>
      </div>

      {/* Personal Baseline Comparison Table */}
      <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#16234b]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Personal Baseline Comparison (Flight Day 12 vs 1G Supine)</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-400">
            Pre-flight record: Houston Space Center
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#17254d] text-slate-400 font-mono text-[11px]">
                <th className="pb-2">Indicator</th>
                <th className="pb-2">Pre-Flight Baseline</th>
                <th className="pb-2">Current Reading</th>
                <th className="pb-2">Calculated Change</th>
                <th className="pb-2">Plain Language Explanation</th>
                <th className="pb-2 text-right">Protocol Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#142146]">
              <tr>
                <td className="py-2.5 font-medium text-slate-200">Resting Heart Rate</td>
                <td className="py-2.5 font-mono text-slate-400">{astronaut.restingHeartRateBaseline} bpm</td>
                <td className="py-2.5 font-mono text-white">58 bpm</td>
                <td className="py-2.5 font-mono text-emerald-400">0% (Baseline match)</td>
                <td className="py-2.5 text-slate-300">Resting heart rate remains identical to pre-flight baseline.</td>
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
                <td className="py-2.5 font-mono text-cyan-400">+1.7% (+2 mmHg)</td>
                <td className="py-2.5 text-slate-300">Minimal variation within ordinary daily physiological range.</td>
                <td className="py-2.5 text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Nominal
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-slate-200">IJV Lumen Cross-Section</td>
                <td className="py-2.5 font-mono text-slate-400">{astronaut.ijvCrossSectionBaselineMm2} mm²</td>
                <td className="py-2.5 font-mono text-amber-300">190.8 mm²</td>
                <td className="py-2.5 font-mono text-amber-300">+26.2% (+39.6 mm²)</td>
                <td className="py-2.5 text-slate-300">Jugular vein dilation observed; consistent with headward venous fluid shift in microgravity.</td>
                <td className="py-2.5 text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Monitor (FD 14)
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-slate-200">HR Variability (RMSSD)</td>
                <td className="py-2.5 font-mono text-slate-400">46 ms</td>
                <td className="py-2.5 font-mono text-white">42 ms</td>
                <td className="py-2.5 font-mono text-cyan-400">-8.7% (-4 ms)</td>
                <td className="py-2.5 text-slate-300">Slight decrease in autonomic variability; well within acceptable mission tolerance.</td>
                <td className="py-2.5 text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Nominal
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
