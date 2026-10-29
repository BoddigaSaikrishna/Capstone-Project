@echo off
title Jenkins Permanent Tunnel (ngrok)
cd /d "%~dp0"
echo Starting permanent HTTPS tunnel for Jenkins with CORS policy...
echo Domain: https://purplish-exhaust-passable.ngrok-free.dev
ngrok http 8080 --url https://purplish-exhaust-passable.ngrok-free.dev --traffic-policy-file traffic-policy.yml
pause
