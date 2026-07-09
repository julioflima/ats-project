"""Candidate registry — the SQLite-backed relational side of the system.

Chroma answers "which CV chunks are semantically close to this question";
this table answers "list the candidates for the sidebar". Two stores, one
volume (PLAN.md section 3.2).
"""

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, Session, SQLModel, create_engine, select

from app import settings


class Candidate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    role: str
    filename: str = Field(index=True, unique=True)
    source_type: str  # "uploaded" | "generated"
    avatar_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


_engine = None


def get_engine():
    global _engine
    if _engine is None:
        settings.SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)
        _engine = create_engine(
            f"sqlite:///{settings.SQLITE_PATH}",
            connect_args={"check_same_thread": False},
        )
        SQLModel.metadata.create_all(_engine)
    return _engine


def add_candidate(
    name: str, role: str, filename: str, source_type: str, avatar_url: str | None = None
) -> Candidate:
    with Session(get_engine()) as session:
        candidate = Candidate(
            name=name,
            role=role,
            filename=filename,
            source_type=source_type,
            avatar_url=avatar_url,
        )
        session.add(candidate)
        session.commit()
        session.refresh(candidate)
        return candidate


def list_candidates() -> list[Candidate]:
    with Session(get_engine()) as session:
        rows = session.exec(select(Candidate).order_by(Candidate.created_at.desc()))
        return list(rows)
