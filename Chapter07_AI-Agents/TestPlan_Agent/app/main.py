"""FastAPI entrypoint. Navigation layer.

Endpoints:
  GET  /                  → static index.html
  GET  /settings          → static settings.html
  POST /api/chat          → generate a Test Plan from a prompt
  POST /api/settings      → save settings to .env
  POST /api/test-connection/jira
  POST /api/test-connection/groq
  GET  /api/health
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.config import env_path, get_settings
from app.models import (
    ChatRequest,
    ChatResponse,
    ConnectionTestResult,
    SCHEMA_VERSION,
    SettingsPayload,
)
from app.orchestrator import OrchestratorError, run
from tools.groq_client import test_connection as groq_test_connection
from tools.jira_client import test_connection as jira_test_connection


PROJECT_ROOT = Path(__file__).resolve().parent.parent
STATIC_DIR = PROJECT_ROOT / "static"

app = FastAPI(title="TestPlan Agent", version="1.0.0")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/settings")
def settings_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "settings.html")


@app.get("/api/health")
def health() -> dict[str, Any]:
    s = get_settings()
    return {
        "ok": True,
        "schema_version": SCHEMA_VERSION,
        "jira_configured": s.jira_configured(),
        "groq_configured": s.groq_configured(),
        "default_jira_key": s.default_jira_key,
        "groq_model": s.groq_model,
    }


@app.get("/api/settings")
def get_settings_public() -> dict[str, Any]:
    s = get_settings()
    return s.redacted()


@app.post("/api/settings")
def save_settings(payload: SettingsPayload) -> dict[str, Any]:
    """Persist settings to .env (atomic write). Secrets are accepted but never echoed back."""
    keys = {
        "JIRA_DOMAIN": payload.jira_domain or "",
        "JIRA_EMAIL": payload.jira_email or "",
        "JIRA_API_TOKEN": payload.jira_api_token or "",
        "GROQ_API_KEY": payload.groq_api_key or "",
        "GROQ_MODEL": payload.groq_model or "openai/gpt-oss-120b",
        "DEFAULT_JIRA_KEY": payload.default_jira_key or "",
    }

    lines: list[str] = []
    if env_path().exists():
        # Preserve comments / ordering of untouched keys.
        existing_lines = env_path().read_text(encoding="utf-8").splitlines()
        seen = set()
        for line in existing_lines:
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                lines.append(line)
                continue
            k = stripped.split("=", 1)[0].strip()
            if k in keys:
                lines.append(f"{k}={keys[k]}")
                seen.add(k)
            else:
                lines.append(line)
        for k, v in keys.items():
            if k not in seen:
                lines.append(f"{k}={v}")
    else:
        lines = [f"{k}={v}" for k, v in keys.items()]

    tmp = env_path().with_suffix(".env.tmp")
    tmp.write_text("\n".join(lines) + "\n", encoding="utf-8")
    os.replace(tmp, env_path())

    return {"ok": True, "message": "Settings saved.", "redacted": get_settings().redacted()}


@app.post("/api/test-connection/jira", response_model=ConnectionTestResult)
def test_jira() -> ConnectionTestResult:
    s = get_settings()
    res = jira_test_connection(
        domain=s.jira_domain or "",
        email=s.jira_email or "",
        token=s.jira_api_token or "",
    )
    return ConnectionTestResult(**res)


@app.post("/api/test-connection/groq", response_model=ConnectionTestResult)
def test_groq() -> ConnectionTestResult:
    s = get_settings()
    res = groq_test_connection(api_key=s.groq_api_key or "", model=s.groq_model)
    return ConnectionTestResult(**res)


@app.post("/api/chat")
def chat(req: ChatRequest) -> JSONResponse:
    try:
        result = run(req.prompt, req.use_groq)
    except OrchestratorError as exc:
        return JSONResponse(status_code=400, content=exc.to_event())

    resp = ChatResponse(
        issue_key=result["issue_key"],
        markdown=result["markdown"],
        json=result["json"],
        markdown_path=result["markdown_path"],
        json_path=result["json_path"],
        groq_used=result["groq_used"],
    )
    body = resp.model_dump(by_alias=True)
    if result.get("groq_warning"):
        body["groq_warning"] = result["groq_warning"]
    return JSONResponse(content=body)


class FetchOnlyRequest(BaseModel):
    issue_key: str


@app.post("/api/fetch-issue")
def fetch_only(req: FetchOnlyRequest) -> dict[str, Any]:
    """Convenience: fetch and return normalized JiraIssue without rendering."""
    from tools.jira_client import fetch_issue as _fetch
    s = get_settings()
    if not s.jira_configured():
        raise HTTPException(status_code=400, detail="Jira not configured.")
    try:
        issue = _fetch(
            domain=s.jira_domain,  # type: ignore[arg-type]
            email=s.jira_email,  # type: ignore[arg-type]
            token=s.jira_api_token,  # type: ignore[arg-type]
            issue_key=req.issue_key,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return issue