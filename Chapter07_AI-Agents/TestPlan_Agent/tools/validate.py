"""Pure validator. T-layer. Raises ValueError on contract violation."""
from __future__ import annotations

from typing import Any

from app.models import SCHEMA_VERSION


REQUIRED_PLAN_FIELDS = (
    "schema_version",
    "source_issue_key",
    "generated_at",
    "generator_version",
    "overview",
    "scope_in",
    "scope_out",
    "approach",
    "entry_criteria",
    "exit_criteria",
    "test_scenarios",
    "risks",
    "references",
)

REQUIRED_SCENARIO_FIELDS = ("id", "title", "type", "given", "when", "then")


def validate_testplan(plan: dict[str, Any]) -> None:
    if not isinstance(plan, dict):
        raise ValueError("plan must be a dict")

    if plan.get("schema_version") != SCHEMA_VERSION:
        raise ValueError(f"schema_version mismatch: expected {SCHEMA_VERSION}, got {plan.get('schema_version')}")

    for field in REQUIRED_PLAN_FIELDS:
        if field not in plan:
            raise ValueError(f"missing required field: {field}")

    if not isinstance(plan["test_scenarios"], list):
        raise ValueError("test_scenarios must be a list")

    for s in plan["test_scenarios"]:
        for field in REQUIRED_SCENARIO_FIELDS:
            if field not in s:
                raise ValueError(f"scenario missing field '{field}': {s.get('id', '<no id>')}")

    ids = [s["id"] for s in plan["test_scenarios"]]
    expected = [f"TC-{i + 1}" for i in range(len(ids))]
    if ids != expected:
        raise ValueError(f"scenario IDs not sequential TC-1..TC-{len(ids)}: {ids}")

    if not plan["source_issue_key"]:
        raise ValueError("source_issue_key is empty")