"""GROQ OpenAI-compatible chat completions client. N-layer transport.

`expand_scenarios(...) → list[scenario]`

Uses JSON-mode (`response_format={"type":"json_object"}`). On parse failure,
raises GroqError. The caller (orchestrator) catches and falls back.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Optional

import httpx

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqError(Exception):
    def __init__(self, code: str, message: str, *, http_status: Optional[int] = None) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.http_status = http_status

    def to_event(self, issue_key: Optional[str] = None) -> dict[str, Any]:
        return {
            "schema_version": "1.0.0",
            "error_code": self.code,
            "issue_key": issue_key,
            "message": self.message,
            "http_status": self.http_status,
            "retry_after_seconds": None,
            "occurred_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }


SYSTEM_PROMPT = """You are a senior QA engineer. Given a Jira issue, produce ADDITIONAL
test scenarios beyond the acceptance-criteria-derived ones. Return strict JSON:
{"scenarios": [ {"title": str, "type": "functional|integration|negative|edge|smoke",
"given": str, "when": str, "then": str, "linked_ac": int_or_null} ]}
Constraints: 3–8 scenarios; deduplicate within the response; do NOT repeat the AC-derived
scenarios; favor negative and edge cases. No markdown fences — JSON only."""


def _build_user_prompt(jira_issue: dict[str, Any], base_titles: list[str]) -> str:
    return json.dumps({
        "key": jira_issue.get("key"),
        "summary": jira_issue.get("summary"),
        "description": jira_issue.get("description_markdown", "")[:4000],
        "labels": jira_issue.get("labels", []),
        "components": jira_issue.get("components", []),
        "priority": jira_issue.get("priority"),
        "existing_scenarios_to_avoid": base_titles,
        "instructions": "Return JSON only. 3-8 additional scenarios.",
    }, ensure_ascii=False)


def expand_scenarios(
    api_key: str,
    model: str,
    jira_issue: dict[str, Any],
    base_scenario_titles: Optional[list[str]] = None,
    *,
    client: Optional[httpx.Client] = None,
    timeout: float = 30.0,
) -> list[dict[str, Any]]:
    if not api_key:
        raise GroqError("GROQ_NOT_CONFIGURED", "GROQ_API_KEY is not configured.")

    user_prompt = _build_user_prompt(jira_issue, base_scenario_titles or [])
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "max_tokens": 1500,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    own_client = client is None
    http = client or httpx.Client(timeout=timeout)
    try:
        resp = http.post(GROQ_URL, json=payload, headers=headers)
    except httpx.RequestError as exc:
        raise GroqError("GROQ_NETWORK_ERROR", f"Network error: {exc}") from exc
    finally:
        if own_client:
            http.close()

    if resp.status_code == 401:
        raise GroqError("GROQ_UNAUTHORIZED", "GROQ rejected the API key (401).",
                        http_status=401)
    if resp.status_code == 429:
        raise GroqError("GROQ_RATE_LIMITED", "GROQ rate limit hit (429).",
                        http_status=429)
    if resp.status_code >= 500:
        raise GroqError("GROQ_SERVER_ERROR",
                        f"GROQ returned {resp.status_code}.", http_status=resp.status_code)
    if resp.status_code != 200:
        raise GroqError("GROQ_SCHEMA_MISMATCH",
                        f"Unexpected status {resp.status_code}: {resp.text[:200]}",
                        http_status=resp.status_code)

    body = resp.json()
    try:
        content = body["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        scenarios = parsed.get("scenarios", [])
        if not isinstance(scenarios, list):
            raise ValueError("'scenarios' is not a list")
        out: list[dict[str, Any]] = []
        for s in scenarios:
            if not isinstance(s, dict):
                continue
            title = (s.get("title") or "").strip()
            if not title:
                continue
            out.append({
                "title": title,
                "type": s.get("type", "functional"),
                "given": s.get("given", ""),
                "when": s.get("when", ""),
                "then": s.get("then", ""),
                "linked_ac": s.get("linked_ac") if isinstance(s.get("linked_ac"), int) else 0,
            })
        return out
    except (KeyError, IndexError, json.JSONDecodeError, ValueError) as exc:
        raise GroqError("GROQ_INVALID_OUTPUT",
                        f"Could not parse GROQ response: {exc}",
                        http_status=resp.status_code) from exc


def test_connection(api_key: str, model: str = "openai/gpt-oss-120b") -> dict[str, Any]:
    if not api_key:
        return {"ok": False, "message": "GROQ_API_KEY missing.", "http_status": None,
                "error_code": "GROQ_NOT_CONFIGURED"}
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "ping"}],
        "max_tokens": 5,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    try:
        with httpx.Client(timeout=15.0) as c:
            r = c.post(GROQ_URL, json=payload, headers=headers)
    except httpx.RequestError as exc:
        return {"ok": False, "message": f"Network error: {exc}", "http_status": None,
                "error_code": "GROQ_NETWORK_ERROR"}

    if r.status_code == 200:
        return {"ok": True, "message": "GROQ connection OK.", "http_status": 200}
    if r.status_code == 401:
        return {"ok": False, "message": "GROQ rejected the API key (401).", "http_status": 401,
                "error_code": "GROQ_UNAUTHORIZED"}
    if r.status_code == 429:
        return {"ok": False, "message": "GROQ rate limit hit (429).", "http_status": 429,
                "error_code": "GROQ_RATE_LIMITED"}
    return {"ok": False, "message": f"GROQ returned {r.status_code}.", "http_status": r.status_code,
            "error_code": "GROQ_SCHEMA_MISMATCH"}