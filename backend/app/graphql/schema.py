"""Schema assembly. `chat` is a mutation, not a query, on purpose: it triggers
a billed LLM call and isn't idempotent/cacheable the way queries are expected
to be (PLAN.md section 3.2).
"""

import strawberry
from strawberry.file_uploads import Upload

from app.graphql import resolvers
from app.graphql.types import Candidate, ChatAnswer, PromptTemplate


@strawberry.type
class Query:
    candidates: list[Candidate] = strawberry.field(resolver=resolvers.candidates)
    default_generation_prompt: PromptTemplate = strawberry.field(
        resolver=resolvers.default_generation_prompt
    )


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def upload_candidate(self, file: Upload) -> Candidate:
        return await resolvers.upload_candidate(file)

    @strawberry.mutation
    async def generate_candidate(self, prompt: str) -> Candidate:
        return await resolvers.generate_candidate(prompt)

    @strawberry.mutation
    async def chat(self, question: str) -> ChatAnswer:
        return await resolvers.chat(question)


schema = strawberry.Schema(query=Query, mutation=Mutation)
