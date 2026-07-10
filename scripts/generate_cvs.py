#!/usr/bin/env python3
"""Batch pre-seed: generate 25-30 fake CVs and ingest them (PLAN.md section 3.1).

Calls the exact same generate_candidate() / ingest_candidate() functions the
GraphQL mutations use — one code path behind three entry points.

Usage (from the repo root, with the chroma container up):

    python scripts/generate_cvs.py --count 28 --out data/cvs

Requires the backend's dependencies (pip install -r backend/requirements.txt)
or run it inside the backend container:

    docker compose run --rm backend python /srv/scripts/generate_cvs.py --count 28
"""

import argparse
import itertools
import os
import random
import sys
import time
from pathlib import Path

# Make the backend's `app` package importable from both entry points:
# host repo checkout (<repo>/backend/app) and backend container (/srv/app,
# with this script mounted at /srv/scripts).
_here = Path(__file__).resolve().parent
for candidate in (_here.parent / "backend", _here.parent):
    if (candidate / "app").is_dir():
        sys.path.insert(0, str(candidate))
        break

# Diversity guardrail (PLAN.md section 3.1): varied (role, seniority, city,
# stack, industry) tuples so demo questions have a non-trivial answer set.
ROLES = [
    ("Backend Engineer", "Python, FastAPI, PostgreSQL", "fintech"),
    ("Frontend Engineer", "React, TypeScript, GraphQL", "e-commerce"),
    ("Data Analyst", "SQL, Python, Looker", "retail analytics"),
    ("DevOps Engineer", "Kubernetes, Terraform, GCP", "SaaS"),
    ("Data Scientist", "Python, scikit-learn, BigQuery", "healthtech"),
    ("Mobile Developer", "Kotlin, Android, Firebase", "media"),
    ("QA Engineer", "Cypress, Playwright, CI/CD", "travel"),
    ("Product Manager", "roadmapping, A/B testing, SQL", "marketplaces"),
    ("ML Engineer", "PyTorch, MLOps, Vertex AI", "adtech"),
    ("Fullstack Engineer", "Node.js, React, MongoDB", "edtech"),
]
SENIORITIES = ["Junior", "Mid-level", "Senior"]
CITIES = ["Barcelona", "Lisbon", "Berlin", "Amsterdam", "Warsaw", "Dublin", "remote (CET)"]


def seed_descriptions(count: int) -> list[str]:
    combos = list(itertools.product(ROLES, SENIORITIES, CITIES))
    random.Random(42).shuffle(combos)  # deterministic corpus across re-runs
    descriptions = []
    for (role, skills, industry), seniority, city in combos[:count]:
        descriptions.append(
            f"Create a realistic fictional candidate: a {seniority} {role} based in "
            f"{city}, skilled in {skills}, with experience in the {industry} industry. "
            f"Include realistic contact information, an AI-generated portrait in the PDF, "
            f"work experience, skills, education, languages, and one career detail that "
            f"makes the profile feel human."
        )
    return descriptions


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--count", type=int, default=28, help="how many CVs (25-30 per the brief)")
    parser.add_argument("--out", default=None, help="override CVS_DIR for the PDFs")
    parser.add_argument(
        "--no-ingest",
        action="store_true",
        help="only render PDFs; skip Chroma/SQLite (no chroma server needed)",
    )
    parser.add_argument(
        "--sleep",
        type=float,
        default=15.0,
        help="seconds between candidates — the free tier allows ~5 requests/min",
    )
    args = parser.parse_args()

    if args.out:
        os.environ["CVS_DIR"] = args.out
    openrouter_key = os.environ.get("OPENROUTER_API_KEY", "")
    if openrouter_key and not openrouter_key.startswith("sk-or-v1-"):
        print(
            "OPENROUTER_API_KEY must be an OpenRouter key starting with 'sk-or-v1-', "
            "or left empty to use the free fallback text endpoint.",
            file=sys.stderr,
        )
        return 1
    if not 1 <= args.count <= 30:
        print("--count must be between 1 and 30 for the business-case dataset.", file=sys.stderr)
        return 1

    from app import settings
    from app.rag.generator import candidate_filename, generate_candidate, render_pdf

    if not args.no_ingest:
        from app.rag.loader import ingest_candidate
        from app import registry
        used_names = {row.name for row in registry.list_candidates()}
    else:
        used_names = set()

    for i, description in enumerate(seed_descriptions(args.count), start=1):
        candidate = generate_candidate(description, forbidden_names=used_names)
        used_names.add(candidate.name)
        pdf = render_pdf(candidate)
        filename = candidate_filename(candidate.name)
        if args.no_ingest:
            settings.CVS_DIR.mkdir(parents=True, exist_ok=True)
            (settings.CVS_DIR / filename).write_bytes(pdf)
        else:
            ingest_candidate(
                pdf, filename, source_type="generated",
                name=candidate.name, role=candidate.title,
            )
        print(f"[{i}/{args.count}] {candidate.name} — {candidate.title} -> {filename}", flush=True)
        if i < args.count and args.sleep > 0:
            time.sleep(args.sleep)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
