"""Configuration store.

Reads and writes the local .env file (same folder as app.py).
The .env uses the keys the user created:

    JIRA_EMAIL=
    JIRA_API_TOKEN=
    JIRA_URL=
    Ollama_URL=
    Ollama_API_KEY=
    GROQ_TOKEN=

Internally the rest of the app works with canonical names, so if a key is
missing we fall back to the defaults defined in the plan.
"""

import os
from pathlib import Path

from dotenv import load_dotenv, set_key

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"

# Map .env keys (as the user wrote them) -> canonical internal names
KEY_ALIASES = {
    "JIRA_BASE_URL": "JIRA_URL",
    "JIRA_EMAIL": "JIRA_EMAIL",
    "JIRA_API_TOKEN": "JIRA_API_TOKEN",
    "OLLAMA_ENDPOINT": "Ollama_URL",
    "OLLAMA_MODEL": "OLLAMA_MODEL",
    "GROQ_API_KEY": "GROQ_TOKEN",
    "GROQ_MODEL": "GROQ_MODEL",
    "DEFAULT_LLM_PROVIDER": "DEFAULT_LLM_PROVIDER",
}

DEFAULTS = {
    "JIRA_BASE_URL": "",
    "JIRA_EMAIL": "",
    "JIRA_API_TOKEN": "",
    "OLLAMA_ENDPOINT": "http://localhost:11434",
    "OLLAMA_MODEL": "qwen2.5:3b",
    "GROQ_API_KEY": "",
    "GROQ_MODEL": "llama-3.3-70b-versatile",
    "DEFAULT_LLM_PROVIDER": "ollama",
}


def _load_env_file():
    if ENV_FILE.exists():
        load_dotenv(ENV_FILE, override=True)


def load_config():
    """Return a dict of canonical config keys resolved from .env + defaults."""
    _load_env_file()
    config = {}
    for canonical, env_key in KEY_ALIASES.items():
        config[canonical] = os.getenv(env_key, DEFAULTS.get(canonical, ""))
    return config


def save_config(updates):
    """Persist canonical config values back to .env using the user's keys.

    `updates` is a dict of canonical names -> values. Values are written
    verbatim (set_key quotes when needed). Returns the canonical dict as
    it now stands on disk.
    """
    _load_env_file()
    ENV_FILE.parent.mkdir(parents=True, exist_ok=True)
    for canonical, value in updates.items():
        env_key = KEY_ALIASES.get(canonical, canonical)
        if value is None:
            value = ""
        set_key(str(ENV_FILE), env_key, str(value))
    return load_config()
