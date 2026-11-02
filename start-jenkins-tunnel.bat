@echo off
title Jenkins Permanent Tunnel (ngrok)
cd /d "%~dp0"
echo ====================================================
echo  Jenkins Permanent ngrok Tunnel Manager
echo ====================================================
node ensure-tunnel.cjs
echo.
echo Tunnel Domain: https://purplish-exhaust-passable.ngrok-free.dev
echo Local Target:  http://localhost:8080
echo.
pause
