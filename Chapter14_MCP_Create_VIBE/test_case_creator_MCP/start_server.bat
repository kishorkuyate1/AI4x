@echo off
REM TestCreator MCP Server Startup Script for Windows

cd /d "%~dp0"

echo.
echo ========================================
echo   TestCreator MCP Server Startup
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo Error: Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo Error: Failed to activate virtual environment
    pause
    exit /b 1
)

REM Install requirements if not already installed
echo Checking dependencies...
pip show fastmcp >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    pip install -q -r requirements.txt
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Start the server
echo.
echo Starting TestCreator MCP Server...
echo.
python -m uvicorn tc_mcp.app:server --host 127.0.0.1 --port 8000 --reload

pause
