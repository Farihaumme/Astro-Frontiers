"""
Aither Kairos — ECG-FM service
==============================
ECG *image*  ->  digitized 12-lead signal  ->  ECG-FM  ->  warnings

Follows the official ECG-FM quickstart notebook:
  * 500 Hz, 5-second (2500-sample) segments, 12 leads in the order I, II, III, aVR, aVL, aVF, V1-V6
  * per-lead standardization (subtract mean, divide by std; constant leads -> 0)
  * 17 MIMIC-IV-ECG labels (label_def.csv), sigmoid outputs, per-label max/mean aggregation
    across segments

ECG-FM is a *signal* model. It never sees pixels, so any error made while
reading the image goes straight into the model. Every response reports how the
image was read.
"""

from __future__ import annotations

import csv
import os
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
from PIL import Image
from scipy.ndimage import label as cc_label, find_objects, median_filter
from scipy.signal import find_peaks

FS = 500
SEG_N = FS * 5               # model input length: 2500
WINDOW_N = FS * 10           # we digitize up to 10 s (two segments)
SLOT_N = WINDOW_N // 4       # one 3x4-sheet column = 2.5 s
LEADS = ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"]
STD_LAYOUT = [
    ["I", "aVR", "V1", "V4"],
    ["II", "aVL", "V2", "V5"],
    ["III", "aVF", "V3", "V6"],
]

AGG_METHODS = {
    "Poor data quality": "max", "Sinus rhythm": "mean",
    "Premature ventricular contraction": "max", "Tachycardia": "mean",
    "Ventricular tachycardia": "max", "Supraventricular tachycardia with aberrancy": "max",
    "Bradycardia": "mean", "Infarction": "mean", "Atrioventricular block": "mean",
    "Right bundle branch block": "mean", "Left bundle branch block": "mean",
    "Electronic pacemaker": "max", "Atrial fibrillation": "mean", "Atrial flutter": "mean",
    "Accessory pathway conduction": "mean", "1st degree atrioventricular block": "mean",
    "Bifascicular block": "mean",
}

_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ECGFM_CKPT = os.environ.get("ECGFM_CKPT", os.path.join(_BACKEND_DIR, "ecgfm", "mimic_iv_ecg_finetuned.pt"))
ECGFM_LABELS = os.environ.get("ECGFM_LABELS", os.path.join(_BACKEND_DIR, "ecgfm", "label_def.csv"))


class EcgImageError(ValueError):
    """The uploaded image cannot be read as an ECG."""


# ==========================================================================
# 1. Image -> signal
# ==========================================================================
@dataclass
class Digitized:
    signal: np.ndarray             # (12, 5000) float32 (mV), zeros where not recorded
    recorded: np.ndarray           # (12, 5000) bool
    layout: str
    notes: list = field(default_factory=list)
    trace_coverage: float = 0.0
    px_per_mm: Optional[float] = None


def _trace_mask(rgb: np.ndarray) -> np.ndarray:
    """Dark ink = ECG trace; light pink/red grid is ignored."""
    gray = rgb.astype(np.float32).mean(axis=2)
    thr = min(110.0, float(np.percentile(gray, 3)) + 40.0)
    return gray < thr


def estimate_px_per_mm(rgb: np.ndarray) -> Optional[float]:
    """Find the ECG paper grid period (autocorrelation of red-pixel column profile)."""
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    red = (r - g > 25) & (r - b > 10) & (r > 120)
    if red.mean() < 0.01:
        return None
    prof = red.sum(axis=0).astype(float)
    prof -= prof.mean()
    n = len(prof)
    f = np.fft.rfft(prof, 2 * n)
    ac = np.fft.irfft(f * np.conj(f))[:n]
    if ac[0] <= 0:
        return None
    ac /= ac[0]
    max_lag = min(n // 4, 150)
    peaks, _ = find_peaks(ac[:max_lag], prominence=0.05)
    peaks = peaks[peaks >= 3]
    if not len(peaks):
        return None
    p = float(peaks[0])
    for mm in (1.0, 5.0):                       # first period = 1 mm or 5 mm?
        total_mm = n / (p / mm)
        if 150 <= total_mm <= 450:
            return p / mm
    return None


def _panel_to_samples(mask: np.ndarray, n_out: int, px_per_mv: float):
    """Trace centre-line of one panel -> mV samples (n_out samples)."""
    h, w = mask.shape
    # drop lead-label text: keep only wide connected components (the trace)
    lab, _ = cc_label(mask, structure=np.ones((3, 3)))
    keep = np.zeros_like(mask)
    for i, sl in enumerate(find_objects(lab), start=1):
        if sl is not None and (sl[1].stop - sl[1].start) >= 0.08 * w:
            keep |= lab == i
    if keep.sum() > 0.3 * mask.sum():
        mask = keep
    cnt = mask.sum(axis=0)
    valid = cnt > 0
    if valid.sum() < max(10, 0.3 * w):
        return None, 0.0
    rows = np.arange(h)[:, None]
    mean_y = np.where(valid, (mask * rows).sum(axis=0) / np.maximum(cnt, 1), np.nan)
    base = np.nanmedian(mean_y)
    top = np.where(valid, np.argmax(mask, axis=0), np.nan)
    bot = np.where(valid, h - 1 - np.argmax(mask[::-1], axis=0), np.nan)
    y = np.where(np.abs(top - base) >= np.abs(bot - base), top, bot)   # keep R-peak extremes
    xs = np.flatnonzero(valid)
    y = np.interp(np.arange(w), xs, y[xs])
    y = median_filter(y, size=3)
    mv = (base - y) / px_per_mv
    out = np.interp(np.linspace(0, w - 1, n_out), np.arange(w), mv)
    return out.astype(np.float32), float(valid.mean())


def digitize_ecg_image(
    img: Image.Image,
    layout: str = "standard_12",
    rows: int = 3,
    seconds: float = 10.0,
    crop_top: float = 0.0,
) -> Digitized:
    """
    layout="standard_12": 3x4 clinical sheet (rows=3) or with bottom rhythm strip (rows=4).
                          The trace area is assumed to span 10 s (25 mm/s).
    layout="single_lead": one strip, treated as lead II. Duration comes from the paper grid
                          when it can be measured, otherwise from `seconds`.
    crop_top:             fraction (0-0.6) of the image height to ignore (patient-info header).
    """
    if not 0.0 <= crop_top <= 0.6:
        raise EcgImageError("crop_top must be between 0 and 0.6.")
    rgb = np.asarray(img.convert("RGB"))
    rgb = rgb[int(rgb.shape[0] * crop_top):]
    px_per_mm = estimate_px_per_mm(rgb)

    mask = _trace_mask(rgb)
    ys, xs = np.nonzero(mask)
    if xs.size < 300:
        raise EcgImageError("No ECG trace found. Use a high-contrast image with a dark trace.")
    x0, x1 = (int(v) for v in np.percentile(xs, [0.5, 99.5]))
    y0, y1 = (int(v) for v in np.percentile(ys, [0.5, 99.5]))
    mask = mask[y0:y1 + 1, x0:x1 + 1]
    H, W = mask.shape
    if W < 200 or H < 40:
        raise EcgImageError("Image is too small or the trace area could not be located.")

    sig = np.zeros((12, WINDOW_N), dtype=np.float32)
    rec = np.zeros((12, WINDOW_N), dtype=bool)
    notes, cov_list = [], []
    measured_s = (W / px_per_mm / 25.0) if px_per_mm else None

    if layout == "single_lead":
        dur = measured_s if measured_s and 2 <= measured_s <= 30 else float(seconds)
        pxmm = px_per_mm or W / (dur * 25.0)
        s, cov = _panel_to_samples(mask, int(dur * FS), pxmm * 10.0)
        if s is None:
            raise EcgImageError("No continuous ECG trace found in the strip.")
        n = min(len(s), WINDOW_N)
        sig[1, :n] = s[:n]
        rec[1, :n] = True
        cov_list.append(cov)
        notes.append(f"Single strip read as lead II over {min(dur, 10):.1f} s; other 11 leads are empty.")
        if dur > 10:
            notes.append(f"Strip is {dur:.0f} s long; only the first 10 s were analysed.")
    elif layout == "standard_12":
        if rows not in (3, 4):
            raise EcgImageError("rows must be 3 or 4.")
        grid_ok = bool(px_per_mm and measured_s and 8.5 <= measured_s <= 11.5)
        pxmm = px_per_mm if grid_ok else W / 250.0     # trace area is 10 s * 25 mm/s = 250 mm
        col_w = min(int(round(62.5 * pxmm)), W // 4 + 8) if grid_ok else W // 4
        band_h = H // rows
        for r in range(3):
            band = mask[r * band_h:(r + 1) * band_h]
            for c in range(4):
                panel = band[:, c * col_w:(c + 1) * col_w]
                s, cov = _panel_to_samples(panel, SLOT_N, pxmm * 10.0)
                if s is None:
                    continue
                li = LEADS.index(STD_LAYOUT[r][c])
                sig[li, c * SLOT_N:(c + 1) * SLOT_N] = s
                rec[li, c * SLOT_N:(c + 1) * SLOT_N] = True
                cov_list.append(cov)
        if rows == 4:
            strip = mask[3 * band_h:, :min(W, 4 * col_w)]
            s, cov = _panel_to_samples(strip, WINDOW_N, pxmm * 10.0)
            if s is not None:
                sig[1], rec[1] = s, True
                cov_list.append(cov)
        if rows == 3:
            notes.append("No rhythm strip: each lead covers only 2.5 s of the 10 s window, so the model sees partial data.")
        if measured_s and not 8.5 <= measured_s <= 11.5:
            notes.append(
                f"Paper grid suggests the trace is {measured_s:.1f} s wide, not 10 s — "
                "heart rate may be mis-scaled. Crop the image to the ECG area."
            )
    else:
        raise EcgImageError(f"Unknown layout '{layout}'.")

    cov = float(np.mean(cov_list)) if cov_list else 0.0
    if cov < 0.4:
        raise EcgImageError(
            f"Could not find a continuous ECG trace (coverage {cov:.0%}). "
            "Use a flat, well-lit, high-contrast image."
        )
    notes.append(
        f"Paper grid detected ({px_per_mm:.1f} px/mm)." if px_per_mm
        else "No paper grid detected; assumed the ECG fills the image width at 25 mm/s."
    )
    return Digitized(sig, rec, layout, notes, cov, px_per_mm)


def make_segments(d: Digitized) -> np.ndarray:
    """(n_seg, 12, 2500): per-lead standardization on recorded samples, then 5 s segments."""
    x = np.zeros_like(d.signal)
    for i in range(12):
        m = d.recorded[i]
        if m.sum() < FS:                               # < 1 s -> treat as missing lead
            continue
        v = d.signal[i, m].astype(np.float64)
        v = v - v.mean()
        sd = v.std()
        x[i, m] = 0.0 if sd < 1e-6 else v / (sd + 1e-8)
    segs = []
    for k in range(WINDOW_N // SEG_N):
        sl = slice(k * SEG_N, (k + 1) * SEG_N)
        if d.recorded[:, sl].sum() >= FS:              # at least 1 s of real data
            segs.append(x[:, sl])
    if not segs:
        raise EcgImageError("Not enough ECG data was read from the image.")
    return np.stack(segs).astype(np.float32)


# ==========================================================================
# Rule-based rate / rhythm check (independent of the model)
# ==========================================================================
def estimate_rhythm(d: Digitized) -> dict:
    parts = []
    for c in range(4):
        sl = slice(c * SLOT_N, (c + 1) * SLOT_N)
        best, best_sd = None, 0.0
        for i in range(12):
            if d.recorded[i, sl].all():
                x = d.signal[i, sl] - np.median(d.signal[i, sl])
                if x.std() > best_sd:
                    best, best_sd = x, x.std()
        if best is not None:
            parts.append((c, -best if abs(best.min()) > best.max() else best))
    empty = {"heart_rate_bpm": None, "rr_irregularity": None, "beats": 0}
    if not parts:
        return empty
    rhythm = np.zeros(WINDOW_N, dtype=np.float32)
    for c, x in parts:
        rhythm[c * SLOT_N:(c + 1) * SLOT_N] = x
    span = float(rhythm.max() - rhythm.min())
    if span < 1e-3:
        return empty
    peaks, _ = find_peaks(rhythm, distance=int(0.25 * FS), prominence=0.4 * span)
    if len(peaks) < 3:
        return {**empty, "beats": int(len(peaks))}
    rr = np.diff(peaks) / FS
    rr = rr[rr < 2.0]                                   # ignore gaps across missing segments
    if rr.size < 2:
        return {**empty, "beats": int(len(peaks))}
    return {
        "heart_rate_bpm": round(float(60.0 / np.median(rr)), 1),
        "rr_irregularity": round(float(rr.std() / rr.mean()), 3),
        "beats": int(len(peaks)),
    }


# ==========================================================================
# 2. ECG-FM model
# ==========================================================================
class EcgFM:
    """Wrapper around the ECG-FM fine-tuned checkpoint (fairseq-signals)."""

    def __init__(self):
        self.model = None
        self.labels: list[str] = []
        self.error: Optional[str] = None
        self.device = "cpu"

    @property
    def loaded(self) -> bool:
        return self.model is not None

    def load(self) -> None:
        try:
            if not os.path.isfile(ECGFM_CKPT):
                raise FileNotFoundError(
                    f"ECG-FM checkpoint not found at '{ECGFM_CKPT}'. Put mimic_iv_ecg_finetuned.pt "
                    "in backend/ecgfm/ or set the ECGFM_CKPT environment variable."
                )
            if not os.path.isfile(ECGFM_LABELS):
                raise FileNotFoundError(f"Label file not found at '{ECGFM_LABELS}'.")
            self.labels = self._read_labels(ECGFM_LABELS)
            import torch
            from fairseq_signals.models import build_model_from_checkpoint

            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            m = build_model_from_checkpoint(checkpoint_path=ECGFM_CKPT)
            self.model = m.eval().to(self.device)
            self.error = None
            print(f"[INFO] ECG-FM loaded: {ECGFM_CKPT} ({len(self.labels)} labels, {self.device})")
        except Exception as e:                           # keep the server alive
            self.model = None
            self.error = f"{type(e).__name__}: {e}"
            print(f"[WARN] ECG-FM unavailable — {self.error}")

    @staticmethod
    def _read_labels(path: str) -> list[str]:
        with open(path, newline="", encoding="utf-8") as f:
            return [row["name"].strip() for row in csv.DictReader(f) if row.get("name")]

    def _forward(self, segments: np.ndarray) -> np.ndarray:
        """segments (n, 12, 2500) -> sigmoid probabilities (n, n_labels). Torch-only part."""
        import torch

        with torch.no_grad():
            src = torch.from_numpy(segments).float().to(self.device)
            out = self.model(source=src)
            logits = out["out"] if isinstance(out, dict) else out
            return torch.sigmoid(logits).detach().cpu().numpy()

    def predict(self, segments: np.ndarray) -> dict:
        """segments (n, 12, 2500) -> {label: aggregated probability}."""
        return self.aggregate(self._forward(segments))

    def aggregate(self, probs: np.ndarray) -> dict:
        if probs.ndim != 2 or probs.shape[1] != len(self.labels):
            raise RuntimeError(
                f"Model returned {probs.shape[-1]} outputs but label_def.csv has {len(self.labels)} labels. "
                "Use the label_def.csv that matches the checkpoint (MIMIC-IV-ECG finetuned: 17 labels)."
            )
        agg = {}
        for j, lab in enumerate(self.labels):
            col = probs[:, j]
            agg[lab] = float(col.max() if AGG_METHODS.get(lab, "mean") == "max" else col.mean())
        return agg


ecg_model = EcgFM()


# ==========================================================================
# 3. Warnings
# ==========================================================================
_RANK = {"normal": 0, "caution": 1, "warning": 2, "critical": 3}

# Severity of each ECG-FM (MIMIC-IV-ECG) label when it fires.
LABEL_LEVEL = {
    "Ventricular tachycardia": "critical",
    "Atrial fibrillation": "warning",
    "Atrial flutter": "warning",
    "Supraventricular tachycardia with aberrancy": "warning",
    "Atrioventricular block": "warning",
    "Bifascicular block": "warning",
    "Left bundle branch block": "warning",
    "Infarction": "warning",
    "Premature ventricular contraction": "caution",
    "Right bundle branch block": "caution",
    "1st degree atrioventricular block": "caution",
    "Accessory pathway conduction": "caution",
    "Tachycardia": "caution",
    "Bradycardia": "caution",
    "Electronic pacemaker": "caution",
}


def build_warnings(probs: dict, rhythm: dict, threshold: float = 0.5) -> dict:
    warnings = []
    for label, p in sorted(probs.items(), key=lambda kv: -kv[1]):
        if p < threshold:
            continue
        if label == "Poor data quality":
            warnings.append({"level": "caution", "source": "ecg-fm", "title": "Poor signal quality",
                             "detail": f"ECG-FM rates the digitized signal as low quality ({p:.0%}). "
                                       "Re-capture the ECG before relying on any result."})
        elif label in LABEL_LEVEL:
            warnings.append({"level": LABEL_LEVEL[label], "source": "ecg-fm", "title": label,
                             "detail": f"ECG-FM score {p:.0%} (threshold {threshold:.0%})."})

    hr = rhythm.get("heart_rate_bpm")
    if hr is not None:
        lvl = ("critical" if hr < 40 or hr > 150 else
               "warning" if hr < 50 or hr > 120 else
               "caution" if hr < 60 or hr > 100 else None)
        if lvl:
            warnings.append({"level": lvl, "source": "rule-based", "title": f"Heart rate ≈ {hr:.0f} bpm",
                             "detail": "Outside the 60–100 bpm resting range (from R-R intervals read off the image)."})
    irr = rhythm.get("rr_irregularity")
    if irr is not None and irr > 0.15:
        warnings.append({"level": "caution", "source": "rule-based", "title": "Irregular R-R intervals",
                         "detail": f"R-R variability {irr:.0%}. May indicate an irregular rhythm; confirm on a clean recording."})

    overall = max((w["level"] for w in warnings), key=lambda l: _RANK[l], default="normal")
    return {"overall_level": overall, "warnings": warnings}
