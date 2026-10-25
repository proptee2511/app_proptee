@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 24 or newer is required.
  pause
  exit /b 1
)
call npm run build
if errorlevel 1 (
  echo Build failed. Check the error above.
  pause
  exit /b 1
)
set "PORT=3001"

echo Open http://127.0.0.1:3001/login after services start.
echo Reset emails require mail provider configuration.
echo Keep this window open. Ctrl+C stops both services.
node scripts/start.js
pause

