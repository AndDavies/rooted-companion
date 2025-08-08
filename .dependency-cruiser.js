/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: {
      path: [
        'node_modules',
        '\\.(spec|test)\\.(ts|tsx|js)$',
        '^public/',
        '^supabase/',
      ],
    },
    tsPreCompilationDeps: true,
    baseDir: '.',
    tsConfig: { fileName: 'tsconfig.json' },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
      },
    },
  },
  forbidden: [
    // flag circular dependencies
    { name: 'no-circular', severity: 'warn', from: {}, to: { circular: true } },
    // disallow orphan modules
    {
      name: 'no-orphans',
      severity: 'warn',
      from: { orphan: true, pathNot: ['^scripts/'] },
      to: {},
    },
  ],
};


