# TestCreator MCP - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Open Terminal in Project Folder
```bash
cd c:\Users\kisho\PlayAI4xTester\Chapter14_MCP_Create_VIBE\test_case_creator_MCP
```

### Step 2: Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Start the Server
```bash
python run_server.py --host 127.0.0.1 --port 8000
```

**Expected Output:**
```
Starting TestCreator MCP in HTTP mode
Listening on 127.0.0.1:8000

Connect via:
  HTTP: http://127.0.0.1:8000/mcp
  MCP Inspector: npx @modelcontextprotocol/inspector --transport http --server-url http://127.0.0.1:8000/mcp
```

### Step 5: Connect via MCP Inspector (New Terminal)
```bash
npx @modelcontextprotocol/inspector --transport http --server-url http://127.0.0.1:8000/mcp
```

The Inspector will open at `http://localhost:5173` - you'll see all 8 tools listed.

---

## 📌 Connection Strings

### For Local Use
```
http://127.0.0.1:8000/mcp
```

### For LAN/Team Use (Replace with YOUR IP)
```
http://192.168.x.x:8000/mcp
```
Get your IP:
- Windows: `ipconfig` → look for IPv4 Address
- macOS/Linux: `ifconfig` → look for inet

### For Public Use (Cloudflare Tunnel)
```bash
cloudflared tunnel --url http://127.0.0.1:8000
# Copy the https://<random>.trycloudflare.com URL
```

---

## 🔧 What Was Built

**Phase 1 Complete ✅**
- 8 core query/filter tools
- 5,000 test cases indexed
- Smart ranking algorithm
- Full-text search
- Device/browser filtering

**Tools Available:**
1. `get_test_cases_by_component` - "Get all tests for SmartCode"
2. `filter_by_priority` - "Find High priority tests"
3. `filter_by_test_type` - "Show all Security tests"
4. `get_test_cases_by_device_browser` - "iOS + Safari tests"
5. `search_test_cases` - "Find user invitation tests"
6. `get_top_test_cases_for_module` - "Top 5 critical tests"
7. `list_available_components` - "What modules exist?"
8. `list_available_values` - "Show all browsers"

---

## ✅ Quick Verification

### Test 1: Server is Running
```bash
# Open new terminal, run:
curl http://127.0.0.1:8000/health
```

### Test 2: List All Modules
In MCP Inspector, select tool: **list_available_components**
- Click "Call Tool"
- Should return list of ~17 modules

### Test 3: Get Tests for a Module
In MCP Inspector, select tool: **get_test_cases_by_component**
- Set component: `SmartCode`
- Set limit: `5`
- Click "Call Tool"
- Should return 5 SmartCode tests

### Test 4: Smart Ranking
In MCP Inspector, select tool: **get_top_test_cases_for_module**
- Set component: `Reports`
- Set top_n: `3`
- Set risk_factor: `high`
- Click "Call Tool"
- Should return top 3 highest-scoring tests with scores

---

## 📋 Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError: No module named 'fastmcp'` | Run: `pip install -r requirements.txt` |
| `Address already in use` | Port 8000 is taken. Try: `python run_server.py --port 8001` |
| `CSV file not found` | Ensure `data/5000_Test_Cases.csv` exists |
| `MCP Inspector won't connect` | Check firewall, verify server is running with `curl` |
| No results from tools | Check component/priority/test_type spelling (case-sensitive) |

---

## 📖 Learn More

- **Full Documentation**: See [README.md](README.md)
- **Complete Plan**: See [PHASE_1_COMPLETE.md](PHASE_1_COMPLETE.md)
- **Original Plan**: See [../01_MCP_Plan.md](../01_MCP_Plan.md)

---

## 🎯 Next Steps

1. ✅ Start server and verify with MCP Inspector
2. 🔄 Test all 8 tools with sample data
3. 📝 Create test suite (Phase 2)
4. 🚀 Share connection string with team
5. 🔧 Add export tools (Phase 3)
6. 🔗 Add JIRA integration (Phase 4)

---

**Ready? Start with Step 1 above! 👆**
