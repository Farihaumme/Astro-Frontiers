import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Brain,
  Clock3,
  Database,
  Heart,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Signal,
  Sparkles,
  Waves,
  Wind,
  Zap,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { supabase } from '../../services/supabase';
import type {
  AstronautProfile,
  SystemStatusData,
  NotificationItem,
  RecentFinding,
  NavigationTab,
} from '../../types';

interface DashboardViewProps {
  astronaut: AstronautProfile;
  systemStatus: SystemStatusData;
  notifications: NotificationItem[];
  findings: RecentFinding[];
  onNavigate: (tab: NavigationTab) => void;
  onRefreshHealth: () => void;
  isCheckingHealth: boolean;

  // Opens the separate Aither AI page
  onOpenAIAssistant: () => void;
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

type CogRow = {
  dsst_score: number;
  nback_accuracy: number;
  pvt_reaction_time: number;
  fatigue_score: number;
  sleep_hours: number;
  recorded_at?: string;
  created_at?: string;
};

type CogBaseline = Omit<CogRow, 'recorded_at'>;
type ChartMetric = 'heart_rate' | 'spo2' | 'hrv' | 'blood_pressure';

const panel = 'rounded-2xl border border-slate-700/60 bg-[#0a1730]/85 shadow-[0_18px_55px_rgba(0,0,0,0.24)] backdrop-blur-xl';
const muted = 'text-slate-400';

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function stamp(value?: string | null) {
  if (!value) return 'No record yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Time unavailable'
    : date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function percentDelta(value: number | null, baseline: number | null) {
  if (value === null || baseline === null || baseline === 0) return null;
  return ((value - baseline) / baseline) * 100;
}

function Delta({ value, lowerIsBetter = false }: { value: number | null; lowerIsBetter?: boolean }) {
  if (value === null) return <span className="text-[11px] text-slate-500">Baseline unavailable</span>;
  const magnitude = Math.abs(value);
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'same';
  const favorable = value === 0 ? null : lowerIsBetter ? value < 0 : value > 0;
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Activity;
  const color = favorable === null ? 'text-slate-400' : favorable ? 'text-emerald-300' : 'text-amber-300';
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {magnitude < 0.05 ? 'At baseline' : `${magnitude.toFixed(1)}% ${direction}`}
      <span className="font-normal text-slate-500">vs baseline</span>
    </span>
  );
}

function MetricCard({
  label,
  value,
  unit,
  baseline,
  icon: Icon,
  accent,
  lowerIsBetter = false,
  footnote,
  comparisonValue,
}: {
  label: string;
  value: number | string | null;
  unit: string;
  baseline: number | null;
  icon: React.ElementType;
  accent: string;
  lowerIsBetter?: boolean;
  footnote?: string;
  comparisonValue?: number | null;
}) {
  const numeric = num(value);
  const delta = percentDelta(comparisonValue === undefined ? numeric : comparisonValue, baseline);
  return (
    <div className={`${panel} group relative overflow-hidden p-4 transition duration-300 hover:-translate-y-1 hover:border-slate-500/80`}>
      <div className={`absolute -right-7 -top-8 h-24 w-24 rounded-full blur-3xl opacity-15 ${accent}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tracking-tight text-white">{value === null ? '—' : value}</span>
            <span className="text-xs text-slate-400">{unit}</span>
          </div>
          <div className="mt-2">
            <Delta value={delta} lowerIsBetter={lowerIsBetter} />
          </div>
          {footnote && <p className="mt-2 text-[10px] text-slate-500">{footnote}</p>}
        </div>
        <div className={`rounded-xl border border-white/10 bg-white/[0.04] p-2.5 ${accent.replace('bg-', 'text-')}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full w-2/3 rounded-full opacity-80 ${accent}`} />
      </div>
      <p className="mt-2 text-[10px] text-slate-500">Personal reference: {baseline === null ? 'Not available' : `${baseline} ${unit}`}</p>
    </div>
  );
}

function StatusPill({ label, state }: { label: string; state: 'good' | 'warning' | 'offline' }) {
  const styles = {
    good: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
    warning: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
    offline: 'border-slate-600/50 bg-slate-700/20 text-slate-400',
  };
  const dot = state === 'good' ? 'bg-emerald-400' : state === 'warning' ? 'bg-amber-400' : 'bg-slate-500';
  return <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] ${styles[state]}`}><span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{label}</span>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  astronaut,
  systemStatus,
  notifications,
  findings,
  onNavigate,
  onRefreshHealth,
  isCheckingHealth,
  onOpenAIAssistant,
}) => {
  const [cvHistory, setCvHistory] = useState<CvRow[]>([]);
  const [cvBaseline, setCvBaseline] = useState<CvBaseline | null>(null);
  const [cogLatest, setCogLatest] = useState<CogRow | null>(null);
  const [cogBaseline, setCogBaseline] = useState<CogBaseline | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('heart_rate');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setDataLoading(true);
    setDataError('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Please sign in to view your health dashboard.');

      const [cvResult, cvBaseResult, cogResult, cogBaseResult] = await Promise.all([
        supabase.from('health_measurements').select('id, heart_rate, systolic_bp, diastolic_bp, spo2, hrv, recorded_at').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(30),
        supabase.from('astronaut_baselines').select('resting_heart_rate, systolic_bp, diastolic_bp, spo2, hrv').eq('user_id', user.id).eq('is_current', true).maybeSingle(),
        supabase.from('cognitive_measurements').select('dsst_score, nback_accuracy, pvt_reaction_time, fatigue_score, sleep_hours, recorded_at').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('cognitive_baselines').select('dsst_score, nback_accuracy, pvt_reaction_time, fatigue_score, sleep_hours, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (cvResult.error) throw cvResult.error;
      if (cvBaseResult.error) throw cvBaseResult.error;
      if (cogResult.error) throw cogResult.error;
      if (cogBaseResult.error) throw cogBaseResult.error;

      const ordered = [...(cvResult.data ?? [])].reverse() as CvRow[];
      setCvHistory(ordered);
      setCvBaseline(cvBaseResult.data as CvBaseline | null);
      setCogLatest(cogResult.data as CogRow | null);
      setCogBaseline(cogBaseResult.data as CogBaseline | null);
      const newestCvTimestamp = ordered.length ? ordered[ordered.length - 1].recorded_at : undefined;
      const stamps = [newestCvTimestamp, (cogResult.data as CogRow | null)?.recorded_at].filter(Boolean) as string[];
      stamps.sort();
      setLastUpdated(stamps.length ? stamps[stamps.length - 1] : null);
    } catch (error) {
      console.error('Dashboard data loading failed:', error);
      setDataError(error instanceof Error ? error.message : 'Could not load dashboard data.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => { void loadDashboardData(); }, [loadDashboardData]);

  const latestCv = cvHistory.length ? cvHistory[cvHistory.length - 1] : null;
  const chartRows = useMemo(() => cvHistory.map(row => ({
    ...row,
    timeLabel: new Date(row.recorded_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
  })), [cvHistory]);

  const cvMetric = selectedMetric === 'blood_pressure' ? null : {
    heart_rate: { key: 'heart_rate' as const, title: 'Heart rate', unit: 'bpm', baseline: num(cvBaseline?.resting_heart_rate), color: '#4dd7f2' },
    spo2: { key: 'spo2' as const, title: 'Blood oxygen', unit: '%', baseline: num(cvBaseline?.spo2), color: '#64d6b3' },
    hrv: { key: 'hrv' as const, title: 'Heart rate variability', unit: 'ms', baseline: num(cvBaseline?.hrv), color: '#a99cff' },
  }[selectedMetric];

  const cognitiveTiles = [
    { label: 'DSST', value: cogLatest ? cogLatest.dsst_score : null, base: num(cogBaseline?.dsst_score), unit: 'symbols', lower: false, color: 'text-sky-300' },
    { label: '2-back accuracy', value: cogLatest ? cogLatest.nback_accuracy : null, base: num(cogBaseline?.nback_accuracy), unit: '%', lower: false, color: 'text-violet-300' },
    { label: 'PVT reaction', value: cogLatest ? cogLatest.pvt_reaction_time : null, base: num(cogBaseline?.pvt_reaction_time), unit: 'ms', lower: true, color: 'text-fuchsia-300' },
    { label: 'Fatigue', value: cogLatest ? cogLatest.fatigue_score : null, base: num(cogBaseline?.fatigue_score), unit: '/10', lower: true, color: 'text-amber-300' },
    { label: 'Sleep', value: cogLatest ? cogLatest.sleep_hours : null, base: num(cogBaseline?.sleep_hours), unit: 'h', lower: false, color: 'text-indigo-300' },
  ];

  const activeAlerts = notifications.filter(item => !item.read).length;
  const latestFinding = findings[0] ?? null;
  const cvHasData = cvHistory.length > 0;
  const cogHasData = cogLatest !== null;
  const dataSourcesReady = cvBaseline !== null && cogBaseline !== null;
  const monitoringLabel = dataLoading ? 'SYNCING HEALTH RECORDS' : (cvHasData || cogHasData) ? 'PERSONAL MONITORING ONLINE' : 'AWAITING FIRST CHECK-IN';
  const overallTime = lastUpdated ? stamp(lastUpdated) : 'No measurements saved yet';

  const chartMetricOptions: { key: ChartMetric; label: string }[] = [
    { key: 'heart_rate', label: 'Heart rate' },
    { key: 'blood_pressure', label: 'Blood pressure' },
    { key: 'spo2', label: 'SpO₂' },
    { key: 'hrv', label: 'HRV' },
  ];

  return (
    <div className="relative isolate mx-auto min-h-full max-w-[1700px] overflow-hidden px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-44 -top-48 h-[34rem] w-[34rem] rounded-full bg-cyan-500/[0.07] blur-3xl" />
        <div className="absolute -left-48 top-[38rem] h-[30rem] w-[30rem] rounded-full bg-violet-500/[0.06] blur-3xl" />
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(#8cc9ff 0.7px, transparent 0.7px)', backgroundSize: '27px 27px' }} />
      </div>

      {/* Dashboard masthead */}
      <header className="mb-5 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-center">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/10 shadow-[0_0_35px_rgba(34,211,238,0.12)]">
            <Activity className="h-6 w-6 text-cyan-300" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#070d1d] bg-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300">Aither Kairos / Mission Health</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Mission control overview</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2">
            <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500">Astronaut</p>
            <p className="mt-0.5 text-sm font-medium text-white">{astronaut.name}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2">
            <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500">Subject ID</p>
            <p className="mt-0.5 font-mono text-sm text-cyan-200">{astronaut.id}</p>
          </div>
          <button type="button" onClick={() => { onRefreshHealth(); void loadDashboardData(); }} disabled={isCheckingHealth || dataLoading} className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300/50 hover:bg-cyan-400/15 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${isCheckingHealth || dataLoading ? 'animate-spin' : ''}`} /> Refresh systems
          </button>
        </div>
      </header>

      {/* Hero status */}
      <section className="relative mb-5 overflow-hidden rounded-[26px] border border-cyan-300/20 bg-[linear-gradient(112deg,#09172f_0%,#0b2443_48%,#101b3a_100%)] px-5 py-6 shadow-[0_25px_80px_rgba(0,0,0,0.3)] sm:px-7 lg:px-9 lg:py-8">
        <div aria-hidden="true" className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(circle at 72% 48%, rgba(41,170,255,.18), transparent 28%), radial-gradient(circle at 86% 18%, rgba(116,91,255,.18), transparent 22%), linear-gradient(90deg, transparent 0%, rgba(9,18,42,.1) 55%, rgba(8,15,34,.5) 100%)' }} />
        <div aria-hidden="true" className="absolute -right-5 -top-24 hidden h-[28rem] w-[28rem] rounded-full border border-cyan-100/15 lg:block" />
        <div aria-hidden="true" className="absolute right-8 -top-16 hidden h-[24rem] w-[24rem] rounded-full border border-cyan-100/10 lg:block" />
        <div aria-hidden="true" className="absolute -right-4 -bottom-44 hidden h-[25rem] w-[37rem] rounded-[50%] bg-gradient-to-t from-blue-400/30 via-cyan-300/10 to-transparent blur-[2px] lg:block" />
        <div className="relative grid gap-7 lg:grid-cols-[1.35fr_.65fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-emerald-200">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>
              {monitoringLabel}
            </div>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">Every signal tells<br className="hidden sm:block" /> part of the story.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">A personalized view of cardiovascular, cognitive and vascular monitoring — anchored to the astronaut’s own baseline.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => onNavigate('cardiovascular')} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-bold text-[#061326] shadow-lg shadow-cyan-500/10 transition hover:bg-cyan-200">Open health telemetry <ArrowRight className="h-4 w-4" /></button>
              <button type="button" onClick={() => onNavigate('cognitive')} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"><Brain className="h-4 w-4 text-violet-300" /> Cognitive check-in</button>
            </div>
          </div>
          <div className="relative mx-auto flex w-full max-w-sm items-center justify-center py-2 lg:min-h-[190px]">
            <div aria-hidden="true" className="absolute h-52 w-52 rounded-full border border-cyan-100/15 shadow-[0_0_55px_rgba(34,211,238,0.08)]" />
            <div aria-hidden="true" className="absolute h-40 w-64 rotate-[-22deg] rounded-[50%] border border-cyan-200/25" />
            <div aria-hidden="true" className="absolute h-40 w-64 rotate-[36deg] rounded-[50%] border border-violet-200/15" />
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-cyan-100/25 bg-[radial-gradient(circle_at_34%_28%,#5ed8eb_0%,#1d6896_23%,#102c57_57%,#071426_78%)] shadow-[0_0_70px_rgba(45,178,235,0.26)]">
              <div className="absolute inset-2 rounded-full border border-white/10" />
              <Activity className="h-12 w-12 text-cyan-100 drop-shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
            </div>
            <div className="absolute right-6 top-5 rounded-lg border border-cyan-100/15 bg-[#07172c]/80 px-3 py-2 backdrop-blur">
              <p className="text-[9px] uppercase tracking-wider text-slate-500">Data sync</p>
              <p className="mt-0.5 text-xs font-semibold text-cyan-200">{dataLoading ? 'Syncing…' : 'Updated'}</p>
            </div>
            <div className="absolute bottom-2 left-2 rounded-lg border border-white/10 bg-[#07172c]/80 px-3 py-2 backdrop-blur">
              <p className="text-[9px] uppercase tracking-wider text-slate-500">Last measurement</p>
              <p className="mt-0.5 text-[11px] font-semibold text-white">{overallTime}</p>
            </div>
          </div>
        </div>
      </section>

      {dataError && <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-semibold">Dashboard data could not be loaded</p><p className="mt-1 text-xs text-rose-200/75">{dataError}</p><button type="button" onClick={() => void loadDashboardData()} className="mt-2 text-xs font-semibold underline underline-offset-4">Try again</button></div></div>}
    {/* Aither AI Assistant */}
<section className="mb-6">
  <div
    onClick={onOpenAIAssistant}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onOpenAIAssistant();
      }
    }}
    className="group cursor-pointer rounded-2xl border border-cyan-500/30
    bg-gradient-to-r from-[#101d3b] to-[#17264a]
    p-6 hover:border-cyan-400/60 transition-all duration-300
    hover:shadow-lg hover:shadow-cyan-500/10"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-cyan-500/10">
          <Sparkles className="w-7 h-7 text-cyan-400" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-white">
            Meet Aither AI
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Your intelligent companion for astronaut health.
          </p>

          <p className="text-xs text-cyan-400 mt-2">
            Ask questions about ECG, ultrasound & space medicine.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-cyan-400">
        <span className="text-sm hidden sm:block">
          Ask Aither AI
        </span>

        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  </div>
</section>

      {/* Vital sign tiles */}
      <section className="mb-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300">Cardiovascular telemetry</p><h3 className="mt-1 text-lg font-semibold text-white">Live health snapshot <span className="text-xs font-normal text-slate-500">· latest saved readings</span></h3></div>
          <button type="button" onClick={() => onNavigate('cardiovascular')} className="hidden items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-100 sm:inline-flex">View module <ArrowRight className="h-3.5 w-3.5" /></button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Heart rate" value={num(latestCv?.heart_rate)} unit="bpm" baseline={num(cvBaseline?.resting_heart_rate)} icon={Heart} accent="bg-rose-400" footnote={stamp(latestCv?.recorded_at)} />
          <MetricCard label="Blood pressure" value={latestCv?.systolic_bp != null && latestCv?.diastolic_bp != null ? `${latestCv.systolic_bp}/${latestCv.diastolic_bp}` : null} unit="mmHg" baseline={num(cvBaseline?.systolic_bp)} comparisonValue={num(latestCv?.systolic_bp)} icon={Waves} accent="bg-cyan-400" footnote={`Systolic baseline ${cvBaseline?.systolic_bp ?? '—'} · Diastolic baseline ${cvBaseline?.diastolic_bp ?? '—'}`} />
          <MetricCard label="Blood oxygen" value={num(latestCv?.spo2)} unit="%" baseline={num(cvBaseline?.spo2)} icon={Wind} accent="bg-emerald-400" footnote="Peripheral oxygen saturation" />
          <MetricCard label="Heart rate variability" value={num(latestCv?.hrv)} unit="ms" baseline={num(cvBaseline?.hrv)} icon={Activity} accent="bg-violet-400" footnote="HRV as stored in the health record" />
        </div>
        {!cvHasData && !dataLoading && <p className="mt-3 rounded-xl border border-dashed border-slate-700 bg-slate-900/30 px-4 py-3 text-xs text-slate-400">No cardiovascular check-ins have been saved yet. Open Cardiovascular to enter the first measurement.</p>}
      </section>

      {/* Main analytic panels */}
      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_.85fr]">
        <div className={`${panel} min-w-0 p-5 sm:p-6`}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Signal history</p><h3 className="mt-1 text-lg font-semibold text-white">Telemetry over time</h3><p className="mt-1 text-xs text-slate-500">Recorded values with personal reference levels.</p></div>
            <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
              {chartMetricOptions.map(option => <button key={option.key} type="button" onClick={() => setSelectedMetric(option.key)} className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold transition ${selectedMetric === option.key ? 'bg-cyan-300 text-[#071426]' : 'text-slate-400 hover:text-white'}`}>{option.label}</button>)}
            </div>
          </div>
          <div className="mt-5 h-[250px] w-full">
            {chartRows.length === 0 ? <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/70 bg-black/10 text-center"><Activity className="h-7 w-7 text-slate-600" /><p className="mt-3 text-sm text-slate-400">Telemetry history will appear here</p><p className="mt-1 text-[11px] text-slate-600">Save cardiovascular measurements to build a trend.</p></div> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartRows} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                  <defs><linearGradient id="cvLineFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={cvMetric?.color ?? '#f5b942'} stopOpacity={0.28} /><stop offset="100%" stopColor={cvMetric?.color ?? '#f5b942'} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="#233653" strokeDasharray="3 5" vertical={false} />
                  <XAxis dataKey="timeLabel" tick={{ fill: '#71839d', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tick={{ fill: '#71839d', fontSize: 10 }} tickLine={false} axisLine={false} width={45} />
                  <Tooltip contentStyle={{ background: '#08152b', border: '1px solid #294365', borderRadius: 12, color: '#f8fafc', fontSize: 12 }} labelStyle={{ color: '#91a6bf', marginBottom: 5 }} />
                  {selectedMetric === 'blood_pressure' ? <>
                    {num(cvBaseline?.systolic_bp) !== null && <ReferenceLine y={num(cvBaseline?.systolic_bp) as number} stroke="#f5b942" strokeDasharray="5 5" label={{ value: 'Sys baseline', fill: '#f5b942', fontSize: 10 }} />}
                    {num(cvBaseline?.diastolic_bp) !== null && <ReferenceLine y={num(cvBaseline?.diastolic_bp) as number} stroke="#a78bfa" strokeDasharray="5 5" label={{ value: 'Dia baseline', fill: '#a78bfa', fontSize: 10 }} />}
                    <Line type="monotone" dataKey="systolic_bp" name="Systolic" stroke="#f5b942" strokeWidth={2.5} dot={false} connectNulls={false} />
                    <Line type="monotone" dataKey="diastolic_bp" name="Diastolic" stroke="#a78bfa" strokeWidth={2.5} dot={false} connectNulls={false} />
                  </> : cvMetric && <>
                    {cvMetric.baseline !== null && <ReferenceLine y={cvMetric.baseline} stroke="#f5b942" strokeDasharray="5 5" label={{ value: 'Personal baseline', fill: '#f5b942', fontSize: 10 }} />}
                    <Line type="monotone" dataKey={cvMetric.key} name={`${cvMetric.title} (${cvMetric.unit})`} stroke={cvMetric.color} strokeWidth={2.7} dot={{ r: 2, fill: cvMetric.color, strokeWidth: 0 }} activeDot={{ r: 5, stroke: '#071426', strokeWidth: 2 }} connectNulls={false} />
                  </>}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3 text-[10px] text-slate-500"><span>{cvHistory.length} cardiovascular records loaded</span><span>Dashed line = personal baseline</span></div>
        </div>

        <div className={`${panel} relative overflow-hidden p-5 sm:p-6`}>
          <div aria-hidden="true" className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">Neuro-performance</p><h3 className="mt-1 text-lg font-semibold text-white">Cognitive readiness</h3><p className="mt-1 text-xs text-slate-500">Latest manual assessment vs personal baseline.</p></div><div className="rounded-xl border border-violet-300/20 bg-violet-400/10 p-2.5"><Brain className="h-5 w-5 text-violet-200" /></div></div>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {cognitiveTiles.map(tile => {
                const delta = percentDelta(num(tile.value), tile.base);
                const favorable = delta === null || delta === 0 ? null : tile.lower ? delta < 0 : delta > 0;
                return <div key={tile.label} className="rounded-xl border border-white/[0.07] bg-black/15 p-3">
                  <p className="text-[10px] text-slate-500">{tile.label}</p>
                  <p className={`mt-1.5 text-xl font-semibold tracking-tight ${tile.color}`}>{tile.value === null ? '—' : tile.value}<span className="ml-1 text-[10px] font-normal text-slate-500">{tile.unit}</span></p>
                  <p className={`mt-1 text-[10px] ${favorable === null ? 'text-slate-500' : favorable ? 'text-emerald-300' : 'text-amber-300'}`}>{delta === null ? 'Awaiting comparison' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}% vs base`}</p>
                </div>;
              })}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3"><span className="text-[10px] text-slate-500">{cogLatest ? `Updated ${stamp(cogLatest.recorded_at)}` : 'No cognitive check-in saved yet'}</span><button type="button" onClick={() => onNavigate('cognitive')} className="inline-flex items-center gap-1 text-xs font-semibold text-violet-200 hover:text-white">Open cognitive module <ArrowRight className="h-3.5 w-3.5" /></button></div>
          </div>
        </div>
      </section>

      {/* Activity, mission modules, system health */}
      <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_.85fr]">
       {/* <div className={`${panel} p-5`}>
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Mission activity</p><h3 className="mt-1 text-base font-semibold text-white">Recent findings</h3></div><button type="button" onClick={() => onNavigate('history')} className="text-[10px] font-semibold text-cyan-300 hover:text-white">View history →</button></div>
          <div className="mt-4 space-y-3">
            {findings.length ? findings.slice(0, 4).map((item, index) => {
              const state = item.status === 'Normal' ? 'bg-emerald-400' : item.status === 'Watch' ? 'bg-amber-400' : 'bg-rose-400';
              return <div key={item.id} className="flex gap-3">
                <div className="flex flex-col items-center"><span className={`mt-1.5 h-2 w-2 rounded-full ${state}`} />{index < Math.min(findings.length, 4) - 1 && <span className="mt-1 h-8 w-px bg-slate-700" />}</div>
                <div className="min-w-0 flex-1 border-b border-white/[0.06] pb-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-slate-200">{item.type}</p><span className="text-[10px] text-slate-500">{item.dateTime}</span></div><p className="mt-1 text-xs leading-5 text-slate-400">{item.finding}</p><span className="mt-1.5 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] text-slate-300">{item.status}</span></div>
              </div>;
            }) : <div className="rounded-xl border border-dashed border-slate-700 p-5 text-center"><Clock3 className="mx-auto h-6 w-6 text-slate-600" /><p className="mt-2 text-xs text-slate-400">No findings recorded in this session.</p></div>}
          </div>
          {latestFinding && <p className="mt-2 text-[10px] text-slate-600">Latest item: {latestFinding.type}</p>}
        </div>

        <div className={`${panel} p-5`}>
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Mission systems</p><h3 className="mt-1 text-base font-semibold text-white">Monitoring modules</h3></div>
          <div className="mt-4 space-y-2.5">
            <button type="button" onClick={() => onNavigate('cardiovascular')} className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left transition hover:border-rose-300/25 hover:bg-rose-300/[0.05]"><span className="rounded-lg bg-rose-400/10 p-2.5 text-rose-300"><Heart className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-white">Cardiovascular</span><span className="mt-0.5 block text-[10px] text-slate-500">Vitals, ECG image analysis, baseline trends</span></span><ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-rose-200" /></button>
            <button type="button" onClick={() => onNavigate('ijv')} className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.05]"><span className="rounded-lg bg-cyan-400/10 p-2.5 text-cyan-300"><ScanLine className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-white">IJV ultrasound</span><span className="mt-0.5 block text-[10px] text-slate-500">Vascular imaging and segmentation</span></span><ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-200" /></button>
            <button type="button" onClick={() => onNavigate('cognitive')} className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left transition hover:border-violet-300/25 hover:bg-violet-300/[0.05]"><span className="rounded-lg bg-violet-400/10 p-2.5 text-violet-300"><Brain className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-white">Cognitive health</span><span className="mt-0.5 block text-[10px] text-slate-500">Processing speed, attention, fatigue, sleep</span></span><ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-violet-200" /></button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2"><StatusPill label={cvHasData ? 'Cardio data saved' : 'Cardio awaiting data'} state={cvHasData ? 'good' : 'warning'} /><StatusPill label={cogHasData ? 'Cognitive data saved' : 'Cognitive awaiting data'} state={cogHasData ? 'good' : 'warning'} /></div>
        </div>*/}

        {/*<div className={`${panel} p-5`}>
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Platform status</p><h3 className="mt-1 text-base font-semibold text-white">System integrity</h3></div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs text-slate-300"><Signal className="h-4 w-4 text-cyan-300" /> FastAPI backend</span><StatusPill label={systemStatus.fastapiConnected ? 'Connected' : 'Offline'} state={systemStatus.fastapiConnected ? 'good' : 'offline'} /></div>
            <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs text-slate-300"><ScanLine className="h-4 w-4 text-cyan-300" /> IJV model</span><StatusPill label={systemStatus.ijvModelStatus} state={systemStatus.ijvModelStatus.toLowerCase().includes('ready') || systemStatus.ijvModelStatus.toLowerCase().includes('online') ? 'good' : 'warning'} /></div>
            <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs text-slate-300"><Database className="h-4 w-4 text-cyan-300" /> Data baseline</span><StatusPill label={dataSourcesReady ? 'Profiles found' : 'Check profile'} state={dataSourcesReady ? 'good' : 'warning'} /></div>
            <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs text-slate-300"><AlertTriangle className="h-4 w-4 text-amber-300" /> Unread alerts</span><span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold text-amber-200">{activeAlerts}</span></div>
          </div>
          <div className="mt-5 rounded-xl border border-white/[0.07] bg-black/15 p-3"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><Sparkles className="h-3.5 w-3.5 text-cyan-300" /> Data note</div><p className="mt-2 text-[11px] leading-5 text-slate-400">Dashboard comparisons use saved records and personal baselines. Missing data is shown as unavailable rather than estimated.</p></div>
          <button type="button" onClick={() => onNavigate('reports')} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 py-2.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-300/15">Open health reports <ArrowRight className="h-3.5 w-3.5" /></button>
        </div>*/}
      </section>

      {/* Notifications and next actions */}
      <section className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
        <div className={`${panel} p-5`}>
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Attention queue</p><h3 className="mt-1 text-base font-semibold text-white">Alerts & notifications</h3></div><span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] text-amber-200">{activeAlerts} unread</span></div>
          <div className="mt-3 space-y-2">
            {notifications.length ? notifications.slice(0, 3).map(item => <div key={item.id} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"><span className="mt-0.5 rounded-lg bg-amber-400/10 p-2 text-amber-300"><AlertTriangle className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><p className="text-xs font-semibold text-slate-200">{item.title}</p><span className="text-[10px] text-slate-500">{item.timestamp}</span></div><p className="mt-1 text-[11px] leading-5 text-slate-400">{item.message}</p></div></div>) : <p className="rounded-xl border border-dashed border-slate-700 p-4 text-xs text-slate-500">No notifications available.</p>}
          </div>
        </div>
        <div className={`${panel} p-5`}>
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Quick launch</p><h3 className="mt-1 text-base font-semibold text-white">What would you like to do?</h3></div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => onNavigate('cardiovascular')} className="group flex items-center justify-between gap-3 rounded-xl border border-rose-300/15 bg-rose-300/[0.05] p-3 text-left transition hover:border-rose-300/40 hover:bg-rose-300/10"><span className="flex items-center gap-2.5"><Heart className="h-4 w-4 text-rose-300" /><span><span className="block text-xs font-semibold text-white">Record vitals / ECG</span><span className="mt-0.5 block text-[10px] text-slate-500">Update cardiovascular data</span></span></span><ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-rose-200" /></button>
            <button type="button" onClick={() => onNavigate('cognitive')} className="group flex items-center justify-between gap-3 rounded-xl border border-violet-300/15 bg-violet-300/[0.05] p-3 text-left transition hover:border-violet-300/40 hover:bg-violet-300/10"><span className="flex items-center gap-2.5"><Brain className="h-4 w-4 text-violet-300" /><span><span className="block text-xs font-semibold text-white">Log cognitive test</span><span className="mt-0.5 block text-[10px] text-slate-500">Save manual assessment</span></span></span><ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-violet-200" /></button>
            <button type="button" onClick={() => onNavigate('ijv')} className="group flex items-center justify-between gap-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] p-3 text-left transition hover:border-cyan-300/40 hover:bg-cyan-300/10"><span className="flex items-center gap-2.5"><ScanLine className="h-4 w-4 text-cyan-300" /><span><span className="block text-xs font-semibold text-white">Analyze IJV scan</span><span className="mt-0.5 block text-[10px] text-slate-500">Open ultrasound workspace</span></span></span><ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-200" /></button>
            <button type="button" onClick={() => onNavigate('trends')} className="group flex items-center justify-between gap-3 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] p-3 text-left transition hover:border-emerald-300/40 hover:bg-emerald-300/10"><span className="flex items-center gap-2.5"><Zap className="h-4 w-4 text-emerald-300" /><span><span className="block text-xs font-semibold text-white">Explore health trends</span><span className="mt-0.5 block text-[10px] text-slate-500">Compare progress over time</span></span></span><ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-emerald-200" /></button>
          </div>
        </div>
      </section>

      <footer className="flex flex-col gap-2 border-t border-white/[0.08] pt-4 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between"><span className="inline-flex items-center gap-2"></span><span></span></footer>
    </div>
  );
};
