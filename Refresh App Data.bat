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

REM Try the Python launcher first (recommended on Windows), then fall back to python/python3
where py >nul 2>nul
if %errorlevel%==0 (
    py -3 update_data.py
    goto :done
)

where python3 >nul 2>nul
if %errorlevel%==0 (
    python3 update_data.py
    goto :done
)

where python >nul 2>nul
if %errorlevel%==0 (
    python update_data.py
    goto :done
)

echo.
echo  ERROR: Python is not installed on this PC.
echo  Install Python 3 from https://www.python.org/downloads/
echo  (tick "Add Python to PATH" during install)
echo.

:done
echo.
pause
