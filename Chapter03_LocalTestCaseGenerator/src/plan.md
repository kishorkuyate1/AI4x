# Plan — Jira AI Test Case Generator (PromptV2.md)

Build the Streamlit app specified in `src/Pages/PromptV2.md` inside
`Chapter03_LocalTestCaseGenerator/src/` (alongside the existing `Pages/` folder).

## 1. Key Decisions

| Decision | Choice | Why |
|---|---|---|
| App location | `Chapter03_LocalTestCaseGenerator/src/` | User-selected; sits next to the existing `Pages/` docs |
| Credential storage | Single `.env` file in `src/` | User-selected; simplest; loaded via python-dotenv; gitignored |
| Two screens | Sidebar selector in `app.py` + `settings.py` module (no `pages/` folder) | `src/Pages/` already exists; Windows is case-insensitive, so Streamlit's `pages/` convention would collide |
| LLM HTTP | Plain `requests` for both Ollama and Groq | Groq exposes an OpenAI-compatible REST endpoint; avoids extra SDK deps |
| Templates | Markdown files in `src/templates/` | Prompt requires templates as source of truth, not hardcoded formats |
| Acceptance criteria | Jira field-name scan (cached) | Custom fields like `customfield_10001` need name mapping; `/rest/api/2/field` fetched once per session |

Existing `Templates/` (chapter root), `src/Pages/*.md`, and `Screenshot.png` are left untouched.

## 2. Project Structure

```
Chapter03_LocalTestCaseGenerator/src/
├── app.py                      # Entry point + Chat screen (Screen 1)
├── settings.py                 # Settings screen (Screen 2)
├── services/
│   ├── __init__.py
│   ├── jira_client.py          # Jira REST client (auth, fetch, parse)
│   └── llm_client.py           # Ollama + Groq, provider select, fallback
├── config/
│   ├── __init__.py
│   └── config_store.py         # Read/write .env, no secrets in logs/UI
├── templates/
│   ├── functional_test_case.md
│   ├── field_level_test_case.md
│   └── flow_diagram_test_case.md
├── utils/
│   ├── __init__.py
│   ├── jira_parser.py          # Extract Jira key from natural language
│   └── prompt_builder.py       # Compose final prompt + load templates
├── .env                        # REAL credentials (gitignored, never committed)
├── .env.example                # Placeholder template (committed)
├── .gitignore
├── requirements.txt
└── README.md
```

## 3. Module Responsibilities

### config/config_store.py
- Load `.env` into `os.environ` via python-dotenv; fall back to defaults.
- `load_config()` → dict; `save_config(dict)` → writes `.env` (quotes/escapes values).
- Keys: `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `OLLAMA_ENDPOINT` (default `http://localhost:11434`), `OLLAMA_MODEL` (default `qwen2.5:3b`), `GROQ_API_KEY`, `GROQ_MODEL` (default `llama-3.3-70b-versatile`), `DEFAULT_LLM_PROVIDER` (default `ollama`).
- Never prints token values.

### services/jira_client.py
- `JiraClient(base_url, email, api_token)` — Basic Auth via `requests`.
- `fetch_issue(key)` → dict: key, summary, description, acceptance_criteria, issue_type, priority, status, labels, components. Missing fields → `"N/A"`, never invented.
- Acceptance criteria: cache field-name map from `/rest/api/2/field`; pick first field matching `/acceptance/i`, else `N/A`.
- Clear exceptions: config missing / 404 not found / 401-403 auth / network. No secrets in messages.

### utils/jira_parser.py
- `extract_issue_key(text)` → regex `\b[A-Z][A-Z0-9_]{1,9}-\d{1,9}\b` (matches `QA-102`, `PROJ-123`, `ABC-456`); returns first match or `None`.
- Caller shows: `Please provide a valid Jira issue key, for example QA-102.`

### templates/ (three .md files)
- `functional_test_case.md` — table: `TC ID | Test Scenario | Test Steps | Expected Result | Test Type`; positive/negative/boundary/alternate flows.
- `field_level_test_case.md` — table: `TC ID | Field | Test Scenario | Test Data | Expected Result | Test Type`; mandatory/type/length/valid/invalid/boundary/special/null/blank/format/default/error-message checks.
- `flow_diagram_test_case.md` — main/alternate/negative flows, decision points, dependencies, pre/postconditions, Mermaid diagram block.
- Each embeds the anti-hallucination rules (only ticket info, `N/A`, no invented rules/fields, `Insufficient requirement information.` when lacking detail).

### utils/prompt_builder.py
- `load_template(test_case_type)` — reads matching file from `templates/`.
- `build_prompt(issue, test_case_type, template)` — labeled sections: `SYSTEM INSTRUCTIONS` (senior QA engineer persona + anti-hallucination rules), `TEST CASE TYPE`, `JIRA DETAILS`, `TEMPLATE`.

### services/llm_client.py
- `LLMClient(config)` with `generate(prompt) -> str`.
- Ollama: `POST {endpoint}/api/generate` `{"model", "prompt", "stream": false}`. Never pulls the model.
- Groq: `POST https://api.groq.com/openai/v1/chat/completions` with `Authorization: Bearer` + `messages=[system, user]`.
- Fallback: user-selected Groq → Groq only. User-selected Ollama → try Ollama; on connection/runtime failure → Groq; both down → clear error (`Unable to generate test cases because both Ollama and Groq are unavailable. Please verify your LLM configuration.`). Availability pre-check via `GET {endpoint}/api/tags`.

### app.py (Screen 1 — Chat)
- Sidebar navigation: `Test Case Generator` / `Settings` (imports `render()` from `settings.py`).
- Test-case-type dropdown (Functional / Field-Level / Flow Diagram); type keyword in the request text overrides, else dropdown, else `functional`.
- Chat input + Send; chat history in `st.session_state` rendered with `st.chat_message`.
- Pipeline on Send: parse key → validate → check config → `JiraClient.fetch_issue` → `load_template` → `build_prompt` → `LLMClient.generate` (status: `Detected Jira ID: QA-102`, `Fetching Jira details...`, `Generating test cases using Ollama...`) → append response; show `st.download_button` for the last table (copy to Jira/Excel).
- Error messages exactly as in PromptV2.md §17.

### settings.py (Screen 2 — Settings)
- Form: Jira URL, Jira Email, Jira API Token (masked `type="password"`), provider select (Ollama/Groq), Ollama Endpoint, Ollama Model, Groq API Key (masked), Groq Model.
- Save → `config_store.save_config` → `st.success`. Existing secrets shown masked (`••••` + last 4 chars); never printed in UI/logs.

### Logging
- Standard `logging`; app.py `basicConfig`. Log: startup, selected provider, issue key, Jira success/failure, template selected, LLM success/failure, fallback. Never log tokens/keys.

## 4. .env Schema (values filled from user-provided credentials)

```
JIRA_BASE_URL=
JIRA_EMAIL=
JIRA_API_TOKEN=
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
DEFAULT_LLM_PROVIDER=ollama
```

`.env` → gitignored. `.env.example` → committed with placeholders.

## 5. Build Order

1. `src/.gitignore` (`.env`, `config.json`, `__pycache__/`, `.streamlit/`) + `requirements.txt` (`streamlit`, `requests`, `python-dotenv`)
2. `config/config_store.py`
3. `utils/jira_parser.py`
4. `services/jira_client.py`
5. `templates/*.md` (3 files)
6. `utils/prompt_builder.py`
7. `services/llm_client.py`
8. `settings.py`
9. `app.py` + integration + error handling
10. `.env` (from user credentials) + `.env.example` + `README.md`
11. Smoke tests, git commit (exclude `.env`), push to origin/main

## 6. Verification

- `pip install -r requirements.txt`; `streamlit run app.py` from `src/`.
- Settings: save config, reload, values persist; secrets masked.
- Chat with real ticket (e.g., `QA-102`): fetch → generate via Ollama; output matches selected template.
- Invalid key / no key: correct error messages shown.
- Ollama stopped: fallback message + Groq generation; both stopped: combined error.
- Grep check: no `JIRA_API_TOKEN`/`GROQ_API_KEY` literals in `*.py`; `.env` absent from `git status` after commit.
