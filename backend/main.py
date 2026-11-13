"""
Aither Kairos — IJV Ultrasound Analysis Backend Service
NASA Space Apps Challenge 2026

FastAPI + Keras/TensorFlow + ECG-FM + OpenAI
"""

import os
import io
import time
import base64

from typing import Optional

import httpx
import numpy as np
from nasa.nasa_service import (
    get_study_metadata,
    get_study_files,
    download_transformed_files
)
from nasa.nasa_intelligence import (
    generate_nasa_research_intelligence
)
from nasa.nasa_processor import (
    inspect_nasa_datasets,
    get_nasa_dataset_summary,
    analyze_nasa_datasets
)
from PIL import Image
from dotenv import load_dotenv
from openai import AsyncOpenAI, OpenAIError

from fastapi import (
    FastAPI,
    File,
    UploadFile,
    HTTPException,
    Query,
    status
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

import ecg_service
from ecg_service import EcgImageError


# ============================================================
# 1. ENVIRONMENT VARIABLES AND OPENAI CONFIGURATION
# ============================================================

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")

# Do not prevent the entire backend from starting if the API
# key is missing. The chatbot endpoint will return an error.
ai_client = AsyncOpenAI(api_key=api_key) if api_key else None

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-6-luna")


# ============================================================
# 2. FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Aither Kairos API",
    description="Astronaut Health Monitoring Backend",
    version="1.1.0"
)


# CORS configuration for local frontend development.
# Restrict origins to your frontend domain before deployment.

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# 3. MODEL PATHS AND GLOBAL VARIABLES
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.environ.get(
    "IJV_MODEL_PATH",
    os.path.join(BASE_DIR, "aither_kairos_ijv_unet.keras")
)

FALLBACK_H5_PATH = os.path.join(
    BASE_DIR,
    "ijv_segthy_unet.h5"
)

keras_model = None

model_load_error = None

device_name = "CPU"


# ============================================================
# 4. LOAD IJV SEGMENTATION MODEL
# ============================================================

def load_segmentation_model():
    """
    Load the trained Keras IJV segmentation model.
    """

    global keras_model
    global model_load_error
    global device_name

    try:

        import tensorflow as tf

        # Check GPU availability
        gpus = tf.config.list_physical_devices("GPU")

        if gpus:
            device_name = f"GPU: {gpus[0].name}"
        else:
            device_name = "CPU"

        # Locate model file
        target_file = None

        if os.path.exists(MODEL_PATH):
            target_file = MODEL_PATH

        elif os.path.exists(FALLBACK_H5_PATH):
            target_file = FALLBACK_H5_PATH

        if target_file is None:

            model_load_error = (
                f"Model weights not found. "
                f"Looked for '{MODEL_PATH}' and "
                f"'{FALLBACK_H5_PATH}'."
            )

            print("[WARNING]", model_load_error)

            return

        # Load model
        keras_model = tf.keras.models.load_model(
            target_file,
            compile=False
        )

        model_load_error = None

        print("[INFO] IJV segmentation model loaded successfully.")
        print("[INFO] Model path:", target_file)
        print("[INFO] Device:", device_name)

    except Exception as e:

        keras_model = None

        model_load_error = str(e)

        print("[ERROR] Failed to load IJV model:", e)


# Load the model once when the backend starts.
load_segmentation_model()


# ============================================================
# 5. REQUEST MODELS
# ============================================================

class ChatRequest(BaseModel):

    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="User's message to Aither AI"
    )


class HealthResponse(BaseModel):

    status: str

    backend: str

    model_loaded: bool

    model_path: str

    model_architecture: str

    device: str

    load_error: Optional[str] = None

    ecg_model_loaded: bool = False

    ecg_load_error: Optional[str] = None

    timestamp: float


# ============================================================
# 6. AITHER AI CHATBOT
# ============================================================

@app.post("/chat")
async def chat_with_ai(request: ChatRequest):

    """
    Aither AI chatbot.

    Receives a user's question and sends it to the
    OpenAI Responses API.
    """

    if ai_client is None:

        raise HTTPException(
            status_code=503,
            detail="OpenAI API key is not configured. "
                   "Please check your backend .env file."
        )

    user_message = request.message.strip()

    if not user_message:

        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    try:

        response = await ai_client.responses.create(

            model=OPENAI_MODEL,

            instructions="""

            You are Aither AI, the intelligent astronaut health
            companion developed for the Aither Kairos project.

            Your purpose is to provide clear and helpful information
            about:

            1. Space medicine and astronaut health.
            2. Cardiovascular health in microgravity.
            3. ECG and cardiac monitoring.
            4. Internal jugular vein ultrasound.
            5. Microgravity-related physiological changes.
            6. Radiation exposure and astronaut health risks.
            7. General health monitoring during space missions.

            RESPONSE GUIDELINES:

            - Explain scientific concepts in simple language.
            - Use clear headings and bullet points when helpful.
            - Explain medical terminology when necessary.
            - Be scientifically accurate.
            - Never invent patient measurements or test results.
            - Do not claim to have access to astronaut health records.
            - Do not pretend to have analyzed an ECG or ultrasound
              unless actual analysis results are supplied.
            - Do not provide a definitive medical diagnosis.
            - If a potentially serious medical issue is discussed,
              recommend evaluation by a qualified medical professional
              or flight surgeon.

            IMPORTANT:

            You are an informational assistant, not a replacement
            for a physician or flight surgeon.

            """

            ,

            input=user_message

        )

        ai_reply = response.output_text

        if not ai_reply:

            raise HTTPException(
                status_code=502,
                detail="Aither AI returned an empty response."
            )

        return {
            "status": "success",
            "reply": ai_reply,
            "model": OPENAI_MODEL
        }

    except HTTPException:
        raise

    except OpenAIError as e:

        print("[OPENAI ERROR]", str(e))

        raise HTTPException(
            status_code=502,
            detail="Aither AI could not generate a response. "
                   "Please check your API configuration and try again."
        )

    except Exception as e:

        print("[CHAT ERROR]", str(e))

        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing "
                   "your message."
        )

@app.get("/nasa/osd-575/metadata")
async def nasa_metadata():

    try:
        data = await get_study_metadata()

        return data

    except Exception as e:
        return {
            "error": str(e)
        }

# nasa api
@app.get("/nasa/osd-575/files")
async def nasa_files():

    try:
        data = await get_study_files()

        return data

    except Exception as e:
        return {
            "error": str(e)
        }
# ============================================================
# 7. HEALTH CHECK
# ============================================================
@app.get("/nasa/osd-575/inspect")
async def inspect_nasa_data():

    try:
        datasets = inspect_nasa_datasets()

        return {
            "status": "success",
            "total_datasets": len(datasets),
            "datasets": datasets
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
@app.get("/health", response_model=HealthResponse)
async def health_check():

    """
    Check backend, IJV model and separate ECG-FM service.
    """

    ecg_loaded = False

    ecg_error = None

    try:

        async with httpx.AsyncClient(timeout=3.0) as client:

            response = await client.get(
                "http://127.0.0.1:8001/health"
            )

            response.raise_for_status()

            ecg_status = response.json()

            ecg_loaded = ecg_status.get(
                "model_loaded",
                False
            )

            ecg_error = ecg_status.get("error")

    except Exception as e:

        ecg_error = str(e)

    return HealthResponse(

        status="operational" if keras_model is not None else "degraded",

        backend="FastAPI/Python",

        model_loaded=(keras_model is not None),

        model_path=MODEL_PATH,

        model_architecture="U-Net (ResNet34 Backbone, SegThy-adapted)",

        device=device_name,

        load_error=model_load_error,

        ecg_model_loaded=ecg_loaded,

        ecg_load_error=ecg_error,

        timestamp=time.time()

    )
@app.get("/nasa/osd-575/insights")
async def nasa_research_insights():

    try:

        result = generate_nasa_research_intelligence()

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# 8. MODEL INFORMATION
# ============================================================
@app.get("/nasa/osd-575/download")
async def download_nasa_datasets():

    try:

        files = await download_transformed_files()

        return {
            "status": "success",
            "total_downloaded": len(files),
            "files": files
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
@app.get("/models/info")
def model_info():

    """
    Detailed metadata about the trained IJV segmentation model.
    """

    return {

        "model_name": "SegThy-IJV-UNet",

        "task": "Semantic Segmentation of Internal Jugular Vein (IJV)",

        "input_dimensions": [128, 128, 1],

        "output_dimensions": [128, 128, 1],

        "framework": "Keras 3 / TensorFlow",

        "dataset_origin": (
            "SegThy Ultrasound Benchmark Dataset "
            "(annotated for thyroid and cervical vasculature)"
        ),

        "clinical_scope": (
            "Morphological cross-sectional area estimation "
            "in microgravity spaceflight"
        ),

        "abnormality_classification_supported": False,

        "abnormality_notice": (
            "SegThy dataset provides anatomical segmentation "
            "boundaries only. Abnormality classification is "
            "not supported by this model."
        )

    }


# ============================================================
# 9. ULTRASOUND PREPROCESSING
# ============================================================

def preprocess_ultrasound(
    pil_image,
    target_size=(128, 128)
):

    image = pil_image.convert("L")

    image = image.resize(target_size)

    image_array = np.array(
        image,
        dtype=np.float32
    ) / 255.0

    # Add batch and channel dimensions

    input_tensor = np.expand_dims(
        image_array,
        axis=0
    )

    input_tensor = np.expand_dims(
        input_tensor,
        axis=-1
    )

    return input_tensor
@app.get("/nasa/osd-575/summary")
async def nasa_summary():
    try:
        return {
            "status": "success",
            "datasets": get_nasa_dataset_summary()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/nasa/osd-575/analyze")
async def analyze_nasa_data():

    try:

        results = analyze_nasa_datasets()

        return results

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
# ============================================================
# 10. IJV ULTRASOUND ANALYSIS
# ============================================================

@app.post("/analyze-ijv")
async def analyze_ijv(

    file: UploadFile = File(...),

    calibration_mm_per_px: float = Query(
        0.088,
        gt=0,
        description="Spatial calibration factor (mm per pixel)"
    )

):

    """
    Process ultrasound scan:

    - Validate image.
    - Perform segmentation.
    - Calculate morphological measurements.
    - Generate segmentation mask.
    """

    start_time = time.time()

    # Validate file type

    if file.content_type not in [
        "image/png",
        "image/jpeg",
        "image/jpg"
    ]:

        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Upload a PNG or JPEG ultrasound image."
        )

    # Read image

    try:

        contents = await file.read()

        pil_image = Image.open(
            io.BytesIO(contents)
        )

        pil_image.load()

        original_width, original_height = pil_image.size

    except Exception as e:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Corrupt or unreadable image file: {str(e)}"
        )

    # Check model availability

    if keras_model is None:

        return JSONResponse(

            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,

            content={

                "status": "model_unavailable",

                "error": "Trained Keras model file not found or failed to load.",

                "details": model_load_error,

                "detection_status": "model_unavailable",

                "instructions": (
                    "Place the trained model in the backend directory "
                    "and check the backend README."
                ),

                "image_info": {

                    "filename": file.filename,

                    "dimensions": {
                        "width": original_width,
                        "height": original_height
                    }

                }

            }

        )

    # Perform segmentation

    try:

        input_tensor = preprocess_ultrasound(
            pil_image,
            target_size=(128, 128)
        )

        preds = keras_model.predict(
            input_tensor,
            verbose=0
        )

        # Binary mask

        pred_mask = (
            preds[0, :, :, 0] > 0.5
        ).astype(np.uint8) * 255

        # Resize mask to original image dimensions

        mask_pil = Image.fromarray(
            pred_mask
        ).resize(
            (original_width, original_height),
            Image.Resampling.NEAREST
        )

        mask_array = np.array(mask_pil) > 128

        # Calculate area

        area_pixels = int(
            np.sum(mask_array)
        )

        has_detection = area_pixels > 150

        area_mm2 = round(
            area_pixels * (calibration_mm_per_px ** 2),
            2
        )

        # Calculate perimeter

        pad_mask = np.pad(
            mask_array,
            1,
            mode="constant"
        )

        edges = (

            (pad_mask[1:-1, 1:-1] != pad_mask[:-2, 1:-1]) |

            (pad_mask[1:-1, 1:-1] != pad_mask[2:, 1:-1]) |

            (pad_mask[1:-1, 1:-1] != pad_mask[1:-1, :-2]) |

            (pad_mask[1:-1, 1:-1] != pad_mask[1:-1, 2:])

        ) & mask_array

        perimeter_pixels = int(
            np.sum(edges)
        )

        # Circularity

        circularity = 0.0

        if perimeter_pixels > 0 and area_pixels > 0:

            circularity = round(
                float(
                    4 * np.pi * area_pixels /
                    (perimeter_pixels ** 2)
                ),
                3
            )

            circularity = min(
                1.0,
                circularity
            )

        # Encode mask as PNG Base64

        mask_png_buffer = io.BytesIO()

        mask_pil.save(
            mask_png_buffer,
            format="PNG"
        )

        mask_base64 = (
            "data:image/png;base64,"
            + base64.b64encode(
                mask_png_buffer.getvalue()
            ).decode("utf-8")
        )

        # Mean confidence

        mean_confidence = None

        if has_detection:

            resized_raw_prob = Image.fromarray(
                (preds[0, :, :, 0] * 255).astype(np.uint8)
            ).resize(
                (original_width, original_height),
                Image.Resampling.BILINEAR
            )

            prob_arr = (
                np.array(resized_raw_prob) / 255.0
            )

            mean_confidence = round(
                float(np.mean(prob_arr[mask_array])),
                3
            )

        inference_time_ms = round(
            (time.time() - start_time) * 1000,
            1
        )

        # Findings

        findings = []

        if has_detection:

            findings.append(
                f"Internal Jugular Vein lumen successfully "
                f"delineated (CSA: {area_mm2} mm² / {area_pixels} px)."
            )

            if area_mm2 > 120.0:

                findings.append(
                    "Venous dilation observed relative to "
                    "1G supine baseline; consistent with "
                    "cephalad fluid shift."
                )

            else:

                findings.append(
                    "Venous cross-sectional area measurement "
                    "is below the configured 120 mm² threshold."
                )

        else:

            findings.append(
                "No coherent internal jugular vein lumen "
                "segmented above the configured pixel threshold."
            )

        limitations = [

            "Segmentation alone does not diagnose thrombosis, "
            "vascular occlusion, or intracranial hypertension.",

            "SegThy training distribution represents earth-based "
            "clinical cohorts; acoustic speckle variance in "
            "microgravity requires clinical oversight.",

            "Area measurement accuracy depends on calibrated "
            "ultrasound transducer depth setting."

        ]

        return {

            "status": "success",

            "detection_status": (
                "detected" if has_detection else "not_detected"
            ),

            "image_name": file.filename,

            "dimensions": {
                "width": original_width,
                "height": original_height
            },

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

                "details": (
                    "The SegThy benchmark dataset provides "
                    "anatomical segmentation ground-truth, "
                    "not clinical diagnostic labels. "
                    "Assessment requires Flight Surgeon evaluation."
                )

            }

        }

    except Exception as e:

        print("[IJV ERROR]", str(e))

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Inference error during ultrasound segmentation."
        )


# ============================================================
# 11. ECG IMAGE ANALYSIS USING ECG-FM
# ============================================================

@app.post("/analyze-ecg")
async def analyze_ecg(

    file: UploadFile = File(...),

    layout: str = Query(
        "standard_12",
        description="'standard_12' or 'single_lead'"
    ),

    rows: int = Query(
        3,
        description="Standard 12-lead layout: 3 or 4 rows"
    ),

    seconds: float = Query(
        10.0,
        gt=0,
        description="Single-lead recording duration"
    ),

    crop_top: float = Query(
        0.0,
        ge=0.0,
        le=0.6,
        description="Fraction of image height to ignore"
    ),

    threshold: float = Query(
        0.5,
        ge=0.05,
        le=0.95,
        description="Probability threshold"
    )

):

    """
    ECG image -> digitized signal -> ECG-FM -> warnings.

    ECG-FM runs separately on port 8001.
    """

    start = time.time()

    # Validate image

    if file.content_type not in [
        "image/png",
        "image/jpeg",
        "image/jpg"
    ]:

        raise HTTPException(
            status_code=415,
            detail="Upload a PNG or JPEG image of the ECG."
        )

    try:

        pil_image = Image.open(
            io.BytesIO(await file.read())
        )

        pil_image.load()

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=f"Corrupt or unreadable ECG image: {e}"
        )

    # Digitize ECG image

    try:

        digitized = ecg_service.digitize_ecg_image(

            pil_image,

            layout=layout,

            rows=rows,

            seconds=seconds,

            crop_top=crop_top

        )

        segments = ecg_service.make_segments(
            digitized
        )

    except EcgImageError as e:

        raise HTTPException(
            status_code=422,
            detail=str(e)
        )

    # Send signal to ECG-FM service

    try:

        async with httpx.AsyncClient(
            timeout=180.0
        ) as client:

            response = await client.post(

                "http://127.0.0.1:8001/predict",

                json={
                    "segments": segments.tolist()
                }

            )

            response.raise_for_status()

            prediction_data = response.json()

            probs = prediction_data["predictions"]

    except httpx.ConnectError:

        raise HTTPException(
            status_code=503,
            detail="ECG-FM service is not running. "
                   "Start it on port 8001."
        )

    except httpx.TimeoutException:

        raise HTTPException(
            status_code=504,
            detail="ECG-FM prediction timed out."
        )

    except httpx.HTTPStatusError as e:

        print("[ECG-FM ERROR]", e.response.text)

        raise HTTPException(
            status_code=502,
            detail="ECG-FM service returned an error."
        )

    except Exception as e:

        print("[ECG ERROR]", str(e))

        raise HTTPException(
            status_code=500,
            detail="ECG-FM inference failed."
        )

    # Build ECG warnings

    rhythm = ecg_service.estimate_rhythm(
        digitized
    )

    result = ecg_service.build_warnings(
        probs,
        rhythm,
        threshold
    )

    # Prepare signal preview

    preview_src = (

        digitized.signal[1]

        if digitized.recorded[1].any()

        else digitized.signal[
            digitized.recorded.any(axis=1)
        ][0]

    )

    preview = preview_src[::5]

    return {

        "status": "success",

        "image_name": file.filename,

        "overall_level": result["overall_level"],

        "warnings": result["warnings"],

        "heart_rate_bpm": rhythm["heart_rate_bpm"],

        "rr_irregularity": rhythm["rr_irregularity"],

        "predictions": [

            {
                "label": k,
                "probability": round(v, 4)
            }

            for k, v in sorted(
                probs.items(),
                key=lambda kv: -kv[1]
            )

        ],

        "digitization": {

            "layout": digitized.layout,

            "trace_coverage": round(
                digitized.trace_coverage,
                3
            ),

            "leads_recorded": [

                l

                for l, r in zip(
                    ecg_service.LEADS,
                    digitized.recorded.any(axis=1)
                )

                if r

            ],

            "notes": digitized.notes

        },

        "signal_preview": [
            round(float(v), 3)
            for v in preview
        ],

        "signal_preview_hz": 100,

        "inference_time_ms": round(
            (time.time() - start) * 1000,
            1
        ),

        "model_version": "ECG-FM (mimic_iv_ecg_finetuned)",

        "segments_analysed": int(
            segments.shape[0]
        ),

        "limitations": [

            "ECG-FM analyzes signals, not pictures. "
            "Image digitization can introduce errors.",

            "Screening aid only. Not a diagnosis. "
            "A flight surgeon or clinician must review every warning.",

            "Warnings are most reliable for clean, flat, "
            "high-resolution 12-lead ECG sheets."

        ]

    }


# ============================================================
# 12. RUN SERVER
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )