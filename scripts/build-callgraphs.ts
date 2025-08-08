/*
  Build static call graphs for key entry points using ts-morph.
  Outputs JSON and simple DOT, then renders SVG (if graphviz-cli present via scripts).
*/
import { Project, SyntaxKind, Node, CallExpression, SourceFile, FunctionDeclaration, ArrowFunction, FunctionExpression } from 'ts-morph';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, relative } from 'path';

type Graph = {
  nodes: string[];
  edges: Array<{ from: string; to: string; label?: string }>;
};

const ROOT = process.cwd();
const OUT_DIR = resolve(ROOT, 'docs/architecture/graphs');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const ENTRY_GLOBS = [
  'app/api/**/route.ts',
  'supabase/functions/**/index.ts',
  'lib/llm/**.ts',
];

function functionNameForNode(node: Node): string | undefined {
  if (Node.isFunctionDeclaration(node) && node.getName()) return node.getName();
  if (Node.isMethodDeclaration(node) && node.getName()) return node.getName();
  if (Node.isVariableDeclaration(node)) {
    const init = node.getInitializer();
    if (init && (Node.isArrowFunction(init) || Node.isFunctionExpression(init))) {
      return node.getName();
    }
  }
  return undefined;
}

function buildCallGraphForFile(sf: SourceFile): Graph {
  const nodes = new Set<string>();
  const edges: Graph['edges'] = [];
  const fileId = relative(ROOT, sf.getFilePath());

  sf.forEachDescendant((desc) => {
    if (desc.getKind() === SyntaxKind.CallExpression) {
      const call = desc as CallExpression;
      const expr = call.getExpression();
      const callee = expr.getText();
      const fromFn = desc.getParentWhile(p => !Node.isSourceFile(p));
      const fromName = fromFn ? functionNameForNode(fromFn as any) || '(anon)' : '(root)';
      nodes.add(`${fileId}:${fromName}`);
      nodes.add(`${fileId}:${callee}`);
      edges.push({ from: `${fileId}:${fromName}`, to: `${fileId}:${callee}` });
    }
  });

  return { nodes: Array.from(nodes), edges };
}

function mergeGraphs(graphs: Graph[]): Graph {
  const nodes = new Set<string>();
  const edges: Graph['edges'] = [];
  for (const g of graphs) {
    g.nodes.forEach((n) => nodes.add(n));
    edges.push(...g.edges);
  }
  return { nodes: Array.from(nodes), edges };
}

function graphToDot(graph: Graph, name = 'callgraph'): string {
  const lines = [
    `digraph ${name} {`,
    '  rankdir=LR;',
    '  node [shape=box, fontsize=10];',
  ];
  for (const n of graph.nodes) {
    const safe = n.replace(/"/g, '\\"');
    lines.push(`  "${safe}";`);
  }
  for (const e of graph.edges) {
    const f = e.from.replace(/"/g, '\\"');
    const t = e.to.replace(/"/g, '\\"');
    lines.push(`  "${f}" -> "${t}";`);
  }
  lines.push('}');
  return lines.join('\n');
}

async function main() {
  const project = new Project({ tsConfigFilePath: resolve(ROOT, 'tsconfig.json') });
  // Add entries explicitly to ensure inclusion
  for (const g of ENTRY_GLOBS) {
    project.addSourceFilesAtPaths(resolve(ROOT, g));
  }
  project.resolveSourceFileDependencies();

  const sourceFiles = project.getSourceFiles();

  const targets = sourceFiles.filter((sf) => {
    const p = relative(ROOT, sf.getFilePath());
    return (
      p.startsWith('app/api/') ||
      p.startsWith('supabase/functions/') ||
      p.startsWith('lib/llm/')
    );
  });

  const perFile: Record<string, Graph> = {};
  for (const sf of targets) {
    perFile[relative(ROOT, sf.getFilePath())] = buildCallGraphForFile(sf);
  }

  const merged = mergeGraphs(Object.values(perFile));

  // Write machine-readable outputs
  writeFileSync(resolve(OUT_DIR, 'callgraph-all.json'), JSON.stringify({ perFile, merged }, null, 2));
  writeFileSync(resolve(OUT_DIR, 'callgraph-all.dot'), graphToDot(merged, 'ROOTED'));

  // Split targeted graphs for key entry points
  const namedTargets: Array<{ name: string; match: (p: string) => boolean }> = [
    { name: 'api', match: (p) => p.startsWith('app/api/') },
    { name: 'garmin-webhook', match: (p) => p.includes('app/api/webhooks/garmin/route.ts') },
    { name: 'llm', match: (p) => p.startsWith('lib/llm/') },
    { name: 'edge-dailyEmail', match: (p) => p.includes('supabase/functions/dailyEmail/index.ts') },
  ];

  for (const t of namedTargets) {
    const subset = Object.entries(perFile)
      .filter(([p]) => t.match(p))
      .map(([, g]) => g);
    const g = mergeGraphs(subset);
    writeFileSync(resolve(OUT_DIR, `callgraph-${t.name}.json`), JSON.stringify(g, null, 2));
    writeFileSync(resolve(OUT_DIR, `callgraph-${t.name}.dot`), graphToDot(g, t.name));
  }

  console.log('Callgraphs written to docs/architecture/graphs');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


