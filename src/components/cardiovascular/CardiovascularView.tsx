import { supabase } from '../../services/supabase';
import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
   ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import {
  Activity,
  Heart,
  AlertCircle,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Info,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  TrendingUp,
  Zap,
  Eye,
  Brain,
} from 'lucide-react';
import { analyzeEcgImage, EcgAnalysisResult } from '../../services/ecgApi';

import { AstronautProfile } from '../../types';

interface CardiovascularViewProps {
  astronaut: AstronautProfile;
}

const ECG_LEVEL_STYLE = {
  normal: 'bg-emerald-950/40 border-emerald-800 text-emerald-200',
  caution: 'bg-yellow-950/40 border-yellow-800 text-yellow-200',
  warning: 'bg-amber-950/40 border-amber-700 text-amber-200',
  critical: 'bg-rose-950/50 border-rose-700 text-rose-200',
} as const;

const ECG_LEVEL_BG = {
  normal: 'from-emerald-950/60 via-[#0b1329] to-[#07101f]',
  caution: 'from-yellow-950/60 via-[#0b1329] to-[#07101f]',
  warning: 'from-amber-950/60 via-[#0b1329] to-[#07101f]',
  critical: 'from-rose-950/60 via-[#0b1329] to-[#07101f]',
} as const;

const ECG_LEVEL_GLOW = {
  normal: 'bg-emerald-500/10',
  caution: 'bg-yellow-500/10',
  warning: 'bg-amber-500/10',
  critical: 'bg-rose-500/15',
} as const;

const ECG_LEVEL_LABEL = {
  normal: '✓ No Clinical Warnings',
  caution: '⚠ Caution — Monitor Closely',
  warning: '⚠ Warning — Medical Review Recommended',
  critical: '🚨 Critical — Seek Immediate Medical Review',
} as const;

const ECG_LEVEL_ICON_COLOR = {
  normal: 'text-emerald-400',
  caution: 'text-yellow-400',
  warning: 'text-amber-400',
  critical: 'text-rose-400',
} as const;

// Plain-language explanations of common ECG findings for astronauts
const ECG_PLAIN_LANGUAGE: Record<string, { meaning: string; concern: string; action: string }> = {
  'Normal Sinus Rhythm': {
    meaning: 'Your heart is beating in a normal, regular rhythm.',
    concern: 'No concern',
    action: 'Continue current health monitoring routine.',
  },
  'Sinus Bradycardia': {
    meaning: 'Your resting heart rate is slower than the typical range (below 60 bpm).',
    concern: 'Often normal for well-conditioned astronauts. Can be related to microgravity adaptation.',
    action: 'Note if accompanied by dizziness or fatigue. Report to flight surgeon if symptomatic.',
  },
  'Sinus Tachycardia': {
    meaning: 'Your heart is beating faster than usual (above 100 bpm at rest).',
    concern: 'May indicate stress, dehydration, or cardiovascular strain during mission activities.',
    action: 'Rest and rehydrate. If persistent, contact Dr. Chen during next comms window.',
  },
  'Atrial Fibrillation': {
    meaning: 'The upper chambers of your heart are beating irregularly instead of rhythmically.',
    concern: 'This is an arrhythmia that requires medical evaluation.',
    action: 'Report to flight surgeon immediately via priority comms.',
  },
  'ST Depression': {
    meaning: 'A segment of your ECG pattern is shifted downward from the normal baseline.',
    concern: 'Can indicate reduced blood flow to part of the heart muscle.',
    action: 'Avoid strenuous activity. Contact flight surgeon for immediate review.',
  },
  'ST Elevation': {
    meaning: 'A segment of your ECG pattern is elevated above baseline.',
    concern: 'May indicate injury to heart muscle — requires urgent medical assessment.',
    action: 'STOP all physical activity. Contact Ground Medical immediately.',
  },
  'T Wave Inversion': {
    meaning: 'The T waves on your ECG are flipped compared to normal orientation.',
    concern: 'Can indicate coronary artery issues or be a benign finding.',
    action: 'Report to flight surgeon at next scheduled communications pass.',
  },
  '1st Degree AV Block': {
    meaning: 'Electrical signals from your heart\'s upper to lower chambers are slightly delayed.',
    concern: 'Usually benign and common. Can be a normal variant especially in athletes.',
    action: 'Note and monitor. Report if you feel palpitations or fainting.',
  },
  'Bundle Branch Block': {
    meaning: 'The electrical pathway that coordinates your heart\'s lower chamber contractions is affected.',
    concern: 'May be pre-existing or new. Needs comparison with baseline ECG.',
    action: 'Report to flight surgeon for comparison with pre-flight ECG records.',
  },
  'Premature Ventricular Contraction': {
    meaning: 'You have occasional extra heartbeats originating in the lower chambers of your heart.',
    concern: 'Usually harmless and common. Can feel like a "skipped beat" or flutter.',
    action: 'Note frequency. If more than 6 per minute or causing symptoms, report to flight surgeon.',
  },
};

function getPlainLanguage(label: string) {
  const key = Object.keys(ECG_PLAIN_LANGUAGE).find(k =>
    label.toLowerCase().includes(k.toLowerCase())
  );
  return key ? ECG_PLAIN_LANGUAGE[key] : null;
}

export const CardiovascularView: React.FC<CardiovascularViewProps> = ({ astronaut }) => {
  const [ecgPhase, setEcgPhase] = useState(0);
  const [ecgImage, setEcgImage] = useState<File | null>(null);
  const [ecgPreview, setEcgPreview] = useState<string | null>(null);
  const [ecgLayout, setEcgLayout] = useState<'standard_12' | 'single_lead'>('standard_12');
  const [ecgRows, setEcgRows] = useState<3 | 4>(3);
  const [ecgCropTop, setEcgCropTop] = useState(0);
  const [ecgLoading, setEcgLoading] = useState(false);
  const [ecgResult, setEcgResult] = useState<EcgAnalysisResult | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [spo2, setSpo2] = useState('');
  const [hrv, setHrv] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [savedMeasurements, setSavedMeasurements] = useState({
    heartRate: '',
    systolic: '',
    diastolic: '',
    spo2: '',
    hrv: '',
    timestamp: ''
  });
  const [measurementHistory, setMeasurementHistory] = useState<any[]>([]);
  const [personalBaseline, setPersonalBaseline] = useState<any>(null);
  const [measurementMessage, setMeasurementMessage] = useState('');
  const [isLoadingMeasurements, setIsLoadingMeasurements] = useState(true);
  const [isSavingMeasurement, setIsSavingMeasurement] = useState(false);
  const [showFullPredictions, setShowFullPredictions] = useState(false);

  const handleEcgUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a JPG, JPEG, or PNG image.');
      return;
    }
    if (ecgPreview) URL.revokeObjectURL(ecgPreview);
    setEcgImage(file);
    setEcgPreview(URL.createObjectURL(file));
    setUploadError('');
  };

  const loadSavedMeasurements = async () => {
    setIsLoadingMeasurements(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) { setMeasurementMessage('Please sign in to view your measurements.'); return; }
      const { data, error } = await supabase
        .from('health_measurements')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setSavedMeasurements({
          heartRate: data.heart_rate?.toString() || '',
          systolic: data.systolic_bp?.toString() || '',
          diastolic: data.diastolic_bp?.toString() || '',
          spo2: data.spo2?.toString() || '',
          hrv: data.hrv?.toString() || '',
          timestamp: new Date(data.recorded_at).toLocaleString()
        });
      }
    } catch (error: any) {
      console.error('Measurement loading error:', error);
      setMeasurementMessage('Could not load saved measurements.');
    } finally {
      setIsLoadingMeasurements(false);
    }
  };

  const removeEcgImage = () => {
    if (ecgPreview) URL.revokeObjectURL(ecgPreview);
    setEcgImage(null);
    setEcgPreview(null);
    setUploadError('');
    setEcgResult(null);
  };

  const runEcgAnalysis = async () => {
    if (!ecgImage) return;
    setEcgLoading(true);
    setUploadError('');
    setEcgResult(null);
    try {
      const result = await analyzeEcgImage(ecgImage, {
        layout: ecgLayout,
        rows: ecgRows,
        cropTop: ecgCropTop / 100,
      });
      setEcgResult(result);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Please sign in to save this analysis.');
      const warningNotes = result.warnings.map((w) => `${w.title}: ${w.detail}`);
      const digitizationNotes = result.digitization.notes;
      const predictionNotes = result.predictions.slice(0, 5).map((p) => `${p.label}: ${(p.probability * 100).toFixed(1)}%`);
      const notes = [...warningNotes, ...digitizationNotes, `Top predictions: ${predictionNotes.join(', ')}`].join('\n');
      const { error: saveError } = await supabase.from('analysis_history').insert({
        user_id: user.id,
        scan_type: 'ECG Analysis',
        source: 'ecg_fm',
        astronaut_name: astronaut.name,
        primary_metric: [`Level: ${result.overall_level}`, result.heart_rate_bpm !== null ? `Heart rate: ${result.heart_rate_bpm} bpm` : null].filter(Boolean).join(' | '),
        notes: notes,
        status: result.overall_level,
        thumbnail_url: null,
        metadata: { filename: ecgImage.name, layout: ecgLayout, rows: ecgRows, cropTop: ecgCropTop, result: result },
      });
      if (saveError) throw saveError;
    } catch (error: any) {
      console.error('ECG analysis/history error:', error);
      setUploadError(error.message || 'ECG analysis or history saving failed.');
    } finally {
      setEcgLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => { setEcgPhase((p) => (p + 1) % 100); }, 50);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadSavedMeasurements();
    loadMeasurementHistory();
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

  const handleSaveMeasurements = async () => {
    setMeasurementMessage('');
    if (!heartRate || !systolic || !diastolic || !spo2 || !hrv) {
      setMeasurementMessage('Please enter all measurements.');
      return;
    }
    const sys = Number(systolic);
    const dia = Number(diastolic);
    const oxygen = Number(spo2);
    const variability = Number(hrv);
    const hr = Number(heartRate);
    if (!Number.isFinite(sys) || !Number.isFinite(dia) || !Number.isFinite(oxygen) || !Number.isFinite(variability) || !Number.isFinite(hr) || sys <= 0 || dia <= 0 || sys <= dia || oxygen < 0 || oxygen > 100 || hr <= 0 || variability <= 0) {
      setMeasurementMessage('Please check your entered values.');
      return;
    }
    setIsSavingMeasurement(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) { setMeasurementMessage('Please sign in before saving measurements.'); return; }
      const { error } = await supabase.from('health_measurements').insert({
        user_id: user.id,
        heart_rate: ecgResult?.heart_rate_bpm ?? hr,
        systolic_bp: sys,
        diastolic_bp: dia,
        spo2: oxygen,
        hrv: variability
      });
      if (error) throw error;
      setSavedMeasurements({
        heartRate: ecgResult?.heart_rate_bpm?.toString() || hr.toString(),
        systolic,
        diastolic,
        spo2,
        hrv,
        timestamp: new Date().toLocaleString()
      });
      setMeasurementMessage('Measurements saved successfully.');
      setSystolic('');
      setDiastolic('');
      setSpo2('');
      setHrv('');
      setHeartRate('');
      loadMeasurementHistory();
    } catch (error: any) {
      console.error('Measurement save error:', error);
      setMeasurementMessage(error.message || 'Failed to save measurements.');
    } finally {
      setIsSavingMeasurement(false);
    }
  };

  const loadMeasurementHistory = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;
      const { data: measurements, error: measurementError } = await supabase
        .from('health_measurements')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: true });
      if (measurementError) throw measurementError;
      setMeasurementHistory(measurements || []);
      const { data: baseline, error: baselineError } = await supabase
        .from('astronaut_baselines')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_current', true)
        .maybeSingle();
      if (baselineError) throw baselineError;
      setPersonalBaseline(baseline);
    } catch (error) {
      console.error('Error loading cardiovascular data:', error);
    }
  };

  const predictionsToShow = showFullPredictions ? ecgResult?.predictions : ecgResult?.predictions.slice(0, 5);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

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

      {/* Animated ECG Banner */}
      <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Live Rhythm Monitor — Lead II
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-[#060a17] border border-[#152349] px-2 py-0.5 rounded">
            50 mm/s · 10 mm/mV
          </span>
        </div>
        <div className="h-28 bg-[#060a17] rounded-lg border border-[#152349] relative overflow-hidden">
          {/* Grid lines */}
          <svg viewBox="0 0 600 120" className="absolute inset-0 w-full h-full opacity-20">
            {[0,30,60,90,120,150,180,210,240,270,300,330,360,390,420,450,480,510,540,570,600].map(x => (
              <line key={x} x1={x} y1={0} x2={x} y2={120} stroke="#22d3ee" strokeWidth="0.5" />
            ))}
            {[0,20,40,60,80,100,120].map(y => (
              <line key={y} x1={0} y1={y} x2={600} y2={y} stroke="#22d3ee" strokeWidth="0.5" />
            ))}
          </svg>
          <svg viewBox="0 0 600 120" className="w-full h-full relative">
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

      {/* ECG Image Upload & Analysis */}
      <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            ECG Image Analysis — Upload & Interpret
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Upload an ECG recording image for ECG-FM foundation model analysis. Results are explained in plain language for astronaut readability.
          </p>
        </div>

        {!ecgPreview ? (
          <label className="flex flex-col items-center justify-center gap-3
            border-2 border-dashed border-[#263b68] rounded-xl p-8
            cursor-pointer hover:border-cyan-500 transition-colors group">
            <div className="w-16 h-16 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center group-hover:bg-cyan-400/20 transition-colors">
              <Upload className="w-8 h-8 text-cyan-400" />
            </div>
            <span className="text-sm font-semibold text-white">Upload ECG Image</span>
            <span className="text-xs text-slate-400">Supports JPG, JPEG, PNG · Standard 12-lead or single strip</span>
            <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={handleEcgUpload} className="hidden" />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-mono">{ecgImage?.name}</span>
              <button onClick={removeEcgImage} className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-xs">
                <X className="w-4 h-4" /> Remove
              </button>
            </div>
            <div className="bg-[#060a17] rounded-lg border border-[#152349] p-3">
              <img src={ecgPreview} alt="Uploaded ECG" className="max-h-96 mx-auto object-contain rounded" />
            </div>

            {/* Analysis Options */}
            <div className="flex flex-wrap gap-3 text-xs text-slate-300">
              <label className="flex items-center gap-1.5">
                Layout
                <select value={ecgLayout} onChange={(e) => setEcgLayout(e.target.value as 'standard_12' | 'single_lead')}
                  className="bg-[#060a17] border border-[#152349] rounded px-2 py-1 text-white">
                  <option value="standard_12">12-lead sheet (3×4)</option>
                  <option value="single_lead">Single strip</option>
                </select>
              </label>
              {ecgLayout === 'standard_12' && (
                <select value={ecgRows} onChange={(e) => setEcgRows(Number(e.target.value) as 3 | 4)}
                  className="bg-[#060a17] border border-[#152349] rounded px-2 py-1 text-white">
                  <option value={3}>No rhythm strip</option>
                  <option value={4}>Has rhythm strip</option>
                </select>
              )}
              <label className="flex items-center gap-1.5" title="Ignore the top part if it has patient text">
                Ignore header
                <input type="number" min={0} max={60} step={5} value={ecgCropTop}
                  onChange={(e) => setEcgCropTop(Math.max(0, Math.min(60, Number(e.target.value) || 0)))}
                  className="w-14 bg-[#060a17] border border-[#152349] rounded px-2 py-1 text-white" /> %
              </label>
            </div>

            <button onClick={runEcgAnalysis} disabled={ecgLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-700 to-cyan-500 hover:from-cyan-600 hover:to-cyan-400 disabled:opacity-50
                text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 transition-all">
              {ecgLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {ecgLoading ? 'Analysing ECG Signal…' : '⚡ Analyze ECG with AI'}
            </button>

            {/* ═══ ENHANCED ECG RESULTS PANEL ═══ */}
            {ecgResult && (
              <div className="space-y-5 mt-2">

                {/* ── OVERVIEW HEADER ── */}
                <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${ECG_LEVEL_BG[ecgResult.overall_level]} p-6`}
                  style={{ borderColor: ecgResult.overall_level === 'normal' ? '#065f46' : ecgResult.overall_level === 'critical' ? '#9f1239' : ecgResult.overall_level === 'warning' ? '#92400e' : '#713f12' }}>
                  <div className={`absolute -right-12 -top-12 w-48 h-48 rounded-full ${ECG_LEVEL_GLOW[ecgResult.overall_level]} blur-3xl`} />
                  <div className="relative">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold tracking-[0.2em] uppercase">
                          <Activity className="w-4 h-4" />
                          ECG Analysis Report — Astronaut Summary
                        </div>
                        <h3 className="text-2xl font-bold text-white mt-3">Analysis Complete</h3>
                        <p className="text-xs text-slate-400 mt-1">ECG-FM foundation model · Signal interpretation for {astronaut.name}</p>
                      </div>
                      <div className={`self-start px-4 py-2.5 rounded-xl border text-sm font-bold ${ECG_LEVEL_STYLE[ecgResult.overall_level]}`}>
                        {ECG_LEVEL_LABEL[ecgResult.overall_level]}
                      </div>
                    </div>

                    {/* Key Metrics Row */}
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl bg-white/[0.05] border border-white/10 p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                          <Heart className="w-3.5 h-3.5 text-rose-400" />
                          Heart Rate
                        </div>
                        <div className="text-3xl font-bold text-white">
                          {ecgResult.heart_rate_bpm ?? '—'}
                          <span className="text-sm font-normal text-slate-400 ml-1">bpm</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">ECG-derived</p>
                      </div>
                      <div className="rounded-xl bg-white/[0.05] border border-white/10 p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                          <Activity className="w-3.5 h-3.5 text-cyan-400" />
                          RR Irregularity
                        </div>
                        <div className="text-3xl font-bold text-white">
                          {ecgResult.rr_irregularity !== null ? (ecgResult.rr_irregularity * 100).toFixed(1) : '—'}
                          <span className="text-sm font-normal text-slate-400 ml-1">%</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{ecgResult.rr_irregularity !== null ? (ecgResult.rr_irregularity < 0.1 ? '✓ Regular rhythm' : '⚠ Irregular rhythm') : 'Not measured'}</p>
                      </div>
                      <div className="rounded-xl bg-white/[0.05] border border-white/10 p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                          <Zap className="w-3.5 h-3.5 text-violet-400" />
                          Leads Captured
                        </div>
                        <div className="text-3xl font-bold text-white">
                          {ecgResult.digitization.leads_recorded.length}
                          <span className="text-sm font-normal text-slate-400 ml-1">leads</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{ecgResult.digitization.leads_recorded.join(', ') || 'Unknown'}</p>
                      </div>
                      <div className="rounded-xl bg-white/[0.05] border border-white/10 p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          Signal Quality
                        </div>
                        <div className="text-3xl font-bold text-white">
                          {Math.round(ecgResult.digitization.trace_coverage * 100)}
                          <span className="text-sm font-normal text-slate-400 ml-1">%</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Trace coverage</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── WARNINGS — Plain Language ── */}
                {ecgResult.warnings.length > 0 && (
                  <div className="rounded-2xl bg-[#0b1329] border border-amber-700/40 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      <h3 className="text-sm font-bold text-amber-300">Clinical Alerts — Action Required</h3>
                    </div>
                    <div className="space-y-4">
                      {ecgResult.warnings.map((w, i) => (
                        <div key={i} className="rounded-xl bg-amber-500/[0.07] border border-amber-500/25 p-4">
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${w.level === 'critical' ? 'bg-rose-900/60 text-rose-300 border border-rose-700' : w.level === 'warning' ? 'bg-amber-900/60 text-amber-300 border border-amber-700' : 'bg-yellow-900/60 text-yellow-300 border border-yellow-700'}`}>
                              {w.level.toUpperCase()}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-white">{w.title}</p>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{w.detail}</p>
                              {/* Plain language explanation */}
                              <div className="mt-3 p-3 rounded-lg bg-black/20 border border-white/[0.06] space-y-1.5">
                                <p className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wider">What this means for you:</p>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                  {w.level === 'critical'
                                    ? 'This finding requires immediate medical review. Stop strenuous activities and contact your flight surgeon now.'
                                    : w.level === 'warning'
                                    ? 'This finding warrants medical attention. Report this to Dr. Chen during the next communications window.'
                                    : 'This is a cautionary finding. Monitor symptoms and note in your health log.'}
                                </p>
                                <p className="text-xs font-medium text-amber-300">
                                  → Recommended action: {w.level === 'critical' ? 'Contact Ground Medical immediately via priority comms.' : w.level === 'warning' ? 'Report at next scheduled comms pass.' : 'Log and monitor. Report if symptoms develop.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ecgResult.warnings.length === 0 && (
                  <div className="rounded-2xl bg-emerald-950/20 border border-emerald-800/40 p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-300">No Clinical Warnings Generated</p>
                      <p className="text-xs text-slate-400 mt-0.5">The AI model did not detect any flagged arrhythmias or abnormalities requiring immediate attention.</p>
                    </div>
                  </div>
                )}

                {/* ── AI PREDICTIONS — Plain Language ── */}
                <div className="rounded-2xl bg-[#0b1329] border border-[#17254d] p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm font-bold text-white">What the AI Detected</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        The ECG-FM model analyzed your heart's electrical patterns and assigned probability scores to these findings.
                        Higher percentage = stronger match to that pattern.
                      </p>
                    </div>
                    <Activity className="w-5 h-5 text-cyan-400 shrink-0" />
                  </div>

                  <div className="space-y-4">
                    {predictionsToShow?.map((p, i) => {
                      const pct = p.probability * 100;
                      const plainLang = getPlainLanguage(p.label);
                      const barColor = pct > 50 ? 'from-cyan-600 to-cyan-300' : pct > 20 ? 'from-violet-600 to-violet-400' : 'from-slate-600 to-slate-500';
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between gap-3">
                            <div>
                              <span className="text-sm text-slate-200 font-semibold">{p.label}</span>
                              {i === 0 && <span className="ml-2 text-[10px] font-mono bg-cyan-900/60 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded">Top finding</span>}
                            </div>
                            <span className="text-sm font-mono font-bold text-cyan-300 shrink-0">{pct.toFixed(1)}%</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-[#172442] overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                              style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                            />
                          </div>
                          {plainLang && pct > 10 && (
                            <div className="pl-2 border-l-2 border-cyan-800/50">
                              <p className="text-[11px] text-slate-400 leading-relaxed">{plainLang.meaning}</p>
                              {pct > 30 && (
                                <p className="text-[11px] text-cyan-400/80 mt-0.5">→ {plainLang.action}</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {ecgResult.predictions.length > 5 && (
                    <button
                      onClick={() => setShowFullPredictions(!showFullPredictions)}
                      className="mt-4 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {showFullPredictions ? 'Show top 5 only' : `Show all ${ecgResult.predictions.length} predictions`}
                    </button>
                  )}

                  <div className="mt-4 p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      <strong className="text-slate-400">Scores are not diagnoses.</strong> These percentages represent the AI model's pattern matching output, not confirmed clinical probabilities. A score of 85% for "Normal Sinus Rhythm" means the model found strong similarity to that pattern — not that there is an 85% clinical certainty.
                    </p>
                  </div>
                </div>

                {/* ── SIGNAL QUALITY & TECHNICAL DETAILS ── */}
                <div className="rounded-2xl bg-[#0b1329] border border-[#17254d] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">Signal Processing & Technical Details</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
                    <div className="p-3 rounded-lg bg-[#060a17] border border-[#152349]">
                      <span className="text-slate-500 block">Analysis time</span>
                      <span className="text-white font-mono font-bold">{ecgResult.inference_time_ms} ms</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#060a17] border border-[#152349]">
                      <span className="text-slate-500 block">Segments analyzed</span>
                      <span className="text-white font-mono font-bold">{ecgResult.segments_analysed}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#060a17] border border-[#152349]">
                      <span className="text-slate-500 block">Model version</span>
                      <span className="text-white font-mono font-bold">{ecgResult.model_version}</span>
                    </div>
                  </div>
                  {ecgResult.digitization.notes.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-400 font-semibold">Processing notes:</p>
                      {ecgResult.digitization.notes.map((note, i) => (
                        <p key={i} className="text-xs text-slate-400 flex gap-2">
                          <span className="text-cyan-400">•</span>{note}
                        </p>
                      ))}
                    </div>
                  )}
                  {ecgResult.limitations.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <p className="text-xs text-slate-400 font-semibold">System limitations:</p>
                      {ecgResult.limitations.map((lim, i) => (
                        <p key={i} className="text-xs text-slate-500 flex gap-2">
                          <span className="text-amber-600">•</span>{lim}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── MEDICAL DISCLAIMER ── */}
                <div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-300 mb-1">AI Screening Aid — Not a Medical Diagnosis</p>
                    <p className="text-xs leading-relaxed text-slate-400">
                      This experimental AI system provides screening support only. Model predictions are not medical diagnoses.
                      All concerning findings require review by Dr. Sarah Chen, your designated Flight Surgeon.
                      Image quality and ECG digitization accuracy affect results.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {uploadError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-950/30 border border-rose-800/50">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-300">{uploadError}</p>
              </div>
            )}
          </div>
        )}

        <p className="text-[11px] text-amber-300/70 border-t border-[#17254d] pt-3">
          Screening aid only — not a diagnosis. Image quality affects result accuracy. A clinician must review every warning.
        </p>
      </div>

      {/* 4 Core Cardiovascular Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Heart Rate */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-rose-500/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Heart Rate</span>
              <Heart className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {savedMeasurements.heartRate || '--'}
              <span className="text-xs font-normal text-slate-400"> bpm</span>
            </div>
            <div className="text-[11px] text-cyan-300 mt-1">
              {ecgResult?.heart_rate_bpm != null ? 'Source: Latest ECG analysis' : savedMeasurements.heartRate ? 'Source: Manual entry' : 'No reading yet'}
            </div>
            {personalBaseline?.resting_heart_rate && savedMeasurements.heartRate && (
              <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>vs baseline {personalBaseline.resting_heart_rate} bpm</span>
              </div>
            )}
          </div>
        </div>

        {/* Blood Pressure */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-cyan-500/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Blood Pressure</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {savedMeasurements.systolic && savedMeasurements.diastolic
                ? `${savedMeasurements.systolic}/${savedMeasurements.diastolic}`
                : '--'}
              <span className="text-xs font-normal text-slate-400"> mmHg</span>
            </div>
            {savedMeasurements.systolic && savedMeasurements.diastolic && (
              <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 mt-1">
                <span>MAP: {Math.round((Number(savedMeasurements.systolic) + 2 * Number(savedMeasurements.diastolic)) / 3)} mmHg</span>
              </div>
            )}
          </div>
        </div>

        {/* SpO2 */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-indigo-500/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Oxygen Saturation (SpO₂)</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {savedMeasurements.spo2 || '--'}
              <span className="text-xs font-normal text-slate-400">%</span>
            </div>
            <div className={`text-[11px] font-mono mt-1 ${Number(savedMeasurements.spo2) >= 95 ? 'text-emerald-400' : Number(savedMeasurements.spo2) > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
              {savedMeasurements.spo2 ? (Number(savedMeasurements.spo2) >= 95 ? '✓ Nominal' : '⚠ Below threshold') : 'Cabin O₂ stable'}
            </div>
          </div>
        </div>

        {/* HRV */}
        <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-cyan-500/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>HR Variability (RMSSD)</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {savedMeasurements.hrv || '--'}
              <span className="text-xs font-normal text-slate-400"> ms</span>
            </div>
            {personalBaseline?.hrv && savedMeasurements.hrv && (
              <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-300 mt-1">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>vs baseline {personalBaseline.hrv} ms</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Cardiovascular Measurements */}
      <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white">Log Manual Cardiovascular Measurements</h3>
          <p className="text-xs text-slate-400 mt-1">
            Enter measurements collected from monitoring devices. These are saved to your health record.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-xs text-slate-300 block mb-1.5">Heart Rate (BPM)</label>
            <input type="number" min="1" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} placeholder="e.g. 72"
              className="w-full bg-[#060a17] border border-[#263b68] rounded-lg p-2 text-white text-sm focus:border-cyan-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-300 block mb-1.5">Systolic BP (mmHg)</label>
            <input type="number" value={systolic} onChange={(e) => setSystolic(e.target.value)} placeholder="e.g. 120"
              className="w-full bg-[#060a17] border border-[#263b68] rounded-lg p-2 text-white text-sm focus:border-cyan-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-300 block mb-1.5">Diastolic BP (mmHg)</label>
            <input type="number" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} placeholder="e.g. 80"
              className="w-full bg-[#060a17] border border-[#263b68] rounded-lg p-2 text-white text-sm focus:border-cyan-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-300 block mb-1.5">SpO₂ (%)</label>
            <input type="number" min="0" max="100" step="0.1" value={spo2} onChange={(e) => setSpo2(e.target.value)} placeholder="e.g. 98"
              className="w-full bg-[#060a17] border border-[#263b68] rounded-lg p-2 text-white text-sm focus:border-cyan-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-300 block mb-1.5">HRV — RMSSD (ms)</label>
            <input type="number" min="0" step="0.1" value={hrv} onChange={(e) => setHrv(e.target.value)} placeholder="e.g. 42"
              className="w-full bg-[#060a17] border border-[#263b68] rounded-lg p-2 text-white text-sm focus:border-cyan-500 focus:outline-none" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button type="button" onClick={handleSaveMeasurements} disabled={isSavingMeasurement}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-700 to-cyan-500 hover:from-cyan-600 hover:to-cyan-400 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-cyan-900/20 transition-all">
            {isSavingMeasurement ? 'Saving…' : 'Save Measurements'}
          </button>
          {measurementMessage && (
            <p className={`text-xs ${measurementMessage.includes('success') ? 'text-emerald-400' : 'text-amber-300'}`}>
              {measurementMessage}
            </p>
          )}
        </div>
      </div>

      {/* Cardiovascular Measurement Trends */}
      <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white">Cardiovascular Measurement Trends</h3>
          <p className="text-xs text-slate-400 mt-1">Historical measurements recorded vs personal baseline.</p>
        </div>

        {measurementHistory.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
            <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No measurement history yet.</p>
            <p className="text-xs text-slate-500 mt-1">Save your first measurements above to build a trend.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Heart Rate */}
            <div className="bg-[#060a17] border border-[#17254d] rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Heart Rate (BPM)
              </h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={measurementHistory.filter(item => item.heart_rate != null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2c4e" />
                  <XAxis dataKey="recorded_at" tickFormatter={v => new Date(v).toLocaleDateString()} stroke="#475569" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#08152b', border: '1px solid #294365', borderRadius: 8, fontSize: 11 }} labelFormatter={v => new Date(String(v)).toLocaleString()} />
                  {personalBaseline?.resting_heart_rate != null && (
                    <ReferenceLine y={Number(personalBaseline.resting_heart_rate)} stroke="#fbbf24" strokeDasharray="6 4"
                      label={{ value: 'Baseline', fill: '#fbbf24', fontSize: 10, position: 'insideTopRight' }} />
                  )}
                  <Line type="monotone" dataKey="heart_rate" stroke="#f87171" strokeWidth={2} dot={{ r: 4, fill: '#f87171' }} connectNulls={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* SpO2 */}
            <div className="bg-[#060a17] border border-[#17254d] rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Blood Oxygen (SpO₂ %)
              </h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={measurementHistory.filter(item => item.spo2 != null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2c4e" />
                  <XAxis dataKey="recorded_at" tickFormatter={v => new Date(v).toLocaleDateString()} stroke="#475569" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ background: '#08152b', border: '1px solid #294365', borderRadius: 8, fontSize: 11 }} labelFormatter={v => new Date(String(v)).toLocaleString()} />
                  {personalBaseline?.spo2 != null && (
                    <ReferenceLine y={Number(personalBaseline.spo2)} stroke="#fbbf24" strokeDasharray="6 4"
                      label={{ value: 'Baseline', fill: '#fbbf24', fontSize: 10, position: 'insideTopRight' }} />
                  )}
                  <Line type="monotone" dataKey="spo2" stroke="#34d399" strokeWidth={2} dot={{ r: 4, fill: '#34d399' }} connectNulls={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Blood Pressure */}
            <div className="bg-[#060a17] border border-[#17254d] rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Blood Pressure (mmHg)
              </h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={measurementHistory.filter(item => item.systolic_bp != null && item.diastolic_bp != null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2c4e" />
                  <XAxis dataKey="recorded_at" tickFormatter={v => new Date(v).toLocaleDateString()} stroke="#475569" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#08152b', border: '1px solid #294365', borderRadius: 8, fontSize: 11 }} labelFormatter={v => new Date(String(v)).toLocaleString()} />
                  {personalBaseline?.systolic_bp != null && (
                    <ReferenceLine y={Number(personalBaseline.systolic_bp)} stroke="#fbbf24" strokeDasharray="6 4"
                      label={{ value: 'Sys baseline', fill: '#fbbf24', fontSize: 10, position: 'insideTopRight' }} />
                  )}
                  {personalBaseline?.diastolic_bp != null && (
                    <ReferenceLine y={Number(personalBaseline.diastolic_bp)} stroke="#a78bfa" strokeDasharray="6 4"
                      label={{ value: 'Dia baseline', fill: '#a78bfa', fontSize: 10, position: 'insideBottomRight' }} />
                  )}
                  <Line type="monotone" dataKey="systolic_bp" name="Systolic" stroke="#f87171" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="diastolic_bp" name="Diastolic" stroke="#60a5fa" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* HRV */}
            <div className="bg-[#060a17] border border-[#17254d] rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-violet-400" />
                Heart Rate Variability (ms)
              </h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={measurementHistory.filter(item => item.hrv != null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2c4e" />
                  <XAxis dataKey="recorded_at" tickFormatter={v => new Date(v).toLocaleDateString()} stroke="#475569" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#08152b', border: '1px solid #294365', borderRadius: 8, fontSize: 11 }} labelFormatter={v => new Date(String(v)).toLocaleString()} />
                  {personalBaseline?.hrv != null && (
                    <ReferenceLine y={Number(personalBaseline.hrv)} stroke="#fbbf24" strokeDasharray="6 4"
                      label={{ value: 'Baseline', fill: '#fbbf24', fontSize: 10, position: 'insideTopRight' }} />
                  )}
                  <Line type="monotone" dataKey="hrv" stroke="#c084fc" strokeWidth={2} dot={{ r: 4, fill: '#c084fc' }} connectNulls={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
