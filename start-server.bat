@echo off
title Kedarnath 360 AR/VR Experience
echo ========================================================
echo   Kedarnath Dham 360 AR/VR Pilgrimage Experience
echo ========================================================
echo.
echo Starting local web server for WebXR & AR support...
echo.

where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Starting Python HTTP server on port 8080...
    start http://localhost:8080
    py -m http.server 8080
    goto end
)

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Starting Python HTTP server on port 8080...
    start http://localhost:8080
    python -m http.server 8080
    goto end
)

echo Python not detected on PATH, opening index.html directly in your default browser...
start "" "%~dp0index.html"

:end
