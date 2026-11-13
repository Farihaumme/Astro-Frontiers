from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import ecg_service

app = FastAPI(title="ECG-FM Inference API")


class PredictionRequest(BaseModel):
    segments: list[list[list[float]]]


@app.on_event("startup")
def load_ecg_model():
    print("Loading ECG-FM...")
    ecg_service.ecg_model.load()

    if ecg_service.ecg_model.loaded:
        print("ECG-FM loaded successfully!")
    else:
        print("ECG-FM failed to load:")
        print(ecg_service.ecg_model.error)


@app.get("/health")
def health():
    return {
        "model_loaded": ecg_service.ecg_model.loaded,
        "error": ecg_service.ecg_model.error
    }


@app.post("/predict")
def predict(request: PredictionRequest):

    if not ecg_service.ecg_model.loaded:
        raise HTTPException(
            status_code=503,
            detail="ECG-FM model is not loaded"
        )

    try:
        segments = np.asarray(
            request.segments,
            dtype=np.float32
        )

        if segments.ndim != 3 or segments.shape[1:] != (12, 2500):
            raise HTTPException(
                status_code=400,
                detail="Expected input shape: (number_of_segments, 12, 2500)"
            )

        predictions = ecg_service.ecg_model.predict(segments)

        return {
            "predictions": predictions
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )