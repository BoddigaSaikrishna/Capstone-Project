/**
 * Automated Test Suite for FullStack Application
 * Executed automatically by Jenkins CI in Stage 2 (Testing & Quality Gate)
 */

const assert = require('assert');
const http = require('http');
const app = require('../server');

const TEST_PORT = 3888;
let server;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: path,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: body.startsWith('{') || body.startsWith('[') ? JSON.parse(body) : body });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (options.data) {
      req.write(typeof options.data === 'string' ? options.data : JSON.stringify(options.data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 [JENKINS CI] Starting Automated Tests for FullStack Application...');
  
  await new Promise((res) => {
    server = app.listen(TEST_PORT, '127.0.0.1', () => {
      console.log(`   Test server running on port ${TEST_PORT}`);
      res();
    });
  });

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`   ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`   ❌ FAIL: ${name}`, err.message);
    }
  }

  // Test 1: Health Check Endpoint
  await test('GET /health returns 200 OK and healthy status', async () => {
    const res = await request('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
    assert.strictEqual(Array.isArray(res.body.pipeline_tools), true);
  });

  // Test 2: Tools Verification
  await test('GET /health verifies all 4 DevOps tools integrated', async () => {
    const res = await request('/health');
    const tools = res.body.pipeline_tools;
    assert.ok(tools.includes('GitHub'), 'GitHub must be integrated');
    assert.ok(tools.includes('Jenkins'), 'Jenkins must be integrated');
    assert.ok(tools.includes('Docker'), 'Docker must be integrated');
    assert.ok(tools.includes('AWS'), 'AWS must be integrated');
  });

  // Test 3: Catalog API
  await test('GET /api/items returns initial product catalog', async () => {
    const res = await request('/api/items');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.count >= 4);
    assert.strictEqual(Array.isArray(res.body.items), true);
  });

  // Test 4: Single Page UI Serving
  await test('GET / serves HTML interface for end-users', async () => {
    const res = await request('/');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('FullStack Cloud Application'));
    assert.ok(res.body.includes('DevOps 4-Tool Integrated'));
  });

  // Test 5: Telemetry API
  await test('GET /api/telemetry returns 4-tool status payload', async () => {
    const res = await request('/api/telemetry');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.tools.github);
    assert.ok(res.body.tools.jenkins);
    assert.ok(res.body.tools.docker);
    assert.ok(res.body.tools.aws);
  });

  server.close();

  console.log('\n==================================================');
  console.log(`📊 Test Summary: ${passed}/${total} Tests Passed`);
  console.log('==================================================');

  if (passed === total) {
    console.log('🎉 Jenkins Quality Gate: PASSED (Zero Defects)');
    process.exit(0);
  } else {
    console.error('❌ Jenkins Quality Gate: FAILED');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  if (server) server.close();
  process.exit(1);
});
