@echo off
setlocal
title BoonmaIQ - Refresh App Data
echo.
echo  ==============================
echo   BoonmaIQ Data Refresh
echo  ==============================
echo.

cd /d "%~dp0"
set "PYTHONIOENCODING=utf-8"

REM ---------------------------------------------------------------
REM [1/4] Find Python (works on any laptop, skips the fake
REM       "python" shortcut Windows adds that opens the Store)
REM ---------------------------------------------------------------
echo  [1/4] Checking Python...
set "PYEXE="
py -3 -c "import sys" >nul 2>nul && set "PYEXE=py -3"
if not defined PYEXE python -c "import sys" >nul 2>nul && set "PYEXE=python"
if not defined PYEXE python3 -c "import sys" >nul 2>nul && set "PYEXE=python3"
if not defined PYEXE for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python3*") do if exist "%%D\python.exe" set "PYEXE="%%D\python.exe""
if not defined PYEXE for /d %%D in ("%ProgramFiles%\Python3*") do if exist "%%D\python.exe" set "PYEXE="%%D\python.exe""
if not defined PYEXE (
    echo.
    echo  ERROR: Python isn't installed on this laptop yet.
    echo  1. Go to https://www.python.org/downloads/ and install Python 3
    echo  2. On the first install screen, tick "Add python.exe to PATH"
    echo  3. Then double-click this file again.
    echo.
    goto :done
)
echo        OK - using %PYEXE%

REM ---------------------------------------------------------------
REM [2/4] Find Git
REM ---------------------------------------------------------------
echo  [2/4] Checking Git...
git --version >nul 2>nul
if errorlevel 1 if exist "%ProgramFiles%\Git\cmd\git.exe" set "PATH=%ProgramFiles%\Git\cmd;%PATH%"
if errorlevel 1 if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
git --version >nul 2>nul
if errorlevel 1 (
    echo.
    echo  ERROR: Git isn't installed on this laptop yet.
    echo  1. Go to https://git-scm.com/download/win and install it
    echo     ^(just keep clicking Next - the defaults are fine^)
    echo  2. Then double-click this file again.
    echo.
    goto :done
)
echo        OK

REM ---------------------------------------------------------------
REM [3/4] One-off Git setup for a new laptop (safe to repeat)
REM ---------------------------------------------------------------
echo  [3/4] Checking Git setup for this laptop...
set "REPO=%CD:\=/%"
git config --global --get-all safe.directory 2>nul | findstr /x /c:"%REPO%" >nul
if errorlevel 1 (
    git config --global --add safe.directory "%REPO%"
    echo        Trusted this folder for Git ^(first run on this laptop^)
)
git config user.name >nul 2>nul || git config --global user.name "Air Vongxayasy"
git config user.email >nul 2>nul || git config --global user.email "air@boonma.com.au"
git config windows.appendAtomically false
if exist ".git\index.lock" del /f /q ".git\index.lock"
if exist ".git\HEAD.lock" del /f /q ".git\HEAD.lock"
echo        OK

REM ---------------------------------------------------------------
REM [4/4] Run the refresh (converts the CSV, then pushes to live)
REM ---------------------------------------------------------------
echo  [4/4] Starting update... please wait.
echo.
echo  Note: the first push from a new laptop may pop up a GitHub
echo  sign-in window. Sign in with the AirV888 account and it will
echo  remember you from then on.
echo.
%PYEXE% update_data.py

:done
echo.
pause
endlocal
