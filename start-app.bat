@echo off
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% equ 0 (
    node "%~dp0server.cjs"
) else if exist "C:\Program Files\nodejs\node.exe" (
    "C:\Program Files\nodejs\node.exe" "%~dp0server.cjs"
) else (
    echo [VIRHE] Node.js ei loytynyt tietokoneelta!
    echo Asenna Node.js osoitteesta: https://nodejs.org/
    pause
)
