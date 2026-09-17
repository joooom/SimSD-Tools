import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';

const helpRequests = [];
const webhook = createServer(async (req, res) => {
  let body = '';
  for await (const chunk of req) body += chunk;
  helpRequests.push({ url: req.url, method: req.method, type: req.headers['content-type'], body });
  res.writeHead(200).end('{}');
});
await new Promise(resolve => webhook.listen(0, '127.0.0.1', resolve));

const port = 4200 + Math.floor(Math.random() * 500);
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['server/index.js'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(port),
    SIMSD_DEV_AUTH: '1',
    SIMSD_HELP_WEBHOOK_URL: `http://127.0.0.1:${webhook.address().port}/help`,
    SIMSD_DATABASE_PATH: `data/integration-${Date.now()}.sqlite`,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverOutput = '';
server.stdout.on('data', chunk => { serverOutput += chunk; });
server.stderr.on('data', chunk => { serverOutput += chunk; });

try {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/config`);
      if (response.ok) break;
    } catch {}
    if (attempt === 49) throw new Error(`Servidor de teste não iniciou.\n${serverOutput}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const suite = spawn(process.execPath, ['tests/integration.mjs'], {
    cwd: process.cwd(), env: { ...process.env, TEST_BASE_URL: base }, stdio: 'inherit',
  });
  const exitCode = await new Promise(resolve => suite.on('exit', code => resolve(code ?? 1)));
  if (exitCode !== 0) process.exitCode = exitCode;
  else {
    assert.equal(helpRequests.length, 1);
    const sent = helpRequests[0];
    const url = new URL(sent.url, 'http://localhost');
    assert.equal(url.searchParams.get('room'), '204/A');
    assert.equal(url.searchParams.get('message'), 'Ajuda com áudio & projetor?');
    assert.equal(sent.method, 'POST');
    assert.equal(sent.type, 'application/json');
    assert.equal(sent.body, '{}');
  }
} finally {
  server.kill();
  webhook.closeAllConnections();
  webhook.close();
}
