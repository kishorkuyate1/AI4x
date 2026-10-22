"""Pure Test Plan renderer. T-layer.

`render_testplan(jira_issue, groq_scenarios=None, clock=now_utc) → (markdown, plan_dict)`

Deterministic given identical inputs and injected clock. Scenario IDs are
sequential TC-1..TC-N (no randomness).
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Callable, Optional

from app.models import GENERATOR_VERSION, SCHEMA_VERSION

Scenario = dict[str, Any]


def _now_utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _build_scenarios_from_ac(acceptance_criteria: list[str]) -> list[Scenario]:
    scenarios: list[Scenario] = []
    for idx, ac in enumerate(acceptance_criteria, start=1):
        ac_clean = ac.strip() or f"AC #{idx}"
        scenarios.append({
            "id": f"TC-{idx}",
            "title": f"Verify: {ac_clean}",
            "type": "functional",
            "given": "the system is in a known good state",
            "when": f"the user exercises: {ac_clean}",
            "then": "the observed behavior matches the acceptance criterion",
            "linked_ac": idx,
        })
    return scenarios


def _renumber(scenarios: list[Scenario]) -> list[Scenario]:
    return [
        {**s, "id": f"TC-{i + 1}"}
        for i, s in enumerate(scenarios)
    ]


def _dedupe(scenarios: list[Scenario]) -> list[Scenario]:
    seen: set[str] = set()
    out: list[Scenario] = []
    for s in scenarios:
        title = s.get("title", "").strip().lower()
        if not title or title in seen:
            continue
        seen.add(title)
        out.append(s)
    return out


def render_testplan(
    jira_issue: dict[str, Any],
    groq_scenarios: Optional[list[Scenario]] = None,
    clock: Callable[[], str] = _now_utc,
) -> tuple[str, dict[str, Any]]:
    """Build the Test Plan (markdown + JSON dict) from a JiraIssue."""
    key = jira_issue.get("key", "UNKNOWN")
    summary = jira_issue.get("summary", "(no summary)")
    description = jira_issue.get("description_markdown", "")
    priority = jira_issue.get("priority", "Unspecified")
    labels = jira_issue.get("labels", []) or []
    components = jira_issue.get("components", []) or []
    reporter = jira_issue.get("reporter", "Unassigned")
    assignee = jira_issue.get("assignee", "Unassigned")
    acceptance_criteria = jira_issue.get("acceptance_criteria", []) or []
    fetched_at = jira_issue.get("fetched_at")

    base_scenarios = _build_scenarios_from_ac(acceptance_criteria)
    extra = groq_scenarios or []
    merged = _dedupe(base_scenarios + extra)
    scenarios = _renumber(merged)

    plan: dict[str, Any] = {
        "schema_version": SCHEMA_VERSION,
        "source_issue_key": key,
        "generated_at": clock(),
        "generator_version": GENERATOR_VERSION,
        "overview": f"{summary}\n\n{description}".strip(),
        "scope_in": [
            f"All acceptance criteria for {key}",
            f"Labels: {', '.join(labels) if labels else '(none)'}",
            f"Components: {', '.join(components) if components else '(none)'}",
            f"Priority: {priority}",
        ],
        "scope_out": [
            "Issues outside the listed components",
            "Performance / load unless explicitly in scope",
        ],
        "approach": [
            "Derive at least one scenario per acceptance criterion (deterministic).",
            "Optionally expand scenarios using GROQ (`openai/gpt-oss-120b`).",
            "Validate the final plan schema before delivery.",
        ],
        "entry_criteria": [
            f"Jira issue {key} is fetchable and not in 'Done' state",
            "Acceptance criteria are populated",
        ],
        "exit_criteria": [
            "All linked test scenarios executed",
            "All P0/P1 defects resolved or explicitly waived",
            f"Test Plan reviewed and signed off for {key}",
        ],
        "test_scenarios": scenarios,
        "risks": [
            "Ambiguous acceptance criteria can produce shallow scenarios (mitigation: review with PM).",
            "GROQ expansions may introduce duplicates; dedupe step in renderer.",
        ],
        "references": {
            "jira_url": f"https://{jira_issue.get('_domain', 'your-domain.atlassian.net')}/browse/{key}",
            "reporter": reporter,
            "assignee": assignee,
            "fetched_at": fetched_at,
        },
    }

    md = _to_markdown(plan)
    return md, plan


def _to_markdown(plan: dict[str, Any]) -> str:
    lines: list[str] = []
    key = plan["source_issue_key"]
    lines.append(f"# Test Plan — {key}")
    lines.append("")
    lines.append(f"_Generated: {plan['generated_at']} • Generator v{plan['generator_version']}_")
    lines.append("")
    lines.append("## 1. Overview")
    lines.append("")
    lines.append(plan["overview"] or "_(no description provided)_")
    lines.append("")
    lines.append("## 2. Scope")
    lines.append("")
    lines.append("**In scope:**")
    for item in plan["scope_in"]:
        lines.append(f"- {item}")
    lines.append("")
    lines.append("**Out of scope:**")
    for item in plan["scope_out"]:
        lines.append(f"- {item}")
    lines.append("")
    lines.append("## 3. Approach")
    lines.append("")
    for i, step in enumerate(plan["approach"], start=1):
        lines.append(f"{i}. {step}")
    lines.append("")
    lines.append("## 4. Entry Criteria")
    for item in plan["entry_criteria"]:
        lines.append(f"- {item}")
    lines.append("")
    lines.append("## 5. Exit Criteria")
    for item in plan["exit_criteria"]:
        lines.append(f"- {item}")
    lines.append("")
    lines.append("## 6. Test Scenarios")
    lines.append("")
    if not plan["test_scenarios"]:
        lines.append("_No scenarios generated — provide acceptance criteria or enable GROQ expansion._")
    else:
        for s in plan["test_scenarios"]:
            lines.append(f"### {s['id']} — {s['title']}")
            lines.append(f"- **Type:** `{s.get('type', 'functional')}`")
            if s.get("linked_ac"):
                lines.append(f"- **Linked AC:** #{s['linked_ac']}")
            lines.append(f"- **Given:** {s.get('given', '')}")
            lines.append(f"- **When:** {s.get('when', '')}")
            lines.append(f"- **Then:** {s.get('then', '')}")
            lines.append("")
    lines.append("## 7. Risks")
    for r in plan["risks"]:
        lines.append(f"- {r}")
    lines.append("")
    lines.append("## 8. References")
    for k, v in plan["references"].items():
        lines.append(f"- **{k}:** {v}")
    lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":  # pragma: no cover - manual smoke
    sample = {
        "key": "PROJ-1",
        "summary": "Export to PDF",
        "description_markdown": "Allow export.",
        "priority": "Medium",
        "labels": ["export"],
        "components": ["Reports"],
        "reporter": "Jane",
        "assignee": "John",
        "acceptance_criteria": ["PDF is downloadable", "PDF respects locale"],
        "fetched_at": "2026-08-30T12:00:00Z",
        "_domain": "acme.atlassian.net",
    }
    md, plan = render_testplan(sample)
    print(md)