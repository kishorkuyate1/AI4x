# progress.md — Execution Log

> Per BLAST Protocol 0. Every action, error, and result is logged.

## Session: Phases 0 → 1 → 2 → 3 → 4 → 5

### T+00:00 — Re-read BLAST.md, captured the full protocol
- Confirmed 5-phase structure (0 Init → 1 Blueprint → 2 Link → 3 Architect → 4 Stylize). Phase 5 Trigger = Run/Verify.

### T+00:02 — Discovery answers
- Stack: FastAPI + vanilla HTML/JS
- Secrets: `.env` (atomic write)
- LLM: optional GROQ expansion (`openai/gpt-oss-120b`)
- Input: free-text prompt with Jira key regex
- Output: `examples/<KEY>_<ts>.md|.json`

### T+00:05 — Plan written + approved
- File: `~/.commandcode/plans/testplan-agent-phases-1-4.md`

### T+00:08 — Scaffolding complete
- `requirements.txt`, `.env.example`, `.gitignore`
- `LLM.md` v1.0.0: schemas, A.N.T. map, Golden Rule
- `task_plan.md`: Phase 0–1 marked done
- `findings.md`: decisions table, GROQ endpoint

### T+00:12 — Implementation
- `app/`: `__init__.py`, `config.py`, `models.py`, `main.py`, `orchestrator.py`
- `tools/`: `__init__.py`, `parser.py` (moved from app/), `adf_to_md.py`, `render_testplan.py`, `validate.py`, `jira_client.py`, `groq_client.py`
- `static/`: `index.html`, `settings.html`, `styles.css`, `app.js`, `settings.js`
- `architecture/`: `01_jira_fetch.md`, `02_testplan_render.md`, `03_groq_expand.md`
- `tests/`: `test_parser.py`, `test_adf_to_md.py`, `test_render_testplan.py` (22 tests total)
- `examples/sample_testplan.json`, `README.md`

### T+00:25 — Install + smoke
- `pip install -r requirements.txt`
- First failure: `pydantic-core==2.23.4` needed Rust/MSVC toolchain on Python 3.14.
- **Fix:** bumped to `pydantic-core 2.46.5` (prebuilt cp314 wheel). Pinned loose version constraints in `requirements.txt`.
- Re-ran `pytest`: 2 tests failed (list recursion bug in `adf_to_md`).
- **Fix:** rewrote bullet/ordered list rendering to walk listItem blocks correctly.
- Pydantic warning: `json` shadowed `BaseModel` attribute. **Fix:** renamed field to `plan` with alias `json`.
- Re-ran `pytest`: **22/22 pass**.

### T+00:30 — Boot uvicorn
- First start failed: `ModuleNotFoundError: No module named 'app.parser'` because I moved `parser.py` to `tools/` but `orchestrator.py` still imported from `app/`. **Fix:** updated orchestrator imports.
- Second start succeeded; `/api/health` returned `{"ok": true}`.
- `/api/settings` returned stale nulls because of `lru_cache` + `load_dotenv` at module-init only. **Fix:** removed cache; `load_dotenv(override=True)` re-reads `.env` on every `get_settings()` call.

### T+00:35 — End-to-end smoke
- `GET  /api/health` → 200, `jira_configured=true`
- `GET  /api/settings` → 200, secrets redacted
- `POST /api/settings` (saved demo creds) → 200, `.env` written atomically
- `POST /api/chat` (`Fetch PROJ-1`) → 404 ErrorEvent (expected — `acme.atlassian.net` is not real)
- `POST /api/test-connection/jira` (no creds) → `JIRA_NOT_CONFIGURED`
- `POST /api/test-connection/groq` (no creds) → `GROQ_NOT_CONFIGURED`
- `GET  /`, `GET /settings`, `GET /static/styles.css`, `GET /static/app.js` → all 200

### T+00:40 — Server still running
- PID 9744, task `s27ar0uo`, listening on `http://127.0.0.1:8000`
- Visit `/` for the main page, `/settings` to add real Jira + GROQ credentials.

---

## Errors / Blockers
| Time | Type | Detail | Resolution |
|------|------|--------|------------|
| T+00:25 | Build | `pydantic-core 2.23.4` couldn't compile on Py 3.14 (no MSVC) | Upgraded to `pydantic-core 2.46.5` (cp314 wheel) |
| T+00:26 | Test | List recursion in ADF walker rendered inner paragraphs as `[unsupported: paragraph]` | Rewrote `bulletList`/`orderedList` to use `render_block_list` for each item |
| T+00:27 | Test | Pydantic warning: `json` shadows BaseModel attr | Renamed to `plan` with `Field(alias="json")` |
| T+00:28 | Import | Orchestrator imported `from app.parser` after I moved it to `tools/` | Updated imports to `from tools.parser` |
| T+00:30 | Config | `lru_cache` + module-load `load_dotenv` made `/api/settings` writes invisible to subsequent reads | Removed cache; reload `.env` on each `get_settings()` call |

---

## Tests / Results
- `pytest -q` → **22 passed in 0.12s**
- Uvicorn boot → **OK**, listening on 127.0.0.1:8000
- HTTP smoke (4 endpoints) → **all expected codes returned**
- E2E orchestrator (with bad Jira creds) → **404 ErrorEvent returned cleanly**

## Next steps for the user
1. Open `http://127.0.0.1:8000/settings` in a browser.
2. Paste real Jira domain, email, API token, optional GROQ key, and your default Jira key (the "Gronth / cyber side" key).
3. Click **Test Jira Connection** and **Test GROQ Connection** — confirm green pills.
4. Return to the main page, click **Generate Test Plan**, optionally enable **Expand with GROQ**.
5. The Markdown + JSON artifacts will appear in the UI and be written to `examples/`.

### T+00:50 — User updated `.env` with real Jira + GROQ + Ollama keys
- **Issues found in `.env`:**
  - `JIRA_DOMAIN` had a full browse URL instead of host → fixed to `kishorkuyate.atlassian.net`.
  - `DEFAULT_JIRA_KEY` empty → set to `KAN-1` (the Jira key the user pasted in the URL).
  - **SECURITY:** real `JIRA_API_TOKEN` and `GROQ_API_KEY` were exposed in chat — user must rotate both. Not logged anywhere except `.env` on disk.
- **Test connections on real Jira:**
  - First attempt: `JIRA_NOT_FOUND` because the test-connection probe URL `/search?maxResults=0` is deprecated on modern Atlassian Cloud (HTTP 410).
  - **Fix:** switched probe to canonical `GET /rest/api/3/myself`. Re-test: `{"ok": true, "http_status": 200}`.
- **GROQ connection:** `{"ok": true, "http_status": 200}`.

### T+00:55 — End-to-end against real Jira
- Server restarted (task `s34r4pw2`, PID 16992, port 8000).
- `POST /api/chat` for `KAN-1` → **success**, fetched real issue (BankOut Payment Request PRD), 31 AC-derived scenarios generated.
- `POST /api/chat` with `use_groq=true` → **success**, GROQ added 1 extra scenario (32 total after dedupe + renumber).
- Artifacts written: `examples/KAN-1_<ts>.md` (1220 lines) and `.json`.
- **Observed gap:** ADF `tableRow` / `table` nodes render as `[unsupported: tableRow]` — content is missing from the Markdown. Tracked as a known limitation; AC extraction still works because it uses `extract_text` (walks text nodes regardless of block type).