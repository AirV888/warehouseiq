@echo off
title BoonmaIQ — Push to Live
echo.
echo  ==============================
echo   BoonmaIQ — Push to Live
echo  ==============================
echo.
echo  Sending the latest committed changes to GitHub...
echo  (Vercel will auto-deploy within 1-2 minutes)
echo.

cd /d "%~dp0"
git push

echo.
echo  Done. If you saw no errors above, the update is on its way.
echo.
pause
