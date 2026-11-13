FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    git \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install uv to manage the second Python version
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_LINK_MODE=copy

WORKDIR /app

# Install Python 3.10 for ECG-FM
RUN uv python install 3.10

# Create two isolated environments
RUN python -m venv /opt/main-venv
RUN uv venv --python 3.10 /opt/ecg-venv

# Copy dependency files
COPY backend/requirements.txt /app/backend/requirements.txt
COPY backend/requirements-ecg.txt /app/backend/requirements-ecg.txt

# Install main backend dependencies
RUN /opt/main-venv/bin/pip install --no-cache-dir \
    -r /app/backend/requirements.txt

# Install ECG-FM dependencies
# Install PyTorch CPU version
RUN /opt/ecg-venv/bin/pip install --no-cache-dir \
    --index-url https://download.pytorch.org/whl/cpu \
    torch==2.14.0

# Install remaining ECG-FM dependencies
RUN /opt/ecg-venv/bin/pip install --no-cache-dir \
    -r /app/backend/requirements-ecg.txt

# Copy application files
COPY backend/ /app/backend/

# Make startup script executable
RUN chmod +x /app/backend/start.sh

EXPOSE 8000

CMD ["/app/backend/start.sh"]