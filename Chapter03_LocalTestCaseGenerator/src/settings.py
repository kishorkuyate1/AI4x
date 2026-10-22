"""Settings screen (Screen 2).

Lets the user configure Jira, Ollama, and Groq settings and save them to .env.
Secrets are shown masked and are never printed in the UI or logs.
"""

import requests
import streamlit as st

from config.config_store import load_config, save_config

PROVIDER_LABELS = {"ollama": "Ollama", "groq": "Groq"}


def _check_ollama_status(endpoint):
    """Return (reachable: bool, detail: str)."""
    try:
        resp = requests.get(f"{endpoint.rstrip('/')}/api/tags", timeout=5)
        if resp.status_code < 500:
            models = [m.get("name", "?") for m in resp.json().get("models", [])]
            return True, f"Connected — {len(models)} model(s) available"
        return False, f"Responded with status {resp.status_code}"
    except requests.ConnectionError:
        return False, "Cannot connect — is Ollama running?"
    except requests.Timeout:
        return False, "Connection timed out"
    except requests.RequestException as exc:
        return False, str(exc)


def _check_groq_status(api_key):
    """Return (configured: bool, detail: str)."""
    if not api_key or not api_key.strip():
        return False, "No API key configured"
    return True, "API key is set"


def _mask(value):
    if not value:
        return ""
    if len(value) <= 4:
        return "*" * len(value)
    return "*" * 8 + value[-4:]


def render():
    st.title("Settings")
    st.caption("Configure Jira and AI provider credentials. Values are stored in the local .env file.")

    config = load_config()

    # ── Provider Status ──────────────────────────────────────────────
    st.subheader("Provider Status")

    ollama_endpoint = config.get("OLLAMA_ENDPOINT", "http://localhost:11434")
    ollama_ok, ollama_detail = _check_ollama_status(ollama_endpoint)
    groq_ok, groq_detail = _check_groq_status(config.get("GROQ_API_KEY", ""))

    col1, col2 = st.columns(2)
    with col1:
        if ollama_ok:
            st.success(f"**Ollama** — {ollama_detail}")
        else:
            st.error(f"**Ollama** — {ollama_detail}")
    with col2:
        if groq_ok:
            st.success(f"**Groq** — {groq_detail}")
        else:
            st.warning(f"**Groq** — {groq_detail}")

    st.divider()

    # ── Settings Form ────────────────────────────────────────────────
    with st.form("settings_form"):
        st.subheader("Jira Configuration")
        jira_url = st.text_input(
            "Jira Base URL",
            value=config.get("JIRA_BASE_URL", ""),
            placeholder="https://your-company.atlassian.net",
        )
        jira_email = st.text_input(
            "Jira Email ID",
            value=config.get("JIRA_EMAIL", ""),
            placeholder="tester@example.com",
        )
        jira_token = st.text_input(
            "Jira API Token",
            value=config.get("JIRA_API_TOKEN", ""),
            type="password",
            help="Stored in .env. Existing value is masked.",
        )

        st.subheader("LLM Configuration")
        provider = st.radio(
            "Provider",
            options=list(PROVIDER_LABELS.keys()),
            format_func=lambda k: PROVIDER_LABELS[k],
            index=0 if config.get("DEFAULT_LLM_PROVIDER", "ollama") != "groq" else 1,
            horizontal=True,
        )

        st.markdown("**Ollama Configuration**")
        ollama_url = st.text_input(
            "Ollama Endpoint",
            value=config.get("OLLAMA_ENDPOINT", "http://localhost:11434"),
        )
        ollama_model = st.text_input(
            "Ollama Model",
            value=config.get("OLLAMA_MODEL", "qwen2.5:3b"),
        )

        st.markdown("**Groq Configuration**")
        groq_key = st.text_input(
            "Groq API Key",
            value=config.get("GROQ_API_KEY", ""),
            type="password",
            help="Stored in .env. Existing value is masked.",
        )
        groq_model = st.text_input(
            "Groq Model",
            value=config.get("GROQ_MODEL", "llama-3.3-70b-versatile"),
        )

        submitted = st.form_submit_button("Save Settings")

    if submitted:
        save_config(
            {
                "JIRA_BASE_URL": jira_url.strip(),
                "JIRA_EMAIL": jira_email.strip(),
                "JIRA_API_TOKEN": jira_token.strip(),
                "DEFAULT_LLM_PROVIDER": provider,
                "OLLAMA_ENDPOINT": ollama_url.strip(),
                "OLLAMA_MODEL": ollama_model.strip(),
                "GROQ_API_KEY": groq_key.strip(),
                "GROQ_MODEL": groq_model.strip(),
            }
        )
        st.success("Settings saved to .env")

    st.divider()
    st.caption(
        f"Jira token on file: **{_mask(config.get('JIRA_API_TOKEN', ''))}**  ·  "
        f"Groq key on file: **{_mask(config.get('GROQ_API_KEY', ''))}**"
    )
