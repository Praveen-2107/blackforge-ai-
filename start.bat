@echo off
echo ============================================
echo   BlackForge AI - Starting All Services
echo ============================================

:: ── Start Ollama AI Server ──────────────────────────────────────────────────
echo [1/3] Starting Ollama AI Server...
set OLLAMA_EXE=C:\Users\Praveen\AppData\Local\Programs\Ollama\ollama.exe
if exist "%OLLAMA_EXE%" (
    start "BlackForge Ollama" cmd /k "%OLLAMA_EXE% serve"
    timeout /t 3 /nobreak >nul
    echo       Ollama started at http://localhost:11434
) else (
    echo       WARNING: Ollama not found. AI Assistant will be offline.
    echo       Download from https://ollama.com
)

:: ── Start Backend ───────────────────────────────────────────────────────────
echo [2/3] Starting Backend API...
start "BlackForge Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:create_app --reload --factory --host 127.0.0.1 --port 8000"
timeout /t 3 /nobreak >nul
echo       Backend started at http://127.0.0.1:8000

:: ── Start Frontend ──────────────────────────────────────────────────────────
echo [3/3] Starting Frontend...
start "BlackForge Frontend" cmd /k "cd /d %~dp0frontend && cmd /c npm start"

echo.
echo ============================================
echo   All services are starting!
echo ============================================
echo   Ollama AI:  http://localhost:11434
echo   Backend:    http://127.0.0.1:8000
echo   Frontend:   http://localhost:3000
echo   AI Chat:    http://localhost:3000/ai
echo ============================================
echo.
echo Keep all windows open while using the app.
pause
