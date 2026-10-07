// ============================================================
// FullStack Application Server (Zero External Dependencies)
// Embedded Frontend + REST API + Health Monitoring
// Integrated with: GitHub -> Jenkins -> Docker -> AWS
// ============================================================

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3000;
const APP_ENV = process.env.APP_ENV || 'production';
const AWS_REGION = process.env.AWS_DEFAULT_REGION || 'us-east-1';

// In-memory data store for products/services
let items = [
  { id: 1, name: 'AWS Cloud EC2 Fleet', category: 'Infrastructure', price: 49.99, status: 'Active' },
  { id: 2, name: 'Docker Container Runtime', category: 'DevOps', price: 129.00, status: 'Provisioned' },
  { id: 3, name: 'ML Model Inference Engine', category: 'AI/ML', price: 89.50, status: 'Active' },
  { id: 4, name: 'Jenkins CI/CD Pipeline', category: 'Automation', price: 75.00, status: 'Ready' }
];

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function sendHtml(res, html) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(html);
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // ── 1. Embedded Single-Page Frontend UI ─────────────────────
  if (pathname === '/' && method === 'GET') {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FullStack Cloud Application — DevOps 4-Tool Integrated</title>
  <style>
    :root {
      --bg: #090d16;
      --card: #111827;
      --border: #1f293d;
      --text: #f3f4f6;
      --accent: #38bdf8;
      --success: #34d399;
    }
    body {
      margin: 0;
      padding: 2.5rem 1.5rem;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    .badge {
      display: inline-block;
      padding: 0.3rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent);
      border: 1px solid rgba(56, 189, 248, 0.3);
      margin-bottom: 1.25rem;
    }
    h1 {
      font-size: 2.4rem;
      margin: 0 0 0.5rem 0;
      background: linear-gradient(135deg, #fff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p { color: #94a3b8; font-size: 1.05rem; line-height: 1.5; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
    }
    .tool-title { font-weight: 700; font-size: 1.05rem; color: #fff; margin-bottom: 0.25rem; }
    .tool-desc { font-size: 0.85rem; color: #94a3b8; }
    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
      margin-right: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1.5rem;
      background: var(--card);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th { background: #162032; color: #94a3b8; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .chip {
      background: rgba(52, 211, 153, 0.15);
      color: var(--success);
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">🚀 Production Ready Microservice</span>
    <h1>FullStack Cloud Application</h1>
    <p>A complete full-stack web service demonstrating end-to-end integration across all 4 DevOps tools.</p>

    <div class="grid">
      <div class="card">
        <div class="tool-title">🐙 1. GitHub</div>
        <div class="tool-desc"><span class="status-dot"></span>Repository & VCS</div>
      </div>
      <div class="card">
        <div class="tool-title">⚙️ 2. Jenkins</div>
        <div class="tool-desc"><span class="status-dot"></span>Automated CI/CD Tests</div>
      </div>
      <div class="card">
        <div class="tool-title">🐳 3. Docker</div>
        <div class="tool-desc"><span class="status-dot"></span>Containerized & Isolated</div>
      </div>
      <div class="card">
        <div class="tool-title">☁️ 4. AWS Cloud</div>
        <div class="tool-desc"><span class="status-dot"></span>Deployed on EC2 (${AWS_REGION})</div>
      </div>
    </div>

    <h3>Application Catalog (REST API: /api/items)</h3>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Service Name</th>
          <th>Category</th>
          <th>Price</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(i => `
          <tr>
            <td>#${i.id}</td>
            <td><strong>${i.name}</strong></td>
            <td>${i.category}</td>
            <td>$${i.price.toFixed(2)}</td>
            <td><span class="chip">${i.status}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="margin-top: 2rem; font-size: 0.85rem; color: #64748b; text-align: center;">
      Environment: <strong>${APP_ENV}</strong> | Port: <strong>${PORT}</strong> | Pipeline: <strong>GitHub ➔ Jenkins ➔ Docker ➔ AWS</strong>
    </div>
  </div>
</body>
</html>`;
    sendHtml(res, html);
    return;
  }

  // ── 2. Health Check Endpoint ────────────────────────────────
  if (pathname === '/health' && method === 'GET') {
    return sendJson(res, 200, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime_seconds: process.uptime(),
      app_environment: APP_ENV,
      pipeline_tools: ['GitHub', 'Jenkins', 'Docker', 'AWS']
    });
  }

  // ── 3. REST API: GET all items ──────────────────────────────
  if (pathname === '/api/items' && method === 'GET') {
    return sendJson(res, 200, {
      count: items.length,
      items: items
    });
  }

  // ── 4. REST API: POST create item ───────────────────────────
  if (pathname === '/api/items' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        if (!parsed.name || !parsed.price) {
          return sendJson(res, 400, { error: 'Missing name or price parameter' });
        }
        const newItem = {
          id: items.length + 1,
          name: parsed.name,
          category: parsed.category || 'General',
          price: parseFloat(parsed.price),
          status: 'Active'
        };
        items.push(newItem);
        return sendJson(res, 201, newItem);
      } catch (err) {
        return sendJson(res, 400, { error: 'Invalid JSON payload' });
      }
    });
    return;
  }

  // ── 5. Pipeline Telemetry Endpoint ──────────────────────────
  if (pathname === '/api/telemetry' && method === 'GET') {
    return sendJson(res, 200, {
      service: 'fullstack-demo-app',
      version: '1.0.0',
      tools: {
        github: { repo: 'devops-fullstack-app', branch: 'main', status: 'synced' },
        jenkins: { build: '#42', tests_passed: 12, status: 'SUCCESS' },
        docker: { image: 'devops-org/fullstack-app:v1.0', container: 'fullstack-app', status: 'running' },
        aws: { provider: 'AWS EC2', region: AWS_REGION, health: 'nominal' }
      }
    });
  }

  // Fallback 404
  sendJson(res, 404, { error: 'Endpoint Not Found', path: pathname });
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[FullStack App] Listening on http://0.0.0.0:${PORT}`);
    console.log(`[FullStack App] All 4 tools integrated: GitHub -> Jenkins -> Docker -> AWS`);
  });
}

module.exports = server;
