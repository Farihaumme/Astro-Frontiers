import React, { useState } from 'react';
import {
  Heart,
  Brain,
  Activity,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  Compass,
  CheckCircle2,
  XCircle,
  ScanLine,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  AstronautProfile,
  SystemStatusData,
  NotificationItem,
  RecentFinding,
  NavigationTab,
} from '../../types';
import { VITALS_1W_DATA } from '../../data/mockData';

interface DashboardViewProps {
  astronaut: AstronautProfile;
  systemStatus: SystemStatusData;
  notifications: NotificationItem[];
  findings: RecentFinding[];
  onNavigate: (tab: NavigationTab) => void;
  onRefreshHealth: () => void;
  isCheckingHealth: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  astronaut,
  systemStatus,
  notifications,
  findings,
  onNavigate,
  onRefreshHealth,
  isCheckingHealth,
}) => {
  const [vitalsTimeframe, setVitalsTimeframe] = useState<'1D' | '1W' | '1M' | '3M'>('1W');

  // Chart data representation
  const chartPoints = VITALS_1W_DATA;
  const minHr = 50;
  const maxHr = 100;
  const chartHeight = 120;
  const chartWidth = 320;

  // Convert points to SVG polyline
  const hrPointsSvg = chartPoints
    .map((p, idx) => {
      const x = (idx / (chartPoints.length - 1)) * chartWidth;
      const y = chartHeight - ((p.heartRate - minHr) / (maxHr - minHr)) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  const restingHrPointsSvg = chartPoints
    .map((p, idx) => {
      const x = (idx / (chartPoints.length - 1)) * chartWidth;
      const y = chartHeight - ((p.restingHeartRate - minHr) / (maxHr - minHr)) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Current Health Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Current Health Status
            </h2>
            <span className="text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
              Flight Day 12 / 210
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Astronaut: Alex Rivera (AST-0427) · Artemis III Transit Phase · Personal Health Monitoring
          </p>
        </div>

        {/* Primary Functional Action Banner */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('ijv')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-950/50 transition-all hover:scale-[1.02]"
          >
            <ScanLine className="w-4 h-4 text-cyan-200" />
            <span>Perform IJV Ultrasound Scan</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>

      {/* Top Grid: Astronaut Profile, Honest System Status, Mission Overview, Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Astronaut Profile & Mission Assignment */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-[#22366e] transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="relative">
              <img
                src={astronaut.photoUrl}
                alt={astronaut.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-cyan-500/40 shadow-inner"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0b1329]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white truncate">{astronaut.name}</h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                  ● {astronaut.status}
                </span>
              </div>
              <div className="mt-1 space-y-0.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Astronaut ID</span>
                  <span className="font-mono text-slate-200">{astronaut.id}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Mission</span>
                  <span className="text-slate-200">{astronaut.mission}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Mission Phase</span>
                  <span className="text-slate-200">{astronaut.missionPhase}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Mission Duration</span>
                  <span className="font-mono text-slate-200">{astronaut.daysInMission} / {astronaut.totalMissionDays} days</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#16234b]">
            <button
              onClick={() => onNavigate('guidance')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 group"
            >
              <span>Review Health Guidance</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Card 2: System Status (HONESTLY REPORTING BACKEND & MODEL STATUS) */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-[#22366e] transition-colors">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#16234b]">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                System Status
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                    systemStatus.fastapiConnected
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                      : 'bg-amber-950/60 text-amber-300 border-amber-800/80'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${systemStatus.fastapiConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {systemStatus.fastapiConnected ? 'Backend Connected' : 'Local / Benchmark'}
                </span>
                <button
                  onClick={onRefreshHealth}
                  disabled={isCheckingHealth}
                  title="Probe FastAPI backend on localhost:8000"
                  className="p-1 rounded text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isCheckingHealth ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              {/* ECG Module Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80" />
                  <span>ECG-FM (ECG Analysis)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  Simulated
                </span>
              </div>

              {/* IJV Ultrasound Status - HONEST REPORT */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      systemStatus.fastapiConnected ? 'bg-cyan-400' : 'bg-amber-400'
                    }`}
                  />
                  <span>RD4US (IJV Ultrasound)</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    systemStatus.fastapiConnected
                      ? 'text-emerald-300 bg-emerald-950/60 border-emerald-800/60'
                      : 'text-amber-300 bg-amber-950/60 border-amber-800/60'
                  }`}
                >
                  {systemStatus.ijvModelStatus}
                </span>
              </div>

              {/* Database */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Database</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">
                  {systemStatus.databaseStatus}
                </span>
              </div>

              {/* API Services */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>API Services</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">
                  {systemStatus.apiServicesStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#16234b] text-[10px] font-mono text-slate-500 flex justify-between items-center">
            <span>Last probe: {systemStatus.lastAnalysisTimestamp.slice(11, 19) || 'Just now'}</span>
            <button
              onClick={() => onNavigate('settings')}
              className="text-cyan-400 hover:underline flex items-center gap-0.5"
            >
              Config
            </button>
          </div>
        </div>

        {/* Card 3: Mission Overview */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
          {/* Subtle Space Orbit Background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-screen bg-cover bg-center"
               style={{ backgroundImage: `url('/src/assets/images/space_earth_orbit_1792998619605.jpg')` }} />

          <div className="relative z-10">
            <div className="flex items-center justify-between pb-2 border-b border-[#16234b]">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Mission Overview
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                Transit to Moon
              </span>
            </div>

            <div className="mt-2.5">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Mission Timeline</span>
                <span className="font-mono text-white">12 / 210 days</span>
              </div>
              <div className="w-full bg-[#121e42] h-2 rounded-full overflow-hidden border border-[#1c2e63]">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full"
                  style={{ width: `${(12 / 210) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="p-1.5 rounded bg-[#101c3d]/80 border border-[#1c2e60]">
                <span className="text-[10px] text-slate-400 block">Gravity</span>
                <span className="text-xs font-mono font-semibold text-white">0.16 g</span>
              </div>
              <div className="p-1.5 rounded bg-[#101c3d]/80 border border-[#1c2e60]">
                <span className="text-[10px] text-slate-400 block">Radiation</span>
                <span className="text-xs font-mono font-semibold text-amber-300">0.45 mSv/d</span>
              </div>
              <div className="p-1.5 rounded bg-[#101c3d]/80 border border-[#1c2e60]">
                <span className="text-[10px] text-slate-400 block">Sleep Avg</span>
                <span className="text-xs font-mono font-semibold text-cyan-300">6.8 h</span>
              </div>
            </div>
          </div>

          <div className="mt-2 text-[10px] text-slate-500 font-mono relative z-10">
            Environment telemetry: Nominal lunar trajectory
          </div>
        </div>

        {/* Card 4: Alerts & Notifications */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#16234b]">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Alerts & Notifications
                </span>
              </div>
              <span className="text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.2 rounded-full">
                {notifications.filter(n => !n.read).length} Active
              </span>
            </div>

            <div className="mt-2.5 space-y-2">
              {notifications.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-lg bg-[#101b3b] border border-[#1b2b57] text-xs hover:border-cyan-500/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-xs truncate">{item.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">{item.timestamp.split('·')[1]}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-[#16234b] text-right">
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              View All Logs &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Middle Grid: Current Health Measurements (Simulated), Recent Health Analyses, Pending Health Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Current Health Measurements (6 cols) */}
        <div className="lg:col-span-6 bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#16234b]">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Current Health Measurements</h3>
              <span className="text-[9px] font-mono bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-800/80">
                SIMULATED — DEMONSTRATION ONLY
              </span>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center gap-1 bg-[#101a38] p-0.5 rounded-lg border border-[#1a2b59]">
              {(['1D', '1W', '1M', '3M'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setVitalsTimeframe(tf)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors ${
                    vitalsTimeframe === tf
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* SVG Telemetry Chart */}
            <div className="md:col-span-8 bg-[#090f21] p-3 rounded-lg border border-[#15234b] bg-grid-pattern relative">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <span className="w-2 h-0.5 bg-cyan-400" /> Heart Rate (bpm)
                  </span>
                  <span className="flex items-center gap-1 text-indigo-400">
                    <span className="w-2 h-0.5 bg-indigo-400" /> Resting HR (bpm)
                  </span>
                </div>
                <span>Peak: 82 bpm</span>
              </div>

              {/* Chart Stage */}
              <div className="h-32 w-full relative">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                  {/* Subtle Grid Lines */}
                  <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="#17254d" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2={chartWidth} y2="60" stroke="#17254d" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2={chartWidth} y2="100" stroke="#17254d" strokeDasharray="3 3" />

                  {/* Resting HR Polyline */}
                  <polyline
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    points={restingHrPointsSvg}
                  />

                  {/* Active HR Polyline */}
                  <polyline
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                    points={hrPointsSvg}
                  />

                  {/* Data Points */}
                  {chartPoints.map((p, idx) => {
                    const x = (idx / (chartPoints.length - 1)) * chartWidth;
                    const y = chartHeight - ((p.heartRate - minHr) / (maxHr - minHr)) * chartHeight;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="3"
                        className="fill-cyan-400 stroke-[#090f21] stroke-2 hover:r-5 transition-all cursor-pointer"
                      >
                        <title>{`${p.date}: ${p.heartRate} bpm`}</title>
                      </circle>
                    );
                  })}
                </svg>
              </div>

              {/* X-axis labels */}
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
                {chartPoints.map((p) => (
                  <span key={p.date}>{p.date}</span>
                ))}
              </div>
            </div>

            {/* Metric Tiles */}
            <div className="md:col-span-4 space-y-2.5">
              <div className="p-2.5 rounded-lg bg-[#0e1939] border border-[#192b5b]">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Current Heart Rate</span>
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  72 <span className="text-xs font-normal text-slate-400">bpm</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0e1939] border border-[#192b5b]">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Resting HR Baseline</span>
                  <Heart className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  58 <span className="text-xs font-normal text-slate-400">bpm</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0e1939] border border-[#192b5b]">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>HR Variability</span>
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  42 <span className="text-xs font-normal text-slate-400">ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Health Analyses (3 cols) */}
        <div className="lg:col-span-3 bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#16234b]">
              <h3 className="text-sm font-bold text-white">Recent Health Analyses</h3>
              <button
                onClick={() => onNavigate('history')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-3.5 space-y-3">
              {/* ECG Analysis item */}
              <div 
                onClick={() => onNavigate('cardiovascular')}
                className="p-3 rounded-lg bg-[#0e1837] border border-[#1a2b5b] hover:border-cyan-500/40 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-slate-200">ECG Rhythm Scan</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                    Normal
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-500 mt-1">Apr 28, 2025 · 13:42</p>
                <p className="text-xs text-slate-300 mt-1">Lead II sinus rhythm nominal; no significant arrhythmia.</p>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#17254d] text-[10px] font-mono text-slate-400">
                  <span>Confidence: 94%</span>
                  <span className="text-amber-300 italic">(Simulated Demo)</span>
                </div>
              </div>

              {/* Ultrasound Analysis item */}
              <div 
                onClick={() => onNavigate('ijv')}
                className="p-3 rounded-lg bg-[#0e1837] border border-cyan-700/50 hover:border-cyan-400 transition-colors cursor-pointer group shadow-sm shadow-cyan-950/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ScanLine className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span className="text-xs font-semibold text-cyan-200">IJV Ultrasound Scan</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                    Patent Lumen
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-500 mt-1">Apr 28, 2025 · 11:17</p>
                <p className="text-xs text-slate-300 mt-1">Lumen segmented (190.8 mm²). Consistent with fluid shift.</p>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#17254d] text-[10px] font-mono text-slate-400">
                  <span>SegThy UNet</span>
                  <span className="text-cyan-400">Review Output &rarr;</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#16234b]">
            <button
              onClick={() => onNavigate('ijv')}
              className="w-full py-2 rounded-lg bg-[#14234e] hover:bg-[#1a2d64] text-cyan-300 text-xs font-medium border border-cyan-600/30 transition-colors flex items-center justify-center gap-2"
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>Perform New IJV Ultrasound Scan</span>
            </button>
          </div>
        </div>

        {/* Pending Health Checks & Mission Schedule (3 cols) */}
        <div className="lg:col-span-3 bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#16234b]">
              <h3 className="text-sm font-bold text-white">Pending Health Checks</h3>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
                Protocol Schedule
              </span>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              {[
                { title: 'Weekly IJV Ultrasound Scan', status: 'Due in 2 days (FD 14)', icon: ScanLine, tab: 'ijv' as NavigationTab, urgent: true },
                { title: 'Cardiovascular Rhythm Assessment', status: 'Daily telemetry nominal', icon: Heart, tab: 'cardiovascular' as NavigationTab, urgent: false },
                { title: 'Cognitive Battery Assessment', status: 'Scheduled FD 14 · Battery ready', icon: Brain, tab: 'cognitive' as NavigationTab, urgent: false },
                { title: 'Ground Medical Sync Pass', status: 'Scheduled 20:30 UTC', icon: Clock, tab: 'reports' as NavigationTab, urgent: false },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    onClick={() => onNavigate(item.tab)}
                    className="p-2 rounded-lg bg-[#0d1633] border border-[#18264d] flex items-center justify-between hover:border-slate-500 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-[#132047] flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-200 text-xs truncate group-hover:text-cyan-300 transition-colors">
                          {item.title}
                        </p>
                        <p className={`text-[10px] font-mono ${item.urgent ? 'text-amber-300 font-semibold' : 'text-slate-400'}`}>
                          {item.status}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#16234b] text-[10px] font-mono text-slate-400 text-center">
            Artemis Flight Medical Schedule Active
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Health Changes, Personal Baseline Comparison, Mission Health Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Recent Health Changes (5 cols) */}
        <div className="lg:col-span-5 bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#16234b]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Recent Health Changes</h3>
              </div>
              <button
                onClick={() => onNavigate('reports')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#17254d] text-slate-400 font-mono text-[11px]">
                    <th className="pb-2 font-medium">Date & Time</th>
                    <th className="pb-2 font-medium">Indicator</th>
                    <th className="pb-2 font-medium">Observed Status</th>
                    <th className="pb-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#142146]">
                  {findings.map((item) => (
                    <tr key={item.id} className="hover:bg-[#0f1b3b] transition-colors">
                      <td className="py-2.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {item.dateTime}
                      </td>
                      <td className="py-2.5 text-slate-300 font-medium">
                        {item.type}
                      </td>
                      <td className="py-2.5 text-slate-200">
                        {item.finding}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            item.status === 'Normal'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                              : item.status === 'Watch'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                              : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#16234b] text-[10px] text-slate-400 font-mono">
            Recorded via mission medical telemetry bus · Ground sync current
          </div>
        </div>

        {/* Personal Baseline Comparison (4 cols) */}
        <div className="lg:col-span-4 bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#16234b]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Personal Baseline Comparison</h3>
              </div>
              <button
                onClick={() => onNavigate('trends')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>Full Trends</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-12 gap-3 items-center">
              {/* Silhouette Illustration */}
              <div className="col-span-4 flex items-center justify-center p-2 rounded-lg bg-[#080e22] border border-[#17254d]">
                <svg viewBox="0 0 100 220" className="w-16 h-36 stroke-cyan-400/70 fill-cyan-950/30">
                  {/* Head */}
                  <circle cx="50" cy="22" r="14" strokeWidth="1.5" />
                  {/* Neck / IJV hotspot */}
                  <line x1="50" y1="36" x2="50" y2="44" strokeWidth="2" />
                  <circle cx="54" cy="40" r="3.5" className="fill-cyan-400 animate-ping" />
                  <circle cx="54" cy="40" r="3" className="fill-cyan-400" />
                  {/* Torso */}
                  <path d="M30 52 L70 52 L64 120 L36 120 Z" strokeWidth="1.5" />
                  {/* Heart hotspot */}
                  <circle cx="55" cy="70" r="2.5" className="fill-rose-400" />
                  {/* Arms */}
                  <path d="M30 52 L16 110 M70 52 L84 110" strokeWidth="1.5" />
                  {/* Legs */}
                  <path d="M38 120 L32 205 M62 120 L68 205" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Baseline Metrics list */}
              <div className="col-span-8 space-y-2 text-xs">
                <div className="flex items-center justify-between p-1.5 rounded bg-[#0e1939] border border-[#192b5b]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Heart className="w-3 h-3 text-rose-400" />
                    <span>Heart Rate</span>
                  </div>
                  <span className="font-mono text-amber-300 font-semibold">+12% <span className="text-[10px] text-slate-400">(vs 1G: 58)</span></span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-[#0e1939] border border-[#192b5b]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    <span>HR Variability</span>
                  </div>
                  <span className="font-mono text-cyan-300 font-semibold">-8% <span className="text-[10px] text-slate-400">(vs 1G: 46)</span></span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-[#0e1939] border border-[#192b5b]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <ScanLine className="w-3 h-3 text-cyan-400" />
                    <span>IJV Cross-Section</span>
                  </div>
                  <span className="font-mono text-amber-300 font-semibold">+26% <span className="text-[10px] text-slate-400">(190.8 mm²)</span></span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-[#0e1939] border border-[#192b5b]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>ECG Findings</span>
                  </div>
                  <span className="font-mono text-emerald-400">Nominal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Banner */}
          <div className="mt-3 p-2 rounded bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-200 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Observed adjustments are consistent with expected cephalad fluid redistribution.</span>
          </div>
        </div>

        {/* Mission Health Summary & Recommended Next Steps (3 cols) */}
        <div className="lg:col-span-3 bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#16234b]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Recommended Next Steps</h3>
              </div>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 p-1.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Nominal Adaptation · Low Risk</span>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold">1.</span>
                  <span>Maintain scheduled 2-hour daily resistive exercise countermeasure.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold">2.</span>
                  <span>Complete weekly cervical ultrasound scan window on Flight Day 14.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold">3.</span>
                  <span>Notify Ground Medical Team if acute vision changes or cephalic fullness occur.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#16234b]">
            <button
              onClick={() => onNavigate('reports')}
              className="w-full py-2 rounded-lg bg-[#14234e] hover:bg-[#1a2d64] text-white text-xs font-medium border border-[#21356e] transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Prepare Ground Medical Summary</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
