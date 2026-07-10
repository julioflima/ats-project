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

# LLM through OpenRouter's OpenAI-compatible API.
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "tencent/hy3:free")
OPENROUTER_APP_URL = os.environ.get("OPENROUTER_APP_URL", "http://localhost:5173")
OPENROUTER_APP_NAME = os.environ.get("OPENROUTER_APP_NAME", "Leadtech ATS")

# Free text-to-image endpoint used only for fictional candidate portraits.
PORTRAIT_IMAGE_URL = os.environ.get("PORTRAIT_IMAGE_URL", "https://image.pollinations.ai/prompt")
POLLINATIONS_TEXT_URL = os.environ.get("POLLINATIONS_TEXT_URL", "https://text.pollinations.ai")
POLLINATIONS_TEXT_MODEL = os.environ.get("POLLINATIONS_TEXT_MODEL", "openai")
LOCAL_CV_TEXT_ONLY = os.environ.get("LOCAL_CV_TEXT_ONLY", "").lower() in {"1", "true", "yes"}

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
