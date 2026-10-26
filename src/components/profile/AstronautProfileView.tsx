import React from 'react';
import {
  User,
  Shield,
  Heart,
  Activity,
  Calendar,
  FileCheck,
  AlertTriangle,
  Award,
  ArrowRight,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { AstronautProfile, NavigationTab } from '../../types';

interface AstronautProfileViewProps {
  astronaut: AstronautProfile;
  onNavigate: (tab: NavigationTab) => void;
}

export const AstronautProfileView: React.FC<AstronautProfileViewProps> = ({
  astronaut,
  onNavigate,
}) => {
  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#152347]">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={astronaut.photoUrl}
              alt={astronaut.name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-full object-cover border-2 border-cyan-400/50 shadow-lg shadow-cyan-950/40"
            />
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#070d1f]" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-white">{astronaut.name}</h2>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                ● {astronaut.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {astronaut.role} · {astronaut.mission}
            </p>
            <p className="text-xs font-mono text-cyan-400 mt-0.5">
              Astronaut ID: {astronaut.id} · Artemis Flight Specialist
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('ijv')}
            className="px-4 py-2 rounded-lg bg-[#14234e] hover:bg-[#1c316d] text-cyan-300 border border-cyan-700/50 text-xs font-medium transition-colors flex items-center gap-2"
          >
            <span>Scan IJV Ultrasound</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid: Biometric Baselines, SANS Protocol Risk, Mission Assignment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Physical & Baseline Vitals */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#16234b]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Biometric Baseline (1G Supine)</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Pre-Flight</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-[#142144]">
              <span className="text-slate-400">Age / Blood Type</span>
              <span className="font-mono text-white">{astronaut.age} yrs · {astronaut.bloodType}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#142144]">
              <span className="text-slate-400">Height / Weight</span>
              <span className="font-mono text-white">{astronaut.heightCm} cm · {astronaut.weightKg} kg</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#142144]">
              <span className="text-slate-400">Resting Heart Rate</span>
              <span className="font-mono text-cyan-300 font-semibold">{astronaut.restingHeartRateBaseline} bpm</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#142144]">
              <span className="text-slate-400">Blood Pressure Baseline</span>
              <span className="font-mono text-white">{astronaut.bloodPressureBaseline}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">IJV Lumen CSA Baseline</span>
              <span className="font-mono text-cyan-300 font-semibold">{astronaut.ijvCrossSectionBaselineMm2} mm²</span>
            </div>
          </div>
        </div>

        {/* Card 2: SANS & Venous Risk Profile */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#16234b]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>SANS & Venous Monitoring</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Low Risk
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Spaceflight-Associated Neuro-ocular Syndrome (SANS) surveillance protocol tracks retrograde jugular pressure
            and optic nerve sheath diameter (ONSD) following headward microgravity fluid shift.
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-[#0e1838] border border-[#182a58]">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">Weekly IJV Echogram:</span>
                <span className="text-cyan-300 font-mono">Scheduled FD 14</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0e1838] border border-[#182a58]">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">Choroidal Folds:</span>
                <span className="text-emerald-400 font-mono">None Detected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Mission Context */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#16234b]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Mission Flight Profile</span>
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">Artemis III</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#142144]">
              <span className="text-slate-400">Launch Date:</span>
              <span className="font-mono text-white">Oct 14, 2026</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#142144]">
              <span className="text-slate-400">Current Flight Day:</span>
              <span className="font-mono text-cyan-300 font-semibold">Day 12 / 210</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#142144]">
              <span className="text-slate-400">Assigned Flight Surgeon:</span>
              <span className="text-white">Dr. Sarah Chen</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Medical Clearance:</span>
              <span className="text-emerald-400 font-semibold">Nominal for Lunar EVA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
