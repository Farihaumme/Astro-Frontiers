/**
 * ECG-FM API service — sends an ECG image to the FastAPI backend (/analyze-ecg).
 */
import { getBackendUrl } from './ijvApi';

export type EcgLevel = 'normal' | 'caution' | 'warning' | 'critical';

export interface EcgWarning {
  level: Exclude<EcgLevel, 'normal'>;
  source: 'ecg-fm' | 'rule-based';
  title: string;
  detail: string;
}

export interface EcgAnalysisResult {
  status: 'success';
  image_name: string;
  overall_level: EcgLevel;
  warnings: EcgWarning[];
  heart_rate_bpm: number | null;
  rr_irregularity: number | null;
  predictions: { label: string; probability: number }[];
  digitization: { layout: string; trace_coverage: number; leads_recorded: string[]; notes: string[] };
  signal_preview: number[];
  signal_preview_hz: number;
  inference_time_ms: number;
  model_version: string;
  segments_analysed: number;
  limitations: string[];
}

export interface EcgOptions {
  layout?: 'standard_12' | 'single_lead';
  rows?: 3 | 4;
  seconds?: number;
  /** fraction (0-0.6) of image height to ignore, e.g. patient-info header */
  cropTop?: number;
}

export async function analyzeEcgImage(file: File, opts: EcgOptions = {}): Promise<EcgAnalysisResult> {
  const params = new URLSearchParams({
    layout: opts.layout ?? 'standard_12',
    rows: String(opts.rows ?? 3),
    seconds: String(opts.seconds ?? 10),
    crop_top: String(opts.cropTop ?? 0),
  });
  const form = new FormData();
  form.append('file', file, file.name);

  let res: Response;
  try {
    res = await fetch(`${getBackendUrl()}/analyze-ecg?${params}`, { method: 'POST', body: form });
  } catch {
    throw new Error(`Cannot reach the backend at ${getBackendUrl()}. Is the FastAPI server running?`);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.details || body.error || body.detail || `Backend error (${res.status})`);
  }
  return res.json();
}
