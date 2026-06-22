FROM python:3.12-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libmagic1 \
    poppler-utils \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY . .

# Create directories
RUN mkdir -p /app/uploads /app/vectorstore /app/tmp

EXPOSE 8000

# Use $PORT for Railway compatibility (fallback to 8000 for local/Docker)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
