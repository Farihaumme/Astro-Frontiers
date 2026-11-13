import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  Heart,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Calendar,
  TrendingUp,
  ScanLine,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Zap,
  Eye,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '../../services/supabase';
import { AstronautProfile } from '../../types';

interface HealthTrendsViewProps {
  astronaut: AstronautProfile;
}

type CvRow = {
  id: string;
  heart_rate: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  spo2: number | null;
  hrv: number | null;
  recorded_at: string;
};

type CvBaseline = {
  resting_heart_rate: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  spo2: number | null;
  hrv: number | null;
};

type EcgAlert = {
  overall_level: 'normal' | 'caution' | 'warning' | 'critical';
  heart_rate_bpm: number | null;
  rr_irregularity: number | null;
  warnings: { level: string; title: string; detail: string }[];
  predictions: { label: string; probability: number }[];
  created_at: string;
};

type ChartMetric = 'heart_rate' | 'spo2' | 'hrv' | 'blood_pressure';

const LEVEL_STYLES = {
  normal: { border: 'border-emerald-800/50', bg: 'bg-emerald-950/30', text: 'text-emerald-300', badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-700' },
  caution: { border: 'border-yellow-800/50', bg: 'bg-yellow-950/30', text: 'text-yellow-300', badge: 'bg-yellow-950/60 text-yellow-300 border-yellow-700' },
  warning: { border: 'border-amber-800/50', bg: 'bg-amber-950/30', text: 'text-amber-300', badge: 'bg-amber-950/60 text-amber-300 border-amber-700' },
  critical: { border: 'border-rose-800/50', bg: 'bg-rose-950/30', text: 'text-rose-300', badge: 'bg-rose-950/60 text-rose-300 border-rose-700' },
};

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pctDelta(val: number | null, base: number | null) {
  if (!val || !base || base === 0) return null;
  return ((val - base) / base) * 100;
}

export const HealthTrendsView: React.FC<HealthTrendsViewProps> = ({ astronaut }) => {
  const [ecgPhase, setEcgPhase] = useState(0);
  const [cvHistory, setCvHistory] = useState<CvRow[]>([]);
  const [cvBaseline, setCvBaseline] = useState<CvBaseline | null>(null);
  const [ecgAlert, setEcgAlert] = useState<EcgAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('heart_rate');
  const [showAllPredictions, setShowAllPredictions] = useState(false);

  // ECG waveform animation
  useEffect(() => {
    const timer = setInterval(() => { setEcgPhase((p) => (p + 1) % 100); }, 50);
    return () => clearInterval(timer);
  }, []);

  const generateEcgPath = () => {
    const points: string[] = [];
    const width = 600;
    const height = 100;
    const mid = height / 2;
    for (let x = 0; x < width; x += 4) {
      const cyclePos = (x + ecgPhase * 6) % 150;
      let y = mid;
      if (cyclePos > 20 && cyclePos < 35) {
        y = mid - 8 * Math.sin(((cyclePos - 20) / 15) * Math.PI);
      } else if (cyclePos >= 45 && cyclePos < 50) {
        y = mid + 6;
      } else if (cyclePos >= 50 && cyclePos < 60) {
        y = mid - 42 * Math.sin(((cyclePos - 50) / 10) * Math.PI);
      } else if (cyclePos >= 60 && cyclePos < 65) {
        y = mid + 12;
      } else if (cyclePos > 75 && cyclePos < 105) {
        y = mid - 12 * Math.sin(((cyclePos - 75) / 30) * Math.PI);
      }
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      if (!user) throw new Error('Sign in to view health trends.');

      const [cvRes, baseRes, ecgRes] = await Promise.all([
        supabase.from('health_measurements').select('id,heart_rate,systolic_bp,diastolic_bp,spo2,hrv,recorded_at').eq('user_id', user.id).order('recorded_at', { ascending: true }).limit(30),
        supabase.from('astronaut_baselines').select('resting_heart_rate,systolic_bp,diastolic_bp,spo2,hrv').eq('user_id', user.id).eq('is_current', true).maybeSingle(),
        supabase.from('analysis_history').select('created_at,metadata,status').eq('user_id', user.id).eq('scan_type', 'ECG Analysis').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      if (cvRes.error) throw cvRes.error;
      if (baseRes.error) throw baseRes.error;
      if (ecgRes.error) throw ecgRes.error;

      setCvHistory((cvRes.data ?? []) as CvRow[]);
      setCvBaseline(baseRes.data as CvBaseline | null);

      if (ecgRes.data) {
        const result = (ecgRes.data.metadata as any)?.result;
        if (result) {
          setEcgAlert({
            overall_level: result.overall_level,
            heart_rate_bpm: result.heart_rate_bpm,
            rr_irregularity: result.rr_irregularity,
            warnings: result.warnings || [],
            predictions: result.predictions || [],
            created_at: ecgRes.data.created_at,
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load health trends.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const latestCv = cvHistory.length ? cvHistory[cvHistory.length - 1] : null;

  const chartRows = useMemo(() => cvHistory.map(row => ({
    ...row,
    timeLabel: new Date(row.recorded_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
  })), [cvHistory]);

  const chartMetricOptions: { key: ChartMetric; label: string }[] = [
    { key: 'heart_rate', label: 'Heart Rate' },
    { key: 'blood_pressure', label: 'Blood Pressure' },
    { key: 'spo2', label: 'SpO₂' },
    { key: 'hrv', label: 'HRV' },
  ];

  const metricConfig = {
    heart_rate: { key: 'heart_rate' as const, title: 'Heart rate', unit: 'bpm', baseline: num(cvBaseline?.resting_heart_rate), color: '#f87171' },
    spo2: { key: 'spo2' as const, title: 'Blood oxygen', unit: '%', baseline: num(cvBaseline?.spo2), color: '#34d399' },
    hrv: { key: 'hrv' as const, title: 'HRV (RMSSD)', unit: 'ms', baseline: num(cvBaseline?.hrv), color: '#a78bfa' },
  };

  const activeCvMetric = selectedMetric !== 'blood_pressure' ? metricConfig[selectedMetric as keyof typeof metricConfig] : null;

  const hrDelta = pctDelta(num(latestCv?.heart_rate), num(cvBaseline?.resting_heart_rate));
  const spo2Delta = pctDelta(num(latestCv?.spo2), num(cvBaseline?.spo2));
  const hrvDelta = pctDelta(num(latestCv?.hrv), num(cvBaseline?.hrv));
  const sbpDelta = pctDelta(num(latestCv?.systolic_bp), num(cvBaseline?.systolic_bp));

  const ecgLevelStyle = ecgAlert ? LEVEL_STYLES[ecgAlert.overall_level] : null;
  const hasEcgAlert = ecgAlert && (ecgAlert.overall_level === 'warning' || ecgAlert.overall_level === 'critical');

  const predictionsToShow = showAllPredictions ? ecgAlert?.predictions : ecgAlert?.predictions.slice(0, 5);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#152347]">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">Health Trends & Personal Baseline</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Longitudinal comparison of current mission indicators against pre-flight 1G baseline measurements.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">{astronaut.name} ({astronaut.id}) · Flight Day {astronaut.daysInMission}</span>
          <button onClick={loadData} disabled={loading}
            className="p-2 rounded-lg bg-[#14234e] hover:bg-[#1b2f69] text-slate-300 border border-slate-700/50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading health trends…</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-300">Could not load health trends</p>
            <p className="text-xs text-slate-400 mt-0.5">{error}</p>
            <button onClick={loadData} className="mt-2 text-xs font-semibold text-cyan-400 underline">Try again</button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ECG Alert Section */}
          {ecgAlert && (
            <div className={`rounded-xl border p-5 ${ecgLevelStyle!.border} ${ecgLevelStyle!.bg}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  {hasEcgAlert ? (
                    <AlertTriangle className={`w-5 h-5 ${ecgLevelStyle!.text} ${ecgAlert.overall_level === 'critical' ? 'animate-pulse' : ''}`} />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )}
                  <div>
                    <h3 className={`text-sm font-bold ${ecgLevelStyle!.text}`}>
                      ECG Analysis — Latest Result
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Analyzed: {new Date(ecgAlert.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${ecgLevelStyle!.badge}`}>
                    {ecgAlert.overall_level.toUpperCase()}
                  </span>
                  {ecgAlert.heart_rate_bpm !== null && (
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500">ECG Heart Rate</p>
                      <p className="text-lg font-bold font-mono text-white">{ecgAlert.heart_rate_bpm} <span className="text-xs font-normal text-slate-400">bpm</span></p>
                    </div>
                  )}
                </div>
              </div>

              {/* ECG Warnings */}
              {ecgAlert.warnings.length > 0 ? (
                <div className="space-y-2.5 mb-4">
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Clinical Alerts:</p>
                  {ecgAlert.warnings.map((w, i) => (
                    <div key={i} className="flex gap-2.5 p-3 rounded-lg bg-black/20 border border-white/[0.06]">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${w.level === 'critical' ? 'bg-rose-900/60 text-rose-300 border border-rose-700' : w.level === 'warning' ? 'bg-amber-900/60 text-amber-300 border border-amber-700' : 'bg-yellow-900/60 text-yellow-300 border border-yellow-700'}`}>
                        {w.level.toUpperCase()}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-white">{w.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{w.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-4 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No clinical warnings generated in this analysis.</span>
                </div>
              )}

              {/* Top ECG Predictions */}
              {ecgAlert.predictions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">AI Pattern Recognition:</p>
                  <div className="space-y-2">
                    {predictionsToShow?.map((p, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <span className={`text-xs ${i === 0 ? 'text-white font-semibold' : 'text-slate-400'}`}>{p.label}</span>
                          <span className="text-xs font-mono text-cyan-300">{(p.probability * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-black/30 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${i === 0 ? 'bg-cyan-400' : 'bg-cyan-800'} transition-all duration-700`}
                            style={{ width: `${Math.max(0, Math.min(100, p.probability * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {ecgAlert.predictions.length > 5 && (
                    <button onClick={() => setShowAllPredictions(!showAllPredictions)}
                      className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {showAllPredictions ? 'Show top 5 only' : `Show all ${ecgAlert.predictions.length}`}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {!ecgAlert && (
            <div className="p-4 rounded-xl bg-slate-900/50 border border-dashed border-slate-700 flex items-center gap-3">
              <Zap className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-400">No ECG Analysis on Record</p>
                <p className="text-xs text-slate-500">Upload an ECG image in the Cardiovascular module to see AI analysis results here.</p>
              </div>
            </div>
          )}

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Resting Heart Rate', icon: Heart, iconColor: 'text-rose-400', iconBg: 'bg-rose-500/10',
                value: latestCv?.heart_rate != null ? `${latestCv.heart_rate}` : '—', unit: 'bpm',
                delta: hrDelta, baseline: cvBaseline?.resting_heart_rate != null ? `${cvBaseline.resting_heart_rate} bpm baseline` : null,
                lowerBetter: false, note: 'Resting rate — daily active HR may be higher',
              },
              {
                label: 'Blood Pressure', icon: Activity, iconColor: 'text-cyan-400', iconBg: 'bg-cyan-500/10',
                value: latestCv?.systolic_bp != null && latestCv?.diastolic_bp != null ? `${latestCv.systolic_bp}/${latestCv.diastolic_bp}` : '—', unit: 'mmHg',
                delta: sbpDelta, baseline: cvBaseline?.systolic_bp != null ? `Sys baseline ${cvBaseline.systolic_bp}` : null,
                lowerBetter: false, note: 'Systolic / diastolic arterial pressure',
              },
              {
                label: 'Blood Oxygen (SpO₂)', icon: Activity, iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/10',
                value: latestCv?.spo2 != null ? `${latestCv.spo2}` : '—', unit: '%',
                delta: spo2Delta, baseline: null, lowerBetter: false, note: 'Peripheral oxygen saturation',
              },
              {
                label: 'HRV (RMSSD)', icon: Activity, iconColor: 'text-violet-400', iconBg: 'bg-violet-500/10',
                value: latestCv?.hrv != null ? `${latestCv.hrv}` : '—', unit: 'ms',
                delta: hrvDelta, baseline: cvBaseline?.hrv != null ? `${cvBaseline.hrv} ms baseline` : null,
                lowerBetter: false, note: 'Autonomic nervous system balance',
              },
            ].map((m, i) => {
              const delta = m.delta;
              const favorable = delta === null || delta === 0 ? null : m.lowerBetter ? delta < 0 : delta > 0;
              const deltaColor = favorable === null ? 'text-slate-400' : favorable ? 'text-emerald-400' : 'text-amber-400';
              const DeltaIcon = delta !== null ? (delta > 0 ? ArrowUpRight : ArrowDownRight) : Activity;
              return (
                <div key={i} className="bg-[#0b1329] border border-[#17254d] rounded-xl p-4 shadow-sm relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
                  <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full ${m.iconBg} blur-2xl`} />
                  <div className="relative">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span>{m.label}</span>
                      <m.icon className={`w-4 h-4 ${m.iconColor}`} />
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">
                      {m.value} <span className="text-xs font-normal text-slate-400">{m.unit}</span>
                    </div>
                    {delta !== null ? (
                      <div className={`flex items-center gap-1 text-[11px] font-mono ${deltaColor} mt-1.5`}>
                        <DeltaIcon className="w-3.5 h-3.5" />
                        <span>{Math.abs(delta) < 0.05 ? 'At baseline' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}% vs baseline`}</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-1.5">{cvHistory.length === 0 ? 'No data yet' : 'No baseline set'}</p>
                    )}
                    {m.baseline && <p className="text-[10px] text-slate-500 mt-1">{m.baseline}</p>}
                    <p className="text-[10px] text-slate-600 mt-2">{m.note}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live ECG Waveform */}
          <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Lead II Rhythm Strip (50 mm/s, 10 mm/mV)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                <span>PR: 154 ms</span>
                <span>·</span>
                <span>QRS: 88 ms</span>
                <span>·</span>
                <span>QTc: 418 ms</span>
              </div>
            </div>
            <div className="h-24 bg-[#060a17] rounded-lg border border-[#152349] relative overflow-hidden">
              {/* ECG grid */}
              <svg viewBox="0 0 600 100" className="absolute inset-0 w-full h-full opacity-15">
                {[0,30,60,90,120,150,180,210,240,270,300,330,360,390,420,450,480,510,540,570,600].map(x => (
                  <line key={x} x1={x} y1={0} x2={x} y2={100} stroke="#22d3ee" strokeWidth="0.5" />
                ))}
                {[0,25,50,75,100].map(y => (
                  <line key={y} x1={0} y1={y} x2={600} y2={y} stroke="#22d3ee" strokeWidth="0.5" />
                ))}
              </svg>
              <svg viewBox="0 0 600 100" className="w-full h-full relative">
                <line x1="0" y1="50" x2="600" y2="50" stroke="#152347" strokeDasharray="2 2" />
                <polyline
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={generateEcgPath()}
                />
              </svg>
            </div>
          </div>

          {/* Trends Chart */}
          <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Signal History</p>
                <h3 className="mt-1 text-lg font-semibold text-white">Telemetry Over Time</h3>
                <p className="mt-0.5 text-xs text-slate-500">Recorded values with personal baseline reference.</p>
              </div>
              <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
                {chartMetricOptions.map(opt => (
                  <button key={opt.key} onClick={() => setSelectedMetric(opt.key)}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold transition ${selectedMetric === opt.key ? 'bg-cyan-300 text-[#071426]' : 'text-slate-400 hover:text-white'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[260px] w-full">
              {chartRows.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/70 bg-black/10">
                  <Activity className="h-7 w-7 text-slate-600" />
                  <p className="mt-3 text-sm text-slate-400">No measurement history yet</p>
                  <p className="mt-1 text-[11px] text-slate-600">Log cardiovascular measurements to build your trend.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartRows} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="#233653" strokeDasharray="3 5" vertical={false} />
                    <XAxis dataKey="timeLabel" tick={{ fill: '#71839d', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis tick={{ fill: '#71839d', fontSize: 10 }} tickLine={false} axisLine={false} width={45} />
                    <Tooltip contentStyle={{ background: '#08152b', border: '1px solid #294365', borderRadius: 12, color: '#f8fafc', fontSize: 12 }} labelStyle={{ color: '#91a6bf', marginBottom: 5 }} />
                    {selectedMetric === 'blood_pressure' ? (
                      <>
                        {num(cvBaseline?.systolic_bp) !== null && <ReferenceLine y={num(cvBaseline?.systolic_bp) as number} stroke="#f5b942" strokeDasharray="5 5" label={{ value: 'Sys baseline', fill: '#f5b942', fontSize: 10 }} />}
                        {num(cvBaseline?.diastolic_bp) !== null && <ReferenceLine y={num(cvBaseline?.diastolic_bp) as number} stroke="#a78bfa" strokeDasharray="5 5" label={{ value: 'Dia baseline', fill: '#a78bfa', fontSize: 10 }} />}
                        <Line type="monotone" dataKey="systolic_bp" name="Systolic" stroke="#f87171" strokeWidth={2.5} dot={false} connectNulls={false} />
                        <Line type="monotone" dataKey="diastolic_bp" name="Diastolic" stroke="#a78bfa" strokeWidth={2.5} dot={false} connectNulls={false} />
                      </>
                    ) : activeCvMetric && (
                      <>
                        {activeCvMetric.baseline !== null && <ReferenceLine y={activeCvMetric.baseline} stroke="#f5b942" strokeDasharray="5 5" label={{ value: 'Personal baseline', fill: '#f5b942', fontSize: 10 }} />}
                        <Line type="monotone" dataKey={activeCvMetric.key} name={`${activeCvMetric.title} (${activeCvMetric.unit})`} stroke={activeCvMetric.color} strokeWidth={2.7} dot={{ r: 2.5, fill: activeCvMetric.color, strokeWidth: 0 }} activeDot={{ r: 5, stroke: '#071426', strokeWidth: 2 }} connectNulls={false} />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3 text-[10px] text-slate-500">
              <span>{cvHistory.length} cardiovascular records loaded</span>
              <span>Dashed line = personal 1G baseline</span>
            </div>
          </div>

          {/* Personal Baseline Comparison Table */}
          <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#16234b]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Personal Baseline Comparison — Flight Day {astronaut.daysInMission} vs Pre-flight 1G</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Pre-flight reference: Houston Space Center</span>
            </div>

            {cvHistory.length === 0 || !cvBaseline ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <Calendar className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                {!cvBaseline ? 'Set up your baseline in the Baseline Setup module to enable comparison.' : 'Log measurements to compare against your baseline.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#17254d] text-slate-400 font-mono text-[11px]">
                      <th className="pb-2">Indicator</th>
                      <th className="pb-2">Pre-Flight Baseline</th>
                      <th className="pb-2">Current Reading</th>
                      <th className="pb-2">Change</th>
                      <th className="pb-2">What This Means</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#142146]">
                    {[
                      {
                        label: 'Resting Heart Rate',
                        baseline: cvBaseline.resting_heart_rate != null ? `${cvBaseline.resting_heart_rate} bpm` : '—',
                        current: latestCv?.heart_rate != null ? `${latestCv.heart_rate} bpm` : '—',
                        delta: hrDelta,
                        meaning: hrDelta !== null ? (Math.abs(hrDelta) < 5 ? 'Heart rate matches your baseline — excellent cardiovascular stability.' : hrDelta > 0 ? 'Slight elevation — common during active mission phases and microgravity adaptation.' : 'Bradycardia noted — common in well-conditioned astronauts in microgravity.') : 'Log measurements to compare.',
                        status: hrDelta === null ? 'No data' : Math.abs(hrDelta) < 20 ? 'Nominal' : 'Monitor',
                      },
                      {
                        label: 'Systolic Blood Pressure',
                        baseline: cvBaseline.systolic_bp != null ? `${cvBaseline.systolic_bp} mmHg` : '—',
                        current: latestCv?.systolic_bp != null ? `${latestCv.systolic_bp} mmHg` : '—',
                        delta: sbpDelta,
                        meaning: sbpDelta !== null ? (Math.abs(sbpDelta) < 5 ? 'Blood pressure within normal daily physiological variation.' : 'Noted change — monitor for persistent trend across multiple readings.') : 'Log measurements to compare.',
                        status: sbpDelta === null ? 'No data' : Math.abs(sbpDelta) < 10 ? 'Nominal' : 'Monitor',
                      },
                      {
                        label: 'Blood Oxygen (SpO₂)',
                        baseline: cvBaseline.spo2 != null ? `${cvBaseline.spo2}%` : '—',
                        current: latestCv?.spo2 != null ? `${latestCv.spo2}%` : '—',
                        delta: spo2Delta,
                        meaning: spo2Delta !== null ? (latestCv && latestCv.spo2 && latestCv.spo2 >= 95 ? 'Oxygen saturation is in the normal range for spacecraft cabin atmosphere.' : 'Below normal threshold — verify cabin atmosphere and report to flight surgeon.') : 'Log measurements to compare.',
                        status: latestCv?.spo2 != null ? (latestCv.spo2 >= 95 ? 'Nominal' : 'Alert') : 'No data',
                      },
                      {
                        label: 'HR Variability (RMSSD)',
                        baseline: cvBaseline.hrv != null ? `${cvBaseline.hrv} ms` : '—',
                        current: latestCv?.hrv != null ? `${latestCv.hrv} ms` : '—',
                        delta: hrvDelta,
                        meaning: hrvDelta !== null ? (Math.abs(hrvDelta) < 15 ? 'Autonomic nervous system balance is stable. Recovery is on track.' : 'Variability has shifted — may indicate stress, poor sleep, or adaptation changes.') : 'Log measurements to compare.',
                        status: hrvDelta === null ? 'No data' : Math.abs(hrvDelta) < 20 ? 'Nominal' : 'Monitor',
                      },
                    ].map((row, i) => {
                      const delta = row.delta;
                      const statusColor = row.status === 'Nominal' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : row.status === 'Alert' ? 'bg-rose-950 text-rose-300 border-rose-800' : row.status === 'Monitor' ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-slate-800 text-slate-400 border-slate-700';
                      const deltaColor = delta === null ? 'text-slate-500' : Math.abs(delta) < 5 ? 'text-emerald-400' : Math.abs(delta) < 15 ? 'text-cyan-400' : 'text-amber-400';
                      return (
                        <tr key={i}>
                          <td className="py-3 font-medium text-slate-200">{row.label}</td>
                          <td className="py-3 font-mono text-slate-400">{row.baseline}</td>
                          <td className="py-3 font-mono text-white">{row.current}</td>
                          <td className={`py-3 font-mono ${deltaColor}`}>
                            {delta !== null ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%` : '—'}
                          </td>
                          <td className="py-3 text-slate-300 max-w-[200px] leading-relaxed">{row.meaning}</td>
                          <td className="py-3 text-right">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${statusColor}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Mission Progress */}
          <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Mission Timeline</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
                  <span>Mission start</span>
                  <span className="font-mono text-cyan-300">Day {astronaut.daysInMission} / {astronaut.totalMissionDays}</span>
                  <span>Mission end</span>
                </div>
                <div className="h-2.5 rounded-full bg-[#172442] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-700 to-cyan-400 transition-all"
                    style={{ width: `${Math.min(100, (astronaut.daysInMission / astronaut.totalMissionDays) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  {((astronaut.daysInMission / astronaut.totalMissionDays) * 100).toFixed(1)}% complete · {astronaut.totalMissionDays - astronaut.daysInMission} days remaining
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
