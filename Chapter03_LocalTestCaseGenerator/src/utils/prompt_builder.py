"""Build the final LLM prompt from Jira details, test-case type, and template."""

from pathlib import Path

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"

TEMPLATE_FILES = {
    "functional": "functional_test_case.md",
    "field-level": "field_level_test_case.md",
    "flow-diagram": "flow_diagram_test_case.md",
}

SYSTEM_INSTRUCTIONS = (
    "You are a senior software test engineer with expertise in QA test case "
    "design, Jira requirements analysis, and anti-hallucination practices. "
    "Generate structured, traceable, non-duplicated test cases using ONLY the "
    "Jira ticket details and the template provided. Do not invent requirements, "
    "business rules, API fields, database behavior, or acceptance criteria. "
    "Use 'N/A' when information is unavailable. If the ticket does not contain "
    "enough information, state 'Insufficient requirement information.' and list "
    "what is missing."
)


def load_template(test_case_type):
    """Return the template text for a test-case type key.

    Raises FileNotFoundError if the template file is missing.
    """
    filename = TEMPLATE_FILES.get(test_case_type)
    if not filename:
        raise ValueError(f"Unknown test case type: {test_case_type}")
    return (TEMPLATES_DIR / filename).read_text(encoding="utf-8")


def _format_issue(issue):
    labels = ", ".join(issue.get("labels") or []) or "N/A"
    components = ", ".join(issue.get("components") or []) or "N/A"
    return (
        f"Issue Key: {issue.get('key', 'N/A')}\n"
        f"Summary: {issue.get('summary', 'N/A')}\n"
        f"Description: {issue.get('description', 'N/A')}\n"
        f"Acceptance Criteria: {issue.get('acceptance_criteria', 'N/A')}\n"
        f"Issue Type: {issue.get('issue_type', 'N/A')}\n"
        f"Priority: {issue.get('priority', 'N/A')}\n"
        f"Status: {issue.get('status', 'N/A')}\n"
        f"Labels: {labels}\n"
        f"Components: {components}"
    )


def build_prompt(issue, test_case_type, template=None):
    """Compose the final prompt from the four required components."""
    if template is None:
        template = load_template(test_case_type)
    return (
        "SYSTEM INSTRUCTIONS\n"
        "-------------------\n"
        f"{SYSTEM_INSTRUCTIONS}\n\n"
        "TEST CASE TYPE\n"
        "--------------\n"
        f"{test_case_type}\n\n"
        "JIRA DETAILS\n"
        "------------\n"
        f"{_format_issue(issue)}\n\n"
        "TEMPLATE\n"
        "--------\n"
        f"{template}"
    )
