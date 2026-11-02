const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const EXPECTED_DOMAIN = 'purplish-exhaust-passable.ngrok-free.dev';
const TRAFFIC_POLICY_FILE = path.join(__dirname, 'traffic-policy.yml');

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

async function main() {
  const isAlreadyRunning = await checkLocalNgrokApi();
  if (isAlreadyRunning) {
    console.log(`[Tunnel] \x1b[32m✔ ngrok Jenkins tunnel is already active\x1b[0m (https://${EXPECTED_DOMAIN})`);
    process.exit(0);
  }

  console.log(`[Tunnel] ngrok tunnel not detected. Launching in background...`);

  if (!fs.existsSync(TRAFFIC_POLICY_FILE)) {
    console.warn(`[Tunnel] Warning: traffic policy file not found at ${TRAFFIC_POLICY_FILE}`);
  }

  const child = spawn(
    'ngrok',
    [
      'http',
      '8080',
      '--url',
      `https://${EXPECTED_DOMAIN}`,
      '--traffic-policy-file',
      TRAFFIC_POLICY_FILE,
    ],
    {
      cwd: __dirname,
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      shell: true,
    }
  );

  child.unref();

  // Poll for up to 8 seconds to confirm tunnel is ready
  for (let i = 0; i < 16; i++) {
    await sleep(500);
    const active = await checkLocalNgrokApi();
    if (active) {
      console.log(`[Tunnel] \x1b[32m✔ ngrok Jenkins tunnel started successfully\x1b[0m (https://${EXPECTED_DOMAIN})`);
      process.exit(0);
    }
  }

  console.log(`[Tunnel] \x1b[33mTunnel process launched in background (awaiting public registration)\x1b[0m`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[Tunnel] Error verifying ngrok tunnel:', err);
  process.exit(0); // Continue dev process even on error
});

