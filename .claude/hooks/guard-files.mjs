// PreToolUse guard: blocks edits to applied Supabase migrations and .env files.
// New migration files are allowed; existing ones are immutable once applied.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const filePath = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
if (!filePath) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const rel = path.relative(projectDir, path.resolve(projectDir, filePath)).split(path.sep).join('/');
const base = path.basename(rel);

function block(reason) {
  process.stderr.write(reason + '\n');
  process.exit(2);
}

if (base.startsWith('.env') && base !== '.env.example') {
  block(`Blocked: ${rel} holds secrets. Ask the user to edit it themselves.`);
}

if (/^supabase\/migrations\/[^/]+\.sql$/.test(rel) && existsSync(path.resolve(projectDir, rel))) {
  block(
    `Blocked: ${rel} is an existing migration and may already be applied in production. ` +
    `Create a new migration file instead (use the new-migration skill).`
  );
}
