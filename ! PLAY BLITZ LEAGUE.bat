@echo off
title Blitz League
cd /d "%~dp0"
if not exist node_modules\@supabase\supabase-js (
  echo Installing Blitz League dependencies...
  call npm install
  if errorlevel 1 goto failed
)
call npm run dev -- --open
if errorlevel 1 goto failed
goto end

:failed
echo.
echo Blitz League could not start. Make sure Node.js is installed.
pause

:end
