from tools.parser import extract_jira_key, extract_all_jira_keys


def test_extract_simple():
    assert extract_jira_key("Fetch PROJ-123 and create a test plan") == "PROJ-123"


def test_extract_lowercase_ignored():
    assert extract_jira_key("please look at proj-42 today") is None


def test_extract_mixed_case_in_word_ignored():
    # A lowercase lead letter should not match (regex requires uppercase start).
    assert extract_jira_key("see bug proj-9") is None


def test_extract_with_underscore_and_digits():
    assert extract_jira_key("handle CYBER_RPT-2026 fix") == "CYBER_RPT-2026"


def test_no_key_returns_none():
    assert extract_jira_key("no key in this sentence") is None


def test_empty_returns_none():
    assert extract_jira_key("") is None
    assert extract_jira_key(None) is None  # type: ignore[arg-type]


def test_extract_all_returns_multiple():
    assert extract_all_jira_keys("compare PROJ-1 vs PROJ-2") == ["PROJ-1", "PROJ-2"]