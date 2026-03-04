@echo off
REM Malawi Cholera Cost Calculator - Launcher
REM This script starts a local web server and opens the calculator in your default browser

cd /d "%~dp0"

echo.
echo Starting Malawi Cholera Cost Calculator...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

REM Start Python's built-in HTTP server
echo Starting local web server on http://localhost:8000

echo Starting local World Bank proxy (Python)
start python wb_proxy.py

echo.
echo Press Ctrl+C to stop the server and proxy
echo.

REM Open browser
start http://localhost:8000

REM Start server
python -m http.server 8000
