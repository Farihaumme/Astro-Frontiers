# Aither Kairos
### Astronaut Health Monitoring & Medical Intelligence System

**NASA Space Apps Challenge 2026**

Aither Kairos is a prototype astronaut-health monitoring platform designed to support medical awareness during long-duration spaceflight, including ISS operations and future lunar and Mars missions. It brings together astronaut-specific baseline information, current measurements, AI-assisted analysis, and NASA spaceflight research context in one dashboard.

> **Important:** Aither Kairos is a research and demonstration prototype, not a certified medical device. It does not diagnose disease or replace a flight surgeon. Demonstration telemetry and placeholder astronaut information must not be mistaken for real astronaut data.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [How the Health Intelligence Works](#how-the-health-intelligence-works)
- [NASA Open Science Data Repository](#nasa-open-science-data-repository)
- [Technical Architecture](#technical-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Models and Data](#models-and-data)
- [Scientific and Clinical Limitations](#scientific-and-clinical-limitations)
- [Current Development Status](#current-development-status)
- [Team and Acknowledgements](#team-and-acknowledgements)

---

## Project Overview

Spaceflight can affect the human body in several ways. Microgravity-driven fluid shifts, cardiovascular adaptation, radiation exposure, isolation, and other mission stressors can influence astronaut health. During long missions, clinicians also need to understand whether a measurement is unusual for a particular astronaut—not only whether it differs from a general population value.

Aither Kairos is designed around that idea:

**Compare current measurements with the astronaut's own baseline, assess changes over time, and present relevant research context to support human review.**

The system combines:
1. **Current measurements** submitted for analysis, such as ECG recordings and IJV ultrasound images.
2. **Personal baseline information**, where available, to help interpret changes relative to the individual.
3. **NASA research context**, retrieved and processed from the NASA Open Science Data Repository (OSDR), where supported.
4. **A compact health summary** that communicates findings, warnings, data quality, and limitations.

The dashboard may use a fictional astronaut profile (Alex Rivera, AST-0427) and simulated telemetry for demonstration. These are not real Artemis III crew records or live NASA telemetry.

---

## Key Features

### 1. Mission Control Health Dashboard
- Dark aerospace-inspired interface with navy surfaces and cyan telemetry accents.
- Astronaut overview and mission information.
- System status indicators for backend availability and model readiness.
- Vital-sign cards and time-series visualizations for measurements such as:
  - Heart rate
  - Heart-rate variability (HRV)
  - Oxygen saturation (SpO₂)
  - Blood pressure
- Alerts and notifications area.
- Clear distinction between simulated demonstration telemetry and actual uploaded/analyzed data.

### 2. ECG Analysis — ECG-FM
- ECG image/recording analysis through the ECG analysis service.
- ECG-FM model inference for supported rhythm and cardiac-label predictions.
- Extracted signal and prediction information can be used by the backend to create an analysis summary.
- Results should be interpreted alongside signal quality, the astronaut's baseline, and clinical review.

The ECG-FM model produces model scores, not definitive diagnoses. A low-quality recording or uncertain prediction must be treated cautiously.

### 3. IJV Ultrasound Analysis
The Internal Jugular Vein (IJV) module is the primary image-analysis feature.

- Upload PNG or JPEG ultrasound images.
- Validate file type and image dimensions.
- Run semantic segmentation using a trained Keras U-Net model.
- Display the predicted vein-lumen mask over the ultrasound image.
- Support visual comparison of the original scan and segmentation result.
- Report available image-derived measurements, including:
  - Segmented area in pixels
  - Calibrated area in mm², when calibration is supplied
  - Perimeter
  - Circularity
  - Model confidence
- Show model and analysis status, including limitations.

**Segmentation is not the same as diagnosis.** A segmentation mask identifies an image region; it does not independently establish thrombosis, obstruction, or another clinical condition. If the model or dataset does not provide validated pathological labels, the application must report that abnormality classification is unavailable.

### 4. NASA Research Intelligence
- Connects to NASA OSDR study metadata and study-file endpoints.
- Downloads supported transformed study data for backend processing.
- Extracts relevant observations and summarizes research findings by category.
- Can provide context from clinical chemistry, cardiovascular, immune, and proteomic datasets when available.
- Keeps research-data processing on the backend rather than requiring users to browse raw study files.

NASA cohort data is **research context**, not the current astronaut's live measurements or personal baseline. It must not be presented as though it were collected from the person currently using the dashboard.

### 5. Health Summary and Medical Reporting
- Brings together available analysis results and data-quality information.
- Designed to communicate notable findings, changes from baseline, warnings, and missing information in a concise format.
- Supports review of prior analysis sessions where implemented.
- Report and export features may depend on the current frontend implementation.

### 6. Cardiovascular and Cognitive Demonstration Modules
The project may include demonstration views for:
- Cardiovascular telemetry and ECG rhythm visualization.
- Cognitive performance measures such as the Digit Symbol Substitution Test (DSST), N-back working-memory tasks, and Psychomotor Vigilance Test (PVT).

Unless connected to a validated assessment workflow and real measurements, these pages are demonstrations only and must be labelled accordingly.

---

## How the Health Intelligence Works

Aither Kairos is intended to follow this high-level workflow:

1. **Collect:** Receive a supported measurement or image from the user/operator.
2. **Validate:** Check file format, dimensions, signal quality, and required metadata.
3. **Analyze:** Run the appropriate model or measurement-processing pipeline.
4. **Compare:** Compare the result with the astronaut's own baseline when a valid, comparable baseline exists.
5. **Add context:** Retrieve relevant NASA research observations where appropriate, keeping cohort-level evidence separate from individual measurements.
6. **Summarize:** Present a compact status with supporting measurements, uncertainty, warnings, and limitations.
7. **Review:** Leave clinical interpretation and decisions to qualified medical personnel.

### Important comparison rules
- Compare an astronaut with their own baseline whenever possible.
- Compare only measurements with compatible units, methods, and collection conditions.
- Do not treat cohort averages or medians as universal clinical reference ranges.
- Do not add historical research observations directly to an individual's risk score.
- Do not interpret missing data as a normal result.
- Clearly identify simulated, estimated, or unavailable values.

---

## NASA Open Science Data Repository

Aither Kairos uses the **NASA Open Science Data Repository (OSDR)** as a source of spaceflight-related research data.

Official portal: https://osdr.nasa.gov/

### OSDR API endpoints used

For example, the OSD-575 study endpoints are:

- Study metadata: `https://osdr.nasa.gov/osdr/data/osd/meta/575`
- Study files: `https://osdr.nasa.gov/osdr/data/osd/files/575`

The backend NASA service is designed to retrieve study metadata and file information and download supported transformed data files for local processing.

### Example study: OSD-575
OSD-575 contains research measurements from the Inspiration4 mission. Its data can help explore changes observed in a small spaceflight cohort across available collection timepoints.

**How it is used:** the backend processes supported assay data and calculates descriptive summaries of paired participant changes where valid matched observations exist.

**What it does not mean:** OSD-575 does not provide live health measurements for the astronaut profile shown in the dashboard. Its cohort results are not a personal baseline, a diagnosis, or a universal normal range.

Because some study cohorts are very small, summaries must be labelled as descriptive and interpreted with appropriate caution.

---

## Technical Architecture

```text
Aither Kairos
│
├── Frontend
│   ├── Mission-control dashboard
│   ├── Astronaut profile and telemetry views
│   ├── ECG analysis interface
│   ├── IJV ultrasound upload and segmentation viewer
│   ├── NASA research / health-intelligence views
│   └── Reports, history, and settings
│
└── Backend
    ├── FastAPI application
    ├── ECG analysis integration
    │   └── ECG-FM inference service
    ├── IJV analysis
    │   └── TensorFlow / Keras U-Net segmentation model
    └── NASA OSDR integration
        ├── Study metadata and file retrieval
        ├── Transformed data downloads
        └── Research-data processing and summaries
```

### Main API routes

The backend may expose the following routes, depending on the enabled modules:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Check backend availability |
| `GET` | `/models/info` | Inspect model availability and information |
| `POST` | `/analyze-ijv` | Analyze an uploaded IJV ultrasound image |
| `POST` | `/analyze-ecg` | Analyze an uploaded ECG image/recording |
| `GET` | `/nasa/osd-575/analyze` | Process available OSD-575 study data |
| `GET` | `/nasa/osd-575/insights` | Return research summaries and insights |

Check the running FastAPI documentation at `http://localhost:8000/docs` for the exact routes and request parameters in your current backend version.

---

## Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- SVG-based telemetry visualizations

### Backend
- Python
- FastAPI
- Uvicorn
- NumPy
- Pillow
- TensorFlow / Keras
- Pandas (where used for dataset processing)

### AI and data
- ECG-FM for ECG-related model inference
- Keras U-Net for IJV ultrasound segmentation
- NASA OSDR API for research-study metadata and supported transformed datasets

---

## Project Structure

The exact files may evolve as development continues. The main project is organized approximately as follows:

```text
Astro-Frontiers/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── README.md
│   ├── nasa/
│   │   ├── nasa_service.py
│   │   ├── nasa_processor.py
│   │   └── nasa_intelligence.py
│   ├── nasa_data/                 # Downloaded study data; not committed
│   └── ecg/                       # ECG-FM integration / inference code
│
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── dashboard/
│   │   ├── ijv/
│   │   ├── cardiovascular/
│   │   ├── cognitive/
│   │   ├── profile/
│   │   ├── reports/
│   │   ├── history/
│   │   ├── settings/
│   │   └── layout/
│   ├── data/
│   ├── services/
│   ├── types/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── package.json
├── vite.config.ts
└── README.md
```

---

## Getting Started

### Prerequisites
Install the following:
- Git
- Node.js and npm
- Python 3.10 or a compatible version supported by the installed ML dependencies

You will also need the trained model files for the AI modules you want to run. Model weights and downloaded research datasets may be excluded from the Git repository because of their size.

### 1. Clone the repository

```bash
git clone https://github.com/Farihaumme/Astro-Frontiers.git
cd Astro-Frontiers
```

### 2. Set up the frontend

From the project root:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite prints the local URL in the terminal. Open that URL in your browser. It is commonly `http://localhost:5173`; use the URL actually shown by your terminal.

### 3. Set up the FastAPI backend (Windows PowerShell)

Open a second terminal:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Start the backend:

```powershell
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend API documentation:

```text
http://localhost:8000/docs
```

If PowerShell blocks virtual-environment activation, you can use this for the current terminal session:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

### 4. Configure model files

Place each model file at the path expected by the backend configuration. For example, the IJV module may expect:

```text
backend/aither_kairos_ijv_unet.keras
```

The exact filename and location must match the path configured in `backend/main.py`.

ECG-FM may require a separate Python environment and model checkpoint. Follow the setup instructions in the ECG integration directory and ensure the backend is configured to contact the ECG inference service if it runs separately.

**Do not commit large model checkpoints, private credentials, or `.env` files to GitHub.** Provide model files through an approved download location or Git LFS if the team needs shared access.

---

## Running the Application

Run the frontend and backend in separate terminals.

**Terminal 1 — Frontend**
```powershell
cd "path\to\Astro-Frontiers"
npm run dev
```

**Terminal 2 — Backend**
```powershell
cd "path\to\Astro-Frontiers\backend"
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --port 8000
```

If ECG-FM is configured as a separate service, start it in its own terminal using the command and environment specified by that service's setup.

---

## Models and Data

### Model weights
Model weights are not necessarily included in this repository. Confirm that the required files are available locally before expecting live inference to work.

### NASA research data
Downloaded OSDR transformed files are generated by the backend and should normally remain outside version control. The backend can retrieve supported files from NASA when the relevant service is configured and network access is available.

### Demonstration data
Any fictional astronaut profile, simulated vital signs, sample ECG, or reference ultrasound image is for demonstration and testing. It must be visibly distinguished from actual astronaut measurements.

---

## Scientific and Clinical Limitations

- Aither Kairos is a prototype and is not certified for clinical or operational flight use.
- AI predictions are decision-support signals for human review, not diagnoses.
- ECG-FM scores depend on the model, input format, signal quality, and supported labels.
- IJV segmentation measures an image region; it does not independently diagnose a vascular condition.
- Ultrasound measurements depend on image quality, segmentation accuracy, and calibration.
- NASA OSDR studies may contain small cohorts, different instruments, assay platforms, units, and collection schedules.
- Historical cohort observations must not be represented as current individual astronaut measurements.
- Cohort medians are descriptive research summaries, not universal clinical reference ranges.
- A change from baseline is not automatically a medical risk. Interpretation requires comparable measurements and clinical context.
- Missing, simulated, or low-quality data must be clearly identified rather than treated as normal.

---

## Current Development Status

Aither Kairos is under active development. The intended functional core includes:
- Mission-control dashboard and telemetry presentation.
- FastAPI backend and model-status reporting.
- IJV ultrasound segmentation using a Keras model.
- ECG-FM integration for ECG analysis.
- NASA OSDR study retrieval and backend research-data processing.

Other areas—such as a fully validated unified health score, operational live telemetry, clinical abnormality classification, and complete cognitive-assessment workflows—require further implementation, validation, and testing. The interface should label demonstration or planned functionality honestly.

---

## Team and Acknowledgements

Developed for the **NASA Space Apps Challenge 2026**.

- NASA Open Science Data Repository (OSDR): https://osdr.nasa.gov/
- ECG-FM research project: https://github.com/bowang-lab/ecg-fm

NASA data and third-party models remain subject to their respective terms, licenses, and attribution requirements. This project is an independent challenge prototype and is not an official NASA medical system.
