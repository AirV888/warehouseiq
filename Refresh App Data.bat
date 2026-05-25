@echo off
title BoonmaIQ — Refresh App Data
echo.
echo  ==============================
echo   BoonmaIQ Data Refresh
echo  ==============================
echo.
echo  Starting update... please wait.
echo.

cd /d "%~dp0"
python update_data.py

echo.
pause
