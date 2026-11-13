import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  AlertTriangle,
  Info,
  CheckCircle2,
  PhoneCall,
  Activity,
  ScanLine,
  Eye,
  Heart,
  ArrowRight,
  Loader2,
  RefreshCw,
  Zap,
  ShieldAlert,
  BookOpen,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { AstronautProfile, NavigationTab } from '../../types';

interface HealthGuidanceViewProps {
  astronaut: AstronautProfile;
  onNavigate: (tab: NavigationTab) => void;
}

type EcgData = {
  overall_level: 'normal' | 'caution' | 'warning' | 'critical';
  heart_rate_bpm: number | null;
  warnings: { level: string; title: string; detail: string }[];
  predictions: { label: string; probability: number }[];
  created_at: string;
};

type HealthSnapshot = {
  heart_rate: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  spo2: number | null;
  hrv: number | null;
  recorded_at: string;
};

type BaselineData = {
  resting_heart_rate: number | null;
  systolic_bp: number | null;
  spo2: number | null;
  hrv: number | null;
};

type IjvData = {
  primary_metric: string;
  notes: string;
  status: string;
  created_at: string;
};

const ECG_WARNING_EXPLANATIONS: Record<string, string> = {
  'ST Depression': 'Your heart\'s electrical pattern shows an ST segment depression, which can indicate the heart muscle may be receiving less blood than usual. This warrants medical attention.',
  'ST Elevation': 'An ST elevation pattern has been detected. This is a priority finding that may indicate cardiac muscle injury. Contact Ground Medical immediately.',
  'Atrial Fibrillation': 'Your heart\'s upper chambers appear to be beating irregularly. This arrhythmia can affect blood flow and requires flight surgeon evaluation.',
  'Ventricular Tachycardia': 'A fast, abnormal heart rhythm originating in the lower chambers was detected. This requires immediate medical review.',
  'T Wave Inversion': 'T wave inversions were detected in your ECG. While sometimes normal, they can indicate myocardial changes requiring evaluation.',
  'Bundle Branch Block': 'An electrical conduction delay in your heart\'s lower chamber pathway was detected. Needs comparison with your pre-flight baseline ECG.',
  'QT Prolongation': 'Your QT interval may be prolonged, which can affect heart rhythm stability. Important to report to your flight surgeon.',
};

function getEcgWarningExplanation(title: string): string {
  const key = Object.keys(ECG_WARNING_EXPLANATIONS).find(k => title.toLowerCase().includes(k.toLowerCase()));
  return key ? ECG_WARNING_EXPLANATIONS[key] : 'This ECG finding requires medical review by a qualified flight surgeon.';
}

export const HealthGuidanceView: React.FC<HealthGuidanceViewProps> = ({ astronaut, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ecgData, setEcgData] = useState<EcgData | null>(null);
  const [healthData, setHealthData] = useState<HealthSnapshot | null>(null);
  const [baseline, setBaseline] = useState<BaselineData | null>(null);
  const [ijvData, setIjvData] = useState<IjvData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      if (!user) throw new Error('Sign in to view guidance.');

      const [cvRes, baseRes, ecgRes, ijvRes] = await Promise.all([
        supabase.from('health_measurements').select('heart_rate,systolic_bp,diastolic_bp,spo2,hrv,recorded_at').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('astronaut_baselines').select('resting_heart_rate,systolic_bp,spo2,hrv').eq('user_id', user.id).eq('is_current', true).maybeSingle(),
        supabase.from('analysis_history').select('created_at,metadata,status').eq('user_id', user.id).eq('scan_type', 'ECG Analysis').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('analysis_history').select('primary_metric,notes,status,created_at').eq('user_id', user.id).eq('scan_type', 'IJV Ultrasound').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      setHealthData(cvRes.data as HealthSnapshot | null);
      setBaseline(baseRes.data as BaselineData | null);
      setIjvData(ijvRes.data as IjvData | null);

      if (ecgRes.data) {
        const result = (ecgRes.data.metadata as any)?.result;
        if (result) {
          setEcgData({
            overall_level: result.overall_level,
            heart_rate_bpm: result.heart_rate_bpm,
            warnings: result.warnings || [],
            predictions: result.predictions || [],
            created_at: ecgRes.data.created_at,
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load guidance data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  // Determine dynamic risk level
  const hasEcgCritical = ecgData?.overall_level === 'critical';
  const hasEcgWarning = ecgData?.overall_level === 'warning';
  const hasEcgCaution = ecgData?.overall_level === 'caution';
  const hasTachycardia = healthData?.heart_rate != null && healthData.heart_rate > 100;
  const hasHypoxia = healthData?.spo2 != null && healthData.spo2 < 95;
  const hasEcgAlerts = ecgData?.warnings != null && ecgData.warnings.length > 0;

  const overallRisk = hasEcgCritical || hasHypoxia
    ? { level: 'CRITICAL', color: 'text-rose-300', bg: 'bg-rose-950/30', border: 'border-rose-700/50', icon: ShieldAlert, iconColor: 'text-rose-400' }
    : hasEcgWarning || hasTachycardia
    ? { level: 'ELEVATED', color: 'text-amber-300', bg: 'bg-amber-950/30', border: 'border-amber-700/50', icon: AlertTriangle, iconColor: 'text-amber-400' }
    : hasEcgCaution
    ? { level: 'MONITOR', color: 'text-yellow-300', bg: 'bg-yellow-950/30', border: 'border-yellow-700/50', icon: AlertCircle, iconColor: 'text-yellow-400' }
    : { level: 'LOW RISK', color: 'text-emerald-300', bg: 'bg-emerald-950/30', border: 'border-emerald-700/50', icon: CheckCircle2, iconColor: 'text-emerald-400' };

  const RiskIcon = overallRisk.icon;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* Protocol Authority Notice */}
      <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/60 flex items-start gap-3.5 shadow-sm">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs leading-relaxed text-slate-300">
          <strong className="text-white block text-sm mb-1 font-semibold">Mission Medical Protocol Authority Notice</strong>
          This guidance interface translates physiological telemetry and AI analysis into protocol-aligned reference guidance.
          Automated analysis tools are supportive companions and <strong>do not substitute for qualified flight surgeon oversight</strong>.
          NASA/ESA mission flight rules and direct communication with Ground Medical take absolute priority.
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#152347]">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">Health Guidance & Mission Protocols</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic guidance based on your current health data, ECG analysis results, and mission protocol status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 bg-[#0e1837] px-3 py-1.5 rounded-lg border border-[#192b5b]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ground Medical Liaison: Dr. Sarah Chen</span>
          </div>
          <button onClick={loadData} disabled={loading}
            className="p-2 rounded-lg bg-[#14234e] hover:bg-[#1b2f69] text-slate-300 border border-slate-700/50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-300">Could not load guidance data</p>
            <p className="text-xs text-slate-400 mt-0.5">{error}</p>
            <button onClick={loadData} className="mt-2 text-xs font-semibold text-cyan-400 underline">Try again</button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Mission Health Status Overview Card */}
          <div className={`rounded-xl border p-6 ${overallRisk.bg} ${overallRisk.border}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${overallRisk.bg} border ${overallRisk.border}`}>
                  <RiskIcon className={`w-7 h-7 ${overallRisk.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Current Health Risk Assessment</p>
                  <p className={`text-2xl font-bold ${overallRisk.color}`}>{overallRisk.level}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {astronaut.name} · {astronaut.mission} · Flight Day {astronaut.daysInMission}
                  </p>
                </div>
              </div>
              {ecgData && (
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Last ECG Analysis</p>
                  <p className="text-xs text-slate-300 font-mono">
                    {new Date(ecgData.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className={`text-xs font-bold mt-0.5 ${ecgData.overall_level === 'normal' ? 'text-emerald-400' : ecgData.overall_level === 'critical' ? 'text-rose-400' : 'text-amber-400'}`}>
                    ECG: {ecgData.overall_level.toUpperCase()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ECG Alerts Section — Dynamic */}
          <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>1. ECG Analysis Alerts & Findings</span>
            </h3>

            {!ecgData ? (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-dashed border-slate-700">
                <p className="text-sm text-slate-400 font-semibold">No ECG Analysis on Record</p>
                <p className="text-xs text-slate-500 mt-1">Upload an ECG image in the Cardiovascular module to see AI analysis alerts here.</p>
                <button onClick={() => onNavigate('cardiovascular')} className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 pt-2 font-medium">
                  <span>Go to Cardiovascular Module</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : hasEcgAlerts ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${hasEcgCritical ? 'bg-rose-950/30 border-rose-700/50' : hasEcgWarning ? 'bg-amber-950/30 border-amber-700/50' : 'bg-yellow-950/30 border-yellow-700/50'}`}>
                  <AlertTriangle className={`w-5 h-5 shrink-0 ${hasEcgCritical ? 'text-rose-400 animate-pulse' : hasEcgWarning ? 'text-amber-400' : 'text-yellow-400'}`} />
                  <div>
                    <p className={`text-sm font-bold ${hasEcgCritical ? 'text-rose-300' : hasEcgWarning ? 'text-amber-300' : 'text-yellow-300'}`}>
                      {ecgData.warnings.length} Alert(s) Detected in Latest ECG
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {hasEcgCritical ? 'Requires immediate medical review.' : hasEcgWarning ? 'Requires medical review at next comms pass.' : 'Monitor symptoms and log any changes.'}
                      {ecgData.heart_rate_bpm !== null && ` ECG heart rate: ${ecgData.heart_rate_bpm} bpm.`}
                    </p>
                  </div>
                </div>

                {ecgData.warnings.map((w, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[#0e1939] border border-[#192c5d] space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${w.level === 'critical' ? 'bg-rose-900/60 text-rose-300 border-rose-700' : w.level === 'warning' ? 'bg-amber-900/60 text-amber-300 border-amber-700' : 'bg-yellow-900/60 text-yellow-300 border-yellow-700'}`}>
                          {w.level.toUpperCase()}
                        </span>
                        <p className="text-sm font-bold text-white">{w.title}</p>
                      </div>
                    </div>

                    {/* Technical finding */}
                    <div className="text-xs text-slate-400 leading-relaxed">{w.detail}</div>

                    {/* Plain language explanation */}
                    <div className="p-3 rounded-lg bg-black/20 border border-white/[0.06] space-y-2">
                      <p className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wider">What this means for you:</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{getEcgWarningExplanation(w.title)}</p>

                      <div className={`p-2.5 rounded-lg ${w.level === 'critical' ? 'bg-rose-950/50 border border-rose-800/50' : 'bg-amber-950/50 border border-amber-800/50'}`}>
                        <p className={`text-xs font-semibold ${w.level === 'critical' ? 'text-rose-300' : 'text-amber-300'}`}>
                          → Recommended Action:
                        </p>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {w.level === 'critical'
                            ? 'STOP strenuous activities immediately. Contact Dr. Sarah Chen via PRIORITY COMMS. Document onset of any chest pain, shortness of breath, or palpitations.'
                            : w.level === 'warning'
                            ? 'Avoid high-intensity EVA or exercise activities. Report this finding to Dr. Chen during the next scheduled communications pass today.'
                            : 'Note this finding in your health log. Report at next scheduled routine comms. Monitor for symptom development.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-300">ECG Analysis Clear — No Alerts</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Latest ECG (analyzed {new Date(ecgData.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}) returned normal status.
                    {ecgData.heart_rate_bpm !== null && ` ECG-derived heart rate: ${ecgData.heart_rate_bpm} bpm.`}
                  </p>
                  {ecgData.predictions.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Top AI finding: {ecgData.predictions[0].label} ({(ecgData.predictions[0].probability * 100).toFixed(1)}% match)
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Current Health Changes */}
          <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>2. Current Health Changes & Plain-Language Explanation</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* IJV Status */}
              <div className="p-4 rounded-xl bg-[#0e1939] border border-[#192c5d] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                    <ScanLine className="w-4 h-4 text-cyan-400" />
                    Internal Jugular Vein Status
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${ijvData?.status === 'Normal' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'}`}>
                    {ijvData ? ijvData.status : 'No data'}
                  </span>
                </div>
                {ijvData ? (
                  <>
                    <p className="text-slate-300 leading-relaxed">
                      <strong>Latest measurement:</strong> {ijvData.primary_metric}
                    </p>
                    <p className="text-slate-400 leading-relaxed">
                      <strong>Meaning:</strong> Without gravity pulling fluids toward your lower body, 1.5–2.0 liters of venous blood and
                      interstitial fluid shift toward your chest and head. Neck veins expand as a result. This is a normal and anticipated
                      physiological response during early spaceflight.
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Recorded: {new Date(ijvData.created_at).toLocaleString()}
                    </p>
                  </>
                ) : (
                  <p className="text-slate-400 leading-relaxed">
                    No IJV ultrasound data on record. Perform ultrasound scan using the IJV Analysis module.
                  </p>
                )}
              </div>

              {/* Cardiovascular Status */}
              <div className="p-4 rounded-xl bg-[#0e1939] border border-[#192c5d] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-400" />
                    Cardiovascular Status
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${hasTachycardia ? 'bg-amber-950 text-amber-300 border-amber-800' : hasHypoxia ? 'bg-rose-950 text-rose-300 border-rose-800' : healthData ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    {!healthData ? 'No data' : hasTachycardia ? 'Elevated HR' : hasHypoxia ? 'Low SpO₂' : 'Stable'}
                  </span>
                </div>
                {healthData ? (
                  <>
                    <p className="text-slate-300 leading-relaxed">
                      <strong>Latest readings:</strong>{' '}
                      {healthData.heart_rate != null ? `HR ${healthData.heart_rate} bpm` : ''}
                      {healthData.systolic_bp != null && healthData.diastolic_bp != null ? ` · BP ${healthData.systolic_bp}/${healthData.diastolic_bp} mmHg` : ''}
                      {healthData.spo2 != null ? ` · SpO₂ ${healthData.spo2}%` : ''}
                    </p>
                    <p className="text-slate-400 leading-relaxed">
                      <strong>Meaning:</strong>{' '}
                      {hasTachycardia
                        ? 'Your heart rate is elevated above 100 bpm. This may be related to current activity, dehydration, or cardiovascular strain. Rest and rehydrate.'
                        : hasHypoxia
                        ? 'Oxygen saturation is below 95%. Verify cabin atmosphere, check equipment, and report to Ground Medical immediately.'
                        : 'Cardiovascular readings are within acceptable mission ranges. Continue current countermeasure protocols.'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Recorded: {new Date(healthData.recorded_at).toLocaleString()}
                    </p>
                  </>
                ) : (
                  <p className="text-slate-400 leading-relaxed">
                    No cardiovascular measurements on record. Log measurements in the Cardiovascular module.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Information Gaps */}
          <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>3. Current Information Gaps & Technical Limitations</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#0e1736] border border-amber-900/40 text-slate-300 space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>ECG AI — Screening Only, Not Diagnosis</span>
                </div>
                <p className="leading-relaxed">
                  The ECG-FM foundation model analyzes pattern similarity from medical datasets. Its outputs are probability scores for recognized
                  patterns — not confirmed diagnoses. <strong>Every warning requires human flight surgeon evaluation.</strong>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#0e1736] border border-amber-900/40 text-slate-300 space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-semibold">
                  <ScanLine className="w-3.5 h-3.5 shrink-0" />
                  <span>IJV — Geometry Only, No Flow Assessment</span>
                </div>
                <p className="leading-relaxed">
                  The automated ultrasound segmentation engine measures vein cross-sectional area. It does not detect vascular thrombosis,
                  stagnant flow, or occlusions. Diagnosis of vascular abnormality requires Doppler evaluation by the Flight Surgeon.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#0e1736] border border-[#1a2d5e] text-slate-300 space-y-1">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  <span>SANS Risk — Optic Data Pending</span>
                </div>
                <p className="leading-relaxed">
                  Full ocular risk assessment for Spaceflight-Associated Neuro-ocular Syndrome requires paired fundoscopy and OCT scans.
                  IJV area data alone is insufficient to evaluate intracranial pressure risk.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Recommended Next Steps */}
          <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>4. Recommended Next Steps</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#0e1939] border border-[#192b5b] space-y-2">
                <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Exercise Countermeasures
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Continue the prescribed 2-hour daily resistive exercise protocol (ARED / cycle ergometer). This promotes peripheral
                  blood circulation and reduces cephalad venous pooling.
                </p>
                {hasTachycardia && (
                  <p className="text-amber-300 text-[11px]">⚠ Current elevated HR — reduce exercise intensity until readings normalize.</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-[#0e1939] border border-[#192b5b] space-y-2">
                <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <ScanLine className="w-3.5 h-3.5" />
                  {!ijvData ? 'First IJV Scan Needed' : 'Next IJV Scan Protocol'}
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {!ijvData
                    ? 'No IJV ultrasound has been recorded. Perform an initial B-mode neck ultrasound scan as per mission protocol.'
                    : `Next scheduled B-mode IJV ultrasound scan due on Flight Day ${astronaut.daysInMission + 2}. Ensure proper acoustic coupling.`}
                </p>
                <button onClick={() => onNavigate('ijv')} className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 pt-1 font-medium">
                  <span>Go to IJV Analysis Module</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#0e1939] border border-[#192b5b] space-y-2">
                <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Ground Medical Sync
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {hasEcgAlerts
                    ? 'PRIORITY: Prepare ECG alert summary for transmission to Dr. Sarah Chen before the next comms window.'
                    : 'Prepare your weekly Health Report summary for transmission to Dr. Sarah Chen at the 20:30 UTC medical conference pass.'}
                </p>
                <button onClick={() => onNavigate('reports')} className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 pt-1 font-medium">
                  <span>Prepare Ground Report</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Emergency Escalation */}
          <div className="bg-[#0b1329] border border-[#17254d] rounded-xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-amber-400" />
              <span>5. When to Contact Ground Medical Team (Escalation Criteria)</span>
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Notify Dr. Sarah Chen <strong>immediately</strong> during the next voice pass or via <strong>priority comms</strong> if you experience any of the following:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
              {[
                {
                  title: 'Visual Symptoms',
                  desc: 'Acute blurry vision, gray spots, loss of contrast, or choroidal fold sensation.',
                  trigger: hasHypoxia,
                },
                {
                  title: 'Cervical / Neck Discomfort',
                  desc: 'Persistent unilateral neck swelling, localized warmth, tenderness, or firmness over the jugular groove.',
                  trigger: false,
                },
                {
                  title: 'Persistent Head Pressure',
                  desc: 'Severe or throbbing morning headache that does not respond to standard hydration and rest.',
                  trigger: false,
                },
                {
                  title: 'Cardiac Palpitations',
                  desc: 'Sudden resting tachycardia (> 110 bpm) or sustained irregular heart rhythm sensations.',
                  trigger: hasTachycardia || hasEcgAlerts,
                },
              ].map((item, i) => (
                <div key={i} className={`p-3 rounded-xl border ${item.trigger ? 'bg-rose-950/50 border-rose-700/60 ring-1 ring-rose-700/30' : 'bg-rose-950/20 border-rose-900/50'} text-rose-200`}>
                  <span className="font-semibold block mb-1">
                    {item.trigger && <span className="text-rose-400 mr-1">●</span>}
                    {item.title}
                  </span>
                  <span className="leading-relaxed text-[11px]">{item.desc}</span>
                  {item.trigger && (
                    <p className="text-[10px] text-rose-400 font-semibold mt-1.5">⚠ Currently flagged</p>
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs text-rose-200/80 mt-2">
              <strong>Emergency Priority Comms:</strong> If unable to reach Dr. Chen via standard audio link, use the emergency data burst protocol to transmit your health data package directly to Houston Mission Control Medical.
            </div>
          </div>
        </>
      )}
    </div>
  );
};
