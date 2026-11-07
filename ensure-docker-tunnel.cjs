const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const BRIDGE_FILE = path.join(__dirname, 'docker-cors-bridge.cjs');
const CLOUDFLARED_EXE = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'cloudflared.exe');
const URL_FILE = path.join(__dirname, 'docker-tunnel-url.txt');

// 1. Start CORS bridge
require('./docker-cors-bridge.cjs');

// 2. Start Cloudflared tunnel
console.log('[Docker Tunnel] Starting Cloudflare tunnel to http://127.0.0.1:2376...');

const child = spawn(
  CLOUDFLARED_EXE,
  ['tunnel', '--url', 'http://127.0.0.1:2376'],
  { stdio: ['ignore', 'pipe', 'pipe'] }
);

child.stderr.on('data', (chunk) => {
  const text = chunk.toString();
  const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
  if (match) {
    const url = match[0];
    console.log(`\n======================================================`);
    console.log(`  DOCKER LIVE CLOUD URL: ${url}`);
    console.log(`======================================================\n`);
    fs.writeFileSync(URL_FILE, url, 'utf8');
  }
});

child.on('error', (err) => {
  console.error('[Docker Tunnel] Error:', err.message);
});

child.on('exit', (code) => {
  console.log('[Docker Tunnel] Exited with code:', code);
});
