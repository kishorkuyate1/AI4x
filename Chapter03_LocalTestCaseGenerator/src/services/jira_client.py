"""Jira REST API client.

Fetches issue details with Basic Auth (email + API token) and extracts the
fields required by the prompt. Missing fields become "N/A" — nothing is
invented.
"""

import logging
import re

import requests

logger = logging.getLogger(__name__)

ACCEPTANCE_PATTERN = re.compile(r"acceptance", re.IGNORECASE)


class JiraError(Exception):
    """Base error with a user-safe message."""


class JiraConfigError(JiraError):
    pass


class JiraAuthError(JiraError):
    pass


class JiraNotFoundError(JiraError):
    pass


class JiraConnectionError(JiraError):
    pass


def _clean_url(base_url):
    return base_url.rstrip("/")


class JiraClient:
    def __init__(self, base_url, email, api_token, timeout=15):
        if not base_url or not email or not api_token:
            raise JiraConfigError(
                "Jira configuration is incomplete. Please open Settings and configure Jira credentials."
            )
        self.base_url = _clean_url(base_url)
        self.email = email
        self.api_token = api_token
        self.timeout = timeout
        self._session = requests.Session()
        self._session.auth = (self.email, self.api_token)
        self._session.headers.update({"Accept": "application/json"})
        self._field_cache = None

    def _get(self, path):
        url = f"{self.base_url}{path}"
        try:
            resp = self._session.get(url, timeout=self.timeout)
        except requests.RequestException as exc:
            raise JiraConnectionError(
                f"Could not reach Jira at {self.base_url}. Please check your Jira URL and network connection."
            ) from exc

        if resp.status_code == 404:
            raise JiraNotFoundError(
                f"Jira issue {self._last_key} could not be found.\nPlease verify the issue key and Jira configuration."
            )
        if resp.status_code in (401, 403):
            raise JiraAuthError(
                "Jira authentication failed. Please verify your Jira email and API token in Settings."
            )
        if resp.status_code >= 400:
            raise JiraError(
                f"Jira API returned an error (HTTP {resp.status_code}). Please try again."
            )
        return resp.json()

    # -- field metadata (for finding the Acceptance Criteria custom field) --
    def _load_fields(self):
        if self._field_cache is None:
            self._field_cache = self._get("/rest/api/2/field")
        return self._field_cache

    def _acceptance_field_id(self):
        for field in self._load_fields():
            name = field.get("name", "")
            if ACCEPTANCE_PATTERN.search(name):
                return field.get("id")
        return None

    # -- issue fetch --
    def fetch_issue(self, key):
        self._last_key = key
        data = self._get(f"/rest/api/2/issue/{key}")
        fields = data.get("fields", {})

        acceptance_field_id = self._acceptance_field_id()
        acceptance_criteria = fields.get(acceptance_field_id) if acceptance_field_id else None

        labels = fields.get("labels") or []
        components = [
            c.get("name") for c in (fields.get("components") or []) if c.get("name")
        ]

        issue = {
            "key": key,
            "summary": fields.get("summary") or "N/A",
            "description": fields.get("description") or "N/A",
            "acceptance_criteria": acceptance_criteria or "N/A",
            "issue_type": (fields.get("issuetype") or {}).get("name") or "N/A",
            "priority": (fields.get("priority") or {}).get("name") or "N/A",
            "status": (fields.get("status") or {}).get("name") or "N/A",
            "labels": labels or [],
            "components": components or [],
        }
        logger.info("Fetched Jira issue %s", key)
        return issue
