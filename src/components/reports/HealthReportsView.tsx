import React from 'react';
import {
  FileText,
  Printer,
  Download,
  ShieldCheck,
  Activity,
  ScanLine,
  Heart,
  Brain,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { AstronautProfile, SystemStatusData, RecentFinding } from '../../types';

interface HealthReportsViewProps {
  astronaut: AstronautProfile;
  findings: RecentFinding[];
  systemStatus: SystemStatusData;
}

export const HealthReportsView: React.FC<HealthReportsViewProps> = ({
  astronaut,
  findings,
  systemStatus,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto print:p-0 print:bg-white print:text-black">
      {/* Header & Print Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#152347] print:hidden">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Health Reports & Ground Medical Summary</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compile available physiological data and IJV ultrasound results for Ground Medical Team review.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-[#14234e] hover:bg-[#1b2f69] text-cyan-300 border border-cyan-700/50 text-xs font-medium transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Formal Medical Summary Document for Ground Team */}
      <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-8 shadow-md space-y-6 print:bg-white print:text-black print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-[#182855] pb-6 print:border-gray-300">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white print:text-black">Aither Kairos</span>
              <span className="text-xs font-mono bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800 print:border-gray-400 print:text-black print:bg-gray-100">
                NASA Space Apps 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
              Astronaut Health Monitoring System — Mission Telemetry Summary for Ground Medical Team
            </p>
          </div>

          <div className="text-right text-xs font-mono text-slate-400 print:text-gray-600">
            <p>Summary ID: AK-ART3-FD12-0427</p>
            <p>Generated: Apr 28, 2025 · 14:45 UTC</p>
            <p className="text-cyan-400 print:text-black font-semibold">Recipient: Dr. Sarah Chen, Flight Surgeon</p>
          </div>
        </div>

        {/* Astronaut Demographics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-[#0e1837] border border-[#1a2c5b] print:bg-gray-50 print:border-gray-300 text-xs">
          <div>
            <span className="text-slate-400 print:text-gray-500 block">Astronaut</span>
            <span className="font-bold text-white print:text-black">{astronaut.name} ({astronaut.id})</span>
          </div>
          <div>
            <span className="text-slate-400 print:text-gray-500 block">Mission & Phase</span>
            <span className="font-semibold text-slate-200 print:text-black">{astronaut.mission} · {astronaut.missionPhase}</span>
          </div>
          <div>
            <span className="text-slate-400 print:text-gray-500 block">Flight Duration</span>
            <span className="font-mono text-cyan-300 print:text-black">{astronaut.daysInMission} / {astronaut.totalMissionDays} Days</span>
          </div>
          <div>
            <span className="text-slate-400 print:text-gray-500 block">Medical Officer</span>
            <span className="font-medium text-slate-200 print:text-black">Dr. Sarah Chen, MD</span>
          </div>
        </div>

        {/* Section 1: IJV Ultrasound Assessment (Primary Research Module) */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-white print:text-black flex items-center gap-2 border-b border-[#182855] pb-2 print:border-gray-300">
            <ScanLine className="w-4 h-4 text-cyan-400 print:text-black" />
            <span>1. Internal Jugular Vein (IJV) Ultrasound Analysis (Primary AI Module)</span>
          </h3>

          <div className="p-4 rounded-lg bg-[#0e1837] border border-[#1a2c5b] print:bg-gray-50 print:border-gray-300 text-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-400 print:text-gray-500 block">Measured Cross-Sectional Area:</span>
                <span className="font-mono text-cyan-300 print:text-black font-bold text-sm">190.8 mm²</span>
                <span className="text-[10px] text-amber-300 print:text-gray-600 block mt-0.5">+26.2% vs 1G Supine Baseline</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-500 block">Circularity Index:</span>
                <span className="font-mono text-white print:text-black font-bold text-sm">0.83 (Patent)</span>
                <span className="text-[10px] text-emerald-400 print:text-gray-600 block mt-0.5">Compliant Venous Wall</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-500 block">Segmentation Architecture:</span>
                <span className="font-mono text-slate-200 print:text-black">SegThy U-Net Keras 3</span>
                <span className="text-[10px] text-slate-400 print:text-gray-600 block mt-0.5">Dice Coeff 0.912</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1a2c5b] print:border-gray-300 text-xs space-y-1">
              <p className="font-semibold text-slate-200 print:text-black">Clinical Summary:</p>
              <p className="text-slate-300 print:text-gray-700 leading-relaxed">
                Right internal jugular vein demonstrates bilateral vascular engorgement secondary to microgravity cephalad fluid
                redistribution. Lumen is fully patent without acoustic shadowing.
              </p>
            </div>

            <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800/60 print:bg-gray-100 print:border-gray-300 text-[11px] text-amber-200 print:text-gray-800">
              <strong>Notice:</strong> Abnormality classification is unavailable (SegThy provides anatomical segmentation annotations only).
              Diagnosis of vascular thrombosis or occlusion requires manual Doppler evaluation by the Flight Surgeon.
            </div>
          </div>
        </div>

        {/* Section 2: Cardiovascular Telemetry Summary (Simulated) */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-white print:text-black flex items-center gap-2 border-b border-[#182855] pb-2 print:border-gray-300">
            <Heart className="w-4 h-4 text-rose-400 print:text-black" />
            <span>2. Cardiovascular Summary (Simulated Demonstration Telemetry)</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#0e1837] border border-[#1a2c5b] print:bg-gray-50 print:border-gray-300">
              <span className="text-slate-400 print:text-gray-500">Resting HR</span>
              <p className="text-lg font-mono font-bold text-white print:text-black">58 bpm</p>
              <span className="text-[10px] text-emerald-400 print:text-gray-600">Nominal Baseline</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0e1837] border border-[#1a2c5b] print:bg-gray-50 print:border-gray-300">
              <span className="text-slate-400 print:text-gray-500">Blood Pressure</span>
              <p className="text-lg font-mono font-bold text-white print:text-black">118/76</p>
              <span className="text-[10px] text-emerald-400 print:text-gray-600">MAP: 90 mmHg</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0e1837] border border-[#1a2c5b] print:bg-gray-50 print:border-gray-300">
              <span className="text-slate-400 print:text-gray-500">SpO₂ Oxygen</span>
              <p className="text-lg font-mono font-bold text-white print:text-black">98.5%</p>
              <span className="text-[10px] text-emerald-400 print:text-gray-600">Cabin Nominal</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0e1837] border border-[#1a2c5b] print:bg-gray-50 print:border-gray-300">
              <span className="text-slate-400 print:text-gray-500">HRV (RMSSD)</span>
              <p className="text-lg font-mono font-bold text-white print:text-black">42 ms</p>
              <span className="text-[10px] text-cyan-400 print:text-gray-600">Autonomic Stability</span>
            </div>
          </div>
        </div>

        {/* Section 3: Cognitive & SANS Risk Recommendation */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-white print:text-black flex items-center gap-2 border-b border-[#182855] pb-2 print:border-gray-300">
            <Brain className="w-4 h-4 text-indigo-400 print:text-black" />
            <span>3. Neuro-Performance & Flight Surgeon Recommendation</span>
          </h3>

          <div className="p-4 rounded-lg bg-[#0e1837] border border-[#1a2c5b] print:bg-gray-50 print:border-gray-300 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 print:text-green-700 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Overall Mission Health Risk: LOW RISK</span>
            </div>
            <p className="text-slate-300 print:text-gray-700 leading-relaxed">
              Astronaut Alex Rivera exhibits physiological adaptation consistent with Artemis lunar transit profiles.
              Psychomotor vigilance is optimal (Mean RT 214 ms), and internal jugular venous expansion remains within
              predicted microgravity fluid shift parameters.
            </p>
            <div className="pt-2 text-slate-400 print:text-gray-500 font-mono text-[11px]">
              Recommendation: Continue weekly ultrasound surveillance on Flight Day 14. Maintain standard countermeasures.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
