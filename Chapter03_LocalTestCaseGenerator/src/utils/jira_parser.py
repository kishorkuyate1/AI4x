"""Extract a Jira issue key from a natural-language request."""

import re

# Matches keys like QA-102, PROJ-123, ABC-456 (project 1-10 chars, number 1-9)
JIRA_KEY_PATTERN = re.compile(r"\b[A-Z][A-Z0-9_]{0,9}-\d{1,9}\b")


def extract_issue_key(text):
    """Return the first Jira issue key found in `text`, or None."""
    if not text:
        return None
    match = JIRA_KEY_PATTERN.search(text)
    return match.group(0) if match else None
