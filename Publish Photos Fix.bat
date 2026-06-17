@echo off
title BoonmaIQ — Publish Photos Fix
echo.
echo  ==================================
echo   BoonmaIQ — Publish Photos Fix
echo  ==================================
echo.
echo  This will publish the photo fix to the live app.
echo.

cd /d "%~dp0"

REM Clear any stale git lock left behind
if exist ".git\index.lock" del /f /q ".git\index.lock"

echo  Saving the change...
git add ".vercelignore" "update_data.py"
git commit -m "Deploy part photos + add slash-safe naming and photo health check"

echo.
echo  Sending to GitHub (Vercel will deploy in 1-2 minutes)...
git push

echo.
echo  Done. If you saw no errors above, the photos are on their way.
echo  Note: the first deploy uploads ~180MB of photos, so it may take
echo  a few minutes longer than a normal data refresh.
echo.
pause
