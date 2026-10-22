"""LLM client: Ollama (default) with Groq fallback.

Uses plain HTTP via `requests`:
- Ollama: POST {endpoint}/api/generate
- Groq:   POST https://api.groq.com/openai/v1/chat/completions
"""

import logging

import requests

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


class LLMError(Exception):
    """User-safe LLM error message."""


class LLMConfigError(LLMError):
    pass


class LLMClient:
    def __init__(self, config, timeout=300):
        self.config = config
        self.timeout = timeout

    # -- availability checks --
    def _ollama_available(self, endpoint):
        try:
            resp = requests.get(f"{endpoint.rstrip('/')}/api/tags", timeout=5)
            return resp.status_code < 500
        except requests.RequestException:
            return False

    def _groq_configured(self):
        return bool(self.config.get("GROQ_API_KEY", "").strip())

    # -- providers --
    def _call_ollama(self, prompt):
        endpoint = self.config.get("OLLAMA_ENDPOINT") or "http://localhost:11434"
        model = self.config.get("OLLAMA_MODEL") or "qwen2.5:3b"
        url = f"{endpoint.rstrip('/')}/api/generate"
        payload = {"model": model, "prompt": prompt, "stream": False}
        resp = requests.post(url, json=payload, timeout=self.timeout)
        resp.raise_for_status()
        data = resp.json()
        return data.get("response", "").strip()
    def _call_groq(self, prompt):
        api_key = self.config.get("GROQ_API_KEY", "").strip()
        if not api_key:
            raise LLMConfigError("Groq API key is not configured. Please set it in Settings.")
        model = self.config.get("GROQ_MODEL") or "openai/gpt-oss-120b"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a senior software test engineer."},
                {"role": "user", "content": prompt},
            ],
        }
        resp = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=self.timeout)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()

    # -- public entry point --
    def generate(self, prompt):
        """Generate using the configured provider, falling back Ollama -> Groq."""
        provider = (self.config.get("DEFAULT_LLM_PROVIDER") or "ollama").strip().lower()

        if provider == "groq":
            logger.info("Selected LLM provider: groq")
            return self._call_groq(prompt)

        # provider == "ollama" (default)
        logger.info("Selected LLM provider: ollama")
        endpoint = self.config.get("OLLAMA_ENDPOINT") or "http://localhost:11434"
        if self._ollama_available(endpoint):
            try:
                return self._call_ollama(prompt)
            except requests.RequestException as exc:
                logger.warning("Ollama call failed, attempting Groq fallback: %s", exc)
        else:
            logger.warning("Ollama unavailable, attempting Groq fallback")

        if self._groq_configured():
            try:
                return self._call_groq(prompt)
            except requests.RequestException as exc:
                logger.error("Groq call also failed: %s", exc)
                raise LLMError(
                    "Unable to generate test cases because both Ollama and Groq are unavailable.\n"
                    "Please verify your LLM configuration."
                ) from exc

        raise LLMError(
            "Unable to generate test cases because both Ollama and Groq are unavailable.\n"
            "Please verify your LLM configuration."
        )
