# TestPlan Agent

A local web app that turns a Jira issue into a structured **Test Plan** (Markdown + JSON), optionally expanded by **GROQ** (`openai/gpt-oss-120b`).

> Built per the **B.L.A.S.T.** protocol (Blueprint · Link · Architect · Stylize · Trigger) with a strict **A.N.T. 3-layer architecture** (Architecture · Navigation · Tools).
> The Project Constitution is `LLM.md` — read it first.

## Features
- 🧭 **Prompt → Jira key** parsing (`"Fetch PROJ-123 and create a test plan"`).
- 🔌 **Jira Cloud REST v3** fetch with ADF → Markdown, retries, error taxonomy.
- 🛡️ **Deterministic renderer** — same input → identical bytes.
- 🪄 **Optional GROQ expansion** — adds 3–8 negative/edge scenarios.
- ⚙️ **Settings UI** — Jira + GROQ + default key, with connection tests.
- 📁 **Artifacts** — `examples/<KEY>_<ts>.md` and `.json`.

## Quick start

```bash
cd Chapter07_AI-Agents/TestPlan_Agent
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt

# Copy and fill in credentials:
copy .env.example .env

# Run tests (pure modules):
pytest -q

# Boot the app:
python -m uvicorn app.main:app --reload --port 8000
```

Then open http://localhost:8000 and click **Settings** to paste your Jira domain, email, API token, and (optionally) your GROQ API key. Save → click **Test Jira Connection** to confirm.

Back on the main page, enter a prompt like:

```
Fetch PROJ-123 and create a test plan.
```

Toggle **Expand with GROQ** if you want richer scenarios.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET    | `/`                  | Main page |
| GET    | `/settings`          | Settings page |
| GET    | `/api/health`        | Liveness + config status |
| GET    | `/api/settings`      | Redacted current settings |
| POST   | `/api/settings`      | Save settings to `.env` |
| POST   | `/api/test-connection/jira` | Jira ping |
| POST   | `/api/test-connection/groq` | GROQ ping |
| POST   | `/api/chat`          | Generate a Test Plan from a prompt |
| POST   | `/api/fetch-issue`   | Fetch + normalize a single issue |

## Architecture

```
TestPlan_Agent/
├── BLAST.md, LLM.md, task_plan.md, findings.md, progress.md  ← memory
├── architecture/      ← A-layer SOPs (markdown only)
├── app/               ← N-layer: FastAPI routes + orchestrator
├── tools/             ← T-layer (pure) + N-layer (clients)
├── static/            ← Phase 4 UI (HTML/CSS/JS, no build)
├── tests/             ← pytest for pure modules
└── examples/          ← generated artifacts + sample fixture
```

See `LLM.md` §4 for the A.N.T. import-direction rule.

## Run tests

```bash
pytest -v
```

Tests cover:
- `tests/test_parser.py` — Jira key regex.
- `tests/test_adf_to_md.py` — ADF walker (paragraphs, headings, lists, marks, unknown nodes).
- `tests/test_render_testplan.py` — determinism, GROQ dedupe, validation, sequential TC-IDs.

## Security notes

- All secrets read from `.env` only. They are never logged or echoed in API responses.
- `.env` is gitignored.
- The Settings UI clears token fields after a successful save to avoid accidental overwrites.