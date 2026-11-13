#!/bin/bash

set -e

echo "======================================"
echo "       Starting Aither Kairos"
echo "======================================"

# Check Hugging Face token
if [ -z "$HF_TOKEN" ]; then
    echo "ERROR: HF_TOKEN environment variable is missing."
    exit 1
fi

# Download private models from Hugging Face
echo "Downloading IJV model and ECG-FM checkpoint..."

/opt/main-venv/bin/python - <<'PY'
import os
from huggingface_hub import hf_hub_download

repo_id = "muntaha0505/aither-kairos-models"
token = os.environ["HF_TOKEN"]

# Download IJV model
hf_hub_download(
    repo_id=repo_id,
    filename="aither_kairos_ijv_unet.keras",
    token=token,
    local_dir="/app/backend"
)

# Download ECG-FM checkpoint
hf_hub_download(
    repo_id=repo_id,
    filename="mimic_iv_ecg_finetuned.pt",
    token=token,
    local_dir="/app/backend/ecgfm"
)

print("Both models downloaded successfully!")
PY

cd /app/backend

echo "Starting ECG-FM service..."

# Start ECG-FM internally on port 8001
/opt/ecg-venv/bin/uvicorn ecg_fm_api:app \
    --host 127.0.0.1 \
    --port 8001 &

ECG_PID=$!

echo "ECG-FM process started: $ECG_PID"

# Give ECG-FM time to initialize
sleep 5

if ! kill -0 "$ECG_PID" 2>/dev/null; then
    echo "ERROR: ECG-FM process stopped unexpectedly."
    exit 1
fi

echo "Starting main FastAPI backend..."

# Start main backend on Render's assigned port
/opt/main-venv/bin/uvicorn main:app \
    --host 0.0.0.0 \
    --port "${PORT:-8000}" &

MAIN_PID=$!

echo "Main backend process started: $MAIN_PID"

# Stop both services if either one exits
set +e
wait -n "$ECG_PID" "$MAIN_PID"
STATUS=$?

echo "One service stopped. Shutting down both services..."

kill "$ECG_PID" "$MAIN_PID" 2>/dev/null || true

wait "$ECG_PID" "$MAIN_PID" 2>/dev/null || true

exit "$STATUS"

