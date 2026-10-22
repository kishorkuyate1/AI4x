"""Pure ADF (Atlassian Document Format) → Markdown walker. T-layer.

Deterministic, no I/O. Handles common ADF node types and renders unknown
nodes as `[unsupported: <type>]` so callers can detect gaps.
"""
from __future__ import annotations

from typing import Any, Iterable

_UNKNOWN_TYPES: list[str] = []


def _flush_unknown() -> list[str]:
    global _UNKNOWN_TYPES
    out, _UNKNOWN_TYPES = _UNKNOWN_TYPES, []
    return out


def _mark_unknown(node_type: str) -> str:
    if node_type not in _UNKNOWN_TYPES:
        _UNKNOWN_TYPES.append(node_type)
    return f"[unsupported: {node_type}]"


def render_inline(content: Iterable[dict] | None) -> str:
    """Render an inline content array (no block-level nodes)."""
    if not content:
        return ""
    parts: list[str] = []
    for node in content:
        parts.append(_render_inline_node(node))
    return "".join(parts)


def _render_inline_node(node: dict) -> str:
    ntype = node.get("type", "")
    text = node.get("text", "")
    marks = node.get("marks", []) or []

    if ntype == "text":
        out = text
        for mark in marks:
            mtype = mark.get("type")
            if mtype == "strong":
                out = f"**{out}**"
            elif mtype == "em":
                out = f"*{out}*"
            elif mtype == "code":
                out = f"`{out}`"
            elif mtype == "link":
                href = mark.get("attrs", {}).get("href", "")
                out = f"[{out}]({href})"
        return out

    if ntype == "hardBreak":
        return "  \n"

    if ntype == "mention":
        attrs = node.get("attrs", {})
        return f"@{attrs.get('text', 'user')}"

    if ntype == "emoji":
        attrs = node.get("attrs", {})
        return attrs.get("shortName", "")

    if ntype == "inlineCard":
        attrs = node.get("attrs", {})
        url = attrs.get("url", "")
        return f"[{url}]({url})"

    return _mark_unknown(ntype)


def render_block(node: dict) -> str:
    """Render a single ADF block node to Markdown text."""
    ntype = node.get("type", "")
    content = node.get("content") or []

    if ntype == "paragraph":
        return render_inline(content)

    if ntype == "heading":
        level = node.get("attrs", {}).get("level", 1)
        level = max(1, min(6, int(level)))
        return f"{'#' * level} {render_inline(content)}"

    if ntype == "bulletList":
        lines = []
        for item in content:
            inner = render_block_list(item.get("content") or [])
            for ln in inner.splitlines():
                if ln:
                    lines.append(f"- {ln}")
                else:
                    lines.append("-")
        return "\n".join(lines)

    if ntype == "orderedList":
        lines = []
        for i, item in enumerate(content):
            inner = render_block_list(item.get("content") or [])
            for ln in inner.splitlines():
                if ln:
                    lines.append(f"{i + 1}. {ln}")
                else:
                    lines.append(f"{i + 1}.")
        return "\n".join(lines)

    if ntype == "codeBlock":
        lang = node.get("attrs", {}).get("language", "")
        body = render_inline(content)
        return f"```{lang}\n{body}\n```"

    if ntype == "blockquote":
        inner = render_block_list(content)
        return "\n".join(f"> {line}" for line in inner.splitlines() if line)

    if ntype == "rule":
        return "---"

    if ntype == "table":
        return render_block_list(content)

    if ntype == "listItem":
        return render_block_list(content)

    return _mark_unknown(ntype)


def render_block_list(content: list[dict] | None) -> str:
    if not content:
        return ""
    blocks: list[str] = []
    for node in content:
        rendered = render_block(node).strip()
        if rendered:
            blocks.append(rendered)
    return "\n\n".join(blocks)


def adf_to_markdown(adf: dict | None) -> str:
    """Convert an ADF document to Markdown. Returns empty string for None."""
    flush = _flush_unknown
    if not adf or not isinstance(adf, dict):
        return ""
    content = adf.get("content") or []
    out = render_block_list(content)
    # If any unknown node types were encountered, expose them via attribute
    unknowns = flush()
    if unknowns:
        return out + "\n\n<!-- adf_unknown_types: " + ",".join(unknowns) + " -->"
    return out


def extract_text(adf: dict | None) -> str:
    """Flatten all text nodes to a plain string (used for AC extraction)."""
    if not adf or not isinstance(adf, dict):
        return ""

    def walk(n: dict) -> str:
        parts: list[str] = []
        if n.get("type") == "text" and "text" in n:
            parts.append(n["text"])
        for c in n.get("content") or []:
            parts.append(walk(c))
        return "".join(parts)

    return walk(adf).strip()


if __name__ == "__main__":  # pragma: no cover - manual smoke
    sample = {
        "type": "doc",
        "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": "Hello world"}]},
            {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "AC"}]},
            {"type": "bulletList", "content": [
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "First"}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Second"}]}]},
            ]},
        ],
    }
    print(adf_to_markdown(sample))