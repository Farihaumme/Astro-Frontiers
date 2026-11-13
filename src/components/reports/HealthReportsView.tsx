import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Printer,
  Heart,
  Brain,
  AlertTriangle,
  CheckCircle2,
  ScanLine,
  Activity,
  Loader2,
  RefreshCw,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { AstronautProfile, SystemStatusData, RecentFinding } from '../../types';

interface HealthReportsViewProps {
  astronaut: AstronautProfile;
  findings: RecentFinding[];
  systemStatus: SystemStatusData;
}

type EcgResult = {
  overall_level: 'normal' | 'caution' | 'warning' | 'critical';
  heart_rate_bpm: number | null;
  rr_irregularity: number | null;
  warnings: { level: string; title: string; detail: string }[];
  predictions: { label: string; probability: number }[];
  digitization: { layout: string; trace_coverage: number; leads_recorded: string[]; notes: string[] };
  segments_analysed: number;
  model_version: string;
};

type HealthData = {
  cv: { heart_rate: number | null; systolic_bp: number | null; diastolic_bp: number | null; spo2: number | null; hrv: number | null; recorded_at: string } | null;
  baseline: { resting_heart_rate: number | null; systolic_bp: number | null; diastolic_bp: number | null; spo2: number | null; hrv: number | null } | null;
  ecg: { id: string; created_at: string; status: string; primary_metric: string; metadata: { result?: EcgResult } } | null;
  ijv: { id: string; created_at: string; primary_metric: string; notes: string; status: string } | null;
  cognitive: { dsst_score: number; nback_accuracy: number; pvt_reaction_time: number; fatigue_score: number; sleep_hours: number; recorded_at: string } | null;
};

const LEVEL_BADGE = {
  normal: 'bg-emerald-950/60 text-emerald-300 border-emerald-700',
  caution: 'bg-yellow-950/60 text-yellow-300 border-yellow-700',
  warning: 'bg-amber-950/60 text-amber-300 border-amber-700',
  critical: 'bg-rose-950/60 text-rose-300 border-rose-700',
};

function pct(val: number | null, base: number | null) {
  if (!val || !base || base === 0) return null;
  return ((val - base) / base) * 100;
}

function DeltaBadge({ value, lowerIsBetter = false }: { value: number | null; lowerIsBetter?: boolean }) {
  if (value === null) return <span className="text-[10px] text-slate-500">No baseline</span>;
  const abs = Math.abs(value);
  const favorable = value === 0 ? null : lowerIsBetter ? value < 0 : value > 0;
  const color = favorable === null ? 'text-slate-400' : favorable ? 'text-emerald-400' : 'text-amber-400';
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-mono ${color}`}>
      <Icon className="w-3 h-3" />
      {abs < 0.05 ? 'At baseline' : `${value > 0 ? '+' : ''}${value.toFixed(1)}% vs baseline`}
    </span>
  );
}

export const HealthReportsView: React.FC<HealthReportsViewProps> = ({ astronaut }) => {
  const [data, setData] = useState<HealthData>({ cv: null, baseline: null, ecg: null, ijv: null, cognitive: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Sign in to view your health report.');

      const [cvRes, baseRes, ecgRes, ijvRes, cogRes] = await Promise.all([
        supabase.from('health_measurements').select('heart_rate,systolic_bp,diastolic_bp,spo2,hrv,recorded_at').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('astronaut_baselines').select('resting_heart_rate,systolic_bp,diastolic_bp,spo2,hrv').eq('user_id', user.id).eq('is_current', true).maybeSingle(),
        supabase.from('analysis_history').select('id,created_at,status,primary_metric,metadata').eq('user_id', user.id).eq('scan_type', 'ECG Analysis').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('analysis_history').select('id,created_at,primary_metric,notes,status').eq('user_id', user.id).eq('scan_type', 'IJV Ultrasound').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('cognitive_measurements').select('dsst_score,nback_accuracy,pvt_reaction_time,fatigue_score,sleep_hours,recorded_at').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      setData({
        cv: cvRes.data as any,
        baseline: baseRes.data as any,
        ecg: ecgRes.data as any,
        ijv: ijvRes.data as any,
        cognitive: cogRes.data as any,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load health data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const ecgResult: EcgResult | undefined = (data.ecg?.metadata as any)?.result;
  const hasEcgAlert = ecgResult && (ecgResult.overall_level === 'warning' || ecgResult.overall_level === 'critical');

  const reportId = `AK-${astronaut.id}-FD${astronaut.daysInMission}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
  const generatedAt = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' });

  const hrDelta = pct(data.cv?.heart_rate ?? null, data.baseline?.resting_heart_rate ?? null);
  const sbpDelta = pct(data.cv?.systolic_bp ?? null, data.baseline?.systolic_bp ?? null);
  const spo2Delta = pct(data.cv?.spo2 ?? null, data.baseline?.spo2 ?? null);
  const hrvDelta = pct(data.cv?.hrv ?? null, data.baseline?.hrv ?? null);

  const overallRisk = hasEcgAlert ? 'ELEVATED RISK' : (ecgResult?.overall_level === 'caution' ? 'MONITOR' : 'LOW RISK');
  const riskColor = hasEcgAlert ? 'text-rose-300' : (ecgResult?.overall_level === 'caution' ? 'text-amber-300' : 'text-emerald-300');
  const riskIcon = hasEcgAlert ? AlertTriangle : (ecgResult?.overall_level === 'caution' ? AlertCircle : CheckCircle2);
  const RiskIcon = riskIcon;

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto print:p-0 print:bg-white print:text-black">

      {/* ECG Alert Banner */}
      {hasEcgAlert && (
        <div className={`p-4 rounded-xl border flex items-start gap-3.5 shadow-sm ${ecgResult!.overall_level === 'critical' ? 'bg-rose-950/40 border-rose-700/60' : 'bg-amber-950/40 border-amber-700/60'} print:hidden`}>
          <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${ecgResult!.overall_level === 'critical' ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
          <div>
            <p className={`text-sm font-bold ${ecgResult!.overall_level === 'critical' ? 'text-rose-300' : 'text-amber-300'}`}>
              ECG Alert: {ecgResult!.overall_level === 'critical' ? '🚨 CRITICAL — Immediate Medical Review Required' : '⚠ WARNING — Medical Review Recommended'}
            </p>
            <p className="text-xs text-slate-300 mt-0.5">
              {ecgResult!.warnings.length} alert(s) flagged in latest ECG analysis. See Section 2 below for details.
            </p>
          </div>
        </div>
      )}

      {/* Header & Print Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#152347] print:hidden">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Health Reports & Ground Medical Summary</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compile available physiological data, ECG analysis, and IJV results for Ground Medical Team review.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} disabled={loading}
            className="px-4 py-2 rounded-lg bg-[#14234e] hover:bg-[#1b2f69] text-slate-300 border border-slate-700/50 text-xs font-medium transition-colors flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-[#14234e] hover:bg-[#1b2f69] text-cyan-300 border border-cyan-700/50 text-xs font-medium transition-colors flex items-center gap-2">
            <Printer className="w-4 h-4" />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading health report data…</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-300">Could not load health report</p>
            <p className="text-xs text-slate-400 mt-0.5">{error}</p>
            <button onClick={loadData} className="mt-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline">Try again</button>
          </div>
        </div>
      )}

      {!loading && !error && (
        /* Formal Medical Summary Document */
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-8 shadow-md space-y-8 print:bg-white print:text-black print:border-none">

          {/* Document Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-[#182855] pb-6 print:border-gray-300 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <span className="font-bold text-lg text-white print:text-black">Aither Kairos</span>
                  <span className="ml-2 text-xs font-mono bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800 print:border-gray-400 print:text-black print:bg-gray-100">
                    NASA Space Apps 2026
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 print:text-gray-600 mt-2">
                Astronaut Health Monitoring System — Mission Telemetry Summary for Ground Medical Team
              </p>
            </div>
            <div className="text-right text-xs font-mono text-slate-400 print:text-gray-600 space-y-0.5">
              <p>Report ID: {reportId}</p>
              <p>Generated: {generatedAt}</p>
              <p className="text-cyan-400 print:text-black font-semibold">Recipient: Dr. Sarah Chen, Flight Surgeon</p>
            </div>
          </div>

          {/* Astronaut Info Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-[#0e1837] border border-[#1a2c5b] print:bg-gray-50 print:border-gray-300 text-xs">
            <div>
              <span className="text-slate-400 print:text-gray-500 block mb-1">Astronaut</span>
              <span className="font-bold text-white print:text-black">{astronaut.name}</span>
              <span className="text-slate-400 ml-1">({astronaut.id})</span>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-500 block mb-1">Mission & Phase</span>
              <span className="font-semibold text-slate-200 print:text-black">{astronaut.mission} · {astronaut.missionPhase}</span>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-500 block mb-1">Flight Duration</span>
              <span className="font-mono text-cyan-300 print:text-black">Day {astronaut.daysInMission} / {astronaut.totalMissionDays}</span>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-500 block mb-1">Mission Status</span>
              <span className="font-medium text-slate-200 print:text-black">{astronaut.status} · {astronaut.role}</span>
            </div>
          </div>

          {/* Overall Risk Assessment Banner */}
          <div className={`p-5 rounded-xl border flex items-center gap-4 ${hasEcgAlert ? 'bg-rose-950/30 border-rose-800/50' : ecgResult?.overall_level === 'caution' ? 'bg-amber-950/30 border-amber-800/50' : 'bg-emerald-950/30 border-emerald-800/50'}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${hasEcgAlert ? 'bg-rose-400/15' : ecgResult?.overall_level === 'caution' ? 'bg-amber-400/15' : 'bg-emerald-400/15'}`}>
              <RiskIcon className={`w-6 h-6 ${riskColor}`} />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Mission Health Risk Assessment</p>
              <p className={`text-xl font-bold ${riskColor}`}>{overallRisk}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {hasEcgAlert
                  ? `ECG analysis flagged ${ecgResult!.warnings.length} clinical alert(s) requiring flight surgeon review.`
                  : ecgResult
                  ? 'Latest ECG within normal or monitored parameters.'
                  : 'No ECG analysis on record. Upload ECG for assessment.'}
              </p>
            </div>
          </div>

          {/* Section 1: IJV Ultrasound */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white print:text-black flex items-center gap-2 border-b border-[#182855] pb-2 print:border-gray-300">
              <ScanLine className="w-4 h-4 text-cyan-400 print:text-black" />
              <span>1. Internal Jugular Vein (IJV) Ultrasound Analysis</span>
            </h3>
            {data.ijv ? (
              <div className="p-4 rounded-xl bg-[#0e1837] border border-[#1a2c5b] print:bg-gray-50 print:border-gray-300 text-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-slate-400 print:text-gray-500 block mb-1">Primary Metric</span>
                    <span className="font-mono text-cyan-300 print:text-black font-bold text-sm">{data.ijv.primary_metric}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 print:text-gray-500 block mb-1">Status</span>
                    <span className={`font-bold text-sm ${data.ijv.status === 'Normal' ? 'text-emerald-400' : 'text-amber-400'}`}>{data.ijv.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 print:text-gray-500 block mb-1">Recorded</span>
                    <span className="font-mono text-slate-300 print:text-black">{new Date(data.ijv.created_at).toLocaleString()}</span>
                  </div>
                </div>
                {data.ijv.notes && (
                  <div className="pt-2 border-t border-[#1a2c5b] print:border-gray-300">
                    <p className="font-semibold text-slate-200 print:text-black mb-1">Clinical Summary:</p>
                    <p className="text-slate-300 print:text-gray-700 leading-relaxed">{data.ijv.notes}</p>
                  </div>
                )}
                <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800/60 print:bg-gray-100 print:border-gray-300 text-[11px] text-amber-200 print:text-gray-800">
                  <strong>Notice:</strong> Abnormality classification requires manual Doppler evaluation by the Flight Surgeon.
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#0e1837] border border-dashed border-[#1a2c5b] text-xs text-slate-400">
                No IJV ultrasound results on record. Use the IJV Analysis module to upload and analyze an ultrasound image.
              </div>
            )}
          </div>

          {/* Section 2: ECG Analysis */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white print:text-black flex items-center gap-2 border-b border-[#182855] pb-2 print:border-gray-300">
              <Zap className="w-4 h-4 text-cyan-400 print:text-black" />
              <span>2. ECG Analysis — Foundation Model Report</span>
              {ecgResult && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${LEVEL_BADGE[ecgResult.overall_level]}`}>
                  {ecgResult.overall_level.toUpperCase()}
                </span>
              )}
            </h3>
            {data.ecg && ecgResult ? (
              <div className="space-y-3 text-xs">
                {/* ECG Key Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#0e1837] border border-[#1a2c5b] print:bg-gray-50 print:border-gray-300">
                    <span className="text-slate-400 print:text-gray-500">Heart Rate</span>
                    <p className="text-lg font-mono font-bold text-white print:text-black mt-0.5">{ecgResult.heart_rate_bpm ?? '—'}<span className="text-xs font-normal text-slate-400 ml-1">bpm</span></p>
                    <span className="text-[10px] text-slate-500">ECG-derived</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0e1837] border border-[#1a2c5b] print:bg-gray-50 print:border-gray-300">
                    <span className="text-slate-400 print:text-gray-500">RR Irregularity</span>
                    <p className="text-lg font-mono font-bold text-white print:text-black mt-0.5">
                      {ecgResult.rr_irregularity !== null ? `${(ecgResult.rr_irregularity * 100).toFixed(1)}%` : '—'}
                    </p>
                    <span className={`text-[10px] ${ecgResult.rr_irregularity !== null && ecgResult.rr_irregularity < 0.1 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {ecgResult.rr_irregularity !== null ? (ecgResult.rr_irregularity < 0.1 ? 'Regular' : 'Irregular') : ''}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0e1837] border border-[#1a2c5b] print:bg-gray-50 print:border-gray-300">
                    <span className="text-slate-400 print:text-gray-500">Signal Quality</span>
                    <p className="text-lg font-mono font-bold text-white print:text-black mt-0.5">{Math.round(ecgResult.digitization.trace_coverage * 100)}%</p>
                    <span className="text-[10px] text-slate-500">Trace coverage</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0e1837] border border-[#1a2c5b] print:bg-gray-50 print:border-gray-300">
                    <span className="text-slate-400 print:text-gray-500">Leads Captured</span>
                    <p className="text-lg font-mono font-bold text-white print:text-black mt-0.5">{ecgResult.digitization.leads_recorded.length}</p>
                    <span className="text-[10px] text-slate-500">{ecgResult.digitization.leads_recorded.slice(0, 4).join(', ')}{ecgResult.digitization.leads_recorded.length > 4 ? '…' : ''}</span>
                  </div>
                </div>

                {/* Top ECG Predictions */}
                <div className="p-4 rounded-xl bg-[#0e1837] border border-[#1a2c5b] print:bg-gray-50 print:border-gray-300">
                  <p className="font-semibold text-slate-200 print:text-black mb-3">AI Pattern Recognition (Top Findings):</p>
                  <div className="space-y-2.5">
                    {ecgResult.predictions.slice(0, 5).map((p, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <span className={`text-xs ${i === 0 ? 'text-white font-semibold' : 'text-slate-300'}`}>{p.label}</span>
                          <span className="text-xs font-mono text-cyan-300">{(p.probability * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#172442] overflow-hidden print:bg-gray-200">
                          <div
                            className={`h-full rounded-full ${i === 0 ? 'bg-cyan-400' : 'bg-cyan-800'} print:bg-blue-400`}
                            style={{ width: `${Math.max(0, Math.min(100, p.probability * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ECG Alerts/Warnings */}
                {ecgResult.warnings.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 print:bg-gray-50 print:border-gray-300">
                    <p className="font-semibold text-amber-300 print:text-black mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Clinical Alerts ({ecgResult.warnings.length}):
                    </p>
                    <div className="space-y-2">
                      {ecgResult.warnings.map((w, i) => (
                        <div key={i} className="flex gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${LEVEL_BADGE[w.level as keyof typeof LEVEL_BADGE] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                            {w.level.toUpperCase()}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-white print:text-black">{w.title}</p>
                            <p className="text-xs text-slate-400 print:text-gray-600">{w.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-slate-500 font-mono">
                  Analyzed: {new Date(data.ecg.created_at).toLocaleString()} · Model: {ecgResult.model_version} · {ecgResult.segments_analysed} segments
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#0e1837] border border-dashed border-[#1a2c5b] text-xs text-slate-400">
                No ECG analysis on record. Upload an ECG image in the Cardiovascular module to generate a report.
              </div>
            )}
          </div>

          {/* Section 3: Cardiovascular Vitals */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white print:text-black flex items-center gap-2 border-b border-[#182855] pb-2 print:border-gray-300">
              <Heart className="w-4 h-4 text-rose-400 print:text-black" />
              <span>3. Cardiovascular Telemetry Summary</span>
            </h3>
            {data.cv ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { label: 'Heart Rate', value: data.cv.heart_rate != null ? `${data.cv.heart_rate} bpm` : '—', delta: hrDelta, baseline: data.baseline?.resting_heart_rate != null ? `Baseline: ${data.baseline.resting_heart_rate} bpm` : null, lowerBetter: false },
                  { label: 'Blood Pressure', value: data.cv.systolic_bp != null && data.cv.diastolic_bp != null ? `${data.cv.systolic_bp}/${data.cv.diastolic_bp} mmHg` : '—', delta: sbpDelta, baseline: data.baseline?.systolic_bp != null ? `Sys baseline: ${data.baseline.systolic_bp}` : null, lowerBetter: false },
                  { label: 'SpO₂ Oxygen', value: data.cv.spo2 != null ? `${data.cv.spo2}%` : '—', delta: spo2Delta, baseline: null, lowerBetter: false },
                  { label: 'HRV (RMSSD)', value: data.cv.hrv != null ? `${data.cv.hrv} ms` : '—', delta: hrvDelta, baseline: data.baseline?.hrv != null ? `Baseline: ${data.baseline.hrv} ms` : null, lowerBetter: false },
                ].map((m, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#0e1837] border border-[#1a2c5b] print:bg-gray-50 print:border-gray-300">
                    <span className="text-slate-400 print:text-gray-500 block mb-1">{m.label}</span>
                    <p className="text-base font-mono font-bold text-white print:text-black">{m.value}</p>
                    <DeltaBadge value={m.delta} lowerIsBetter={m.lowerBetter} />
                    {m.baseline && <span className="text-[10px] text-slate-500 block mt-0.5">{m.baseline}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#0e1837] border border-dashed border-[#1a2c5b] text-xs text-slate-400">
                No cardiovascular measurements on record. Log measurements in the Cardiovascular module.
              </div>
            )}
            {data.cv?.recorded_at && (
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <Clock className="w-3 h-3" />
                <span>Last recorded: {new Date(data.cv.recorded_at).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Section 4: Cognitive Performance */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white print:text-black flex items-center gap-2 border-b border-[#182855] pb-2 print:border-gray-300">
              <Brain className="w-4 h-4 text-indigo-400 print:text-black" />
              <span>4. Neuro-Performance & Cognitive Assessment</span>
            </h3>
            {data.cognitive ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                {[
                  { label: 'DSST Score', value: data.cognitive.dsst_score, unit: 'symbols', color: 'text-sky-300' },
                  { label: '2-Back Accuracy', value: data.cognitive.nback_accuracy, unit: '%', color: 'text-violet-300' },
                  { label: 'PVT Reaction', value: data.cognitive.pvt_reaction_time, unit: 'ms', color: 'text-fuchsia-300' },
                  { label: 'Fatigue Index', value: data.cognitive.fatigue_score, unit: '/10', color: 'text-amber-300' },
                  { label: 'Sleep', value: data.cognitive.sleep_hours, unit: 'hrs', color: 'text-indigo-300' },
                ].map((m, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#0e1837] border border-[#1a2c5b] print:bg-gray-50 print:border-gray-300">
                    <span className="text-slate-400 print:text-gray-500 block mb-1">{m.label}</span>
                    <p className={`text-base font-mono font-bold ${m.color} print:text-black`}>{m.value}<span className="text-[10px] font-normal text-slate-400 ml-1">{m.unit}</span></p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#0e1837] border border-dashed border-[#1a2c5b] text-xs text-slate-400">
                No cognitive assessment on record. Complete the Cognitive Check-in module.
              </div>
            )}
          </div>

          {/* Section 5: Mission Risk Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white print:text-black flex items-center gap-2 border-b border-[#182855] pb-2 print:border-gray-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400 print:text-black" />
              <span>5. Flight Surgeon Recommendation Summary</span>
            </h3>
            <div className="p-5 rounded-xl bg-[#0e1837] border border-[#1a2c5b] print:bg-gray-50 print:border-gray-300 text-xs space-y-3">
              <div className={`flex items-center gap-2 font-bold text-sm ${riskColor}`}>
                <RiskIcon className="w-5 h-5" />
                <span>Overall Mission Health Risk: {overallRisk}</span>
              </div>
              <p className="text-slate-300 print:text-gray-700 leading-relaxed">
                {astronaut.name} ({astronaut.id}) is on Flight Day {astronaut.daysInMission} of the {astronaut.mission} {astronaut.missionPhase}.
                {data.cv ? ` Latest cardiovascular readings are ${hrDelta !== null && Math.abs(hrDelta) < 15 ? 'within normal adaptation range' : 'being monitored'}.` : ' No cardiovascular readings on record.'}
                {ecgResult ? ` ECG analysis returned ${ecgResult.overall_level} status with ${ecgResult.warnings.length} alert(s).` : ' No ECG analysis on record.'}
              </p>
              <div className="pt-2 text-slate-400 print:text-gray-500 font-mono text-[11px] border-t border-[#1a2c5b] print:border-gray-300">
                Recommendation: {hasEcgAlert
                  ? 'PRIORITY — Review ECG alerts and schedule urgent medical communication pass.'
                  : `Continue standard monitoring protocol. Next IJV ultrasound scheduled for Flight Day ${astronaut.daysInMission + 2}.`}
              </div>
            </div>
          </div>

          {/* Document Footer */}
          <div className="border-t border-[#182855] print:border-gray-300 pt-4 text-[10px] text-slate-500 print:text-gray-500 font-mono space-y-0.5">
            <p>Aither Kairos · NASA Space Apps Challenge 2026 · Astronaut Health Monitoring Interface</p>
            <p>This report is generated from mission telemetry. All clinical decisions require qualified flight surgeon oversight.</p>
          </div>
        </div>
      )}
    </div>
  );
};
