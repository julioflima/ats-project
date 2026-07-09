"""Chroma client wrapper — one collection ("cvs"), one document per chunk.

Embeddings use Chroma's default ONNX MiniLM function (no torch anywhere in the
image — the RAM/image-size decision from PLAN.md section 3.2). Note the honest
detail: Chroma embedding functions execute in the *client* process, so the ONNX
runtime lives in this backend container, not the chroma server pod. Same model,
same zero cost, same total RAM budget — just a different pod than the plan's
diagram sketched, worth knowing when reading memory dashboards.
"""

from functools import lru_cache

import chromadb
from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2

from app import settings


@lru_cache(maxsize=1)
def get_collection():
    if settings.CHROMA_HOST:
        client = chromadb.HttpClient(host=settings.CHROMA_HOST, port=settings.CHROMA_PORT)
    else:
        client = chromadb.PersistentClient(path=settings.CHROMA_PATH)
    return client.get_or_create_collection(
        settings.CHROMA_COLLECTION,
        embedding_function=ONNXMiniLM_L6_V2(),
        metadata={"hnsw:space": "cosine"},
    )


def add_chunks(chunks: list[str], source: str, candidate_id: int, candidate_name: str) -> None:
    if not chunks:
        return
    collection = get_collection()
    collection.add(
        ids=[f"{source}::{i}" for i in range(len(chunks))],
        documents=chunks,
        metadatas=[
            {"source": source, "candidate_id": candidate_id, "candidate_name": candidate_name}
            for _ in chunks
        ],
    )


def query(text: str, k: int | None = None) -> list[dict]:
    """Similarity search; returns [{text, source, candidate_name}] hits."""
    collection = get_collection()
    result = collection.query(query_texts=[text], n_results=k or settings.RETRIEVAL_K)
    hits = []
    for document, metadata in zip(result["documents"][0], result["metadatas"][0]):
        hits.append(
            {
                "text": document,
                "source": metadata.get("source", "unknown"),
                "candidate_name": metadata.get("candidate_name", ""),
            }
        )
    return hits
