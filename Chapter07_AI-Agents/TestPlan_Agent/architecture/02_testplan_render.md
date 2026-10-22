# SOP 02 — Test Plan Render

## Goal
Render a `JiraIssue` into a `TestPlan` (Markdown + JSON dict), deterministic given identical inputs and an injected clock.

## Function signature
```python
render_testplan(
    jira_issue: dict,
    groq_scenarios: list[dict] | None = None,
    clock: Callable[[], str] = _now_utc,
) -> tuple[str, dict]
```

## Section template (Markdown, in this order)
1. `# Test Plan — {KEY}`
2. `_Generated: {ts} • Generator v{GENERATOR_VERSION}_`
3. `## 1. Overview` — `summary` + `description_markdown`.
4. `## 2. Scope` — `In:` (AC list, labels, components, priority). `Out:` (out-of-scope defaults).
5. `## 3. Approach` — deterministic scaffold + optional GROQ expansion + validate.
6. `## 4. Entry Criteria` — minimum preconditions.
7. `## 5. Exit Criteria` — sign-off criteria.
8. `## 6. Test Scenarios` — one `### TC-<n> — Title` block per scenario with `Given/When/Then`.
9. `## 7. Risks` — known risks (AC ambiguity, GROQ dupes).
10. `## 8. References` — Jira URL, reporter, assignee, fetched_at.

## Scenario generation
- Start with one scenario per AC: `{id: "TC-1..TC-N", title: "Verify: <AC>", type: "functional", linked_ac: 1..N}`.
- Append `groq_scenarios` (if any), deduplicate by lowercased title.
- **Renumber** deterministically to `TC-1..TC-<total>`.

## Hard rules
- **No I/O in `render_testplan`.** Clock is injected.
- **No randomness.** Scenario IDs are sequential.
- **Markdown is byte-identical** given identical inputs + clock.

## Validation
- `tools.validate.validate_testplan(plan)` is mandatory.
- Required fields (see `LLM.md` §2.2) must all be present.
- Scenario IDs must be sequential `TC-1..TC-N`.

## Acceptance criteria for changes here
- [ ] `tests/test_render_testplan.py` passes.
- [ ] Same inputs + clock → identical Markdown bytes.
- [ ] GROQ scenarios dedupe + renumber correctly.