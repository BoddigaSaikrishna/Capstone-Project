const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const DOMAIN = 'purplish-exhaust-passable.ngrok-free.dev';
const POLICY_FILE = path.join(__dirname, 'traffic-policy.yml');

let isSpawning = false;

function isTunnelUp() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:4040/api/tunnels', { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const ok = (parsed.tunnels || []).some(
            (t) => t.public_url && t.public_url.includes(DOMAIN)
          );
          resolve(ok);
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

function startNgrok() {
  if (isSpawning) return;
  isSpawning = true;
  console.log(`[Watchdog ${new Date().toLocaleTimeString()}] ngrok tunnel down. Restarting...`);

  const child = spawn(
    'ngrok',
    [
      'http',
      '8080',
      '--url',
      `https://${DOMAIN}`,
      '--traffic-policy-file',
      POLICY_FILE,
    ],
    {
      cwd: __dirname,
      stdio: 'ignore',
      windowsHide: true,
      shell: true,
    }
  );

  child.on('error', (err) => {
    console.error(`[Watchdog] Spawn error:`, err.message);
    isSpawning = false;
  });

  child.on('exit', () => {
    isSpawning = false;
  });

  setTimeout(() => {
    isSpawning = false;
  }, 5000);
}

async function loop() {
  console.log(`[Watchdog] Continuous Jenkins Tunnel Monitor started for ${DOMAIN}`);
  while (true) {
    try {
      const up = await isTunnelUp();
      if (!up) {
        startNgrok();
        await new Promise((r) => setTimeout(r, 6000));
      }
    } catch (err) {
      console.error('[Watchdog] Loop error:', err.message);
    }
    await new Promise((r) => setTimeout(r, 10000)); // Checks every 10 seconds
  }
}

loop();
