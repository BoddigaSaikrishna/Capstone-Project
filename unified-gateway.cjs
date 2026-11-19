// Unified MLOps Local Gateway (Jenkins + Docker + CORS)
// Proxies /docker-proxy/* to Docker Engine (127.0.0.1:2375)
// Proxies all other traffic to Jenkins (127.0.0.1:8080)
// Injects open CORS headers and handles preflight OPTIONS requests

const http = require('http');

const GATEWAY_PORT = 8088;
const JENKINS_PORT = 8080;
const DOCKER_PORT = 2375;

const server = http.createServer((req, res) => {
  // Global CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Fast preflight response
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const isDocker = req.url.startsWith('/docker-proxy');
  const targetPort = isDocker ? DOCKER_PORT : JENKINS_PORT;
  const targetPath = isDocker ? req.url.replace(/^\/docker-proxy/, '') || '/' : req.url;

  const options = {
    hostname: '127.0.0.1',
    port: targetPort,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${targetPort}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    const headers = { ...proxyRes.headers };
    headers['access-control-allow-origin'] = '*';
    headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    headers['access-control-allow-headers'] = '*';

    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(503, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    if (isDocker) {
      res.end(
        JSON.stringify({
          error: 'Docker Desktop daemon is not running on port 2375. Please open Docker Desktop on your PC.',
          detail: err.message,
        })
      );
    } else {
      res.end(
        JSON.stringify({
          error: 'Jenkins server is not running on port 8080.',
          detail: err.message,
        })
      );
    }
  });

  req.pipe(proxyReq);
});

server.listen(GATEWAY_PORT, '127.0.0.1', () => {
  console.log(`[Gateway] Unified MLOps Gateway running on http://127.0.0.1:${GATEWAY_PORT}`);
  console.log(`  -> Docker  : http://127.0.0.1:${GATEWAY_PORT}/docker-proxy/* => 127.0.0.1:${DOCKER_PORT}/*`);
  console.log(`  -> Jenkins : http://127.0.0.1:${GATEWAY_PORT}/*              => 127.0.0.1:${JENKINS_PORT}/*`);
});

module.exports = server;
