# LLM.md — Project Constitution

> Authoritative source of truth for **schemas, behavioral rules, and architectural invariants**.
> Status: **APPROVED v1.0.0** — Phases 1–4 Blueprint locked.

---

## 1. Architectural Invariants (A.N.T. 3-layer)

| Layer | Responsibility | Allowed modules |
|-------|---------------|-----------------|
| **A — Architecture** | Schemas, contracts, rules | `architecture/*.md`, `LLM.md` |
| **N — Navigation** | I/O, transport, external APIs, orchestration | `app/*.py`, `tools/jira_client.py`, `tools/groq_client.py` |
| **T — Tools** | Deterministic, pure operations | `tools/adf_to_md.py`, `tools/render_testplan.py`, `tools/validate.py`, `tools/parser.py` |

**Golden Rule (from BLAST Phase 3):** if logic changes, **update the SOP in `architecture/` before editing the code**.

**Rules:**
- A layer may import only from layers to its **right** (A ← N ← T). Never the reverse.
- **No business logic in transport modules.** `jira_client.py` returns a `JiraIssue`; it does not render Markdown.
- **No I/O in pure tool modules.** `render_testplan.py` is pure: `JiraIssue → (markdown_str, TestPlan_dict)`. Clock is injected.
- All secrets read from env vars in Navigation layer only.

---

## 2. Data Schemas

### 2.1 `JiraIssue` (input contract — normalized from Jira REST v3)
```json
{
  "schema_version": "1.0.0",
  "key": "PROJ-123",
  "id": "10001",
  "self_url": "https://.../issue/10001",
  "summary": "Allow users to export reports as PDF",
  "description_markdown": "## Goal\n...\n- AC1 ...\n- AC2 ...",
  "priority": "Medium",
  "labels": ["reports", "export"],
  "components": ["Reporting"],
  "reporter": "Jane Doe",
  "assignee": "John Roe",
  "acceptance_criteria": [
    "User can export a report to PDF",
    "PDF respects user locale"
  ],
  "fetched_at": "2026-08-30T12:00:00Z"
}
```

### 2.2 `TestPlan` (output contract)
```json
{
  "schema_version": "1.0.0",
  "source_issue_key": "PROJ-123",
  "generated_at": "2026-08-30T12:00:01Z",
  "generator_version": "1.0.0",
  "overview": "...",
  "scope_in": ["..."],
  "scope_out": ["..."],
  "approach": ["..."],
  "entry_criteria": ["..."],
  "exit_criteria": ["..."],
  "test_scenarios": [
    {
      "id": "TC-1",
      "title": "...",
      "type": "functional|integration|negative|edge",
      "given": "...",
      "when": "...",
      "then": "...",
      "linked_ac": 0
    }
  ],
  "risks": ["..."],
  "references": {
    "jira_url": "https://.../browse/PROJ-123"
  }
}
```

### 2.3 `ErrorEvent` (failure contract — emitted by Navigation layer)
```json
{
  "schema_version": "1.0.0",
  "error_code": "JIRA_NOT_FOUND|JIRA_UNAUTHORIZED|JIRA_RATE_LIMITED|JIRA_SCHEMA_MISMATCH|GROQ_INVALID_OUTPUT|NO_JIRA_KEY",
  "issue_key": "PROJ-123",
  "message": "...",
  "http_status": 404,
  "retry_after_seconds": null,
  "occurred_at": "2026-08-30T12:00:00Z"
}
```

### 2.4 `ChatRequest` (UI → backend)
```json
{
  "schema_version": "1.0.0",
  "prompt": "Fetch PROJ-123 and create a test plan",
  "use_groq": false
}
```

### 2.5 `ChatResponse` (backend → UI)
```json
{
  "schema_version": "1.0.0",
  "issue_key": "PROJ-123",
  "markdown": "# Test Plan ...",
  "json": { "...TestPlan object...": null },
  "markdown_path": "examples/PROJ-123_20260830T120001Z.md",
  "json_path": "examples/PROJ-123_20260830T120001Z.json",
  "groq_used": false
}
```

### 2.6 `SettingsPayload` (Settings UI → backend)
```json
{
  "schema_version": "1.0.0",
  "jira_domain": "acme.atlassian.net",
  "jira_email": "you@example.com",
  "jira_api_token": "<redacted>",
  "groq_api_key": "<redacted>",
  "groq_model": "openai/gpt-oss-120b",
  "default_jira_key": "PROJ-1"
}
```

---

## 3. Behavioral Rules

1. **Determinism:** given identical `JiraIssue` input and injected clock, `render_testplan.py` produces byte-identical output. Scenario IDs are sequential `TC-1..TC-N`.
2. **Self-healing retries:** transient Jira errors (`429`, `5xx`, network timeouts) retried up to 3× with exponential backoff honoring `Retry-After`.
3. **Secrets:** `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_DOMAIN`, `GROQ_API_KEY` read from env vars. **Never** logged, echoed, or written to disk in plaintext.
4. **No silent failures:** any non-2xx response or schema-mismatch emits `ErrorEvent` and exits non-zero (HTTP 4xx/5xx from the API).
5. **LLM is opt-in:** `use_groq=False` by default. UI surfaces a toggle.
6. **GROQ JSON-mode:** `response_format={"type":"json_object"}` is enforced. On parse failure, fall back to deterministic-only and log.
7. **Schema versioning:** every contract carries `schema_version`. Mismatches raise `JIRA_SCHEMA_MISMATCH`.
8. **Golden Rule:** logic changes update the SOP in `architecture/` **first**.

---

## 4. Architectural Invariants (hard rules)

- **`tools/` is the only directory that holds executable Python.** `app/` is the FastAPI layer.
- **`architecture/` is read-only markdown — never imported by code.**
- **Pure modules** (`adf_to_md`, `render_testplan`, `validate`, `parser`) have **no I/O, no network, no clock reads** outside an injected `clock` parameter.
- **Validation is mandatory:** `validate()` runs against every produced `TestPlan` before it's written.
- **A.N.T. import direction:** `architecture/` ← `app/`, `tools/*_client.py` ← `tools/{render,adf,validate,parser}.py`.
- **Demo mode:** if `.env` is empty, app boots but routes return a friendly "configure settings" state. No background network calls at import time.