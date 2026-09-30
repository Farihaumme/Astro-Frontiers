# Aither Kairos — Astronaut Health Monitoring System

> **A spaceflight-aware health monitoring dashboard prototype for long-duration astronaut missions.**

Aither Kairos is an interactive web-based prototype designed to help astronauts and flight-support teams monitor physiological and cognitive health, compare measurements against personal baselines, understand changes in mission context, and identify items that may require further review.

The current repository contains a **front-end prototype using simulated data**. It is intended for demonstration and concept validation rather than clinical diagnosis or real-time medical use.

---

## Overview

Long-duration spaceflight can affect multiple aspects of astronaut health. Aither Kairos presents these health indicators in a single mission dashboard instead of treating each measurement as an isolated value.

The system combines:

- Physiological telemetry
- Personal-baseline comparison
- ECG visualization and AI decision-support concepts
- Cardiovascular trends
- Blood oxygen and respiratory monitoring
- Blood-pressure measurements
- Internal jugular vein (IJV) ultrasound monitoring
- Cognitive-performance monitoring
- Spaceflight and mission context
- Health alerts and review items
- Mission health reports

The interface is designed around the idea of **"What changed, how much did it change, and what mission context might explain it?"**

---

## Key Features

### 🛰️ Mission Overview

The main dashboard provides a high-level snapshot of astronaut health, including:

- Current heart rate
- SpO₂
- Blood pressure
- Cardiovascular status
- Personal-baseline deviations
- Recent health changes
- Items recommended for review
- Spaceflight context

The overview also provides live physiological telemetry charts and an ECG monitor.

### 🫀 Cardiovascular Monitoring

The cardiovascular dashboard includes:

- Heart rate
- SpO₂
- Systolic and diastolic blood pressure
- ECG rhythm
- PVC burden
- QTc
- HRV (rMSSD)
- Bradycardia/tachycardia indicators
- Repolarization status
- Mission-long cardiovascular trends
- Exercise recovery concepts
- VO₂-max proxy visualization

### 🤖 ECG AI Analysis

The ECG AI page demonstrates a decision-support workflow:

```text
ECG Input
    ↓
Preprocessing
    ↓
ECG-FM
    ↓
Spaceflight Context
    ↓
Risk Interpretation
    ↓
Human Review
```

The prototype shows:

- ECG waveform visualization
- AI focus/saliency region
- Personal baseline
- Recent heart-rate trend
- QTc
- PVC burden
- Spaceflight context
- Pattern-change detection
- Model confidence
- Recommended human review

**Important:** The interface explicitly presents this as decision support, not a medical diagnosis. ECG interpretations require qualified medical review.

### 🫁 Blood & Oxygen Monitoring

The Blood & Oxygen module monitors:

- SpO₂
- Respiratory rate
- SpO₂ trends
- Personal baseline comparison

### 📡 Ultrasound / IJV Monitoring

The ultrasound module demonstrates repeated internal jugular vein monitoring through comparison of:

- Previous scan
- Current scan
- IJV diameter
- Baseline
- Flow-pattern status
- Anomaly indicators
- Scan history
- Next scheduled scan

The prototype presents IJV ultrasound as a **spaceflight-related monitoring concept and intracranial-pressure surrogate**, not as a standalone diagnosis.

### 🧠 Cognitive Monitoring

The cognitive dashboard compares performance against a pre-flight personal baseline across:

- Processing speed
- Sustained attention
- Working memory
- Decision making
- Composite cognitive score

It also provides a workflow from baseline measurement to in-flight testing, comparison, trend checking, and review.

### 🌍 Mission Context

Physiological measurements are shown alongside mission information such as:

- Mission day
- Microgravity status
- Radiation exposure
- Cumulative radiation dose
- Sleep duration
- Exercise
- EVA status
- CO₂ exposure
- Fluid-shift status
- Recent mission events

This helps demonstrate the **spaceflight-aware** part of Aither Kairos.

### 🧬 Future Health Modules

The prototype includes placeholders for future:

- Immune Health monitoring
- Bone Health monitoring

These sections currently display planned data categories and integration concepts rather than functioning data pipelines.

### 📋 Reports

The Reports page provides a prototype interface for mission health reports, including:

- Daily Health Summary
- Cardiovascular Weekly Review
- ECG AI Analysis Report
- Cognitive Assessment
- IJV Ultrasound Comparative Report
- Mission Health Trend Report

---

## Technology Stack

Aither Kairos is currently implemented as a lightweight front-end prototype.

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Dashboard layout, responsive design, glassmorphism UI |
| JavaScript | Navigation, simulation, interaction, visualization logic |
| [Three.js](https://threejs.org/) | 3D space background and visual effects |
| [Chart.js](https://www.chartjs.org/) | Telemetry charts and trend visualizations |
| Canvas API | ECG waveform, hero animation, and ultrasound/body visualizations |
| Google Fonts — Orbitron | Mission/brand typography |

The current HTML loads Three.js and Chart.js through jsDelivr CDN resources. Therefore, the current prototype is **not fully self-contained/offline** until those dependencies are bundled locally. 

---

## Project Structure

The current prototype can run as a single HTML file:

```text
Aither-Kairos/
│
├── index.html
└── README.md
```

As the project grows, the application can be separated into a more maintainable structure such as:

```text
Aither-Kairos/
│
├── index.html
│
├── assets/
│   ├── images/
│   └── icons/
│
├── css/
│   └── styles.css
│
├── js/
│   ├── app.js
│   ├── charts.js
│   ├── ecg.js
│   ├── navigation.js
│   └── simulation.js
│
├── data/
│   └── demo/
│
├── docs/
│
└── README.md
```

---

## Running the Prototype

### Option 1 — Open Directly

Because the current application is a static HTML prototype, it can be opened directly in a modern browser.

1. Clone the repository.
2. Open `index.html`.
3. Interact with the dashboard.

### Option 2 — Run a Local Server

For a more reliable development environment:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

A local server is recommended as the project evolves toward modular JavaScript, local assets, APIs, and cached mission data.

---

## Data Status

### Current Prototype

The current dashboard uses **simulated/demo data**.

Charts generate values programmatically for demonstration, while the interface displays representative mission values such as:

- Heart rate
- SpO₂
- Blood pressure
- HRV
- QTc
- PVC burden
- Respiratory rate
- Cognitive scores
- IJV measurements
- Mission/environmental context

The live heart-rate and SpO₂ displays are updated periodically using JavaScript-generated values.

This means the current prototype does **not** directly connect to astronaut medical sensors, NASA telemetry, hospital systems, or a live medical database.

### Production Direction

A future implementation can replace the simulation layer with real data sources:

```text
Sensors / Medical Data
        ↓
Data Ingestion
        ↓
Validation & Preprocessing
        ↓
Personal Baseline
        ↓
Trend / Anomaly Detection
        ↓
Spaceflight Context
        ↓
Astronaut Dashboard
        ↓
Human Medical Review
```

---

## Design Philosophy

Aither Kairos is designed around several principles:

### 1. Personal Baseline First

A measurement should not be interpreted only against a generic population range.

The dashboard emphasizes:

```text
Current Value
      ↓
Personal Baseline
      ↓
Deviation
      ↓
Trend
      ↓
Context
```

### 2. Context-Aware Monitoring

A physiological change can be displayed alongside relevant mission events such as exercise, CO₂ exposure, fluid shifts, or an EVA.

### 3. Human-in-the-Loop

AI is presented as decision support rather than an autonomous medical authority.

The prototype therefore includes human review in the ECG analysis workflow.

### 4. Longitudinal Monitoring

The system focuses not only on a single measurement but also on changes over:

- Hours
- Days
- Weeks
- Mission duration

### 5. Astronaut-Centered Interface

The dashboard aims to let a crew member quickly answer:

- **What is happening?**
- **What changed?**
- **Is it different from my baseline?**
- **Could mission context matter?**
- **Does this need attention?**

---

## Current Limitations

This version is a **prototype**, not a clinical system.

Current limitations include:

- Data is simulated.
- No real medical sensor integration.
- No real astronaut telemetry integration.
- No backend API.
- No persistent database.
- No authentication or authorization.
- No clinical validation.
- AI analysis is represented as a prototype decision-support interface rather than a validated medical AI model.
- Historical chart data is generated for visualization.
- Some modules are conceptual/future modules.
- External CDN dependencies are currently used for Three.js and Chart.js.
- Report entries are interface prototypes rather than actual generated medical reports.

---

## Future Development

Potential next steps include:

### Data Layer

- Connect real or research datasets.
- Add a structured telemetry schema.
- Store longitudinal measurements.
- Support mission-day indexing.
- Implement personal-baseline calculation.

### Monitoring & Analytics

- Robust anomaly detection.
- Trend detection.
- Multi-parameter correlation.
- Spaceflight-context-aware analysis.
- Confidence and uncertainty reporting.

### AI

- Replace the ECG demonstration with a validated model where appropriate.
- Add explainable AI outputs.
- Preserve human review for medical decisions.
- Track model version and confidence.

### Offline / Mission Operation

- Bundle front-end dependencies locally.
- Add service-worker caching.
- Cache mission datasets before communication loss.
- Support operation with intermittent connectivity.
- Add a clear data-sync state.

### Backend

A future architecture could separate the application into:

```text
Frontend
   ↓
Health Monitoring API
   ↓
Data / Analytics Layer
   ↓
Mission & Environmental Data
```

This would allow the current dashboard to evolve from a demonstration interface into a complete health-monitoring platform.

---

## Medical Safety

Aither Kairos is a research/demo prototype.

It is **not a medical device, diagnostic system, or substitute for qualified medical judgment**.

Any real deployment involving astronaut health would require appropriate:

- Clinical validation
- Medical oversight
- Data-quality controls
- Cybersecurity
- Privacy protections
- Human-factors testing
- Regulatory and operational review

---

## Repository Contribution

When contributing to the project:

1. Keep the dashboard focused on astronaut health monitoring.
2. Clearly distinguish simulated data from real data.
3. Do not present prototype AI outputs as clinical diagnoses.
4. Document new data sources and assumptions.
5. Keep experimental/future modules clearly labeled.
6. Test the dashboard after UI or JavaScript changes.
7. Avoid committing credentials, API keys, or sensitive health data.

---

## Project Status

**Current stage:** Interactive front-end prototype

**Data:** Simulated / demonstration data

**Backend:** Not yet implemented

**AI:** Decision-support concept / simulated analysis output

**Clinical use:** Not intended

---

## License

Add the project's chosen open-source license here before publishing the repository.

If this project is being submitted under a competition or organization with specific open-source requirements, follow those requirements and include the corresponding `LICENSE` file in the repository.

---

## Aither Kairos

**Aither Kairos** — *Spaceflight-Aware Continuous Health Monitoring*

A unified interface for understanding astronaut health through **baseline comparison + longitudinal trends + mission context + human-centered decision support**.
