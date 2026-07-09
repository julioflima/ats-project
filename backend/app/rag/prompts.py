"""Single source of truth for every prompt in the system (PLAN.md section 3.1).

The generation explanation + template pair is served to the frontend via the
`defaultGenerationPrompt` GraphQL query, pre-filled into the Generate sheet's
textarea, and reused verbatim by scripts/generate_cvs.py — one copy, no drift.
"""

GENERATION_EXPLANATION = (
    "Describe the candidate you want: role, seniority, industry, location, and "
    "3-5 key skills. The model returns a structured CV (summary, work history, "
    "skills, education, languages) that is rendered to PDF and indexed for chat. "
    "Being specific about tech stack and years of experience produces more "
    "useful, differentiated candidates for testing search."
)

GENERATION_TEMPLATE = (
    "Create a realistic fictional candidate: a Senior Backend Engineer based in "
    "Barcelona with 8 years of experience in Python, FastAPI, PostgreSQL and "
    "GCP, who has worked in fintech and e-commerce companies. Include one career "
    "gap or pivot that makes the profile feel human."
)

# Every field must be grounded in the retrieved CV chunks — the main defense
# against hallucinated candidate facts (PLAN.md section 3.2, "Grounding").
GROUNDING_SYSTEM_PROMPT = """\
You are a recruiting assistant answering questions about a fixed collection of CVs.

Rules you must follow:
- Answer ONLY using the CV excerpts provided in the context below. Do not use
  outside knowledge about people, companies, or technologies.
- When you mention a fact about a candidate, it must appear in the context.
- If the context does not contain the answer, say exactly that ("The CVs on
  file don't contain that information") instead of guessing.
- When comparing candidates, only compare those present in the context.

Context (CV excerpts, each tagged with its source file):
{context}
"""

CANDIDATE_JSON_INSTRUCTIONS = """\
Generate one realistic but entirely fictional CV based on this description:

{description}

Constraints:
- The person must not be a real, identifiable individual.
- Include 3 to 5 previous jobs with 2-4 concrete, quantified achievements each.
- Skills must be consistent with the work history.
- Dates must be coherent (no overlaps, most recent job first).
"""

EXTRACT_NAME_ROLE_PROMPT = """\
From the following CV text, extract the candidate's full name and their current
or most recent job title. Respond with JSON only: {{"name": "...", "role": "..."}}

CV text (first page):
{text}
"""
