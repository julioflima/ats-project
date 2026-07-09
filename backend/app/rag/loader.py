"""The single shared ingestion path (PLAN.md section 1): every candidate —
uploaded PDF, in-app generated, or batch pre-seeded — goes through
`ingest_candidate()`. One code path behind three entry points.
"""

import logging

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app import settings
from app.rag import vectorstore
from app.registry import Candidate, add_candidate

logger = logging.getLogger(__name__)

_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)


def ingest_candidate(
    pdf_bytes: bytes,
    filename: str,
    source_type: str,
    name: str | None = None,
    role: str | None = None,
) -> Candidate:
    """Persist the PDF, chunk + index its text in Chroma, register the candidate.

    `name`/`role` are passed by the generate path (it already knows them from
    the structured CandidateJSON); the upload path leaves them None and we
    extract them from the PDF text instead.
    """
    settings.CVS_DIR.mkdir(parents=True, exist_ok=True)
    path = settings.CVS_DIR / filename
    path.write_bytes(pdf_bytes)

    docs = PyPDFLoader(str(path)).load()
    chunks = [chunk.page_content for chunk in _splitter.split_documents(docs)]

    if name is None:
        from app.rag.generator import extract_name_role

        first_page = docs[0].page_content if docs else ""
        name, role = extract_name_role(first_page)

    candidate = add_candidate(
        name=name, role=role or "Unknown role", filename=filename, source_type=source_type
    )
    vectorstore.add_chunks(chunks, source=filename, candidate_id=candidate.id, candidate_name=name)
    _backup_to_gcs(path.name, pdf_bytes)
    return candidate


def _backup_to_gcs(filename: str, pdf_bytes: bytes) -> None:
    """Best-effort per-write PDF copy to Cloud Storage (PLAN.md section 8.2).

    Complementary to the scheduled CronJob snapshots (section 8.5a); silently
    skipped when GCS_BUCKET is unset (local dev) and never fails an ingest.
    """
    if not settings.GCS_BUCKET:
        return
    try:
        from google.cloud import storage

        bucket = storage.Client().bucket(settings.GCS_BUCKET)
        bucket.blob(f"cvs/{filename}").upload_from_string(
            pdf_bytes, content_type="application/pdf"
        )
    except Exception:
        logger.warning("GCS backup of %s failed (continuing)", filename, exc_info=True)
