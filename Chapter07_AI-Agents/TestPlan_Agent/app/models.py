"""Pydantic contracts. See LLM.md §2 for full schemas."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


SCHEMA_VERSION = "1.0.0"
GENERATOR_VERSION = "1.0.0"


class ChatRequest(BaseModel):
    schema_version: str = Field(default=SCHEMA_VERSION)
    prompt: str
    use_groq: bool = False


class ChatResponse(BaseModel):
    schema_version: str = Field(default=SCHEMA_VERSION)
    issue_key: str
    markdown: str
    plan: dict[str, Any] = Field(alias="json")
    markdown_path: Optional[str] = None
    json_path: Optional[str] = None
    groq_used: bool = False

    model_config = {"populate_by_name": True}


class ErrorEvent(BaseModel):
    schema_version: str = Field(default=SCHEMA_VERSION)
    error_code: str
    issue_key: Optional[str] = None
    message: str
    http_status: Optional[int] = None
    retry_after_seconds: Optional[int] = None
    occurred_at: str


class SettingsPayload(BaseModel):
    schema_version: str = Field(default=SCHEMA_VERSION)
    jira_domain: Optional[str] = None
    jira_email: Optional[str] = None
    jira_api_token: Optional[str] = None
    groq_api_key: Optional[str] = None
    groq_model: Optional[str] = None
    default_jira_key: Optional[str] = None


class ConnectionTestResult(BaseModel):
    ok: bool
    message: str
    http_status: Optional[int] = None
    details: Optional[dict[str, Any]] = None
    error_code: Optional[str] = None