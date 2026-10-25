@echo off
cd /d "%~dp0"
call npm run build
if errorlevel 1 exit /b 1
echo Open http://127.0.0.1:3001/login and http://127.0.0.1:3001/api-docs
echo LOCAL TEST ONLY: reset links are displayed without sending email.
node scripts/start-local-test.js
pause
