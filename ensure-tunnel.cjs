const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const EXPECTED_DOMAIN = 'purplish-exhaust-passable.ngrok-free.dev';
const WATCHDOG_FILE = path.join(__dirname, 'tunnel-watchdog.cjs');

function checkLocalNgrokApi() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:4040/api/tunnels', { timeout: 1500 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const tunnels = parsed.tunnels || [];
          const matched = tunnels.some((t) => t.public_url && t.public_url.includes(EXPECTED_DOMAIN));
          resolve(matched);
        } catch {
          resolve(false);
        }
      });
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function launchWatchdog() {
  try {
    const child = spawn(
      'node',
      [WATCHDOG_FILE],
      {
        cwd: __dirname,
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      }
    );
    child.unref();
  } catch (err) {
    console.warn('[Tunnel] Could not launch watchdog:', err.message);
  }
}

async function main() {
  const isAlreadyRunning = await checkLocalNgrokApi();
  if (isAlreadyRunning) {
    console.log(`[Tunnel] \x1b[32m✔ ngrok Jenkins tunnel is active\x1b[0m (https://${EXPECTED_DOMAIN})`);
    launchWatchdog();
    process.exit(0);
  }

  console.log(`[Tunnel] ngrok tunnel not detected. Launching continuous Watchdog...`);
  launchWatchdog();

  // Poll for up to 8 seconds to confirm tunnel is ready
  for (let i = 0; i < 16; i++) {
    await sleep(500);
    const active = await checkLocalNgrokApi();
    if (active) {
      console.log(`[Tunnel] \x1b[32m✔ ngrok Jenkins tunnel started successfully\x1b[0m (https://${EXPECTED_DOMAIN})`);
      process.exit(0);
    }
  }

  console.log(`[Tunnel] \x1b[33mWatchdog launched in background (awaiting public registration)\x1b[0m`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[Tunnel] Error verifying ngrok tunnel:', err);
  process.exit(0);
});
