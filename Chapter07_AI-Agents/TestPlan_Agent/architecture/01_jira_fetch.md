# SOP 01 — Jira Issue Fetch

## Goal
Fetch a Jira Cloud issue by key and normalize it into the `JiraIssue` schema (see `LLM.md` §2.1).

## Endpoint
- **URL:** `GET https://{JIRA_DOMAIN}/rest/api/3/issue/{ISSUE_KEY}`
- **Headers:** `Authorization: Basic base64(email:api_token)`, `Accept: application/json`
- **Query params:** `fields=summary,description,priority,labels,components,reporter,assignee,status,issuetype`

## Normalization rules
1. `summary` → `summary` (string).
2. `description` (ADF) → `description_markdown` via `tools.adf_to_md.adf_to_markdown`.
3. `priority.name` → `priority` (default "Unspecified").
4. `labels[]` → `labels` (string[]).
5. `components[].name` → `components` (string[]).
6. `reporter.displayName`, `assignee.displayName` → `reporter`, `assignee`.
7. `acceptance_criteria` extracted heuristically by `tools.jira_client._extract_acceptance_criteria`.

## Retry policy
- **Retries:** 3 max.
- **Triggers:** `429`, `5xx`, network timeouts.
- **Backoff:** `max(Retry-After, 2^attempt)`.
- **No retry on:** `401`, `403`, `404` — these are terminal `JiraError`s.

## Error taxonomy
| HTTP | Code | Action |
|------|------|--------|
| 200 | — | normalize → return |
| 401 | `JIRA_UNAUTHORIZED` | surface to UI |
| 403 | `JIRA_FORBIDDEN` | surface to UI |
| 404 | `JIRA_NOT_FOUND` | surface to UI |
| 429 | `JIRA_RATE_LIMITED` | retry with `Retry-After` |
| 5xx | `JIRA_SERVER_ERROR` | retry with exp backoff |
| network | `JIRA_NETWORK_ERROR` | retry |

## Connection test (cheap)
- Hit `GET /rest/api/3/search?maxResults=0&fields=[]&jql=project=PROJ%20OR%20issuekey=NONE` (always returns quickly with auth).
- Status 200 → `ok=true`. Else → `ok=false` with `http_status` and `error_code`.

## Acceptance criteria for changes here
- [ ] `tests/test_render_testplan.py` still passes.
- [ ] ADF unknown nodes still emit `[unsupported: <type>]` and a comment in Markdown.
- [ ] Secrets are never logged.