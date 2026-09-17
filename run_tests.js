import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkPort() {
  return new Promise((resolve) => {
    http.get('http://127.0.0.1:3000/api/health', (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function run() {
  console.log('Starting local dev server for tests...');

  const env = {
    ...process.env,
    PORT: '3000',
    APP_URL: 'http://localhost:3000'
  };

  const server = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    env,
  });

  let serverStarted = false;
  let timeout = 200; // 20 seconds maximum wait

  while (!serverStarted && timeout > 0) {
    serverStarted = await checkPort();
    if (!serverStarted) {
      await new Promise(r => setTimeout(r, 100));
      timeout--;
    }
  }

  if (!serverStarted) {
    console.error('Test server failed to start on port 3000 within timeout.');
    server.kill();
    process.exit(1);
  }

  console.log('Test server ready. Running tests...');
  const tests = spawn('npm', ['run', 'test-only'], {
    cwd: __dirname,
    env,
    stdio: 'inherit'
  });

  const cleanup = () => {
    if (!server.killed) {
        server.kill();
    }
  };

  process.on('SIGINT', () => {
      cleanup();
      process.exit(1);
  });

  process.on('SIGTERM', () => {
      cleanup();
      process.exit(1);
  });

  tests.on('close', (code) => {
    console.log(`\nTests finished with code ${code}. Shutting down server...`);
    cleanup();
    process.exit(code);
  });
}

run();
