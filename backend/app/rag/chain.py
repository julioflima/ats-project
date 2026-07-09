"""Retrieval chain (LCEL) + grounding prompt (PLAN.md section 3.2).

Deliberately small: retrieve -> format context -> grounded prompt -> Gemini.
Source citation is NOT parsed from the LLM's prose — it comes from the
retrieved chunks' metadata, deduplicated, which is what makes the "Sources:"
line in the UI deterministic.
"""

from functools import lru_cache

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnablePassthrough

from app.rag import prompts, vectorstore
from app.rag.generator import _llm


def _format_context(hits: list[dict]) -> str:
    blocks = []
    for hit in hits:
        blocks.append(f"[source: {hit['source']} — {hit['candidate_name']}]\n{hit['text']}")
    return "\n\n---\n\n".join(blocks) if blocks else "(no CVs indexed yet)"


@lru_cache(maxsize=1)
def _chain():
    prompt = ChatPromptTemplate.from_messages(
        [("system", prompts.GROUNDING_SYSTEM_PROMPT), ("human", "{question}")]
    )
    return (
        {
            "context": RunnableLambda(lambda q: _format_context(vectorstore.query(q))),
            "question": RunnablePassthrough(),
        }
        | prompt
        | _llm()
        | StrOutputParser()
    )


def answer(question: str) -> dict:
    """Returns {"answer": str, "sources": [filename, ...]}."""
    hits = vectorstore.query(question)
    answer_text = _chain().invoke(question)
    seen: dict[str, None] = {}
    for hit in hits:
        seen.setdefault(hit["source"], None)
    return {"answer": answer_text, "sources": list(seen)}
