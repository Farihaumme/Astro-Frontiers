# Aither Kairos — Astronaut Health Monitoring System
**NASA Space Apps Challenge 2026**

A mission-critical medical intelligence dashboard and Internal Jugular Vein (IJV) ultrasound segmentation system designed for long-duration spaceflight (e.g., Artemis lunar transit, Mars transport, and ISS missions).

---

## Key Features

1. **Mission Control Medical Dashboard**
   - Faithful to mission-control aerospace telemetry aesthetics: dark navy surfaces, cyan phosphor accents, dense information architecture, and zero-clutter typography.
   - Comprehensive astronaut overview for **Alex Rivera (AST-0427)** aboard Artemis III.
   - Live **System Status** card that honestly reports whether the local FastAPI backend and Keras model weights are connected.
   - Simulated vital telemetry (Heart Rate, HRV, SpO₂, Blood Pressure) with multi-point SVG charting.
   - Real-time Alerts & Notifications center.

2. **IJV Ultrasound Analysis Module (Primary Functional AI Module)**
   - **Upload & Validation:** Accepts PNG and JPEG ultrasound scans, validates image formats and dimensions, with clear error reporting and replace/remove actions.
   - **Preloaded Reference Scans:** Built-in SegThy benchmark scans with ground-truth anatomical annotations for immediate testing.
   - **Real FastAPI & Keras Integration:** Full Python backend integration supporting trained Keras U-Net models for semantic segmentation of the internal jugular vein lumen.
   - **Interactive Mask Overlay:** Customizable mask opacity slider (0–100%), clinical color modes (Laser Cyan, Bio Green, Ultraviolet), and side-by-side or overlay comparison views.
   - **Morphological Measurements:** Cross-sectional area (pixels and calibrated $\text{mm}^2$), circularity index, perimeter, and confidence score.
   - **Honest Abnormality Reporting:** Transparently indicates *"Abnormality classification unavailable"* because SegThy benchmarks provide anatomical segmentation annotations, not pathological diagnostic labels.

3. **Cardiovascular & Cognitive Demonstration Pages (Planned Modules)**
   - Clear banners denoting simulated demonstration data for upcoming mission phases.
   - Live simulated Lead II ECG rhythm strip with P-Q-R-S-T wave dynamics.
   - DSST processing speed, spatial N-back working memory, and PVT reaction time assessments.

4. **Medical Reporting & Analysis History**
   - Flight Surgeon Medical Dossier with print/PDF export styling.
   - Session analysis history with scan thumbnails and JSON export.

---

## Technical Architecture

```
/
├── backend/                  # Python FastAPI & Keras Inference Engine
│   ├── main.py               # REST API (/health, /analyze-ijv, /models/info)
│   ├── requirements.txt      # FastAPI, TensorFlow, Keras, Pillow, NumPy
│   └── README.md             # Backend setup & model weights guide
├── src/
│   ├── assets/images/        # High-fidelity aerospace & ultrasound assets
│   ├── components/
│   │   ├── dashboard/        # Mission Control Dashboard
│   │   ├── ijv/              # Primary IJV Ultrasound Segmentation Module
│   │   ├── cardiovascular/   # Cardiovascular Demonstration Page
│   │   ├── cognitive/        # Cognitive Assessment Demonstration Page
│   │   ├── profile/          # Astronaut Profile View
│   │   ├── reports/          # Flight Surgeon Health Reports
│   │   ├── history/          # Analysis Session History
│   │   ├── settings/         # API Endpoint & Probe Settings
│   │   └── layout/           # Navbar, Sidebar, and Footer
│   ├── data/                 # Astronaut & telemetry records
│   ├── services/             # API client & SegThy benchmark annotations
│   ├── types/                # Strict TypeScript interfaces
│   ├── App.tsx               # Root component & state orchestration
│   ├── index.css             # Tailwind CSS & mission-control styling
│   └── main.tsx              # Application entry point
├── package.json
└── vite.config.ts
```

---

## Getting Started

### Running the Web Dashboard (Frontend)
```bash
npm install
npm run dev
```
The application will launch at `http://localhost:3000`.

### Running the FastAPI Backend (Optional for live Keras inference)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Place your trained weights file (`ijv_segthy_unet.keras`) in the `/backend` folder. When running, the dashboard's System Status card will automatically switch to **Backend Connected**.
