# Torch-free backend image (PLAN.md section 3.2): the only ML runtime anywhere
# is Chroma's ONNX MiniLM embedding function, pulled in via the chromadb package.
FROM python:3.12-slim

# WeasyPrint system deps (HTML -> PDF rendering, PLAN.md section 3.1).
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libharfbuzz0b \
    libharfbuzz-subset0 \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
