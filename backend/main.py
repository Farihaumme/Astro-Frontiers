"""
Aither Kairos — IJV Ultrasound Analysis Backend Service
NASA Space Apps Challenge 2026
FastAPI + Keras/TensorFlow Segmentation Engine
"""

import os
import io
import time
import base64
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import numpy as np
from PIL import Image

app = FastAPI(
    title="Aither Kairos IJV Analysis API",
    description="Internal Jugular Vein (IJV) B-Mode Ultrasound Segmentation Inference API",
    version="1.0.0"
)

# Enable CORS for local development and AI Studio frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration & Model Paths
MODEL_PATH = os.environ.get(
    "IJV_MODEL_PATH",
    os.path.join(os.path.dirname(__file__), "aither_kairos_ijv_unet.keras")
)
FALLBACK_H5_PATH = os.path.join(
    os.path.dirname(__file__),
    "ijv_segthy_unet.h5"
)

# Global model container
keras_model = None
model_load_error = None
device_name = "CPU"

def load_segmentation_model():
    """Attempt to load the trained Keras IJV segmentation model."""
    global keras_model, model_load_error, device_name
    try:
        import tensorflow as tf
        # Check for GPU
        gpus = tf.config.list_physical_devices('GPU')
        if gpus:
            device_name = f"GPU: {gpus[0].name}"
        else:
            device_name = "CPU"

        target_file = None
        if os.path.exists(MODEL_PATH):
            target_file = MODEL_PATH
        elif os.path.exists(FALLBACK_H5_PATH):
            target_file = FALLBACK_H5_PATH
        
        if target_file:
            # Custom objects if model used Dice loss or custom metrics
            keras_model = tf.keras.models.load_model(target_file, compile=False)
            print(f"[INFO] Successfully loaded IJV segmentation model from {target_file}")
            model_load_error = None
        else:
            model_load_error = f"Model weights not found. Looked for '{MODEL_PATH}' and '{FALLBACK_H5_PATH}'."
            print(f"[WARN] {model_load_error}")
    except Exception as e:
        model_load_error = f"Failed to load Keras model: {str(e)}"
        print(f"[ERROR] {model_load_error}")

# Try loading at startup
load_segmentation_model()


class HealthResponse(BaseModel):
    status: str
    backend: str
    model_loaded: bool
    model_path: str
    model_architecture: str
    device: str
    load_error: Optional[str] = None
    timestamp: float


@app.get("/health", response_model=HealthResponse)
def health_check():
    """Check backend operational status and Keras model readiness."""
    return HealthResponse(
        status="operational" if keras_model is not None else "degraded",
        backend="FastAPI/Python 3.11",
        model_loaded=(keras_model is not None),
        model_path=MODEL_PATH,
        model_architecture="U-Net (ResNet34 Backbone, SegThy-adapted)",
        device=device_name,
        load_error=model_load_error,
        timestamp=time.time()
    )


@app.get("/models/info")
def model_info():
    """Detailed metadata about the trained IJV segmentation model."""
    return {
        "model_name": "SegThy-IJV-UNet",
        "task": "Semantic Segmentation of Internal Jugular Vein (IJV)",
        "input_dimensions": [256, 256, 1],
        "output_dimensions": [256, 256, 1],
        "framework": "Keras 3 / TensorFlow",
        "dataset_origin": "SegThy Ultrasound Benchmark Dataset (annotated for thyroid & cervical vasculature)",
        "clinical_scope": "Morphological cross-sectional area estimation in microgravity spaceflight",
        "abnormality_classification_supported": False,
        "abnormality_notice": "SegThy dataset provides anatomical segmentation boundaries only. Abnormality classification is not supported by this model."
    }


    
def preprocess_ultrasound(pil_image, target_size=(128, 128)):
    image = pil_image.convert("L")
    image = image.resize(target_size)

    image_array = np.array(image, dtype=np.float32) / 255.0

    # Add batch and channel dimensions
    input_tensor = np.expand_dims(image_array, axis=0)
    input_tensor = np.expand_dims(input_tensor, axis=-1)

    return input_tensor




@app.post("/analyze-ijv")
async def analyze_ijv(
    file: UploadFile = File(...),
    calibration_mm_per_px: float = Query(0.088, description="Spatial calibration factor (mm per pixel)")
):
    """
    Process ultrasound scan:
    - Validates image format (PNG, JPEG)
    - If model is available: performs inference, extracts mask, computes metrics
    - If model is unavailable: cleanly returns 503 with structured error details
    """
    start_time = time.time()

    # Validate file type
    if file.content_type not in ["image/png", "image/jpeg", "image/jpg"]:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file format. Please upload a PNG or JPEG ultrasound image."
        )

    # Read image contents
    try:
        contents = await file.read()
        pil_image = Image.open(io.BytesIO(contents))
        original_width, original_height = pil_image.size
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Corrupt or unreadable image file: {str(e)}"
        )

    # Check model readiness
    if keras_model is None:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "model_unavailable",
                "error": "Trained Keras model file not found or failed to load on backend.",
                "details": model_load_error or "Model weights missing. Place 'ijv_segthy_unet.keras' in /backend directory.",
                "detection_status": "model_unavailable",
                "instructions": "Run backend setup with trained weights as documented in /backend/README.md",
                "image_info": {
                    "filename": file.filename,
                    "dimensions": {"width": original_width, "height": original_height}
                }
            }
        )

    # Perform segmentation inference
    try:
        input_tensor = preprocess_ultrasound(pil_image, target_size=(128, 128))
        print("Input tensor shape:", input_tensor.shape)
        preds = keras_model.predict(input_tensor)
        print("Prediction shape:", preds.shape)
        print("Prediction min:", float(np.min(preds)))
        print("Prediction max:", float(np.max(preds)))
        print("Prediction mean:", float(np.mean(preds)))
        print("Pixels above 0.5:", int(np.sum(preds > 0.5)))
        # Binary mask threshold at 0.5
        pred_mask_256 = (preds[0, :, :, 0] > 0.5).astype(np.uint8) * 255
        
        # Resize mask back to original resolution for display
        mask_pil = Image.fromarray(pred_mask_256).resize(
            (original_width, original_height),
            Image.Resampling.NEAREST
        )
        mask_array = np.array(mask_pil) > 128
        
        # Calculate morphological metrics
        area_pixels = int(np.sum(mask_array))
        has_detection = area_pixels > 150 # minimum pixel threshold
        
        # Calibrated area in mm^2: area_px * (calibration_factor)^2
        area_mm2 = round(area_pixels * (calibration_mm_per_px ** 2), 2)
        
        # Estimate perimeter using simple border gradient
        pad_mask = np.pad(mask_array, 1, mode='constant')
        edges = (
            (pad_mask[1:-1, 1:-1] != pad_mask[:-2, 1:-1]) |
            (pad_mask[1:-1, 1:-1] != pad_mask[2:, 1:-1]) |
            (pad_mask[1:-1, 1:-1] != pad_mask[1:-1, :-2]) |
            (pad_mask[1:-1, 1:-1] != pad_mask[1:-1, 2:])
        ) & mask_array
        perimeter_pixels = int(np.sum(edges))
        
        # Circularity (isoperimetric quotient: 4 * pi * Area / Perimeter^2)
        circularity = 0.0
        if perimeter_pixels > 0 and area_pixels > 0:
            circularity = round(float(4 * np.pi * area_pixels / (perimeter_pixels ** 2)), 3)
            circularity = min(1.0, circularity)

        # Encode mask as PNG base64 for direct browser overlay
        mask_png_buffer = io.BytesIO()
        mask_pil.save(mask_png_buffer, format="PNG")
        mask_base64 = "data:image/png;base64," + base64.b64encode(mask_png_buffer.getvalue()).decode("utf-8")
        
        # Calculate mean activation confidence within detected region
        mean_confidence = None
        if has_detection:
            resized_raw_prob = Image.fromarray((preds[0, :, :, 0] * 255).astype(np.uint8)).resize(
                (original_width, original_height),
                Image.Resampling.BILINEAR
            )
            prob_arr = np.array(resized_raw_prob) / 255.0
            mean_confidence = round(float(np.mean(prob_arr[mask_array])), 3)

        inference_time_ms = round((time.time() - start_time) * 1000, 1)

        findings = []
        if has_detection:
            findings.append(f"Internal Jugular Vein lumen successfully delineated (CSA: {area_mm2} mm² / {area_pixels} px).")
            if area_mm2 > 120.0:
                findings.append("Venous dilation observed relative to 1G supine baseline; consistent with cephalad fluid shift.")
            else:
                findings.append("Venous cross-sectional area remains within standard expected microgravity envelope.")
        else:
            findings.append("No coherent internal jugular vein lumen segmented above acoustic threshold.")

        limitations = [
            "Segmentation alone does not diagnose thrombosis, vascular occlusion, or intracranial hypertension.",
            "SegThy training distribution represents earth-based clinical cohorts; acoustic speckle variance in microgravity requires clinical oversight.",
            "Area measurement accuracy depends on calibrated ultrasound transducer depth setting."
        ]

        return {
            "status": "success",
            "detection_status": "detected" if has_detection else "not_detected",
            "image_name": file.filename,
            "dimensions": {"width": original_width, "height": original_height},
            "area_pixels": area_pixels,
            "area_mm2": area_mm2,
            "perimeter_pixels": perimeter_pixels,
            "circularity": circularity,
            "confidence": mean_confidence,
            "inference_time_ms": inference_time_ms,
            "model_version": "SegThy-UNet-v1.0 (Keras 3)",
            "mask_data_url": mask_base64,
            "calibration_used_mm_per_px": calibration_mm_per_px,
            "findings": findings,
            "limitations": limitations,
            "abnormality_classification": {
                "status": "unavailable",
                "message": "Abnormality classification unavailable",
                "details": "The SegThy benchmark dataset provides anatomical segmentation ground-truth, not clinical diagnostic labels (e.g. thrombosis vs patent). Assessment requires Flight Surgeon evaluation."
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error during segmentation: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
