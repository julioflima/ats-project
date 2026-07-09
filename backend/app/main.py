"""FastAPI host: Strawberry GraphQL at /graphql (with GraphiQL in the browser),
plus the one deliberate REST exception — GET /api/health for Kubernetes probes,
which should stay a fast, dependency-free HTTP GET (PLAN.md section 2).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

from app import settings
from app.graphql.schema import schema

app = FastAPI(title="Leadtech ATS backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # "*" locally; the app hostname in k8s
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    GraphQLRouter(schema, multipart_uploads_enabled=True),
    prefix="/graphql",
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
