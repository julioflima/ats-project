"""Candidate generation — shared by scripts/generate_cvs.py and the
`generateCandidate` GraphQL mutation (PLAN.md section 3.1: one function,
three entry points).
"""

import base64
import hashlib
import json
import re
import uuid
from functools import lru_cache

from jinja2 import Environment, PackageLoader, select_autoescape
from pydantic import BaseModel, Field

from app import settings
from app.rag import prompts


class Job(BaseModel):
    title: str
    company: str
    start: str = Field(description="e.g. 'Mar 2021'")
    end: str = Field(description="e.g. 'Present' or 'Jun 2023'")
    achievements: list[str]


class Education(BaseModel):
    degree: str
    institution: str
    year: str


class CandidateJSON(BaseModel):
    name: str
    title: str
    location: str
    email: str
    phone: str
    summary: str
    skills: list[str]
    languages: list[str]
    jobs: list[Job]
    education: list[Education]


@lru_cache(maxsize=1)
def _llm():
    # Imported lazily so registry/vectorstore paths work without an API key.
    from langchain_google_genai import ChatGoogleGenerativeAI

    # max_retries matters on the free tier (5 requests/min): 429s back off and
    # retry instead of failing the mutation.
    return ChatGoogleGenerativeAI(model=settings.GEMINI_MODEL, temperature=0.9, max_retries=6)


def generate_candidate(description: str) -> CandidateJSON:
    """One user-authored (or seed-tuple) description in, one structured CV out."""
    structured = _llm().with_structured_output(CandidateJSON)
    prompt = prompts.CANDIDATE_JSON_INSTRUCTIONS.format(description=description)
    return structured.invoke(prompt)


def extract_name_role(first_page_text: str) -> tuple[str, str]:
    """Best-effort name/role extraction for *uploaded* PDFs.

    Falls back to placeholders when no API key is configured or the model
    response doesn't parse — an upload must never fail because of this.
    """
    try:
        raw = _llm().invoke(
            prompts.EXTRACT_NAME_ROLE_PROMPT.format(text=first_page_text[:2000])
        ).content
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        data = json.loads(match.group(0)) if match else {}
        name = str(data.get("name") or "").strip()
        role = str(data.get("role") or "").strip()
        if name:
            return name, role or "Unknown role"
    except Exception:
        pass
    return "Unknown candidate", "Unknown role"


# --- PDF rendering (Jinja2 HTML -> WeasyPrint) ------------------------------

_AVATAR_PALETTE = ["#4a4a4a", "#6b6b6b", "#2f2f2f", "#8a8a8a", "#575757"]


def _initials_avatar_data_uri(name: str) -> str:
    """Deterministic SVG-initials avatar (the placeholder head-shot set from
    PLAN.md section 3.1 — photo realism isn't what's graded)."""
    parts = [p for p in name.split() if p]
    initials = (parts[0][0] + (parts[-1][0] if len(parts) > 1 else "")).upper()
    color = _AVATAR_PALETTE[int(hashlib.sha256(name.encode()).hexdigest(), 16) % len(_AVATAR_PALETTE)]
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">'
        f'<rect width="120" height="120" rx="60" fill="{color}"/>'
        f'<text x="60" y="76" font-family="Helvetica, Arial" font-size="44" '
        f'fill="#ffffff" text-anchor="middle">{initials}</text></svg>'
    )
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()


@lru_cache(maxsize=1)
def _jinja_env() -> Environment:
    return Environment(
        loader=PackageLoader("app.rag", "templates"),
        autoescape=select_autoescape(["html"]),
    )


def render_pdf(candidate: CandidateJSON) -> bytes:
    # WeasyPrint imported lazily: it needs system libs (pango/cairo) that only
    # the Docker image guarantees; keep bare-metal dev usable without them.
    from weasyprint import HTML

    html = _jinja_env().get_template("cv.html").render(
        c=candidate, avatar=_initials_avatar_data_uri(candidate.name)
    )
    return HTML(string=html).write_pdf()


def candidate_filename(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_") or "candidate"
    return f"{slug}_{uuid.uuid4().hex[:8]}.pdf"
