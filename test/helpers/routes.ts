/**
 * Every /api route of the server, read from the source: method, path, and the guard on the route line.
 * Used by the permission matrix (test/p3-auth-matrix.test.ts) and the coverage count (test/p3-endpoint-coverage.test.ts).
 *
 * Guards: `admin` = verifyTeacherAuth + requireSuperAdmin, `teacher`, `student`, `signed` = any signed-in account
 * (withActor), `open` = no middleware (public data, webhooks, cron, or a check inside the handler).
 */
import fs from 'node:fs';
import path from 'node:path';

export type Guard = 'admin' | 'teacher' | 'student' | 'signed' | 'open';
export interface Route { method: string; path: string; guard: Guard; file: string; line: number }

// One route per line in this codebase; the middle part is everything between the path and the handler's `(req`.
const ROUTE = /\bapp\.(get|post|put|patch|delete|all)\(\s*(['"`])(\/api\/[^'"`]+)\2\s*,([^\n]{0,400}?)(?:async\s*)?\(\s*_?(?:req|request)\b/g;

function sourceFiles(): string[] {
  const dir = path.join('server', 'routes');
  return ['api/index.ts', ...fs.readdirSync(dir).filter(f => f.endsWith('.ts')).map(f => path.join(dir, f).replace(/\\/g, '/'))];
}

export function listRoutes(): Route[] {
  const routes: Route[] = [];
  for (const file of sourceFiles()) {
    const src = fs.readFileSync(file, 'utf8');
    // `...guard` / `...admin` / `...me`: a local array of middlewares; read what it holds.
    const spread = (name: string) => src.match(new RegExp(`const\\s+${name}\\s*=\\s*\\[([^\\]]*)\\]`))?.[1] || '';
    for (const m of src.matchAll(ROUTE)) {
      const chain = m[4].replace(/\.\.\.(\w+)/g, (_all, name) => spread(name));
      const line = src.slice(0, m.index).split('\n').length;
      const add = (routePath: string, guard: Guard) => routes.push({ method: m[1].toUpperCase(), path: routePath, guard, file, line });
      // server/routes/push.ts registers the same two routes for each role in a loop.
      if (m[3].includes('${role}')) { add(m[3].replace('${role}', 'student'), 'student'); add(m[3].replace('${role}', 'teacher'), 'teacher'); continue; }
      add(m[3], /requireSuperAdmin/.test(chain) ? 'admin' : /verifyTeacherAuth/.test(chain) ? 'teacher' : /verifyStudentAuth/.test(chain) ? 'student' : /withActor\(/.test(chain) ? 'signed' : 'open');
    }
  }
  return routes;
}

/** The path with every `:param` filled by `value`. */
export const fill = (routePath: string, value: string) => routePath.replace(/:\w+/g, value);
