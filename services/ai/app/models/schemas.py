from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    timestamp: str


class IngestRequest(BaseModel):
    manual_id: str = Field(min_length=3, max_length=80)
    file_path: str
    manual_name: str | None = None


class IngestResponse(BaseModel):
    manual_id: str
    manual_name: str
    file_path: str
    page_count: int
    word_count: int
    status: Literal["ingested"]


class SectionOutline(BaseModel):
    section_id: str
    title: str
    page_start: int
    page_end: int
    summary: str


class BuildIndexRequest(BaseModel):
    manual_id: str = Field(min_length=3, max_length=80)
    chunk_size_pages: int = Field(default=3, ge=1, le=30)


class BuildIndexResponse(BaseModel):
    manual_id: str
    section_count: int
    sections: list[SectionOutline]
    status: Literal["indexed"]


class Evidence(BaseModel):
    manual_id: str
    section_id: str
    page_number: int = Field(ge=1)
    excerpt: str = Field(min_length=1)


class ChecklistItem(BaseModel):
    item_id: str
    text: str = Field(min_length=3)
    priority: Literal["must_do", "optional"]
    frequency: str = Field(min_length=2, max_length=64)
    safety_tag: Literal["safety", "standard"]
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: Evidence
    status: Literal["todo", "done", "na"] = "todo"
    assignee: str | None = None
    notes: str | None = None


class GenerateChecklistRequest(BaseModel):
    manual_id: str = Field(min_length=3, max_length=80)
    objective: str = "Extract preventive and safety maintenance checklist"
    max_items: int = Field(default=25, ge=1, le=100)
    strict_citations: bool | None = None


class GenerateChecklistResponse(BaseModel):
    manual_id: str
    checklist_id: str
    item_count: int
    items: list[ChecklistItem]
    warnings: list[str] = Field(default_factory=list)
    status: Literal["generated"]


class RejectedItem(BaseModel):
    text: str
    reason: str


class VerifyChecklistRequest(BaseModel):
    manual_id: str = Field(min_length=3, max_length=80)
    checklist_id: str | None = None
    strict_citations: bool = True
    items: list[ChecklistItem] | None = None


class VerifyChecklistResponse(BaseModel):
    manual_id: str
    checklist_id: str | None = None
    accepted_count: int
    rejected_count: int
    accepted_items: list[ChecklistItem]
    rejected_items: list[RejectedItem]
    status: Literal["verified"]

