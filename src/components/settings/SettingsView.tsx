import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { probeBackendHealth } from '../../services/ijvApi';
import type { SystemStatusData } from '../../types';

interface SettingsViewProps {
  systemStatus: SystemStatusData;
  onUpdateSystemStatus: (newStatus: SystemStatusData) => void;
}

type CvBaseline = {
  id: string;
  resting_heart_rate: number;
  spo2: number;
  systolic_bp: number;
  diastolic_bp: number;
  hrv: number;
  recorded_at: string;
  is_current: boolean;
};

type CogBaseline = {
  id: string;
  dsst_score: number;
  nback_accuracy: number;
  pvt_reaction_time: number;
  fatigue_score: number;
  sleep_hours: number;
  created_at: string;
};

type CvForm = {
  resting_heart_rate: string;
  spo2: string;
  systolic_bp: string;
  diastolic_bp: string;
  hrv: string;
  recorded_at: string;
};

type CogForm = {
  dsst_score: string;
  nback_accuracy: string;
  pvt_reaction_time: string;
  fatigue_score: string;
  sleep_hours: string;
};

const emptyCv: CvForm = {
  resting_heart_rate: '',
  spo2: '',
  systolic_bp: '',
  diastolic_bp: '',
  hrv: '',
  recorded_at: new Date().toISOString().slice(0, 10),
};

const emptyCog: CogForm = {
  dsst_score: '',
  nback_accuracy: '',
  pvt_reaction_time: '',
  fatigue_score: '',
  sleep_hours: '',
};

const inputClass =
  'mt-1.5 w-full rounded-lg border border-[#26365c] bg-[#080f22] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/10';
const panelClass =
  'rounded-2xl border border-[#1b2b50] bg-[#0b142a]/90 p-5 shadow-lg shadow-black/10 md:p-6';

function valueOrEmpty(value: number | null | undefined) {
  return value === null || value === undefined ? '' : String(value);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  systemStatus,
  onUpdateSystemStatus,
}) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('Astronaut');
  const [loading, setLoading] = useState(true);
  const [savingCv, setSavingCv] = useState(false);
  const [savingCog, setSavingCog] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [checkingBackend, setCheckingBackend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [cvCurrent, setCvCurrent] = useState<CvBaseline | null>(null);
  const [cogCurrent, setCogCurrent] = useState<CogBaseline | null>(null);
  const [cvForm, setCvForm] = useState<CvForm>(emptyCv);
  const [cogForm, setCogForm] = useState<CogForm>(emptyCog);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [pageError, setPageError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setPageError('');

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Your session has expired. Please sign in again.');

      const metadata = user.user_metadata ?? {};
      setEmail(user.email ?? '');
      setUsername(
        (typeof metadata.username === 'string' && metadata.username.trim()) ||
        (typeof metadata.full_name === 'string' && metadata.full_name.trim()) ||
        (user.email?.split('@')[0] ?? 'Astronaut')
      );

      const [cvResult, cogResult] = await Promise.all([
        supabase
          .from('astronaut_baselines')
          .select('id, resting_heart_rate, spo2, systolic_bp, diastolic_bp, hrv, recorded_at, is_current')
          .eq('user_id', user.id)
          .eq('is_current', true)
          .maybeSingle(),
        supabase
          .from('cognitive_baselines')
          .select('id, dsst_score, nback_accuracy, pvt_reaction_time, fatigue_score, sleep_hours, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (cvResult.error) throw cvResult.error;
      if (cogResult.error) throw cogResult.error;

      const cv = cvResult.data as CvBaseline | null;
      const cog = cogResult.data as CogBaseline | null;
      setCvCurrent(cv);
      setCogCurrent(cog);

      if (cv) {
        setCvForm({
          resting_heart_rate: valueOrEmpty(cv.resting_heart_rate),
          spo2: valueOrEmpty(cv.spo2),
          systolic_bp: valueOrEmpty(cv.systolic_bp),
          diastolic_bp: valueOrEmpty(cv.diastolic_bp),
          hrv: valueOrEmpty(cv.hrv),
          recorded_at: cv.recorded_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        });
      } else {
        setCvForm(emptyCv);
      }

      if (cog) {
        setCogForm({
          dsst_score: valueOrEmpty(cog.dsst_score),
          nback_accuracy: valueOrEmpty(cog.nback_accuracy),
          pvt_reaction_time: valueOrEmpty(cog.pvt_reaction_time),
          fatigue_score: valueOrEmpty(cog.fatigue_score),
          sleep_hours: valueOrEmpty(cog.sleep_hours),
        });
      } else {
        setCogForm(emptyCog);
      }
    } catch (error) {
      setPageError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const saveCardiovascularBaseline = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPageError('');
    setSuccessMessage('');

    const values = [
      cvForm.resting_heart_rate,
      cvForm.spo2,
      cvForm.systolic_bp,
      cvForm.diastolic_bp,
      cvForm.hrv,
    ].map(Number);
    const [heartRate, oxygen, systolic, diastolic, hrv] = values;

    if (!values.every(Number.isFinite) || heartRate <= 0 || oxygen <= 0 || oxygen > 100 || systolic <= 0 || diastolic <= 0 || hrv <= 0) {
      setPageError('Enter valid positive cardiovascular values. SpO₂ must be greater than 0 and no more than 100%.');
      return;
    }
    if (!cvForm.recorded_at || Number.isNaN(Date.parse(`${cvForm.recorded_at}T00:00:00`))) {
      setPageError('Choose a valid date for this baseline.');
      return;
    }

    setSavingCv(true);
    let oldBaselineDeactivated = false;

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Please sign in again.');

      // Keep prior baseline rows for traceability and mark the former row as inactive.
      if (cvCurrent) {
        const { error: deactivateError } = await supabase
          .from('astronaut_baselines')
          .update({ is_current: false })
          .eq('id', cvCurrent.id)
          .eq('user_id', user.id);
        if (deactivateError) throw deactivateError;
        oldBaselineDeactivated = true;
      }

      const { data: inserted, error: insertError } = await supabase
        .from('astronaut_baselines')
        .insert({
          user_id: user.id,
          resting_heart_rate: heartRate,
          spo2: oxygen,
          systolic_bp: systolic,
          diastolic_bp: diastolic,
          hrv,
          recorded_at: cvForm.recorded_at,
          is_current: true,
        })
        .select('id, resting_heart_rate, spo2, systolic_bp, diastolic_bp, hrv, recorded_at, is_current')
        .single();

      if (insertError) throw insertError;
      setCvCurrent(inserted as CvBaseline);
      setSuccessMessage('Cardiovascular baseline updated. Previous baseline records were retained.');
    } catch (error) {
      // Best-effort recovery if creating the replacement row fails after deactivation.
      if (oldBaselineDeactivated && cvCurrent) {
        const { error: restoreError } = await supabase
          .from('astronaut_baselines')
          .update({ is_current: true })
          .eq('id', cvCurrent.id);
        if (restoreError) {
          setPageError(`${errorMessage(error)} The previous baseline could not be reactivated; please check Supabase. ${restoreError.message}`);
        } else {
          setPageError(errorMessage(error));
        }
      } else {
        setPageError(errorMessage(error));
      }
    } finally {
      setSavingCv(false);
    }
  };

  const saveCognitiveBaseline = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPageError('');
    setSuccessMessage('');

    const dsst = Number(cogForm.dsst_score);
    const nback = Number(cogForm.nback_accuracy);
    const pvt = Number(cogForm.pvt_reaction_time);
    const fatigue = Number(cogForm.fatigue_score);
    const sleep = Number(cogForm.sleep_hours);

    if (!Number.isInteger(dsst) || dsst < 0 || dsst > 10000) {
      setPageError('DSST score must be a whole number from 0 to 10,000.');
      return;
    }
    if (!Number.isFinite(nback) || nback < 0 || nback > 100) {
      setPageError('2-back accuracy must be between 0 and 100%.');
      return;
    }
    if (!Number.isFinite(pvt) || pvt <= 0 || pvt > 100000) {
      setPageError('PVT reaction time must be greater than 0 and no more than 100,000 ms.');
      return;
    }
    if (!Number.isFinite(fatigue) || fatigue < 0 || fatigue > 10) {
      setPageError('Fatigue must be between 0 and 10.');
      return;
    }
    if (!Number.isFinite(sleep) || sleep < 0 || sleep > 24) {
      setPageError('Sleep duration must be between 0 and 24 hours.');
      return;
    }

    setSavingCog(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Please sign in again.');

      // Cognitive baselines are versioned: insert a new row rather than altering history.
      const { data, error } = await supabase
        .from('cognitive_baselines')
        .insert({
          user_id: user.id,
          dsst_score: dsst,
          nback_accuracy: nback,
          pvt_reaction_time: pvt,
          fatigue_score: fatigue,
          sleep_hours: sleep,
        })
        .select('id, dsst_score, nback_accuracy, pvt_reaction_time, fatigue_score, sleep_hours, created_at')
        .single();

      if (error) throw error;
      setCogCurrent(data as CogBaseline);
      setSuccessMessage('Cognitive baseline updated. The previous baseline version remains in your records.');
    } catch (error) {
      setPageError(errorMessage(error));
    } finally {
      setSavingCog(false);
    }
  };

  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPageError('');
    setSuccessMessage('');

    if (newPassword.length < 8) {
      setPageError('Use a new password with at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPageError('The new password and confirmation do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      // Verify the current password by signing in again before changing it.
      if (!email) throw new Error('The account email could not be loaded. Please refresh this page.');
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verifyError) throw new Error('Your current password is incorrect.');

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Your password has been changed successfully.');
    } catch (error) {
      setPageError(errorMessage(error));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    setPageError('');
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // App.tsx listens for Supabase auth changes and will show the login screen.
    } catch (error) {
      setPageError(errorMessage(error));
      setSigningOut(false);
    }
  };

  const refreshBackendStatus = async () => {
    setCheckingBackend(true);
    setPageError('');
    try {
      const status = await probeBackendHealth();
      onUpdateSystemStatus(status);
      setSuccessMessage('Backend connection status refreshed.');
    } catch (error) {
      setPageError(errorMessage(error));
    } finally {
      setCheckingBackend(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-sm text-cyan-300">Loading account settings…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-5 md:p-8">
      <header className="border-b border-[#182747] pb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-400">Aither Kairos / Control Center</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Manage your account security, personal health reference values, and system connection.</p>
      </header>

      {pageError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-800/70 bg-rose-950/30 p-3 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{pageError}</span>
        </div>
      )}
      {successMessage && (
        <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-800/70 bg-emerald-950/25 p-3 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Account information */}
      <section className={`${panelClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300"><UserRound className="h-5 w-5" /></div>
          <div>
            <h2 className="font-semibold text-white">Astronaut account</h2>
            <p className="mt-0.5 text-xs text-slate-400">{username} · {email}</p>
          </div>
        </div>
        <button type="button" onClick={() => void loadSettings()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-500/50 hover:text-white">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh account data
        </button>
      </section>

      {/* Password */}
      <section className={`${panelClass} space-y-4`}>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-violet-500/10 p-2 text-violet-300"><KeyRound className="h-5 w-5" /></div>
          <div><h2 className="font-semibold text-white">Change password</h2><p className="mt-1 text-xs leading-5 text-slate-400">Verify your current password, then choose a new one.</p></div>
        </div>
        <form onSubmit={changePassword} className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="text-xs font-medium text-slate-300">Current password
            <input className={inputClass} type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
          </label>
          <label className="text-xs font-medium text-slate-300">New password
            <input className={inputClass} type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </label>
          <label className="text-xs font-medium text-slate-300">Confirm new password
            <div className="relative">
              <input className={`${inputClass} pr-11`} type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-4 text-slate-500 hover:text-slate-200">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          <div className="md:col-span-3"><button disabled={changingPassword} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"><KeyRound className="h-4 w-4" />{changingPassword ? 'Changing password…' : 'Update password'}</button></div>
        </form>
      </section>

      {/* Cardiovascular personal baseline */}
      <section className={`${panelClass} space-y-4`}>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-rose-500/10 p-2 text-rose-300"><Activity className="h-5 w-5" /></div>
          <div>
            <h2 className="font-semibold text-white">Cardiovascular personal baseline</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">Edit the reference values used when comparing future cardiovascular measurements.</p>
            {cvCurrent && <p className="mt-1 text-[10px] text-slate-500">Current baseline date: {cvCurrent.recorded_at?.slice(0, 10) || 'Not recorded'}</p>}
          </div>
        </div>
        <form onSubmit={saveCardiovascularBaseline} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="text-xs font-medium text-slate-300">Resting heart rate (bpm)<input className={inputClass} type="number" min="1" step="any" value={cvForm.resting_heart_rate} onChange={e => setCvForm(v => ({ ...v, resting_heart_rate: e.target.value }))} required /></label>
          <label className="text-xs font-medium text-slate-300">SpO₂ (%)<input className={inputClass} type="number" min="0.1" max="100" step="any" value={cvForm.spo2} onChange={e => setCvForm(v => ({ ...v, spo2: e.target.value }))} required /></label>
          <label className="text-xs font-medium text-slate-300">Systolic blood pressure (mmHg)<input className={inputClass} type="number" min="1" step="any" value={cvForm.systolic_bp} onChange={e => setCvForm(v => ({ ...v, systolic_bp: e.target.value }))} required /></label>
          <label className="text-xs font-medium text-slate-300">Diastolic blood pressure (mmHg)<input className={inputClass} type="number" min="1" step="any" value={cvForm.diastolic_bp} onChange={e => setCvForm(v => ({ ...v, diastolic_bp: e.target.value }))} required /></label>
          <label className="text-xs font-medium text-slate-300">Heart rate variability (ms)<input className={inputClass} type="number" min="0.1" step="any" value={cvForm.hrv} onChange={e => setCvForm(v => ({ ...v, hrv: e.target.value }))} required /></label>
          <label className="text-xs font-medium text-slate-300">Baseline date<input className={inputClass} type="date" value={cvForm.recorded_at} onChange={e => setCvForm(v => ({ ...v, recorded_at: e.target.value }))} required /></label>
          <div className="sm:col-span-2 xl:col-span-3"><button disabled={savingCv} className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"><Save className="h-4 w-4" />{savingCv ? 'Saving baseline…' : 'Save cardiovascular baseline'}</button></div>
        </form>
      </section>

      {/* Cognitive personal baseline */}
      <section className={`${panelClass} space-y-4`}>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-violet-500/10 p-2 text-violet-300"><ShieldCheck className="h-5 w-5" /></div>
          <div>
            <h2 className="font-semibold text-white">Cognitive personal baseline</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">Set a new reference from completed assessments. Older baseline versions are kept in the database.</p>
            {cogCurrent && <p className="mt-1 text-[10px] text-slate-500">Latest baseline saved: {new Date(cogCurrent.created_at).toLocaleString()}</p>}
          </div>
        </div>
        <form onSubmit={saveCognitiveBaseline} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="text-xs font-medium text-slate-300">DSST completed symbols<input className={inputClass} type="number" min="0" max="10000" step="1" value={cogForm.dsst_score} onChange={e => setCogForm(v => ({ ...v, dsst_score: e.target.value }))} required /></label>
          <label className="text-xs font-medium text-slate-300">2-back accuracy (%)<input className={inputClass} type="number" min="0" max="100" step="0.1" value={cogForm.nback_accuracy} onChange={e => setCogForm(v => ({ ...v, nback_accuracy: e.target.value }))} required /></label>
          <label className="text-xs font-medium text-slate-300">PVT mean reaction time (ms)<input className={inputClass} type="number" min="0.1" max="100000" step="0.1" value={cogForm.pvt_reaction_time} onChange={e => setCogForm(v => ({ ...v, pvt_reaction_time: e.target.value }))} required /></label>
          <label className="text-xs font-medium text-slate-300">Self-reported fatigue (0–10)<input className={inputClass} type="number" min="0" max="10" step="0.1" value={cogForm.fatigue_score} onChange={e => setCogForm(v => ({ ...v, fatigue_score: e.target.value }))} required /></label>
          <label className="text-xs font-medium text-slate-300">Sleep duration (hours)<input className={inputClass} type="number" min="0" max="24" step="0.25" value={cogForm.sleep_hours} onChange={e => setCogForm(v => ({ ...v, sleep_hours: e.target.value }))} required /></label>
          <div className="flex items-end"><button disabled={savingCog} className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"><Save className="h-4 w-4" />{savingCog ? 'Saving baseline…' : 'Save cognitive baseline'}</button></div>
        </form>
      </section>

      

      {/* Sign out */}
      <section className="flex flex-col gap-3 rounded-2xl border border-rose-900/50 bg-rose-950/15 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-semibold text-white">Sign out</h2><p className="mt-1 text-xs text-slate-400">End this astronaut account session on this device.</p></div>
        <button type="button" onClick={() => void handleSignOut()} disabled={signingOut} className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-700/70 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-950/50 disabled:opacity-50"><LogOut className="h-4 w-4" />{signingOut ? 'Signing out…' : 'Log out'}</button>
      </section>

      <p className="text-[10px] leading-5 text-slate-500">Personal baseline values are comparison references, not diagnoses. Enter values from consistent assessments or established records. Review major baseline changes with qualified medical personnel.</p>
    </div>
  );
};
