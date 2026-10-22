"""Navigation layer: ties Jira fetch → deterministic render → optional GROQ expand → validate → write."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.config import PROJECT_ROOT, get_settings
from tools.groq_client import GroqError, expand_scenarios
from tools.jira_client import JiraError, fetch_issue
from tools.parser import extract_jira_key
from tools.render_testplan import render_testplan
from tools.validate import validate_testplan


class OrchestratorError(Exception):
    def __init__(self, code: str, message: str, *, http_status: int | None = None,
                 issue_key: str | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.http_status = http_status
        self.issue_key = issue_key

    def to_event(self) -> dict[str, Any]:
        return {
            "schema_version": "1.0.0",
            "error_code": self.code,
            "issue_key": self.issue_key,
            "message": self.message,
            "http_status": self.http_status,
            "retry_after_seconds": None,
            "occurred_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }


def _ts() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def run(prompt: str, use_groq: bool) -> dict[str, Any]:
    settings = get_settings()

    if not settings.jira_configured():
        raise OrchestratorError(
            "JIRA_NOT_CONFIGURED",
            "Jira is not configured. Open Settings and save your Jira credentials first.",
        )

    issue_key = extract_jira_key(prompt)
    if not issue_key:
        raise OrchestratorError(
            "NO_JIRA_KEY",
            "No Jira key found in the prompt. Try something like 'Fetch PROJ-123 and create a test plan'.",
        )

    # 1. Fetch issue
    try:
        jira_issue = fetch_issue(
            domain=settings.jira_domain,  # type: ignore[arg-type]
            email=settings.jira_email,  # type: ignore[arg-type]
            token=settings.jira_api_token,  # type: ignore[arg-type]
            issue_key=issue_key,
        )
    except JiraError as exc:
        raise OrchestratorError(exc.code, exc.message, http_status=exc.http_status,
                                issue_key=issue_key) from exc

    # 2. Optional GROQ expansion
    groq_used = False
    groq_scenarios: list[dict[str, Any]] = []
    groq_warning: str | None = None
    if use_groq:
        if not settings.groq_configured():
            groq_warning = "GROQ not configured — falling back to deterministic plan."
        else:
            try:
                groq_scenarios = expand_scenarios(
                    api_key=settings.groq_api_key,  # type: ignore[arg-type]
                    model=settings.groq_model,
                    jira_issue=jira_issue,
                    base_scenario_titles=[f"Verify: {ac}" for ac in jira_issue.get("acceptance_criteria", [])],
                )
                groq_used = True
            except GroqError as exc:
                groq_warning = f"GROQ unavailable ({exc.code}): {exc.message}"

    # 3. Render
    markdown, plan = render_testplan(jira_issue, groq_scenarios=groq_scenarios or None)

    # 4. Validate
    validate_testplan(plan)

    # 5. Write artifacts
    examples_dir = PROJECT_ROOT / "examples"
    examples_dir.mkdir(exist_ok=True)
    md_path = examples_dir / f"{issue_key}_{_ts()}.md"
    json_path = examples_dir / f"{issue_key}_{_ts()}.json"
    md_path.write_text(markdown, encoding="utf-8")
    json_path.write_text(__import__("json").dumps(plan, indent=2, ensure_ascii=False),
                        encoding="utf-8")

    return {
        "schema_version": "1.0.0",
        "issue_key": issue_key,
        "markdown": markdown,
        "json": plan,
        "markdown_path": str(md_path.relative_to(PROJECT_ROOT)),
        "json_path": str(json_path.relative_to(PROJECT_ROOT)),
        "groq_used": groq_used,
        "groq_warning": groq_warning,
    }