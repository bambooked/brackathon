"""Break Thunder bulletin board schemas."""

from pydantic import BaseModel, Field


class BreakThunderActiveResponse(BaseModel):
    active: bool
    schedule_id: int | None = None
    ends_at: str | None = None


class BreakThunderMessageCreateRequest(BaseModel):
    body: str = Field(min_length=1, max_length=240)


class BreakThunderMessageItem(BaseModel):
    id: int
    schedule_id: int
    user_id: int
    user_name: str
    body: str
    created_at: str


class BreakThunderMessagesResponse(BaseModel):
    active: bool
    schedule_id: int | None = None
    ends_at: str | None = None
    messages: list[BreakThunderMessageItem]
