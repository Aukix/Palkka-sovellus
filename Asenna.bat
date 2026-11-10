@echo off
rem Asentaa Tyotunnit-sovelluksen: Node.js (tarvittaessa), sovelluksen tiedostot ja pikakuvakkeet.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0asenna.ps1"
echo.
pause
