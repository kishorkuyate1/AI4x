# TestCreator MCP - Connection Strings

## 🚀 Quick Start

**Status**: ✅ Ready to Connect

**Server Address (Local)**: `http://127.0.0.1:8000/mcp`

---

## 🔗 How to Connect

### Option 1: MCP Inspector (Recommended for Testing)

1. **Start the server first:**
   ```bash
   # Windows
   start_server.bat
   
   # macOS/Linux
   ./start_server.sh (create this file with bash equivalent)
   ```

2. **Open new terminal and run:**
   ```bash
   npx @modelcontextprotocol/inspector --transport http --server-url http://127.0.0.1:8000/mcp
   ```

3. **Browser opens at**: `http://localhost:5173`
   - You'll see all 8 tools listed
   - Click on any tool to test it
   - Fill in parameters and call the tool

---

### Option 2: VS Code Copilot

Add to `.vscode/settings.json` in your workspace:

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

Then in VS Code, you can use Copilot Chat to query test cases!

---

### Option 3: Cursor Editor

Add to `~/.cursor/codeium.json` (create if doesn't exist):

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

---

### Option 4: Direct HTTP Requests

```bash
# Example 1: List all components
curl -X POST http://127.0.0.1:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_available_components",
      "arguments": {}
    }
  }'

# Example 2: Get tests for a component
curl -X POST http://127.0.0.1:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_test_cases_by_component",
      "arguments": {
        "component": "SmartCode",
        "limit": 5
      }
    }
  }'
```

---

### Option 5: Share on Local Network

**Get your IP address:**
- Windows: `ipconfig` → look for "IPv4 Address" (e.g., 192.168.1.100)
- macOS: `ifconfig` → look for "inet" (e.g., 192.168.1.100)
- Linux: `hostname -I` (e.g., 192.168.1.100)

**Share this connection string with your team:**
```
http://<YOUR_IP>:8000/mcp
```

Example: `http://192.168.1.100:8000/mcp`

**Team members can then:**
1. Copy your IP connection string
2. Add it to their `.vscode/settings.json` or MCP Inspector
3. Start using the tools

---

### Option 6: Public Access via Cloudflare Tunnel

**Install Cloudflare Tunnel** (if not already installed):
```bash
# Windows
choco install cloudflare-warp

# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
sudo apt-get install cloudflared
```

**Start the tunnel** (in another terminal while server is running):
```bash
cloudflared tunnel --url http://127.0.0.1:8000
```

**Output will look like:**
```
Tunnel running at: https://random-id.trycloudflare.com
```

**Share this URL**: `https://random-id.trycloudflare.com/mcp`

Anyone with the URL can connect using:
- MCP Inspector: `npx @modelcontextprotocol/inspector --transport http --server-url https://random-id.trycloudflare.com/mcp`
- VS Code: Add to settings.json with the Cloudflare URL
- Direct HTTP: Same curl commands but with the public URL

---

## 📋 All Available Tools

| Tool | Purpose | Example |
|------|---------|---------|
| `list_available_components` | Get all modules | "What modules exist?" |
| `list_available_values` | Get values (priorities, types, etc.) | "Show all test types" |
| `get_test_cases_by_component` | Get tests for a module | "All SmartCode tests" |
| `filter_by_priority` | Filter by priority level | "High priority tests" |
| `filter_by_test_type` | Filter by test category | "All Security tests" |
| `get_test_cases_by_device_browser` | Filter by platform | "iOS + Safari tests" |
| `search_test_cases` | Text search | "User invitation tests" |
| `get_top_test_cases_for_module` | Smart ranked tests | "Top 5 Reports tests" |

---

## 🧪 Test the Connection

### Using MCP Inspector

1. Start server: `start_server.bat`
2. Start Inspector: `npx @modelcontextprotocol/inspector --transport http --server-url http://127.0.0.1:8000/mcp`
3. In Inspector UI, select tool: `list_available_components`
4. Click "Call Tool"
5. Should return list of ~17 components

### Using curl

```bash
# Simple test - list components
curl http://127.0.0.1:8000/health
# Should return 200 OK (or 404 if health endpoint not available)

# More detailed test
curl -X POST http://127.0.0.1:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
# Should return list of 8 tools
```

---

## 🆘 Troubleshooting Connection

| Issue | Solution |
|-------|----------|
| `Connection refused` | Make sure server is running on the correct port |
| `Port already in use` | Change port: `start_server.bat` → modify port number |
| `Tool not found` | Verify tool name spelling (tools are case-sensitive) |
| `No results from tool` | Check parameter values and data - all 5,000 cases are loaded |
| MCP Inspector won't connect | Verify URL is correct: `http://127.0.0.1:8000/mcp` |
| Slow response | First query loads 5,000 test cases - wait a few seconds |

---

## 📝 Server Status Check

### Quick Health Check
```bash
# From the MCP project folder:
.\venv\Scripts\python -c "from tc_mcp.data_loader import get_data_loader; loader = get_data_loader(); print(f'Ready! Loaded {len(loader.test_cases)} test cases')"
```

### Full Server Test
```bash
# Start server and verify tools load
.\venv\Scripts\python run_server.py
# Check for "Starting TestCreator MCP" message
```

---

## 🎯 Next Steps After Connecting

1. **Test all 8 tools** using MCP Inspector
2. **Verify rankings** are working with `get_top_test_cases_for_module`
3. **Search for keywords** using `search_test_cases`
4. **Share the connection string** with your QA team
5. **Collect feedback** on which tools are most useful
6. **Plan Phase 2**: Test generation and export tools

---

## 📊 Performance Notes

- **First request**: ~2-3 seconds (loading 5,000 test cases into memory)
- **Subsequent requests**: <100 ms per tool call
- **All data is indexed**: O(1) lookups by component, priority, test type, etc.
- **No database needed**: Everything runs in-memory after initial load
- **Stateless**: Each request is independent, no session management

---

## 🔐 Security Notes

- ✅ Read-only operations (no data modification)
- ✅ Works on local network only by default
- ⚠️ If exposing publicly, use Cloudflare Tunnel (encrypted)
- ⚠️ Add authentication before sharing on untrusted networks
- ✅ API token-based auth can be added in Phase 2

---

**Status**: ✅ Server Ready  
**Last Updated**: 2026-10-21  
**Tools Available**: 8  
**Test Cases Loaded**: 5,000+
