@echo off
rem Paivittaa sovelluksen uusimpaan versioon GitHubista.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0paivita.ps1"
echo.
pause
