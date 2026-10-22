# SOP 03 — GROQ Expansion (Optional)

## Goal
When the user toggles "Expand scenarios with GROQ", call GROQ to generate **additional** scenarios beyond the AC-derived ones, and append them to the deterministic plan.

## Endpoint
- **URL:** `POST https://api.groq.com/openai/v1/chat/completions`
- **Auth:** `Authorization: Bearer $GROQ_API_KEY`
- **Model:** `$GROQ_MODEL` (default `openai/gpt-oss-120b`)
- **Body:** see `tools/groq_client.SYSTEM_PROMPT` + `_build_user_prompt`.

## Request contract
- `messages: [system(SYSTEM_PROMPT), user(JSON payload)]`
- `response_format: {"type": "json_object"}` (enforced)
- `temperature: 0.2`, `max_tokens: 1500`

## Response contract (strict JSON)
```json
{
  "scenarios": [
    {"title": str, "type": "functional|integration|negative|edge|smoke",
     "given": str, "when": str, "then": str, "linked_ac": int|null}
  ]
}
```

## Constraints
- 3–8 additional scenarios.
- Deduped within the response.
- Avoid repeating the AC-derived titles (we pass them as `existing_scenarios_to_avoid`).
- Prefer negative + edge cases.
- **JSON only** — no markdown fences.

## Failure policy
| HTTP | Code | Action |
|------|------|--------|
| 200 + valid JSON | — | merge scenarios |
| 401 | `GROQ_UNAUTHORIZED` | fall back to deterministic; UI shows warning |
| 429 | `GROQ_RATE_LIMITED` | fall back; UI shows warning |
| 5xx | `GROQ_SERVER_ERROR` | fall back; UI shows warning |
| 200 + invalid JSON | `GROQ_INVALID_OUTPUT` | fall back; UI shows warning |
| network | `GROQ_NETWORK_ERROR` | fall back; UI shows warning |

## Acceptance criteria for changes here
- [ ] When `GROQ_API_KEY` is empty, deterministic plan still works without warning (no call attempted).
- [ ] When GROQ errors, deterministic plan still produced and `groq_warning` surfaces in response.
- [ ] Secrets never logged.