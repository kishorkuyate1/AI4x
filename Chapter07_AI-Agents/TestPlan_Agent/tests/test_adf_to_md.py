from tools.adf_to_md import adf_to_markdown, extract_text


def test_empty():
    assert adf_to_markdown(None) == ""
    assert adf_to_markdown({}) == ""


def test_paragraph():
    adf = {"type": "doc", "content": [
        {"type": "paragraph", "content": [{"type": "text", "text": "hello"}]}
    ]}
    assert adf_to_markdown(adf) == "hello"


def test_heading_levels():
    adf = {"type": "doc", "content": [
        {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "AC"}]}
    ]}
    assert adf_to_markdown(adf) == "## AC"


def test_bullet_list():
    adf = {"type": "doc", "content": [
        {"type": "bulletList", "content": [
            {"type": "listItem", "content": [
                {"type": "paragraph", "content": [{"type": "text", "text": "one"}]}
            ]},
            {"type": "listItem", "content": [
                {"type": "paragraph", "content": [{"type": "text", "text": "two"}]}
            ]},
        ]}
    ]}
    out = adf_to_markdown(adf)
    assert "- one" in out
    assert "- two" in out


def test_ordered_list():
    adf = {"type": "doc", "content": [
        {"type": "orderedList", "content": [
            {"type": "listItem", "content": [
                {"type": "paragraph", "content": [{"type": "text", "text": "a"}]}
            ]},
            {"type": "listItem", "content": [
                {"type": "paragraph", "content": [{"type": "text", "text": "b"}]}
            ]},
        ]}
    ]}
    out = adf_to_markdown(adf)
    assert "1. a" in out
    assert "2. b" in out


def test_marks():
    adf = {"type": "doc", "content": [
        {"type": "paragraph", "content": [
            {"type": "text", "text": "bold", "marks": [{"type": "strong"}]},
            {"type": "text", "text": " "},
            {"type": "text", "text": "italic", "marks": [{"type": "em"}]},
        ]}
    ]}
    out = adf_to_markdown(adf)
    assert "**bold**" in out
    assert "*italic*" in out


def test_unknown_node_rendered_as_marker():
    adf = {"type": "doc", "content": [
        {"type": "customWidget", "attrs": {"foo": "bar"}}
    ]}
    out = adf_to_markdown(adf)
    assert "[unsupported: customWidget]" in out
    assert "adf_unknown_types: customWidget" in out


def test_extract_text_flattens():
    adf = {"type": "doc", "content": [
        {"type": "paragraph", "content": [{"type": "text", "text": "hello "}]},
        {"type": "bulletList", "content": [
            {"type": "listItem", "content": [
                {"type": "paragraph", "content": [{"type": "text", "text": "world"}]}
            ]},
        ]},
    ]}
    assert extract_text(adf) == "hello world"