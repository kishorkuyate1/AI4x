"""Environment configuration. Navigation layer.

Loads `.env` and exposes a cached `Settings` object. Secrets are never logged.
"""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_ROOT / ".env"

load_dotenv(ENV_PATH)


class Settings:
    def __init__(self) -> None:
        self.jira_domain: Optional[str] = os.getenv("JIRA_DOMAIN") or None
        self.jira_email: Optional[str] = os.getenv("JIRA_EMAIL") or None
        self.jira_api_token: Optional[str] = os.getenv("JIRA_API_TOKEN") or None
        self.groq_api_key: Optional[str] = os.getenv("GROQ_API_KEY") or None
        self.groq_model: str = os.getenv("GROQ_MODEL") or "openai/gpt-oss-120b"
        self.default_jira_key: Optional[str] = os.getenv("DEFAULT_JIRA_KEY") or None

    def jira_configured(self) -> bool:
        return bool(self.jira_domain and self.jira_email and self.jira_api_token)

    def groq_configured(self) -> bool:
        return bool(self.groq_api_key)

    def redacted(self) -> dict:
        return {
            "jira_domain": self.jira_domain,
            "jira_email": self.jira_email,
            "jira_api_token_set": bool(self.jira_api_token),
            "groq_api_key_set": bool(self.groq_api_key),
            "groq_model": self.groq_model,
            "default_jira_key": self.default_jira_key,
        }


def get_settings() -> Settings:
    """Return current settings, re-reading .env each call so /api/settings writes
    are picked up immediately. Cheap — no I/O beyond a file read."""
    load_dotenv(ENV_PATH, override=True)
    return Settings()


def env_path() -> Path:
    return ENV_PATH