# findings.md — Research, Discoveries, Constraints

## 1. Decisions (locked)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Stack | **FastAPI + vanilla HTML/JS** | Reuses Python tooling; no build step; easy to run locally |
| Secrets storage | **`.env`** (written atomically by Settings UI) | Simple, gitignored, easy to inspect |
| LLM role | **Optional toggle** — deterministic-first, GROQ expands on demand | Reliability first; graceful if GROQ unavailable |
| Input parsing | **Jira key regex-extracted from free-text prompt** | Matches user phrasing "Fetch PROJ-123 and create..." |
| Output | **Markdown + JSON to `examples/`, rendered in UI** | Auditable artifacts + instant feedback |
| Model | **`openai/gpt-oss-120b`** on GROQ | Confirmed via [GroqDocs](https://console.groq.com/docs/model/openai/gpt-oss-120b) |

## 2. GROQ API surface
- Endpoint: `POST https://api.groq.com/openai/v1/chat/completions`
- Headers: `Authorization: Bearer $GROQ_API_KEY`, `Content-Type: application/json`
- Body: `{ "model": "openai/gpt-oss-120b", "messages": [...], "response_format": {"type":"json_object"}, "temperature": 0.2 }`
- Compatible with OpenAI client (base URL swap). We use raw `httpx` for transparency.

## 3. Jira REST v3 — issue fetch
- Endpoint: `GET /rest/api/3/issue/{issueIdOrKey}`
- Auth: Basic `email:api_token` (Cloud)
- `description` arrives as ADF → must flatten via `tools/adf_to_md.py`
- Useful query params: `fields`, `expand=renderedFields`

## 4. ADF (Atlassian Document Format)
- Recursive `content` tree; node types we handle: `paragraph`, `heading`, `bulletList`/`orderedList`/`listItem`, `codeBlock`, `hardBreak`, `link`, `inlineCard`, `text`, `em`/`strong` (mapped to `*text*` / `**text**`).
- Unknown nodes → `[unsupported: <type>]` in Markdown + log entry in `progress.md`.

## 5. Constraints
- No code in `tools/` before `LLM.md` marked APPROVED ✅
- Secrets only in env vars; never logged.
- Pure modules: no I/O, no network, clock injected.

## 6. Curl templates

### Fetch one issue (Cloud)
```bash
curl -sS -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Accept: application/json" \
  "https://${JIRA_DOMAIN}/rest/api/3/issue/${ISSUE_KEY}?fields=summary,description,priority,labels,components,reporter,assignee"
```

### GROQ ping (chat completion)
```bash
curl -sS https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-oss-120b","messages":[{"role":"user","content":"ping"}],"max_tokens":5}'
```

## 7. Open Discoveries (to revisit)
- Exact `customfield_*` IDs for AC vary per instance → we parse AC from description bullets prefixed with `AC`, `Given`, or `Acceptance Criteria`. If your instance uses a specific customfield, surface it in Settings and we'll add a field override.
- ADF custom mark types → handled with `[unsupported: <type>]` fallback.

## Sources
- [OpenAI GPT-OSS 120B — GroqDocs](https://console.groq.com/docs/model/openai/gpt-oss-120b)
- [Groq API Reference](https://console.groq.com/docs/api-reference)