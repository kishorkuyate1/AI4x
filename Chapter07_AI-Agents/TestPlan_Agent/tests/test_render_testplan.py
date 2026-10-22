import pytest

from tools.render_testplan import render_testplan
from tools.validate import validate_testplan


SAMPLE = {
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


def fixed_clock():
    return "2026-08-30T12:00:00Z"


def test_render_basic_determinism():
    md1, plan1 = render_testplan(SAMPLE, clock=fixed_clock)
    md2, plan2 = render_testplan(SAMPLE, clock=fixed_clock)
    assert md1 == md2
    assert plan1 == plan2


def test_render_includes_sections():
    md, _ = render_testplan(SAMPLE, clock=fixed_clock)
    for heading in [
        "# Test Plan — PROJ-1",
        "## 1. Overview",
        "## 2. Scope",
        "## 3. Approach",
        "## 4. Entry Criteria",
        "## 5. Exit Criteria",
        "## 6. Test Scenarios",
        "## 7. Risks",
        "## 8. References",
    ]:
        assert heading in md, f"missing section: {heading}"


def test_render_produces_sequential_tc_ids():
    _, plan = render_testplan(SAMPLE, clock=fixed_clock)
    assert [s["id"] for s in plan["test_scenarios"]] == ["TC-1", "TC-2"]


def test_render_validates_against_schema():
    _, plan = render_testplan(SAMPLE, clock=fixed_clock)
    validate_testplan(plan)  # should not raise


def test_render_with_groq_expansion_and_dedupe():
    extra = [
        {"title": "Verify: PDF is downloadable", "type": "functional",
         "given": "x", "when": "y", "then": "z", "linked_ac": 0},  # duplicate
        {"title": "PDF handles 10k rows", "type": "edge",
         "given": "10k rows", "when": "export", "then": "no crash", "linked_ac": 0},
    ]
    _, plan = render_testplan(SAMPLE, groq_scenarios=extra, clock=fixed_clock)
    titles = [s["title"].lower() for s in plan["test_scenarios"]]
    # dupes removed, new scenario appended
    assert "pdf handles 10k rows" in titles
    assert len(titles) == len(set(titles))  # no duplicates
    # ids remain sequential
    assert [s["id"] for s in plan["test_scenarios"]] == [f"TC-{i+1}" for i in range(len(plan["test_scenarios"]))]


def test_render_handles_no_ac_with_groq_only():
    issue = {**SAMPLE, "acceptance_criteria": []}
    extra = [{"title": "Smoke: page loads", "type": "smoke",
              "given": "user", "when": "open page", "then": "200 OK", "linked_ac": 0}]
    _, plan = render_testplan(issue, groq_scenarios=extra, clock=fixed_clock)
    assert len(plan["test_scenarios"]) == 1
    validate_testplan(plan)


def test_validate_rejects_bad_ids():
    bad = {
        "schema_version": "1.0.0",
        "source_issue_key": "X",
        "generated_at": "2026-01-01T00:00:00Z",
        "generator_version": "1.0.0",
        "overview": "",
        "scope_in": [], "scope_out": [], "approach": [],
        "entry_criteria": [], "exit_criteria": [],
        "test_scenarios": [{"id": "TC-7", "title": "t", "type": "x", "given": "", "when": "", "then": ""}],
        "risks": [], "references": {},
    }
    with pytest.raises(ValueError):
        validate_testplan(bad)