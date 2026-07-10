"""FastAPI host: Strawberry GraphQL at /graphql (with GraphiQL in the browser),
plus the one deliberate REST exception — GET /api/health for Kubernetes probes,
which should stay a fast, dependency-free HTTP GET (PLAN.md section 2).
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
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


@app.get("/api/cvs/{filename}")
def cv_pdf(filename: str) -> FileResponse:
    cvs_dir = settings.CVS_DIR.resolve()
    path = (cvs_dir / filename).resolve()
    if not path.is_file() or path.parent != cvs_dir:
        raise HTTPException(status_code=404, detail="CV not found")
    return FileResponse(path, media_type="application/pdf", headers={"Content-Disposition": "inline"})
