import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

interface BaselineSetupProps {
  onComplete: () => void;
  needsCardiovascular: boolean;
  needsCognitive: boolean;
}

type CardiovascularValues = {
  restingHeartRate: string;
  spo2: string;
  systolicBP: string;
  diastolicBP: string;
  hrv: string;
};

type CognitiveValues = {
  dsstScore: string;
  nbackAccuracy: string;
  pvtReactionTime: string;
  fatigueScore: string;
  sleepHours: string;
};

const cardiovascularDefaults: CardiovascularValues = {
  restingHeartRate: '',
  spo2: '',
  systolicBP: '',
  diastolicBP: '',
  hrv: '',
};

const cognitiveDefaults: CognitiveValues = {
  dsstScore: '',
  nbackAccuracy: '',
  pvtReactionTime: '',
  fatigueScore: '',
  sleepHours: '',
};

const inputClass =
  'w-full rounded-lg border border-[#26365c] bg-[#101b35] px-4 py-3 text-white outline-none focus:border-cyan-400';

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function BaselineSetup({
  onComplete,
  needsCardiovascular,
  needsCognitive,
}: BaselineSetupProps) {
  const [cardiovascular, setCardiovascular] = useState(cardiovascularDefaults);
  const [cognitive, setCognitive] = useState(cognitiveDefaults);
  const [recordedAt, setRecordedAt] = useState(localDateString(new Date()));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error) {
        setMessage(error.message);
        return;
      }
      setUserEmail(data.user?.email ?? '');
    };

    void loadUser();
    return () => {
      active = false;
    };
  }, []);

  const updateCardiovascular = (key: keyof CardiovascularValues, value: string) => {
    setCardiovascular((current) => ({ ...current, [key]: value }));
  };

  const updateCognitive = (key: keyof CognitiveValues, value: string) => {
    setCognitive((current) => ({ ...current, [key]: value }));
  };

  const validateCardiovascular = () => {
    const rawValues = Object.values(cardiovascular);
    if (rawValues.some((value) => value.trim() === '')) {
      return 'Please complete all five cardiovascular baseline measurements.';
    }

    const hr = Number(cardiovascular.restingHeartRate);
    const oxygen = Number(cardiovascular.spo2);
    const systolic = Number(cardiovascular.systolicBP);
    const diastolic = Number(cardiovascular.diastolicBP);
    const variability = Number(cardiovascular.hrv);

    if (
      ![hr, oxygen, systolic, diastolic, variability].every(Number.isFinite) ||
      hr <= 0 || oxygen <= 0 || oxygen > 100 || systolic <= 0 ||
      diastolic <= 0 || variability <= 0
    ) {
      return 'Enter valid positive cardiovascular measurements. SpO₂ must not exceed 100%.';
    }

    if (!recordedAt || Number.isNaN(Date.parse(`${recordedAt}T00:00:00`))) {
      return 'Please select a valid cardiovascular baseline date.';
    }

    return '';
  };

  const validateCognitive = () => {
    const rawValues = Object.values(cognitive);
    if (rawValues.some((value) => value.trim() === '')) {
      return 'Please complete all five cognitive baseline measurements.';
    }

    const dsst = Number(cognitive.dsstScore);
    const nback = Number(cognitive.nbackAccuracy);
    const pvt = Number(cognitive.pvtReactionTime);
    const fatigue = Number(cognitive.fatigueScore);
    const sleep = Number(cognitive.sleepHours);

    if (!Number.isInteger(dsst) || dsst < 0 || dsst > 10000) {
      return 'DSST completed symbols must be a whole number from 0 to 10,000.';
    }
    if (!Number.isFinite(nback) || nback < 0 || nback > 100) {
      return '2-back accuracy must be between 0 and 100%.';
    }
    if (!Number.isFinite(pvt) || pvt <= 0 || pvt > 100000) {
      return 'PVT mean reaction time must be greater than 0 and no more than 100,000 ms.';
    }
    if (!Number.isFinite(fatigue) || fatigue < 0 || fatigue > 10) {
      return 'Self-reported fatigue must be between 0 and 10.';
    }
    if (!Number.isFinite(sleep) || sleep < 0 || sleep > 24) {
      return 'Sleep duration must be between 0 and 24 hours.';
    }

    return '';
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    if (needsCardiovascular) {
      const validationError = validateCardiovascular();
      if (validationError) {
        setMessage(validationError);
        return;
      }
    }

    if (needsCognitive) {
      const validationError = validateCognitive();
      if (validationError) {
        setMessage(validationError);
        return;
      }
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('Please log in again.');

      // Re-check before inserting. This also makes retrying safe if one insert
      // succeeded but the other insert failed during a previous attempt.
      if (needsCardiovascular) {
        const { data: existingCardiovascular, error: cardiovascularCheckError } =
          await supabase
            .from('astronaut_baselines')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_current', true)
            .maybeSingle();

        if (cardiovascularCheckError) throw cardiovascularCheckError;

        if (!existingCardiovascular) {
          const { error: cardiovascularInsertError } = await supabase
            .from('astronaut_baselines')
            .insert({
              user_id: user.id,
              resting_heart_rate: Number(cardiovascular.restingHeartRate),
              spo2: Number(cardiovascular.spo2),
              systolic_bp: Number(cardiovascular.systolicBP),
              diastolic_bp: Number(cardiovascular.diastolicBP),
              hrv: Number(cardiovascular.hrv),
              recorded_at: recordedAt,
              is_current: true,
            });

          if (cardiovascularInsertError) throw cardiovascularInsertError;
        }
      }

      if (needsCognitive) {
        const { data: existingCognitive, error: cognitiveCheckError } =
          await supabase
            .from('cognitive_baselines')
            .select('id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (cognitiveCheckError) throw cognitiveCheckError;

        if (!existingCognitive?.length) {
          const { error: cognitiveInsertError } = await supabase
            .from('cognitive_baselines')
            .insert({
              user_id: user.id,
              dsst_score: Number(cognitive.dsstScore),
              nback_accuracy: Number(cognitive.nbackAccuracy),
              pvt_reaction_time: Number(cognitive.pvtReactionTime),
              fatigue_score: Number(cognitive.fatigueScore),
              sleep_hours: Number(cognitive.sleepHours),
            });

          if (cognitiveInsertError) throw cognitiveInsertError;
        }
      }

      onComplete();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save your personal baseline. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCardiovascularFields = () => (
    <section className="rounded-xl border border-[#1c2d52] bg-[#0b1329] p-5 md:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">Cardiovascular baseline</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          Enter established reference measurements from medical records or a clinician-approved assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="text-sm text-slate-300">
          <span className="mb-2 block">Resting Heart Rate (bpm)</span>
          <input type="number" min="1" step="any" value={cardiovascular.restingHeartRate} onChange={(e) => updateCardiovascular('restingHeartRate', e.target.value)} placeholder="e.g. 65" className={inputClass} required />
        </label>

        <label className="text-sm text-slate-300">
          <span className="mb-2 block">SpO₂ (%)</span>
          <input type="number" min="1" max="100" step="any" value={cardiovascular.spo2} onChange={(e) => updateCardiovascular('spo2', e.target.value)} placeholder="e.g. 98" className={inputClass} required />
        </label>

        <label className="text-sm text-slate-300">
          <span className="mb-2 block">Systolic Blood Pressure (mmHg)</span>
          <input type="number" min="1" step="any" value={cardiovascular.systolicBP} onChange={(e) => updateCardiovascular('systolicBP', e.target.value)} placeholder="e.g. 120" className={inputClass} required />
        </label>

        <label className="text-sm text-slate-300">
          <span className="mb-2 block">Diastolic Blood Pressure (mmHg)</span>
          <input type="number" min="1" step="any" value={cardiovascular.diastolicBP} onChange={(e) => updateCardiovascular('diastolicBP', e.target.value)} placeholder="e.g. 80" className={inputClass} required />
        </label>

        <label className="text-sm text-slate-300 sm:col-span-2">
          <span className="mb-2 block">Heart Rate Variability (ms)</span>
          <input type="number" min="1" step="any" value={cardiovascular.hrv} onChange={(e) => updateCardiovascular('hrv', e.target.value)} placeholder="e.g. 45" className={inputClass} required />
        </label>

        <label className="text-sm text-slate-300 sm:col-span-2">
          <span className="mb-2 block">Baseline Measurement Date</span>
          <input type="date" value={recordedAt} max={localDateString(new Date())} onChange={(e) => setRecordedAt(e.target.value)} className={inputClass} required />
        </label>
      </div>
    </section>
  );

  const renderCognitiveFields = () => (
    <section className="rounded-xl border border-[#1c2d52] bg-[#0b1329] p-5 md:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">Cognitive & neuro-performance baseline</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          Enter results from the astronaut’s initial cognitive assessments. Use the same assessment procedures for future comparisons.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="text-sm text-slate-300">
          <span className="mb-2 block">DSST completed symbols</span>
          <input type="number" min="0" max="10000" step="1" value={cognitive.dsstScore} onChange={(e) => updateCognitive('dsstScore', e.target.value)} placeholder="e.g. 65" className={inputClass} required />
          <span className="mt-1 block text-xs text-slate-500">Number of symbols correctly completed.</span>
        </label>

        <label className="text-sm text-slate-300">
          <span className="mb-2 block">2-back accuracy (%)</span>
          <input type="number" min="0" max="100" step="0.1" value={cognitive.nbackAccuracy} onChange={(e) => updateCognitive('nbackAccuracy', e.target.value)} placeholder="e.g. 85" className={inputClass} required />
        </label>

        <label className="text-sm text-slate-300">
          <span className="mb-2 block">PVT mean reaction time (ms)</span>
          <input type="number" min="0.1" max="100000" step="0.1" value={cognitive.pvtReactionTime} onChange={(e) => updateCognitive('pvtReactionTime', e.target.value)} placeholder="e.g. 280" className={inputClass} required />
        </label>

        <label className="text-sm text-slate-300">
          <span className="mb-2 block">Self-reported fatigue (0–10)</span>
          <input type="number" min="0" max="10" step="0.1" value={cognitive.fatigueScore} onChange={(e) => updateCognitive('fatigueScore', e.target.value)} placeholder="e.g. 3" className={inputClass} required />
        </label>

        <label className="text-sm text-slate-300 sm:col-span-2">
          <span className="mb-2 block">Sleep duration (hours)</span>
          <input type="number" min="0" max="24" step="0.25" value={cognitive.sleepHours} onChange={(e) => updateCognitive('sleepHours', e.target.value)} placeholder="e.g. 7.5" className={inputClass} required />
        </label>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-[#050914] flex items-center justify-center p-5">
      <div className="w-full max-w-4xl space-y-6 py-6">
        <header className="rounded-2xl border border-[#1c2d52] bg-[#0b1329] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Aither Kairos | Personal Health Profile
          </p>
          <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">
            Complete Your Personal Baseline
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {needsCardiovascular && needsCognitive
              ? 'Enter both cardiovascular and cognitive reference measurements. Future records will be compared against these individual baseline values.'
              : needsCardiovascular
                ? 'Your cognitive baseline is already saved. Complete the cardiovascular section below to finish your profile.'
                : 'Your cardiovascular baseline is already saved. Complete the cognitive section below to finish your profile.'}
          </p>
          {userEmail && <p className="mt-2 text-xs text-slate-500">Account: {userEmail}</p>}
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          {needsCardiovascular && renderCardiovascularFields()}
          {needsCognitive && renderCognitiveFields()}

          <div className="rounded-lg border border-cyan-900/60 bg-cyan-950/20 p-4">
            <p className="text-xs leading-5 text-cyan-200">
              Enter results from established records or completed assessments; do not guess missing values. Cognitive scores should be collected using consistent test conditions. These values are personal comparison references and are not a clinical diagnosis.
            </p>
          </div>

          {message && (
            <p role="alert" className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-[#04101d] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Saving Personal Baseline...' : 'Save Baseline & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
