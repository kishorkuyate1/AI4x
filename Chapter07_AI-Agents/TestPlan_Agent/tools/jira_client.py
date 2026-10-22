"""Jira Cloud REST v3 client. N-layer transport.

`fetch_issue(domain, email, token, key) → JiraIssue`
Retries on 429/5xx with exponential backoff honoring Retry-After.

Raises JiraError on non-recoverable failure (401, 404, schema mismatch).
"""
from __future__ import annotations

import base64
import time
from datetime import datetime, timezone
from typing import Any, Optional

import httpx

from tools.adf_to_md import adf_to_markdown, extract_text


class JiraError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        *,
        http_status: Optional[int] = None,
        retry_after: Optional[int] = None,
        issue_key: Optional[str] = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.http_status = http_status
        self.retry_after = retry_after
        self.issue_key = issue_key

    def to_event(self) -> dict[str, Any]:
        return {
            "schema_version": "1.0.0",
            "error_code": self.code,
            "issue_key": self.issue_key,
            "message": self.message,
            "http_status": self.http_status,
            "retry_after_seconds": self.retry_after,
            "occurred_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }


FIELDS_WHITELIST = "summary,description,priority,labels,components,reporter,assignee,status,issuetype"

MAX_RETRIES = 3


def _basic_auth_header(email: str, token: str) -> str:
    raw = f"{email}:{token}".encode("utf-8")
    return "Basic " + base64.b64encode(raw).decode("ascii")


def _extract_acceptance_criteria(description_adf: dict | None) -> list[str]:
    """Heuristic: look for a bulletList whose preceding heading is 'Acceptance Criteria' or starts with 'AC'.

    Falls back to: any bullet item containing 'should' or 'must'.
    """
    if not description_adf or not isinstance(description_adf, dict):
        return []
    content = description_adf.get("content") or []

    ac_heading_idx: Optional[int] = None
    for i, node in enumerate(content):
        if node.get("type") == "heading":
            heading_text = extract_text(node).strip().lower()
            if heading_text.startswith("acceptance criteria") or heading_text.startswith("ac ") or heading_text == "ac":
                ac_heading_idx = i
                break

    ac_bullets: list[str] = []
    if ac_heading_idx is not None:
        for node in content[ac_heading_idx + 1:]:
            if node.get("type") == "heading":
                break
            if node.get("type") == "bulletList":
                for item in node.get("content") or []:
                    txt = extract_text(item).strip()
                    if txt:
                        ac_bullets.append(txt)

    if not ac_bullets:
        for node in content:
            if node.get("type") == "bulletList":
                for item in node.get("content") or []:
                    txt = extract_text(item).strip()
                    if txt and ("should" in txt.lower() or "must" in txt.lower()):
                        ac_bullets.append(txt)

    return ac_bullets


def fetch_issue(
    domain: str,
    email: str,
    token: str,
    issue_key: str,
    *,
    client: Optional[httpx.Client] = None,
) -> dict[str, Any]:
    """Fetch a Jira issue and normalize to the JiraIssue schema."""
    if not domain or not email or not token:
        raise JiraError("JIRA_NOT_CONFIGURED", "Jira credentials are not configured.")

    url = f"https://{domain}/rest/api/3/issue/{issue_key}"
    params = {"fields": FIELDS_WHITELIST}
    headers = {
        "Authorization": _basic_auth_header(email, token),
        "Accept": "application/json",
    }

    own_client = client is None
    http = client or httpx.Client(timeout=20.0)

    attempt = 0
    last_exc: Optional[Exception] = None
    while attempt < MAX_RETRIES:
        try:
            resp = http.get(url, params=params, headers=headers)
        except httpx.RequestError as exc:
            last_exc = exc
            attempt += 1
            time.sleep(min(2 ** attempt, 8))
            continue

        if resp.status_code == 200:
            return _normalize(resp.json(), domain)

        if resp.status_code == 404:
            raise JiraError(
                "JIRA_NOT_FOUND",
                f"Issue {issue_key} not found (or not visible to this account).",
                http_status=404,
                issue_key=issue_key,
            )

        if resp.status_code == 401:
            raise JiraError(
                "JIRA_UNAUTHORIZED",
                "Jira rejected the credentials (401). Check JIRA_EMAIL and JIRA_API_TOKEN.",
                http_status=401,
                issue_key=issue_key,
            )

        if resp.status_code == 403:
            raise JiraError(
                "JIRA_FORBIDDEN",
                "Jira forbade the request (403). The account may lack browse permission.",
                http_status=403,
                issue_key=issue_key,
            )

        if resp.status_code == 429 or resp.status_code >= 500:
            retry_after = int(resp.headers.get("Retry-After", "0") or 0)
            if attempt >= MAX_RETRIES - 1:
                raise JiraError(
                    "JIRA_RATE_LIMITED" if resp.status_code == 429 else "JIRA_SERVER_ERROR",
                    f"Jira returned {resp.status_code} after {MAX_RETRIES} retries.",
                    http_status=resp.status_code,
                    retry_after=retry_after or None,
                    issue_key=issue_key,
                )
            time.sleep(max(retry_after, 2 ** attempt))
            attempt += 1
            continue

        raise JiraError(
            "JIRA_SCHEMA_MISMATCH",
            f"Unexpected status {resp.status_code}: {resp.text[:200]}",
            http_status=resp.status_code,
            issue_key=issue_key,
        )

    if own_client:
        http.close()
    raise JiraError(
        "JIRA_NETWORK_ERROR",
        f"Network error after {MAX_RETRIES} retries: {last_exc}",
        issue_key=issue_key,
    )


def _normalize(raw: dict, domain: str) -> dict[str, Any]:
    fields = raw.get("fields") or {}
    description_adf = fields.get("description")
    description_md = adf_to_markdown(description_adf) if description_adf else ""
    ac = _extract_acceptance_criteria(description_adf)

    def _name(obj: dict | None) -> str | None:
        if not obj:
            return None
        return obj.get("displayName") or obj.get("name") or obj.get("emailAddress")

    return {
        "schema_version": "1.0.0",
        "key": raw.get("key", ""),
        "id": raw.get("id", ""),
        "self_url": raw.get("self", ""),
        "summary": fields.get("summary", ""),
        "description_markdown": description_md,
        "priority": (fields.get("priority") or {}).get("name", "Unspecified"),
        "labels": list(fields.get("labels") or []),
        "components": [c.get("name", "") for c in (fields.get("components") or []) if c.get("name")],
        "reporter": _name(fields.get("reporter")) or "Unassigned",
        "assignee": _name(fields.get("assignee")) or "Unassigned",
        "acceptance_criteria": ac,
        "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "_domain": domain,
    }


def test_connection(domain: str, email: str, token: str) -> dict[str, Any]:
    """Cheap ping: hit the canonical auth-check endpoint `/rest/api/3/myself`.

    This is the supported way to verify credentials; the old `/search?maxResults=0`
    probe returned 410 on modern Atlassian Cloud instances.
    """
    if not (domain and email and token):
        return {"ok": False, "message": "Jira credentials missing.", "http_status": None,
                "error_code": "JIRA_NOT_CONFIGURED"}
    url = f"https://{domain}/rest/api/3/myself"
    headers = {
        "Authorization": _basic_auth_header(email, token),
        "Accept": "application/json",
    }
    try:
        with httpx.Client(timeout=15.0) as c:
            r = c.get(url, headers=headers)
    except httpx.RequestError as exc:
        return {"ok": False, "message": f"Network error: {exc}", "http_status": None,
                "error_code": "JIRA_NETWORK_ERROR"}

    if r.status_code == 200:
        return {"ok": True, "message": "Jira connection OK.", "http_status": 200}
    if r.status_code == 401:
        return {"ok": False, "message": "Jira rejected the credentials (401).", "http_status": 401,
                "error_code": "JIRA_UNAUTHORIZED"}
    if r.status_code == 403:
        return {"ok": False, "message": "Jira forbade access (403).", "http_status": 403,
                "error_code": "JIRA_FORBIDDEN"}
    return {"ok": False, "message": f"Jira returned {r.status_code}.", "http_status": r.status_code,
            "error_code": "JIRA_SCHEMA_MISMATCH"}