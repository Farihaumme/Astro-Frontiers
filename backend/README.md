# Aither Kairos — IJV Ultrasound Analysis Backend

**NASA Space Apps Challenge 2026**  
Internal Jugular Vein (IJV) B-Mode Ultrasound Segmentation Inference Engine using FastAPI and Keras/TensorFlow.

---

## 1. Overview

This backend service provides machine-learning inference endpoints for segmenting the Internal Jugular Vein (IJV) from B-mode neck ultrasound scans captured in microgravity environments (such as on the ISS or Artemis transit).

- **Architecture:** U-Net with ResNet34 backbone (SegThy-adapted)
- **Input:** Single-channel grayscale ultrasound image (resized to $256 \times 256$)
- **Output:** Predicted binary segmentation mask, cross-sectional area (pixels and $\text{mm}^2$), circularity index, and confidence score.
- **Diagnostics:** Honest reporting of model readiness and clear notice that abnormality classification is separate from anatomical segmentation.

---

## 2. Quickstart & Installation

### Step 1: Create a Python virtual environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 2: Install dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Provide Model Weights
Place your trained Keras model file in the `backend/` directory as:
```
backend/ijv_segthy_unet.keras
```
*(or `ijv_segthy_unet.h5`)*

If no weights file is present, the server starts in **Honest Reporting Mode**: `GET /health` returns `status: degraded`, and `POST /analyze-ijv` returns HTTP `503 Service Unavailable` with instructions, ensuring the frontend never fabricates fake clinical outputs.

### Step 4: Launch the API Server
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The service will be live at:
- **API Base:** `http://localhost:8000`
- **Swagger Documentation:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/health`

---

## 3. Endpoints

### `GET /health`
Returns backend operational status and whether the Keras model is loaded.
```json
{
  "status": "operational",
  "backend": "FastAPI/Python 3.11",
  "model_loaded": true,
  "model_path": ".../backend/ijv_segthy_unet.keras",
  "model_architecture": "U-Net (ResNet34 Backbone, SegThy-adapted)",
  "device": "CPU",
  "load_error": null,
  "timestamp": 1745851200.0
}
```

### `POST /analyze-ijv`
Accepts a multipart file upload (`image/png` or `image/jpeg`) and an optional `calibration_mm_per_px` query parameter.

**Parameters:**
- `file`: Ultrasound image (PNG/JPEG).
- `calibration_mm_per_px` (query float, default: `0.088`): Millimeters per pixel scale from the ultrasound transducer depth setting.

**Response (Model Available):**
```json
{
  "status": "success",
  "detection_status": "detected",
  "image_name": "scan_ast0427.png",
  "dimensions": { "width": 800, "height": 600 },
  "area_pixels": 14200,
  "area_mm2": 110.0,
  "perimeter_pixels": 450,
  "circularity": 0.88,
  "confidence": 0.942,
  "inference_time_ms": 138.4,
  "model_version": "SegThy-UNet-v1.0 (Keras 3)",
  "mask_data_url": "data:image/png;base64,...",
  "findings": [
    "Internal Jugular Vein lumen successfully delineated (CSA: 110.0 mm² / 14200 px).",
    "Venous cross-sectional area remains within standard expected microgravity envelope."
  ],
  "limitations": [
    "Segmentation alone does not diagnose thrombosis, vascular occlusion, or intracranial hypertension.",
    "SegThy training distribution represents earth-based clinical cohorts; acoustic speckle variance in microgravity requires clinical oversight."
  ],
  "abnormality_classification": {
    "status": "unavailable",
    "message": "Abnormality classification unavailable",
    "details": "The SegThy benchmark dataset provides anatomical segmentation ground-truth, not clinical diagnostic labels. Assessment requires Flight Surgeon evaluation."
  }
}
```

**Response (Model Unavailable):**
```json
{
  "status": "model_unavailable",
  "error": "Trained Keras model file not found or failed to load on backend.",
  "details": "Model weights not found. Looked for '.../ijv_segthy_unet.keras'.",
  "detection_status": "model_unavailable",
  "instructions": "Place 'ijv_segthy_unet.keras' in /backend directory."
}
```

---

## 4. SegThy Dataset & Medical Responsibility Notice
- **Segmentation vs Abnormality:** The SegThy dataset provides ground-truth boundaries for thyroid and neck anatomical structures. It is not an anomaly detection dataset.
- **Flight Surgeon In-the-Loop:** Automated lumen area estimation assists in tracking cephalic fluid shift and Spaceflight-Associated Neuro-ocular Syndrome (SANS) risks, but must always be reviewed by mission medical personnel.
