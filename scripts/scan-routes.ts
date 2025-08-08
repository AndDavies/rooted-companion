/*
  Scans Next.js App Router structure to enumerate routes and methods.
  Outputs routes.md and routes.mmd (Mermaid) under docs/architecture/graphs/.
*/
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { resolve, relative, dirname } from 'path';

const ROOT = process.cwd();
const APP_DIR = resolve(ROOT, 'app');
const OUT_DIR = resolve(ROOT, 'docs/architecture/graphs');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

type RouteEntry = {
  path: string;
  kind: 'page' | 'route' | 'layout' | 'middleware';
  methods?: string[];
  file: string;
};

function toRoutePath(filePath: string): string {
  // Convert app/(group)/segment/page.tsx to /segment
  const rel = relative(APP_DIR, filePath).replace(/\\/g, '/');
  const segments = rel.split('/');
  const parts: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.startsWith('(') && seg.endsWith(')')) continue; // group
    if (seg === 'page.tsx' || seg === 'route.ts' || seg === 'layout.tsx') break;
    parts.push(seg);
  }
  return '/' + parts.join('/');
}

function walk(dir: string): string[] {
  const out: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const abs = resolve(dir, entry);
    const st = statSync(abs);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next' || entry === 'public') continue;
      out.push(...walk(abs));
    } else if (st.isFile()) {
      if (abs.endsWith('page.tsx') || abs.endsWith('route.ts') || abs.endsWith('layout.tsx') || abs.endsWith('middleware.ts')) {
        out.push(relative(ROOT, abs));
      }
    }
  }
  return out;
}

async function scan() {
  const files = walk(ROOT);
  const entries: RouteEntry[] = [];
  for (const f of files) {
    const abs = resolve(ROOT, f);
    if (f === 'middleware.ts') {
      entries.push({ path: '(global)', kind: 'middleware', file: f });
      continue;
    }
    const routePath = toRoutePath(abs);
    if (f.endsWith('page.tsx')) {
      entries.push({ path: routePath, kind: 'page', file: f });
    } else if (f.endsWith('layout.tsx')) {
      entries.push({ path: routePath || '/', kind: 'layout', file: f });
    } else if (f.endsWith('route.ts')) {
      const content = readFileSync(abs, 'utf8');
      const methods = Array.from(content.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/g)).map(m => m[1]);
      entries.push({ path: routePath, kind: 'route', methods, file: f });
    }
  }

  // Write routes.md
  const mdLines: string[] = [];
  mdLines.push('| Path | Kind | Methods | File |');
  mdLines.push('| --- | --- | --- | --- |');
  for (const e of entries.sort((a, b) => a.path.localeCompare(b.path))) {
    mdLines.push(`| ${e.path} | ${e.kind} | ${(e.methods || []).join(', ')} | ${e.file} |`);
  }
  writeFileSync(resolve(OUT_DIR, 'routes.md'), mdLines.join('\n'));

  // Write routes.mmd
  const mmd: string[] = [];
  mmd.push('graph TD');
  const grouped = new Map<string, RouteEntry[]>();
  for (const e of entries) {
    const dir = dirname(e.file);
    const key = relative(APP_DIR, dir).split('/').filter(s => s && !s.startsWith('(')).join('/');
    const k = key || 'root';
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(e);
  }
  for (const [k, arr] of grouped) {
    const cluster = k.replace(/[^A-Za-z0-9_]/g, '_') || 'root';
    mmd.push(`  subgraph "${k || '/'}"`);
    for (const e of arr) {
      const id = (e.path + '-' + e.kind + '-' + e.file).replace(/[^A-Za-z0-9_]/g, '_');
      mmd.push(`    ${id}["${e.path} (${e.kind}${e.methods ? ':' + e.methods.join(',') : ''})\n${e.file}"]`);
    }
    mmd.push('  end');
  }
  writeFileSync(resolve(OUT_DIR, 'routes.mmd'), mmd.join('\n'));

  console.log('Route map written to docs/architecture/graphs/routes.md and routes.mmd');
}

scan().catch((e) => {
  console.error(e);
  process.exit(1);
});


