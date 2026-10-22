"""Configuration for TestCreator MCP"""
import os
from pathlib import Path

# Project root
PROJECT_ROOT = Path(__file__).parent.parent

# Data directory
DATA_DIR = PROJECT_ROOT / "data"
CSV_PATH = DATA_DIR / "5000_Test_Cases.csv"

# Cache and overlay settings
CACHE_DIR = PROJECT_ROOT / ".cache"
OVERLAY_FILE = PROJECT_ROOT / ".mcp_overlay.json"

# JIRA configuration
JIRA_BASE_URL = os.getenv("JIRA_BASE_URL", "")
JIRA_API_TOKEN = os.getenv("JIRA_API_TOKEN", "")
JIRA_USERNAME = os.getenv("JIRA_USERNAME", "")

# Server configuration
HOST = os.getenv("MCP_HOST", "127.0.0.1")
PORT = int(os.getenv("MCP_PORT", "8000"))

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Test case limits
MAX_RESULTS_DEFAULT = 100
MAX_RESULTS_MAX = 1000
