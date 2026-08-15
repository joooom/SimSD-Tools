import { spawn } from 'node:child_process';

const port = 4200 + Math.floor(Math.random() * 500);
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['server/index.js'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(port),
    SIMSD_DEV_AUTH: '1',
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
} finally {
  server.kill();
}
