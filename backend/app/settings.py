"""Central place for environment-driven configuration.

Every knob the deployment story (PLAN.md section 4 / section 8) mentions is read
here once, so the rest of the code imports names instead of os.environ strings.
"""

import os
from pathlib import Path

# Where uploaded/generated CV PDFs live (the PVC subpath on k3s, ./data locally).
CVS_DIR = Path(os.environ.get("CVS_DIR", "data/cvs"))

# SQLite candidate registry (colocated on Chroma's volume in the cloud profile).
SQLITE_PATH = Path(os.environ.get("SQLITE_PATH", "data/app.db"))

# Chroma: talk to a standalone server when CHROMA_HOST is set (docker-compose /
# k3s), otherwise fall back to an embedded on-disk client (bare local runs).
CHROMA_HOST = os.environ.get("CHROMA_HOST")
CHROMA_PORT = int(os.environ.get("CHROMA_PORT", "8000"))
CHROMA_PATH = os.environ.get("CHROMA_PATH", "data/chroma")
CHROMA_COLLECTION = os.environ.get("CHROMA_COLLECTION", "cvs")

# LLM (Google AI Studio free tier by default). "gemini-flash-latest" is
# Google's rolling alias for the current Flash model — pinned model names
# (e.g. gemini-2.0-flash) rotate out of the free tier as new ones ship.
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")

# Optional off-VM backup of every uploaded/generated PDF (PLAN.md section 8.5a).
# Empty/unset means "skip silently" so local dev needs no GCP credentials.
GCS_BUCKET = os.environ.get("GCS_BUCKET", "")

RETRIEVAL_K = int(os.environ.get("RETRIEVAL_K", "5"))

# CORS: comma-separated origins. "*" is the local-dev default (GraphiQL, the
# vite dev server on :5173, curl). In the deployed profile the browser only
# ever talks same-origin through Caddy/Traefik, so this is locked down to the
# app's own hostname there (infra/k8s/config.yaml).
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]
