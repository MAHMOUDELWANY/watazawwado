// Minimal stdio MCP client: node mcp.mjs '<method>' '<json params>'
import { spawn } from 'node:child_process';
const [method, params = '{}'] = process.argv.slice(2);
const p = spawn('npx', ['-y', 'woven-sfx-mcp'], { shell: true, stdio: ['pipe', 'pipe', 'inherit'] });
let buf = '';
const send = (o) => p.stdin.write(JSON.stringify(o) + '\n');
p.stdout.on('data', (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i); buf = buf.slice(i + 1);
    if (!line.trim()) continue;
    const m = JSON.parse(line);
    if (m.id === 1) { send({ jsonrpc: '2.0', method: 'notifications/initialized' }); send({ jsonrpc: '2.0', id: 2, method, params: JSON.parse(params) }); }
    else if (m.id === 2) { console.log(JSON.stringify(m.result ?? m.error, null, 1)); p.kill(); process.exit(0); }
  }
});
send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'cli', version: '1' } } });
setTimeout(() => { console.error('timeout'); p.kill(); process.exit(1); }, 120000);
