"""Strawberry types — mirrors the SDL sketch in PLAN.md section 3.2."""

import enum
from datetime import datetime
from typing import Optional
from urllib.parse import quote

import strawberry

from app import registry


@strawberry.enum
class SourceType(enum.Enum):
    UPLOADED = "uploaded"
    GENERATED = "generated"


@strawberry.type
class Candidate:
    id: strawberry.ID
    name: str
    role: str
    avatar_url: Optional[str]
    source_type: SourceType
    created_at: datetime
    pdf_url: str

    @classmethod
    def from_row(cls, row: registry.Candidate) -> "Candidate":
        return cls(
            id=strawberry.ID(str(row.id)),
            name=row.name,
            role=row.role,
            avatar_url=row.avatar_url,
            source_type=SourceType(row.source_type),
            created_at=row.created_at,
            pdf_url=f"/api/cvs/{quote(row.filename)}",
        )


@strawberry.type
class PromptTemplate:
    explanation: str
    template: str


@strawberry.type
class ChatAnswer:
    answer: str
    sources: list[str]
