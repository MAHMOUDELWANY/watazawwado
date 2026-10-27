// Starts Vite on port 3101 for the curriculum preview, from this checkout's node_modules or, in a worktree, the main one's.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const vite = ['node_modules/vite/bin/vite.js', '../../../node_modules/vite/bin/vite.js'].find((p) => existsSync(p));
if (!vite) { console.error('vite not found: run from the project root (or a worktree under .claude/worktrees)'); process.exit(1); }
spawn(process.execPath, [vite, '--port', process.env.PORT || '3101', '--strictPort'], { stdio: 'inherit' }).on('exit', (code) => process.exit(code ?? 0));
