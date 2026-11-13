import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, Brain, Clock3, Moon, Save, ShieldCheck, Target, TrendingDown,
  TrendingUp, Zap, Loader2
} from 'lucide-react';
import {
  CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts';
import { supabase } from '../../services/supabase';
import { AstronautProfile } from '../../types';

interface CognitiveViewProps {
  astronaut: AstronautProfile;
}

type MetricValues = {
  dsst_score: string;
  nback_accuracy: string;
  pvt_reaction_time: string;
  fatigue_score: string;
  sleep_hours: string;
};

type CognitiveRow = {
  id: string;
  user_id: string;
  dsst_score: number;
  nback_accuracy: number;
  pvt_reaction_time: number;
  fatigue_score: number;
  sleep_hours: number;
  recorded_at?: string;
  created_at?: string;
};

const emptyValues: MetricValues = {
  dsst_score: '',
  nback_accuracy: '',
  pvt_reaction_time: '',
  fatigue_score: '',
  sleep_hours: ''
};

const fields = [
  { key: 'dsst_score', label: 'DSST completed symbols', unit: 'symbols', min: 0, max: 10000, step: 1, higher: true, icon: Zap },
  { key: 'nback_accuracy', label: '2-back accuracy', unit: '%', min: 0, max: 100, step: 0.1, higher: true, icon: Brain },
  { key: 'pvt_reaction_time', label: 'PVT mean reaction time', unit: 'ms', min: 1, max: 100000, step: 0.1, higher: false, icon: Target },
  { key: 'fatigue_score', label: 'Self-reported fatigue', unit: '/10', min: 0, max: 10, step: 0.1, higher: false, icon: AlertCircle },
  { key: 'sleep_hours', label: 'Sleep duration', unit: 'hours', min: 0, max: 24, step: 0.25, higher: null, icon: Moon }
] as const;

const inputClass = 'w-full rounded-lg border border-[#26375f] bg-[#080f22] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500';
const cardClass = 'rounded-xl border border-[#17254d] bg-[#0b1329] p-5 shadow-sm';

const numberValue = (value: string | number) => Number(value);

function formatDate(value: string) {
  return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const CognitiveView: React.FC<CognitiveViewProps> = ({ astronaut }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<CognitiveRow | null>(null);
  const [history, setHistory] = useState<CognitiveRow[]>([]);
  const [values, setValues] = useState<MetricValues>(emptyValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Please sign in to view cognitive health data.');
      setUserId(user.id);

      const [{ data: baselineRows, error: baselineError }, { data: rows, error: historyError }] = await Promise.all([
        supabase.from('cognitive_baselines').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
        supabase.from('cognitive_measurements').select('*').eq('user_id', user.id).order('recorded_at', { ascending: true })
      ]);
      if (baselineError) throw baselineError;
      if (historyError) throw historyError;

      const currentBaseline = baselineRows?.[0] ?? null;
      setBaseline(currentBaseline);
      setHistory(rows ?? []);

      // Pre-fill the check-in with the most recent record, if available.
      const latest = rows?.length ? rows[rows.length - 1] : null;
      if (latest) {
        setValues({
          dsst_score: String(latest.dsst_score),
          nback_accuracy: String(latest.nback_accuracy),
          pvt_reaction_time: String(latest.pvt_reaction_time),
          fatigue_score: String(latest.fatigue_score),
          sleep_hours: String(latest.sleep_hours)
        });
      } else if (currentBaseline) {
        setValues({
          dsst_score: String(currentBaseline.dsst_score),
          nback_accuracy: String(currentBaseline.nback_accuracy),
          pvt_reaction_time: String(currentBaseline.pvt_reaction_time),
          fatigue_score: String(currentBaseline.fatigue_score),
          sleep_hours: String(currentBaseline.sleep_hours)
        });
      }
    } catch (e: any) {
      setError(e.message || 'Could not load cognitive records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const validate = () => {
    for (const field of fields) {
      const raw = values[field.key];
      if (raw.trim() === '') return `${field.label} is required.`;
      const value = numberValue(raw);
      if (!Number.isFinite(value) || value < field.min || value > field.max) {
        return `${field.label} must be between ${field.min} and ${field.max}.`;
      }
    }
    return '';
  };

  const payload = () => ({
    user_id: userId!,
    dsst_score: Math.round(numberValue(values.dsst_score)),
    nback_accuracy: numberValue(values.nback_accuracy),
    pvt_reaction_time: numberValue(values.pvt_reaction_time),
    fatigue_score: numberValue(values.fatigue_score),
    sleep_hours: numberValue(values.sleep_hours)
  });

  const saveBaseline = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validate();
    if (validation) { setError(validation); return; }
    if (!userId) { setError('Please sign in again.'); return; }
    setSaving(true); setError(''); setMessage('');
    try {
      const { data, error: insertError } = await supabase
        .from('cognitive_baselines').insert(payload()).select().single();
      if (insertError) throw insertError;
      setBaseline(data);
      setMessage('Your personal cognitive baseline has been saved.');
      await loadHistoryOnly();
    } catch (e: any) {
      setError(e.message || 'Could not save baseline.');
    } finally { setSaving(false); }
  };

  const loadHistoryOnly = async () => {
    if (!userId) return;
    const { data, error: readError } = await supabase.from('cognitive_measurements')
      .select('*').eq('user_id', userId).order('recorded_at', { ascending: true });
    if (readError) throw readError;
    setHistory(data ?? []);
  };

  const saveMeasurement = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validate();
    if (validation) { setError(validation); return; }
    if (!userId) { setError('Please sign in again.'); return; }
    setSaving(true); setError(''); setMessage('');
    try {
      const { error: insertError } = await supabase.from('cognitive_measurements').insert(payload());
      if (insertError) throw insertError;
      setMessage('Cognitive check-in saved successfully.');
      await loadHistoryOnly();
    } catch (e: any) {
      setError(e.message || 'Could not save cognitive check-in.');
    } finally { setSaving(false); }
  };

  const latest = history.length ? history[history.length - 1] : null;

  const chartData = useMemo(() => history.map(row => ({
    ...row,
    chartDate: formatDate(row.recorded_at || row.created_at || new Date().toISOString())
  })), [history]);

  const deviation = (key: typeof fields[number]['key'], current: number, base: number) => {
    const diff = current - base;
    const percent = base === 0 ? null : Math.abs((diff / base) * 100);
    const field = fields.find(item => item.key === key)!;
    if (key === 'sleep_hours') {
      return { text: `${diff > 0 ? '+' : ''}${diff.toFixed(2)} h vs baseline`, tone: 'text-slate-300' };
    }
    const favorable = field.higher === null ? null : (field.higher ? diff >= 0 : diff <= 0);
    return {
      text: `${diff > 0 ? '+' : ''}${diff.toFixed(key === 'dsst_score' ? 0 : 2)} ${field.unit}${percent === null ? '' : ` (${diff > 0 ? '+' : ''}${percent.toFixed(1)}%)`}`,
      tone: favorable === null ? 'text-slate-300' : favorable ? 'text-emerald-300' : 'text-amber-300'
    };
  };

  const renderFormFields = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {fields.map(field => (
        <label key={field.key} className="space-y-1.5">
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <field.icon className="h-4 w-4 text-cyan-400" /> {field.label}
          </span>
          <div className="relative">
            <input
              className={inputClass}
              type="number"
              min={field.min}
              max={field.max}
              step={field.step}
              value={values[field.key]}
              onChange={event => setValues(old => ({ ...old, [field.key]: event.target.value }))}
              placeholder={`Enter ${field.unit}`}
              required
            />
          </div>
          <span className="text-[10px] text-slate-500">Unit: {field.unit}</span>
        </label>
      ))}
    </div>
  );

  if (loading) return <div className="p-8 text-center text-slate-300"><Loader2 className="inline h-5 w-5 animate-spin mr-2" />Loading cognitive records...</div>;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-6">
      <div className="flex flex-col gap-3 border-b border-[#152347] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">Astronaut Cognitive & Neuro-Performance Monitoring</h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">Manual cognitive and sleep records compared with each astronaut's own baseline.</p>
        </div>
        <div className="text-xs font-mono text-slate-400">Subject: {astronaut.name} ({astronaut.id})</div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-cyan-900/70 bg-cyan-950/20 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
        <p className="text-xs leading-relaxed text-cyan-100/90">
          Enter results from your own assessments. Changes are compared with your personal baseline, not a universal normal score.
          This module supports monitoring and is not a clinical diagnosis.
        </p>
      </div>

      {error && <div role="alert" className="rounded-lg border border-rose-800 bg-rose-950/30 p-3 text-sm text-rose-200">{error}</div>}
      {message && <div role="status" className="rounded-lg border border-emerald-800 bg-emerald-950/30 p-3 text-sm text-emerald-200">{message}</div>}

      {!baseline ? (
        <section className={`${cardClass} space-y-4`}>
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-white"><ShieldCheck className="h-4 w-4 text-cyan-400" /> Set your personal cognitive baseline</h3>
            <p className="mt-1 text-xs text-slate-400">Enter your initial reference measurements. These will be used for future comparisons.</p>
          </div>
          <form onSubmit={saveBaseline} className="space-y-5">
            {renderFormFields()}
            <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save baseline
            </button>
          </form>
        </section>
      ) : (
        <>
          <section className={`${cardClass} space-y-4`}>
            <div>
              <h3 className="text-sm font-bold text-white">Manual cognitive check-in</h3>
              <p className="mt-1 text-xs text-slate-400">Enter the latest results. Saving creates a new historical record and never overwrites previous measurements.</p>
            </div>
            <form onSubmit={saveMeasurement} className="space-y-5">
              {renderFormFields()}
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save check-in
              </button>
            </form>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {fields.map(field => {
              const current = latest ? Number(latest[field.key]) : Number(baseline[field.key]);
              const base = Number(baseline[field.key]);
              const delta = deviation(field.key, current, base);
              return (
                <div key={field.key} className={`${cardClass} space-y-2`}>
                  <div className="flex items-center gap-2 text-xs text-slate-400"><field.icon className="h-4 w-4 text-cyan-400" />{field.label}</div>
                  <div className="text-2xl font-bold font-mono text-white">{current}<span className="ml-1 text-xs font-normal text-slate-400">{field.unit}</span></div>
                  <div className={`text-xs font-mono ${delta.tone}`}>{delta.text}</div>
                  <div className="text-[10px] text-slate-500">Personal baseline: {base} {field.unit}</div>
                </div>
              );
            })}
          </section>

          <section className={`${cardClass} space-y-3`}>
            <h3 className="text-sm font-bold text-white">Personal baseline comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-xs">
                <thead className="text-slate-400"><tr className="border-b border-[#1b2a50]"><th className="py-2">Metric</th><th>Baseline</th><th>Latest</th><th>Change</th><th>Interpretation</th></tr></thead>
                <tbody>
                  {fields.map(field => {
                    const current = latest ? Number(latest[field.key]) : Number(baseline[field.key]);
                    const base = Number(baseline[field.key]);
                    const delta = deviation(field.key, current, base);
                    const interpretation = field.key === 'sleep_hours'
                      ? 'Compared with personal sleep baseline'
                      : field.higher === null ? 'Compared with personal baseline' :
                        ((field.higher ? current >= base : current <= base) ? 'No decline vs baseline' : 'Change from baseline; review trend');
                    return <tr key={field.key} className="border-b border-[#17254d] text-slate-300">
                      <td className="py-3 font-medium text-white">{field.label}</td><td>{base} {field.unit}</td><td>{current} {field.unit}</td>
                      <td className={delta.tone}>{delta.text}</td><td>{interpretation}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <div><h3 className="text-sm font-bold text-white">Historical trends</h3><p className="mt-1 text-xs text-slate-400">Each graph shows one metric and its personal baseline reference line.</p></div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {fields.map(field => (
                <div key={field.key} className={`${cardClass} space-y-3`}>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white">{field.label}</h4>
                    <span className="text-xs font-mono text-slate-400">Baseline: {Number(baseline[field.key])} {field.unit}</span>
                  </div>
                  {chartData.length === 0 ? <p className="py-10 text-center text-xs text-slate-500">No check-ins recorded yet.</p> : (
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
                          <CartesianGrid stroke="#1b2a50" strokeDasharray="3 3" />
                          <XAxis dataKey="chartDate" tick={{ fill: '#94a3b8', fontSize: 10 }} minTickGap={24} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} width={48} />
                          <Tooltip contentStyle={{ background: '#0b1329', border: '1px solid #26375f', borderRadius: 8, color: '#fff' }} />
                          <ReferenceLine y={Number(baseline[field.key])} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Baseline', fill: '#fbbf24', fontSize: 10 }} />
                          <Line type="monotone" dataKey={field.key} name={`${field.label} (${field.unit})`} stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
          <p className="text-[10px] text-slate-500">Historical records: {history.length}. Sleep and fatigue are self-reported. A single change should not be treated as a diagnosis.</p>
        </>
      )}
    </div>
  );
};
