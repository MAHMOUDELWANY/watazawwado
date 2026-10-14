// Stop hook: type-checks the project and reports errors only in files changed
// since HEAD, so pre-existing errors elsewhere don't block every turn.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
if (input.stop_hook_active) process.exit(0); // already re-prompted once; don't loop

const cwd = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).split('\n').filter(Boolean);

const changed = new Set(
  [...git('diff', '--name-only', 'HEAD'), ...git('ls-files', '--others', '--exclude-standard')]
    .filter((f) => /\.tsx?$/.test(f))
);
if (changed.size === 0) process.exit(0);

const tsc = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '--pretty', 'false'], {
  cwd,
  encoding: 'utf8',
});
const errors = tsc.stdout
  .split('\n')
  .filter((line) => /error TS\d+/.test(line) && changed.has(line.split('(')[0].replace(/\\/g, '/')));

if (errors.length > 0) {
  process.stderr.write(`Type errors in files you changed:\n${errors.join('\n')}\n`);
  process.exit(2);
}
