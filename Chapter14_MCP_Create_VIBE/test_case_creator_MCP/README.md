# TestCreator MCP - FastMCP Server

A shared Model Context Protocol (MCP) server that exposes intelligent tools for QA and development teams to query, filter, and analyze test cases from a dataset of 5,000+ VWO test cases.

## Features

✅ **8 Core Tools** for querying and filtering test cases  
✅ **Smart Ranking** using Priority × TestType × Status × Risk scoring  
✅ **Multi-format Exports** (JSON, CSV, JIRA)  
✅ **Full-text Search** across test case fields  
✅ **Device/Browser Filtering** for platform-specific testing  
✅ **JIRA Integration** (coming soon)  

## Quick Start

### 1. Install Dependencies

```bash
cd test_case_creator_MCP
python -m venv venv

# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Start the Server

**Option A: HTTP Server (Recommended)**
```bash
python -m fastmcp.server tc_mcp.app:server --host 127.0.0.1 --port 8000
```

**Option B: Stdio Mode (for direct integration)**
```bash
uvicorn tc_mcp.app:server
```

**Option C: Using uv (if installed)**
```bash
uv run tc-mcp
```

### 3. Connect via MCP Inspector

```bash
npx @modelcontextprotocol/inspector --transport http --server-url http://127.0.0.1:8000/mcp
```

## Available Tools

| Tool | Purpose | Key Parameters |
|------|---------|-----------------|
| **get_test_cases_by_component** | Get all tests for a module | `component`, `limit` |
| **filter_by_priority** | Filter by importance level | `priority`, `component*`, `test_type*`, `limit` |
| **filter_by_test_type** | Filter by test category | `test_type`, `component*`, `priority*`, `limit` |
| **get_test_cases_by_device_browser** | Filter by platform | `device`, `browser`, `os*`, `limit` |
| **search_test_cases** | Full-text keyword search | `keyword`, `search_fields*`, `limit` |
| **get_top_test_cases_for_module** | Smart ranking by risk | `component`, `top_n`, `risk_factor` |
| **list_available_components** | Get all modules | - |
| **list_available_values** | Get values by category | `category` |

\* = optional parameter

## Usage Examples

### Example 1: Get All Tests for a Module
```json
{
  "tool": "get_test_cases_by_component",
  "arguments": {
    "component": "SmartCode",
    "limit": 20
  }
}
```

### Example 2: Get Top 5 Critical Tests for Reports Module
```json
{
  "tool": "get_top_test_cases_for_module",
  "arguments": {
    "component": "Reports",
    "top_n": 5,
    "risk_factor": "high"
  }
}
```

### Example 3: Filter High-Priority Security Tests
```json
{
  "tool": "filter_by_priority",
  "arguments": {
    "priority": "High",
    "test_type": "Security",
    "limit": 10
  }
}
```

### Example 4: Find All Mobile Tests
```json
{
  "tool": "get_test_cases_by_device_browser",
  "arguments": {
    "device": "mobile",
    "browser": "Chrome",
    "limit": 50
  }
}
```

### Example 5: Search for User Management Tests
```json
{
  "tool": "search_test_cases",
  "arguments": {
    "keyword": "user invitation",
    "search_fields": "all",
    "limit": 20
  }
}
```

## Data Statistics

After loading the CSV, the server indexes:
- **5,000+ test cases**
- **~17 components** (SmartCode, Funnels, Reports, etc.)
- **4 priority levels** (Highest, High, Medium, Low)
- **9 test types** (Functional, API, Security, UI/UX, etc.)
- **4 browsers** (Chrome, Firefox, Safari, Edge)
- **4 device types** (desktop, tablet, mobile)
- **4 status values** (Ready, Draft, Automated, Deprecated)

## Environment Variables

```bash
# Server
MCP_HOST=127.0.0.1
MCP_PORT=8000

# JIRA Integration (coming soon)
JIRA_BASE_URL=https://your-jira-instance.atlassian.net
JIRA_API_TOKEN=your_token_here
JIRA_USERNAME=your_email@example.com

# Logging
LOG_LEVEL=INFO
```

## Ranking Algorithm

The smart ranking tool uses a **composite scoring formula**:

```
Score = (Priority × 0.4) + (TestType × 0.3) + (Status × 0.2) + (Risk × 0.1)
```

Where:
- **Priority Weight (0.4)**: Highest=3.0, High=2.0, Medium=1.0, Low=0.5
- **Test Type Weight (0.3)**: Security=1.5, API=1.2, Functional=1.0, etc.
- **Status Weight (0.2)**: Automated=1.2, Ready=1.0, Draft=0.5, Deprecated=0.0
- **Risk Weight (0.1)**: high=1.5, medium=1.0, low=0.5

All components are normalized to [0, 1] range before combining.

## Project Structure

```
test_case_creator_MCP/
├── tc_mcp/
│   ├── __init__.py          # Package marker
│   ├── app.py               # FastMCP server + tools
│   ├── models.py            # Pydantic models
│   ├── config.py            # Configuration
│   ├── data_loader.py       # CSV loader + indexing
│   ├── ranking.py           # Ranking algorithm
│   ├── tools/               # (Coming soon: tool implementations)
│   ├── integrations/        # (Coming soon: JIRA, etc.)
│   └── templates/           # (Coming soon: test generation templates)
├── tests/                   # Test suite (coming soon)
├── data/                    # Data directory
│   └── 5000_Test_Cases.csv  # Test case dataset
├── requirements.txt         # Dependencies
├── README.md               # This file
└── .gitignore             # Git ignore rules
```

## Testing

```bash
# Run tests (coming in Phase 2)
pytest tests/

# With coverage
pytest --cov=tc_mcp tests/
```

## Connection Strings for Different Clients

### VS Code with Copilot
Add to `.vscode/settings.json`:
```json
{
  "github.copilot.advanced": {
    "mcpServers": {
      "testcreator": {
        "type": "http",
        "url": "http://127.0.0.1:8000/mcp"
      }
    }
  }
}
```

### Cursor
Add to `~/.cursor/codeium.json`:
```json
{
  "mcpServers": {
    "testcreator": {
      "type": "http",
      "url": "http://127.0.0.1:8000/mcp"
    }
  }
}
```

### MCP Inspector (Recommended for Testing)
```bash
npx @modelcontextprotocol/inspector --transport http --server-url http://127.0.0.1:8000/mcp
```

## Sharing with Your Team

### Local Network
1. Start the server on your machine
2. Find your IP: `ipconfig` (Windows) or `ifconfig` (macOS/Linux)
3. Share connection string: `http://<your-ip>:8000/mcp`
4. Team members connect using same string from their machines

### Using Cloudflare Tunnel (Public)
```bash
npm install -g cloudflared
cloudflared tunnel --url http://127.0.0.1:8000
```
Share the generated `https://<random>.trycloudflare.com/mcp` URL

### Docker (Coming Soon)
```bash
docker build -t testcreator-mcp .
docker run -p 8000:8000 testcreator-mcp
```

## Phases of Development

### Phase 1: Foundation ✅
- ✅ FastMCP setup + CSV loading
- ✅ Data indexing + caching
- ✅ Pydantic models + validation

### Phase 2: Core Tools (In Progress)
- ✅ Query/filter tools (1-6)
- 🔄 Smart ranking tool (3)
- ⏳ Search + device filtering

### Phase 3: Advanced Tools
- ⏳ Test generation from templates
- ⏳ Coverage analysis
- ⏳ Test case generation

### Phase 4: Export + JIRA
- ⏳ Multi-format export (JSON, CSV, JIRA XML)
- ⏳ JIRA ticket creation automation
- ⏳ Error handling + rate limiting

### Phase 5: Production
- ⏳ Full test suite
- ⏳ Documentation completion
- ⏳ Docker packaging
- ⏳ Team deployment guide

## API Response Format

All tools return a consistent JSON response:

```json
{
  "status": "success",
  "total_count": 150,
  "returned_count": 20,
  "component": "SmartCode",
  "filters": {
    "priority": "High",
    "test_type": "Functional"
  },
  "test_cases": [
    {
      "issue_key": "VWO-1001",
      "summary": "[SmartCode] Functional: ensure data collection",
      "priority": "Medium",
      "component": "SmartCode",
      "test_type": "Functional",
      "status": "Ready",
      "browser": "Chrome 148",
      "device": "mobile (iOS)"
    },
    ...
  ]
}
```

## Troubleshooting

### Server won't start
- Check Python version: `python --version` (need 3.8+)
- Verify dependencies: `pip install -r requirements.txt`
- Check port availability: `netstat -an | grep 8000` (Windows) or `lsof -i :8000` (macOS/Linux)

### CSV not loading
- Verify file exists at: `data/5000_Test_Cases.csv`
- Check file encoding is UTF-8
- Ensure CSV has headers: Issue Type, Issue Key, Summary, etc.

### MCP Inspector won't connect
- Ensure server is running: `curl http://127.0.0.1:8000/health`
- Check firewall settings
- Try direct URL test: `http://127.0.0.1:8000/mcp`

### Search returns no results
- Check keyword spelling
- Try shorter keywords
- Use `list_available_components` to verify component names

## Contributing

Coming soon: guidelines for adding new tools, improving ranking algorithm, and adding integrations.

## License

Proprietary - For internal QA team use only

## Support

For issues or feature requests, please contact the automation team.

---

**Last Updated**: 2026-10-21  
**Version**: 0.1.0 (Phase 1)  
**Status**: 🔄 In Development
