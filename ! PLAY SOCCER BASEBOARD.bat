@echo off
title Soccer Baseboard
cd /d "%~dp0"
if not exist node_modules\@supabase\supabase-js (
  echo Installing Soccer Baseboard dependencies...
  call npm install
  if errorlevel 1 goto failed
)
call npm run dev -- --open
if errorlevel 1 goto failed
goto end

:failed
echo.
echo Soccer Baseboard could not start. Make sure Node.js is installed.
pause

:end
