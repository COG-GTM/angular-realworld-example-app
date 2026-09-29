#!/usr/bin/env node
// Summarises an `ng build --stats-json` output: initial bundle size and the
// total JavaScript each lazy route entry needs on first navigation.
// Usage: node scripts/bundle-report.mjs [distDir] [--json]
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const distDir = args.find(a => !a.startsWith('--')) ?? 'dist/angular-conduit';
const browserDir = join(distDir, 'browser');
const { outputs } = JSON.parse(readFileSync(join(distDir, 'stats.json'), 'utf8'));

const sizeCache = new Map();
const sizeOf = file => {
  if (!sizeCache.has(file)) {
    const buf = readFileSync(join(browserDir, file));
    sizeCache.set(file, { raw: buf.length, gzip: gzipSync(buf, { level: 9 }).length });
  }
  return sizeCache.get(file);
};

const staticClosure = roots => {
  const seen = new Set();
  const stack = [...roots];
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    for (const imp of outputs[file]?.imports ?? []) {
      if (imp.kind === 'import-statement') stack.push(imp.path);
    }
  }
  return seen;
};

const total = files =>
  [...files].reduce(
    (acc, f) => {
      const s = sizeOf(f);
      return { raw: acc.raw + s.raw, gzip: acc.gzip + s.gzip };
    },
    { raw: 0, gzip: 0 },
  );

const jsFiles = Object.keys(outputs).filter(f => f.endsWith('.js'));
const mainFile = jsFiles.find(f => outputs[f].entryPoint === 'src/main.ts');
const initialJs = staticClosure([mainFile]);
const initialCss = Object.keys(outputs).filter(f => f.endsWith('.css') && outputs[f].entryPoint);

const lazy = jsFiles
  .filter(f => f !== mainFile && outputs[f].entryPoint)
  .map(f => {
    const extra = [...staticClosure([f])].filter(c => !initialJs.has(c));
    return {
      entry: relative('src/app', outputs[f].entryPoint)
        .replace(/^(\.\.\/)+node_modules\//, '')
        .replace(/\.(m?js|ts)$/, ''),
      chunk: f,
      extra: total(extra),
      firstLoad: total(new Set([...initialJs, ...extra])),
    };
  })
  .sort((a, b) => a.entry.localeCompare(b.entry));

const report = {
  initial: { js: total(initialJs), css: total(initialCss), jsChunks: initialJs.size },
  allJs: total(jsFiles),
  lazy,
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const kb = n => (n / 1024).toFixed(2).padStart(8) + ' kB';
  const row = (name, s) => `${name.padEnd(60)}${kb(s.raw)}${kb(s.gzip)}`;
  console.log(`${''.padEnd(60)}${'raw'.padStart(11)}${'gzip'.padStart(11)}`);
  console.log(row(`Initial JS (${report.initial.jsChunks} chunks)`, report.initial.js));
  console.log(row('Initial CSS', report.initial.css));
  console.log(row('All JS emitted', report.allJs));
  console.log('\nLazy entry: extra JS on first navigation / total JS for a cold load');
  for (const l of lazy) {
    console.log(row(`  ${l.entry} (+lazy)`, l.extra));
    console.log(row(`  ${l.entry} (cold load)`, l.firstLoad));
  }
}
