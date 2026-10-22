# Jira AI Test Case Generator

A lightweight Streamlit app that converts Jira tickets into structured test
cases using a local LLM (Ollama) with Groq as an optional fallback.

## What it does

- Two screens: **Chat generator** and **Settings**
- Enter a request like `Create test cases for QA-102`
- Detects the Jira issue key, fetches the ticket from Jira
- Loads the selected test-case template (functional / field-level / flow diagram)
- Generates structured test cases with Ollama (`qwen2.5:3b`), falling back to
  Groq if Ollama is unavailable
- Applies anti-hallucination rules: only ticket data is used, missing info is
  marked `N/A`, no invented requirements

## Structure

```
src/
├── app.py                  # Entry point + chat screen
├── settings.py             # Settings screen
├── services/
│   ├── jira_client.py      # Jira REST API client
│   └── llm_client.py       # Ollama + Groq with fallback
├── config/
│   └── config_store.py     # Reads/writes .env
├── utils/
│   ├── jira_parser.py      # Extracts Jira keys from text
│   └── prompt_builder.py   # Builds the LLM prompt
├── templates/              # Test-case templates (source of truth)
├── .env                    # Credentials (gitignored)
└── requirements.txt
```

## Setup

1. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Create `.env` in `src/` with your credentials (see `.env.example`):

   ```
   JIRA_EMAIL=your@email.com
   JIRA_API_TOKEN=your-jira-token
   JIRA_URL=https://your-company.atlassian.net
   Ollama_URL=http://localhost:11434
   GROQ_TOKEN=your-groq-key
   ```

   > The app reads these exact key names. `OLLAMA_MODEL` defaults to
   > `qwen2.5:3b` and `GROQ_MODEL` to `llama-3.3-70b-versatile` if unset.

3. Start Ollama locally and make sure the model is available
   (the app does not download models).

## Run

```bash
cd src
streamlit run app.py
```

Open the shown local URL (default `http://localhost:8501`).

## Usage

1. In the **Settings** screen, verify/save Jira and LLM settings.
2. In the **Test Case Generator** screen, pick a test-case type and type:

   ```
   Create test cases for QA-102
   ```

3. Click **Send**. The app detects `QA-102`, fetches it from Jira, and
   generates test cases with Ollama (falling back to Groq if needed).

## Notes

- Credentials live only in `src/.env`, which is gitignored.
- Secrets are never logged or printed — masked fields are used in the UI.
- Test-case templates live in `templates/`; add new test-case types by adding a
  template file and a `TEST_CASE_TYPES` entry in `app.py`.
