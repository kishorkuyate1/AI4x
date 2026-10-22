# task_plan.md — Jira-Driven Test Plan Generator

> Approved Blueprint. Phases 1–4 in flight.

## 1. Objective
A FastAPI web app: user types a prompt → app parses the Jira key → fetches the issue → produces a structured Test Plan (Markdown + JSON), optionally expanded by GROQ. Settings UI persists Jira + GROQ credentials and a default Jira key.

## 2. Scope
**In:** Jira Cloud (REST v3) fetch, ADF flatten, deterministic Test Plan scaffold, optional GROQ expand (`openai/gpt-oss-120b`), Settings UI, local file output to `examples/`.
**Out:** writing back to Jira, multi-issue aggregation, attachment downloads.

## 3. Architecture
A.N.T. 3-layer, enforced by directory layout (see `LLM.md` §4). Golden Rule: SOP first, code second.

## 4. Phases & Checklists

### Phase 0 — Initialization
- [x] `task_plan.md`, `findings.md`, `progress.md`, `LLM.md` created.
- [x] Discovery questions captured.
- [x] Blueprint approved.

### Phase 1 — Blueprint
- [x] Schemas locked in `LLM.md` §2 (`JiraIssue`, `TestPlan`, `ErrorEvent`, `ChatRequest`, `ChatResponse`, `SettingsPayload`).
- [x] Behavioral rules locked in `LLM.md` §3.
- [x] A.N.T. layer rule enforced via directory.

### Phase 2 — Link (Connectivity)
- [ ] `requirements.txt`, `.env.example`, `.gitignore`.
- [ ] `app/config.py` loads `.env`, caches settings.
- [ ] `tools/jira_client.py` — Basic auth, retries on 429/5xx, ADF → MD.
- [ ] `tools/groq_client.py` — JSON-mode expansion.
- [ ] `/api/test-connection/{jira|groq}` returns clean status.

### Phase 3 — Architect (3-Layer Build)
- [ ] `architecture/01_jira_fetch.md`, `02_testplan_render.md`, `03_groq_expand.md` SOPs.
- [ ] `tools/adf_to_md.py` (pure) + `tests/test_adf_to_md.py`.
- [ ] `tools/render_testplan.py` (pure) + `tools/validate.py` + `tests/test_render_testplan.py`.
- [ ] `tools/parser.py` (pure) + `tests/test_parser.py`.
- [ ] `app/orchestrator.py` (Navigation) + `app/main.py` (FastAPI).
- [ ] `app/models.py` Pydantic contracts.

### Phase 4 — Stylize (UI)
- [ ] `static/index.html`, `static/settings.html`.
- [ ] `static/app.js`, `static/settings.js`, `static/styles.css`.
- [ ] Error banner surfaces `ErrorEvent.message`; secrets never echoed.
- [ ] Demo-mode when `.env` empty.

### Phase 5 — Trigger (Run & Verify)
- [ ] `pytest` passes (parser, adf_to_md, render_testplan).
- [ ] `uvicorn app.main:app` boots without error.
- [ ] Settings save → `.env` written atomically.
- [ ] E2E smoke (deterministic) on a real Jira key (user-provided).
- [ ] E2E smoke (GROQ toggle) → scenarios appended, deduped.

## 5. Goals & Success Criteria
- **Deterministic:** same Jira input + injected clock → byte-identical Test Plan.
- **Self-healing:** transient errors retry with backoff.
- **Auditable:** every run logs key + timestamp + generator version.
- **Secure:** secrets in env only, never logged.
- **Local-first:** runs on `uvicorn` with no external services required for the UI to boot.

## 6. Risks
- **No keys at run time** → mitigated by demo-mode.
- **ADF unknown node types** → strict allowlist, render as `[unsupported: <type>]`, logged.
- **GROQ non-JSON response** → JSON-mode enforced, graceful fallback.

## 7. Status
**Phase 1 ✅ approved. Phase 2–4 in progress.**