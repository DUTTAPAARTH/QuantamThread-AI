@echo off
title QuantumThread AI
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║        QuantumThread AI - Launching       ║
echo  ╚══════════════════════════════════════════╝
echo.

:: ── Frontend ────────────────────────────────────────────
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [1/5] Installing frontend dependencies...
    npm install
    echo.
) else (
    echo [1/5] Frontend dependencies OK
)

echo [2/5] Building frontend...
call npm run build
echo.

:: ── Backend ─────────────────────────────────────────────
cd /d "%~dp0backend"

if not exist "node_modules" (
    echo [3/5] Installing backend dependencies...
    npm install
    echo.
) else (
    echo [3/5] Backend dependencies OK
)

:: Delete old DB so it auto-seeds fresh data on first run (optional)
:: If you want a fresh DB every time, uncomment the next line:
:: if exist "quantumthread.db" del "quantumthread.db"

:: Start the server in the background
echo [4/5] Starting QuantumThread AI server...
start /b node server.js

:: Wait for the server to be ready
echo [5/5] Waiting for server to start...
:waitloop
timeout /t 1 /nobreak >nul
powershell -command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/health' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 goto waitloop

echo.
echo  ✓ Server is running on http://localhost:3001
echo  ✓ Opening browser...
echo.
start "" http://localhost:3001

echo  Press any key to stop the server and exit.
pause >nul

:: Kill the node process when user presses a key
taskkill /f /im node.exe >nul 2>&1
echo  Server stopped. Goodbye!
