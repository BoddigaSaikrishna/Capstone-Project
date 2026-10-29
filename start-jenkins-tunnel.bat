@echo off
title Jenkins Permanent Tunnel (ngrok)
echo Starting permanent HTTPS tunnel for Jenkins on port 8080...
echo Domain: https://purplish-exhaust-passable.ngrok-free.dev
ngrok http 8080 --url https://purplish-exhaust-passable.ngrok-free.dev
pause
