"""Retrieval chain + grounding prompt (PLAN.md section 3.2).

Deliberately small: retrieve -> format context -> grounded prompt -> LLM.
Source citation is NOT parsed from the LLM's prose — it comes from the
retrieved chunks' metadata, deduplicated, which is what makes the "Sources:"
line in the UI deterministic.
"""

from app.rag import prompts, vectorstore
from app.rag.generator import generate_text


def _format_context(hits: list[dict]) -> str:
    blocks = []
    for hit in hits:
        blocks.append(f"[source: {hit['source']} — {hit['candidate_name']}]\n{hit['text']}")
    return "\n\n---\n\n".join(blocks) if blocks else "(no CVs indexed yet)"


def answer(question: str) -> dict:
    """Returns {"answer": str, "sources": [filename, ...]}."""
    hits = vectorstore.query(question)
    prompt = f"{prompts.GROUNDING_SYSTEM_PROMPT.format(context=_format_context(hits))}\n\nQuestion:\n{question}"
    answer_text = generate_text(prompt)
    seen: dict[str, None] = {}
    for hit in hits:
        seen.setdefault(hit["source"], None)
    return {"answer": answer_text, "sources": list(seen)}
