"""Resolver bodies for the schema — thin wiring over the shared rag/registry
functions. GraphQL changes the transport, not the underlying ingestion path
(PLAN.md section 2, "why this shape").
"""

import anyio

from app import registry
from app.graphql.types import Candidate, ChatAnswer, PromptTemplate
from app.rag import chain, generator, loader, prompts


def candidates() -> list[Candidate]:
    return [Candidate.from_row(row) for row in registry.list_candidates()]


def default_generation_prompt() -> PromptTemplate:
    return PromptTemplate(
        explanation=prompts.GENERATION_EXPLANATION,
        template=prompts.GENERATION_TEMPLATE,
    )


async def upload_candidate(file) -> Candidate:
    pdf_bytes = await file.read()
    filename = generator.candidate_filename(getattr(file, "filename", None) or "uploaded")
    # Ingestion is blocking (PDF parse + ONNX embed + LLM name extraction):
    # run in a worker thread so the event loop keeps serving other requests.
    row = await anyio.to_thread.run_sync(
        lambda: loader.ingest_candidate(pdf_bytes, filename, source_type="uploaded")
    )
    return Candidate.from_row(row)


async def generate_candidate(prompt: str) -> Candidate:
    def _generate() -> registry.Candidate:
        candidate_json = generator.generate_candidate(prompt)
        pdf_bytes = generator.render_pdf(candidate_json)
        filename = generator.candidate_filename(candidate_json.name)
        return loader.ingest_candidate(
            pdf_bytes,
            filename,
            source_type="generated",
            name=candidate_json.name,
            role=candidate_json.title,
        )

    row = await anyio.to_thread.run_sync(_generate)
    return Candidate.from_row(row)


async def chat(question: str) -> ChatAnswer:
    result = await anyio.to_thread.run_sync(lambda: chain.answer(question))
    return ChatAnswer(answer=result["answer"], sources=result["sources"])
