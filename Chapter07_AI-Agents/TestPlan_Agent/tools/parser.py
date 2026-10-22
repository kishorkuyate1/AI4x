"""Pure parser. T-layer. Extracts a Jira key from free text.

Examples
--------
>>> extract_jira_key("Fetch PROJ-123 and create a test plan")
'PROJ-123'
>>> extract_jira_key("please look at CYB-42 today")
'CYB-42'
>>> extract_jira_key("no key here")
"""
from __future__ import annotations

import re

_JIRA_KEY_RE = re.compile(r"\b([A-Z][A-Z0-9_]+-\d+)\b")


def extract_jira_key(prompt: str) -> str | None:
    if not prompt:
        return None
    m = _JIRA_KEY_RE.search(prompt)
    return m.group(1) if m else None


def extract_all_jira_keys(prompt: str) -> list[str]:
    if not prompt:
        return []
    return _JIRA_KEY_RE.findall(prompt)