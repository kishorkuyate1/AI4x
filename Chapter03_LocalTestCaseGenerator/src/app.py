"""Jira AI Test Case Generator — Streamlit app.

Screen 1 (this file): ChatGPT-style test-case generator.
Screen 2 (settings.py): Jira / Ollama / Groq configuration.

Run with:  streamlit run app.py
"""

import logging

import streamlit as st

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("jira_testcase_generator")

from config.config_store import load_config
from services.jira_client import JiraClient, JiraError
from services.llm_client import LLMClient, LLMError
from utils.jira_parser import extract_issue_key
from utils.prompt_builder import TEMPLATE_FILES, build_prompt, load_template

TEST_CASE_TYPES = {
    "Functional Test Case": "functional",
    "Field-Level Test Case": "field-level",
    "Flow Diagram Test Case": "flow-diagram",
}

# Keywords in the user request override the dropdown selection
TYPE_KEYWORDS = {
    "functional": "functional",
    "field": "field-level",
    "field-level": "field-level",
    "flow": "flow-diagram",
    "flow diagram": "flow-diagram",
}

PAGE = ["Test Case Generator", "Settings"]


def _detect_type(text, selected_key):
    lowered = (text or "").lower()
    for keyword, key in TYPE_KEYWORDS.items():
        if keyword in lowered:
            return key
    return selected_key


def _run_generation(user_input, test_case_key, selected_label):
    config = load_config()

    if not config.get("JIRA_BASE_URL") or not config.get("JIRA_EMAIL") or not config.get("JIRA_API_TOKEN"):
        st.error(
            "Jira configuration is incomplete. Please open Settings and configure Jira credentials."
        )
        return

    issue_key = extract_issue_key(user_input)
    if not issue_key:
        st.warning("Please provide a valid Jira issue key, for example QA-102.")
        return

    with st.chat_message("assistant"):
        st.write(f"Detected Jira ID: **{issue_key}**")
        st.write(f"Test Case Type: **{selected_label}**")

        status = st.empty()
        status.info("Fetching Jira details...")
        try:
            client = JiraClient(
                config["JIRA_BASE_URL"],
                config["JIRA_EMAIL"],
                config["JIRA_API_TOKEN"],
            )
            issue = client.fetch_issue(issue_key)
        except JiraError as exc:
            status.empty()
            st.error(str(exc))
            return

        status.info("Building prompt and loading template...")
        try:
            template = load_template(test_case_key)
        except (FileNotFoundError, ValueError) as exc:
            status.empty()
            st.error(f"Template error: {exc}")
            return

        prompt = build_prompt(issue, test_case_key, template)

        status.info("Generating test cases using Ollama...")
        try:
            result = LLMClient(config).generate(prompt)
        except LLMError as exc:
            status.empty()
            st.error(str(exc))
            return

        status.empty()
        st.markdown(result)

        st.download_button(
            "Download test cases (.md)",
            data=result,
            file_name=f"{issue_key}_{test_case_key}.md",
            mime="text/markdown",
        )


def render_chat():
    st.title("Jira AI Test Case Generator")
    st.caption("Enter a Jira ticket ID or a natural-language request to generate structured test cases.")

    # Test-case type selection (extensible)
    selected_label = st.selectbox("Select the type of test cases", list(TEST_CASE_TYPES.keys()))

    # Chat history in session state
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    for message in st.session_state.chat_history:
        with st.chat_message(message["role"]):
            st.write(message["content"])

    user_input = st.chat_input('Type a request, e.g. "Create test cases for QA-102"')

    if user_input:
        st.session_state.chat_history.append({"role": "user", "content": user_input})
        with st.chat_message("user"):
            st.write(user_input)

        selected_key = TEST_CASE_TYPES[selected_label]
        test_case_key = _detect_type(user_input, selected_key)
        # Resolve the final label for display
        final_label = next(
            (label for label, key in TEST_CASE_TYPES.items() if key == test_case_key),
            selected_label,
        )

        _run_generation(user_input, test_case_key, final_label)


def main():
    st.sidebar.title("Navigation")
    page = st.sidebar.radio("Screen", PAGE, index=0)

    if page == "Settings":
        from settings import render as render_settings

        render_settings()
    else:
        render_chat()


if __name__ == "__main__":
    main()
