import React from 'react';
import {
  Compass,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  PhoneCall,
  Activity,
  ScanLine,
  Eye,
  Heart,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { AstronautProfile, NavigationTab } from '../../types';

interface HealthGuidanceViewProps {
  astronaut: AstronautProfile;
  onNavigate: (tab: NavigationTab) => void;
}

export const HealthGuidanceView: React.FC<HealthGuidanceViewProps> = ({
  astronaut,
  onNavigate,
}) => {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/60 flex items-start gap-3.5 shadow-sm">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs leading-relaxed text-slate-300">
          <strong className="text-white block text-sm mb-1 font-semibold">
            Mission Medical Protocol Authority Notice
          </strong>
          This guidance interface translates physiological telemetry and image measurements into protocol-aligned
          reference guidance. Automated analysis tools are supportive companions and <strong>do not substitute for qualified
          flight surgeon oversight</strong>. NASA / ESA mission flight rules and direct communication with Ground Medical take absolute priority.
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#152347]">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              Health Guidance & Mission Protocols
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Plain-language explanations of observed indicator changes, baseline shifts, and recommended actions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 bg-[#0e1837] px-3 py-1.5 rounded-lg border border-[#192b5b]">
          <span>Ground Medical Liaison: Dr. Sarah Chen</span>
          <span>·</span>
          <span className="text-emerald-400">Audio/Data Link Open</span>
        </div>
      </div>

      {/* Section 1: What Measurement or Trend Changed */}
      <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>1. Recent Health Changes & Plain-Language Explanation</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* IJV Shift */}
          <div className="p-4 rounded-lg bg-[#0e1939] border border-[#192c5d] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                <ScanLine className="w-4 h-4 text-cyan-400" />
                Internal Jugular Vein Dilation (+26.2%)
              </span>
              <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded">
                Expected Adaptation
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>What changed:</strong> The cross-sectional area of your right Internal Jugular Vein increased from 
              151.2 mm² (pre-flight 1G supine baseline) to 190.8 mm² on Flight Day 12.
            </p>
            <p className="text-slate-400 leading-relaxed">
              <strong>Meaning:</strong> Without gravity pulling fluids toward your lower body, approximately 1.5 to 2.0 liters
              of venous blood and interstitial fluid shift toward your chest and head. This causes veins in the neck and head
              to expand. This is a normal and anticipated physiological response during early spaceflight.
            </p>
          </div>

          {/* Resting HR Shift */}
          <div className="p-4 rounded-lg bg-[#0e1939] border border-[#192c5d] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-400" />
                Resting Heart Rate & HRV (+14 bpm during workload)
              </span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded">
                Stable
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>What changed:</strong> Daytime active heart rate has averaged 72 bpm, while your basal resting rate
              at sleep remains consistent at 58 bpm, closely matching your 1G baseline.
            </p>
            <p className="text-slate-400 leading-relaxed">
              <strong>Meaning:</strong> Cardiovascular deconditioning is being successfully mitigated by your daily
              2-hour resistive exercise schedule. Cardiac rhythm intervals (PR and QTc) show no electrical conduction anomalies.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Missing or Uncertain Information */}
      <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>2. Current Information Gaps & Technical Limitations</span>
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="p-3 rounded-lg bg-[#0e1736] border border-amber-900/40 text-slate-300 space-y-1">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Abnormality Classification Is Not Available</span>
            </div>
            <p className="leading-relaxed">
              The automated ultrasound segmentation engine delineates vein boundaries to measure area. It <strong>does not
              have diagnostic training to detect vascular thrombosis, stagnant flow, or occlusions</strong>. A segmentation mask
              simply shows the geometry of the lumen—it does not indicate whether the vein is healthy or abnormal.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0e1736] border border-[#1a2d5e] text-slate-300 space-y-1">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span>Optic Nerve Sheath Diameter (SANS) Data Pending</span>
            </div>
            <p className="leading-relaxed">
              Full ocular risk assessment for Spaceflight-Associated Neuro-ocular Syndrome requires paired fundoscopy and OCT scans,
              which are scheduled for Flight Day 15. Venous area alone is insufficient to evaluate intracranial pressure.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Recommended Next Steps by Mission Protocol */}
      <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>3. Recommended Next Steps Based on Mission Protocols</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-[#0e1939] border border-[#192b5b] space-y-2">
            <span className="font-semibold text-cyan-300 block">Exercise Countermeasures</span>
            <p className="text-slate-300 leading-relaxed">
              Continue the prescribed 2-hour daily resistive exercise protocol (ARED / cycle ergometer). This promotes
              peripheral blood circulation and reduces cephalad venous pooling.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0e1939] border border-[#192b5b] space-y-2">
            <span className="font-semibold text-cyan-300 block">Upcoming Ultrasound Scan</span>
            <p className="text-slate-300 leading-relaxed">
              Perform the next scheduled B-mode IJV ultrasound scan on Flight Day 14. Ensure proper skin-probe acoustic
              coupling and record both transverse and longitudinal cervical views.
            </p>
            <button
              onClick={() => onNavigate('ijv')}
              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 pt-1 font-medium"
            >
              <span>Go to IJV Analysis Module</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0e1939] border border-[#192b5b] space-y-2">
            <span className="font-semibold text-cyan-300 block">Ground Summary Sync</span>
            <p className="text-slate-300 leading-relaxed">
              Prepare your weekly Health Report summary for transmission to Dr. Sarah Chen prior to the 20:30 UTC
              medical conference pass.
            </p>
            <button
              onClick={() => onNavigate('reports')}
              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 pt-1 font-medium"
            >
              <span>Prepare Ground Report</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Section 4: When to Contact the Ground Medical Team */}
      <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-6 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-amber-400" />
          <span>4. When to Contact the Ground Medical Team (Escalation Criteria)</span>
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed">
          Notify your assigned Flight Surgeon (Dr. Sarah Chen) immediately during the next voice pass or via priority comms
          if you experience any of the following symptoms:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-2.5 rounded bg-rose-950/30 border border-rose-900/60 text-rose-200">
            <span className="font-semibold block mb-0.5">Visual Symptoms</span>
            Acute blurry vision, gray spots, loss of contrast, or choroidal fold sensation.
          </div>
          <div className="p-2.5 rounded bg-rose-950/30 border border-rose-900/60 text-rose-200">
            <span className="font-semibold block mb-0.5">Cervical / Neck Discomfort</span>
            Persistent unilateral neck swelling, localized warmth, tenderness, or firmness over the jugular groove.
          </div>
          <div className="p-2.5 rounded bg-rose-950/30 border border-rose-900/60 text-rose-200">
            <span className="font-semibold block mb-0.5">Persistent Head Pressure</span>
            Severe or throbbing morning headache that does not respond to standard hydration and rest.
          </div>
          <div className="p-2.5 rounded bg-rose-950/30 border border-rose-900/60 text-rose-200">
            <span className="font-semibold block mb-0.5">Cardiac Palpitations</span>
            Sudden resting tachycardia (&gt; 110 bpm) or sustained irregular heart rhythm sensations.
          </div>
        </div>
      </div>
    </div>
  );
};
