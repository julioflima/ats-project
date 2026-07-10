"""Candidate generation — shared by scripts/generate_cvs.py and the
`generateCandidate` GraphQL mutation (PLAN.md section 3.1: one function,
three entry points).
"""

import base64
import hashlib
import json
import re
import urllib.parse
import urllib.request
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
    achievements: list[str] = Field(min_length=2, max_length=4)


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
    skills: list[str] = Field(min_length=8, max_length=14)
    languages: list[str] = Field(min_length=2, max_length=4)
    jobs: list[Job] = Field(min_length=2, max_length=5)
    education: list[Education] = Field(min_length=1, max_length=3)


def _as_string_list(values: object) -> list[str]:
    if not isinstance(values, list):
        return []
    result = []
    for value in values:
        if isinstance(value, str):
            result.append(value)
        elif isinstance(value, dict):
            language = value.get("language") or value.get("name")
            proficiency = value.get("proficiency") or value.get("level")
            if language and proficiency:
                result.append(f"{language} ({proficiency})")
            elif language:
                result.append(str(language))
    return result


def _coerce_candidate(raw: str) -> CandidateJSON:
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    data = json.loads(match.group(0) if match else raw)
    if "candidate" in data and isinstance(data["candidate"], dict):
        data = data["candidate"]
    if "cv" in data and isinstance(data["cv"], dict):
        data = data["cv"]
    if "resume" in data and isinstance(data["resume"], dict):
        data = data["resume"]

    contact = data.get("contact") if isinstance(data.get("contact"), dict) else {}
    jobs = data.get("jobs") or data.get("experience") or data.get("work_experience") or []
    normalized_jobs = []
    for job in jobs if isinstance(jobs, list) else []:
        if not isinstance(job, dict):
            continue
        achievements = _as_string_list(
            job.get("achievements") or job.get("responsibilities") or job.get("bullets") or []
        )[:4]
        while len(achievements) < 2:
            achievements.append("Delivered measurable improvements across product quality, delivery, and team workflows.")
        normalized_jobs.append(
            {
                "title": job.get("title") or job.get("role") or job.get("position") or "Software Specialist",
                "company": job.get("company") or job.get("employer") or "Fictional Company",
                "start": job.get("start") or job.get("start_date") or "Jan 2021",
                "end": job.get("end") or job.get("end_date") or "Present",
                "achievements": achievements,
            }
        )

    education = data.get("education") or []
    normalized_education = []
    for item in education if isinstance(education, list) else []:
        if not isinstance(item, dict):
            continue
        normalized_education.append(
            {
                "degree": item.get("degree") or item.get("qualification") or "Degree",
                "institution": item.get("institution") or item.get("school") or item.get("university") or "University",
                "year": str(item.get("year") or item.get("end") or item.get("graduation_year") or "2020"),
            }
        )

    skills = _as_string_list(data.get("skills"))[:14]
    while len(skills) < 8:
        skills.append(
            [
                "Stakeholder communication",
                "Agile delivery",
                "Documentation",
                "Quality assurance",
                "Data analysis",
                "Problem solving",
                "Cross-functional collaboration",
                "Process improvement",
            ][len(skills)]
        )

    languages = _as_string_list(data.get("languages"))[:4] or ["English (Fluent)", "Portuguese (Professional)"]
    while len(normalized_jobs) < 2:
        normalized_jobs.append(
            {
                "title": data.get("title") or data.get("role") or "Software Specialist",
                "company": f"Fictional Studio {len(normalized_jobs) + 1}",
                "start": "Jan 2021" if not normalized_jobs else "Mar 2018",
                "end": "Present" if not normalized_jobs else "Dec 2020",
                "achievements": [
                    "Built practical workflows that improved delivery reliability for internal teams.",
                    "Collaborated with product, engineering, and operations to resolve recurring issues.",
                ],
            }
        )
    if not normalized_education:
        normalized_education.append(
            {"degree": "BSc Computer Science", "institution": "Fictional University", "year": "2018"}
        )

    coerced = {
        "name": data.get("name") or data.get("full_name") or "Fictional Candidate",
        "title": data.get("title") or data.get("role") or data.get("current_title") or "Software Specialist",
        "location": data.get("location") or contact.get("location") or contact.get("address") or "Lisbon, Portugal",
        "email": data.get("email") or contact.get("email") or "candidate@example.com",
        "phone": data.get("phone") or contact.get("phone") or "+351 910 000 000",
        "summary": data.get("summary") or data.get("professional_summary") or data.get("profile") or "Fictional candidate with practical experience delivering reliable software and collaborating across product teams.",
        "skills": skills,
        "languages": languages,
        "jobs": normalized_jobs[:5],
        "education": normalized_education[:3],
    }

    return CandidateJSON.model_validate(coerced)


_FALLBACK_NAMES = [
    "Alba Costa", "Tiago Ribeiro", "Marina Kowalska", "Jonas Weber", "Clara Mendes",
    "Nora van Dijk", "Mateo Alvarez", "Elena Petrova", "Lucas Ferreira", "Sara Novak",
    "Hugo Martins", "Lina Schneider", "Iris Bakker", "Rafael Moreira", "Marta Zielinska",
    "Oscar Lindholm", "Sofia Carvalho", "Daniel Nowak", "Eva Laurent", "Bruno Silva",
    "Greta Hoffmann", "Nadia Rossi", "Felix Schmidt", "Ines Vidal", "Adam Kowalczyk",
    "Laura Meijer", "Marco Conti", "Yara Haddad", "Pavel Sokolov", "Julia Fernandes",
]


def _extract_role(description: str) -> str:
    for role in [
        "Backend Engineer", "Frontend Engineer", "Data Analyst", "DevOps Engineer",
        "Data Scientist", "Mobile Developer", "QA Engineer", "Product Manager",
        "ML Engineer", "Fullstack Engineer",
    ]:
        if role.lower() in description.lower():
            return role
    return "Software Specialist"


def _extract_seniority(description: str) -> str:
    for seniority in ["Junior", "Mid-level", "Senior"]:
        if seniority.lower() in description.lower():
            return seniority
    return "Mid-level"


def _extract_location(description: str) -> str:
    for city in ["Barcelona", "Lisbon", "Berlin", "Amsterdam", "Warsaw", "Dublin"]:
        if city.lower() in description.lower():
            return f"{city}, Europe"
    return "Remote, CET"


def _local_candidate(description: str, forbidden_names: set[str]) -> CandidateJSON:
    normalized_forbidden = {_normalize_name(name) for name in forbidden_names}
    name = next(
        candidate_name
        for candidate_name in _FALLBACK_NAMES
        if _normalize_name(candidate_name) not in normalized_forbidden
    )
    role = _extract_role(description)
    seniority = _extract_seniority(description)
    title = f"{seniority} {role}"
    location = _extract_location(description)
    slug = re.sub(r"[^a-z]+", ".", name.lower()).strip(".")
    role_skills = {
        "Backend Engineer": ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "REST APIs"],
        "Frontend Engineer": ["React", "TypeScript", "GraphQL", "Accessibility", "Vite", "Playwright"],
        "Data Analyst": ["SQL", "Python", "Looker", "dbt", "A/B testing", "Dashboarding"],
        "DevOps Engineer": ["Kubernetes", "Terraform", "GCP", "CI/CD", "Prometheus", "Docker"],
        "Data Scientist": ["Python", "scikit-learn", "BigQuery", "Feature engineering", "Experiment design", "Pandas"],
        "Mobile Developer": ["Kotlin", "Android", "Firebase", "Jetpack Compose", "REST APIs", "Release management"],
        "QA Engineer": ["Cypress", "Playwright", "CI/CD", "Test planning", "Regression testing", "Bug triage"],
        "Product Manager": ["Roadmapping", "A/B testing", "SQL", "Stakeholder management", "Discovery", "Analytics"],
        "ML Engineer": ["PyTorch", "MLOps", "Vertex AI", "Model monitoring", "Python", "Feature stores"],
        "Fullstack Engineer": ["Node.js", "React", "MongoDB", "TypeScript", "GraphQL", "Docker"],
    }
    skills = role_skills.get(role, ["Documentation", "Delivery planning", "Data analysis", "Agile delivery", "Quality assurance", "Stakeholder communication"])
    skills = [*skills, "Agile delivery", "Documentation", "Cross-functional collaboration"][:14]
    return CandidateJSON(
        name=name,
        title=title,
        location=location,
        email=f"{slug}@example.com",
        phone="+351 910 000 000",
        summary=(
            f"Fictional {title.lower()} with practical experience delivering realistic "
            "product work, collaborating with cross-functional teams, and improving measurable outcomes."
        ),
        skills=skills,
        languages=["English (Fluent)", "Portuguese (Professional)", "Spanish (Intermediate)"],
        jobs=[
            Job(
                title=title,
                company=f"{role.split()[0]}Works Labs",
                start="Jan 2021",
                end="Present",
                achievements=[
                    "Delivered production improvements that reduced recurring operational issues by 28%.",
                    "Partnered with product and engineering teams to ship reliable candidate-facing workflows.",
                    "Introduced clearer documentation and review practices that shortened onboarding time.",
                ],
            ),
            Job(
                title=role,
                company="Northstar Digital",
                start="Mar 2018",
                end="Dec 2020",
                achievements=[
                    "Built practical internal tools used weekly by support, product, and operations teams.",
                    "Improved release confidence through better validation, monitoring, and stakeholder feedback loops.",
                ],
            ),
        ],
        education=[
            Education(degree="BSc Computer Science", institution="European Institute of Technology", year="2017")
        ],
    )


@lru_cache(maxsize=1)
def _llm():
    # Imported lazily so registry/vectorstore paths work without an API key.
    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL,
        model=settings.OPENROUTER_MODEL,
        temperature=0.9,
        max_retries=6,
        default_headers={
            "HTTP-Referer": settings.OPENROUTER_APP_URL,
            "X-Title": settings.OPENROUTER_APP_NAME,
        },
    )


def _pollinations_text(prompt: str) -> str:
    payload = json.dumps(
        {
            "model": settings.POLLINATIONS_TEXT_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "private": True,
        }
    ).encode()
    request = urllib.request.Request(
        f"{settings.POLLINATIONS_TEXT_URL}/openai",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "leadtech-ats-cv-generator/1.0",
        },
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        data = json.loads(response.read().decode())
    return str(data["choices"][0]["message"]["content"]).strip()


def generate_text(prompt: str) -> str:
    if settings.OPENROUTER_API_KEY:
        try:
            return str(_llm().invoke(prompt).content)
        except Exception:
            pass
    return _pollinations_text(prompt)


def _concise_candidate_prompt(description: str, forbidden_names: set[str]) -> str:
    forbidden_text = ", ".join(sorted(forbidden_names)) or "none"
    return (
        "Return raw JSON only for one realistic but fictional CV. "
        f"Description: {description}. "
        f"Forbidden full names, do not use: {forbidden_text}. "
        "Schema: name string, title string, location string, email string, phone string, "
        "summary string, skills array of 8-14 strings, languages array of 2-4 strings "
        "with proficiency, jobs array of 2-5 objects, education array of 1-3 objects. "
        "Each job object has title, company, start, end, achievements array of 2-4 strings. "
        "Each education object has degree, institution, year. No markdown."
    )


def _normalize_name(name: str) -> str:
    return re.sub(r"\s+", " ", name.strip()).casefold()


def generate_candidate(description: str, forbidden_names: set[str] | None = None) -> CandidateJSON:
    """One user-authored (or seed-tuple) description in, one structured CV out."""
    forbidden_names = forbidden_names or set()
    if settings.LOCAL_CV_TEXT_ONLY:
        return _local_candidate(description, forbidden_names)
    normalized_forbidden = {_normalize_name(name) for name in forbidden_names}
    forbidden_text = ", ".join(sorted(forbidden_names)) or "none"
    prompt = prompts.CANDIDATE_JSON_INSTRUCTIONS.format(
        description=f"{description}\n\nForbidden names that must not be used: {forbidden_text}"
    )
    concise_prompt = _concise_candidate_prompt(description, forbidden_names)

    last_candidate: CandidateJSON | None = None
    last_error: Exception | None = None
    for attempt in range(1, 6):
        try:
            try:
                raw = generate_text(prompt)
            except Exception:
                raw = generate_text(concise_prompt)
            candidate = _coerce_candidate(str(raw))
        except Exception as error:
            last_error = error
            prompt += (
                f"\n\nRetry #{attempt}: the previous response did not satisfy the schema "
                "or missed required CV sections. Return exactly one valid complete CV with "
                "2-5 jobs, contact information, skills, education, and languages. "
                "Return raw JSON only, with no markdown fence or explanation."
            )
            concise_prompt += (
                f" Retry {attempt}: previous output was invalid. Return valid JSON only, "
                "with all required fields and no markdown."
            )
            continue
        last_candidate = candidate
        if _normalize_name(candidate.name) not in normalized_forbidden:
            return candidate
        prompt += (
            f"\n\nThe name {candidate.name!r} was already used. Generate a different "
            f"fictional full name on retry #{attempt}."
        )

    return _local_candidate(description, forbidden_names)


def extract_name_role(first_page_text: str) -> tuple[str, str]:
    """Best-effort name/role extraction for *uploaded* PDFs.

    Falls back to placeholders when no API key is configured or the model
    response doesn't parse — an upload must never fail because of this.
    """
    try:
        raw = generate_text(
            prompts.EXTRACT_NAME_ROLE_PROMPT.format(text=first_page_text[:2000])
        )
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

def _portrait_data_uri(candidate: CandidateJSON) -> str:
    prompt = (
        "Realistic but entirely fictional professional CV headshot, "
        "not a real public figure, no logos, no text, no badges, "
        f"watermarks, documents, or extra people. Candidate profile: {candidate.name}, "
        f"{candidate.title}, based in {candidate.location}. Neutral studio lighting, "
        "business-casual clothing, natural face detail, square crop, realistic photography"
    )
    encoded_prompt = urllib.parse.quote(prompt)
    seed = int(hashlib.sha256(candidate.name.encode()).hexdigest()[:8], 16)
    url = (
        f"{settings.PORTRAIT_IMAGE_URL}/{encoded_prompt}"
        f"?width=768&height=768&model=flux&nologo=true&private=true&seed={seed}"
    )
    request = urllib.request.Request(url, headers={"User-Agent": "leadtech-ats-cv-generator/1.0"})
    with urllib.request.urlopen(request, timeout=90) as response:
        image_bytes = response.read()
        content_type = response.headers.get("Content-Type", "image/jpeg").split(";")[0]
    if not image_bytes or not content_type.startswith("image/"):
        raise ValueError(f"Image generation returned no portrait for {candidate.name}")
    image_data = base64.b64encode(image_bytes).decode()
    return f"data:{content_type};base64,{image_data}"


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
        c=candidate, avatar=_portrait_data_uri(candidate)
    )
    return HTML(string=html).write_pdf()


def candidate_filename(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_") or "candidate"
    return f"{slug}_{uuid.uuid4().hex[:8]}.pdf"
