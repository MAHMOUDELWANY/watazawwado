import { spawn, spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import fs from 'fs';
import { parseEnv } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isWindows = process.platform === 'win32';
// Parallel testing sessions each use their own port (docs/testing/RULES.md): PORT=3001 npm test.
const PORT = String(process.env.PORT || 3000);
const BASE_URL = `http://localhost:${PORT}`;

// A worktree (.claude/worktrees/<name>) has no .env of its own: use the main checkout's, never overriding the shell.
function envFromMainCheckout() {
  if (fs.existsSync(path.join(__dirname, '.env'))) return {};
  const i = __dirname.indexOf(path.join('.claude', 'worktrees'));
  const file = i >= 0 ? path.join(__dirname.slice(0, i), '.env') : null;
  return file && fs.existsSync(file) ? parseEnv(fs.readFileSync(file, 'utf8')) : {};
}

async function checkPort() {
  return new Promise((resolve) => {
    http.get(`http://127.0.0.1:${PORT}/api/health`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

// `npm` is npm.cmd on Windows, which Node only spawns through a shell.
// A single command string (no args array) avoids Node's DEP0190 shell-args warning.
function npmRun(script, options) {
  return spawn(`npm run ${script}`, { cwd: __dirname, shell: true, ...options });
}

// Kills the server and everything it spawned (shell -> npm -> tsx -> node).
function killTree(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  if (isWindows) {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM'); // negative pid = the whole process group (detached below)
    } catch {
      child.kill('SIGTERM');
    }
  }
}

async function run() {
  // Otherwise the tests would silently run against whatever is already on that port,
  // which may lack ALLOW_DEV_AUTH or use a different .env.
  if (await checkPort()) {
    console.error(`Port ${PORT} is already serving /api/health. Stop that server first, or run \`TEST_BASE_URL=${BASE_URL} npm run test-only\` against it.`);
    process.exit(1);
  }

  console.log(`Starting local dev server for tests on ${BASE_URL}...`);

  const env = {
    ...envFromMainCheckout(),
    ...process.env,
    PORT,
    ALLOW_DEV_AUTH: 'true',
    APP_URL: BASE_URL,
    TEST_BASE_URL: BASE_URL
  };

  const server = npmRun('dev', { env, stdio: ['ignore', 'pipe', 'pipe'], detached: !isWindows });
  let serverLog = '';
  const capture = (chunk) => { serverLog = (serverLog + chunk).slice(-8000); };
  server.stdout.on('data', capture);
  server.stderr.on('data', capture);

  let serverExited = false;
  server.on('exit', () => { serverExited = true; });
  server.on('error', (err) => {
    console.error('Failed to spawn the dev server:', err.message);
    serverExited = true;
  });

  const cleanup = () => killTree(server);
  process.on('exit', cleanup);
  process.on('SIGINT', () => process.exit(130));
  process.on('SIGTERM', () => process.exit(143));

  let serverStarted = false;
  let timeout = 600; // 60 seconds maximum wait (tsx + Vite middleware is slow on a cold Windows start)

  while (!serverStarted && !serverExited && timeout > 0) {
    serverStarted = await checkPort();
    if (!serverStarted) {
      await new Promise(r => setTimeout(r, 100));
      timeout--;
    }
  }

  if (!serverStarted) {
    console.error(serverExited
      ? 'Test server exited before it was ready.'
      : `Test server failed to start on port ${PORT} within timeout.`);
    console.error(serverLog);
    process.exit(1);
  }

  console.log('Test server ready. Running tests...');
  const tests = npmRun('test-only', { env, stdio: 'inherit' });

  tests.on('close', (code) => {
    console.log(`\nTests finished with code ${code}. Shutting down server...`);
    process.exit(code ?? 1);
  });
}

run();
