import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { SCREENSHOT_ROOT, VIEWPORTS, VIEWS, type ViewportName } from './harness';

const THRESHOLD = Number(process.env.MISMATCH_THRESHOLD ?? '2');
const sourceDir = join(SCREENSHOT_ROOT, 'source');
const reactDir = join(SCREENSHOT_ROOT, 'react');
const diffDir = join(SCREENSHOT_ROOT, 'diffs');

mkdirSync(diffDir, { recursive: true });

interface Result {
  name: string;
  mismatch: number;
  passed: boolean;
}

function pad(image: PNG, width: number, height: number): PNG {
  if (image.width === width && image.height === height) return image;
  const padded = new PNG({ width, height, fill: true });
  // Fill with white so extra height does not count as a hard black/transparent diff.
  padded.data.fill(0xff);
  PNG.bitblt(image, padded, 0, 0, Math.min(image.width, width), Math.min(image.height, height), 0, 0);
  return padded;
}

const results: Result[] = [];

for (const view of VIEWS) {
  for (const viewport of Object.keys(VIEWPORTS) as ViewportName[]) {
    const name = `${view.name}-${viewport}`;
    const sourceFile = join(sourceDir, `${name}.png`);
    const reactFile = join(reactDir, `${name}.png`);

    if (!existsSync(sourceFile) || !existsSync(reactFile)) {
      results.push({ name, mismatch: 100, passed: false });
      continue;
    }

    const sourcePng = PNG.sync.read(readFileSync(sourceFile));
    const reactPng = PNG.sync.read(readFileSync(reactFile));
    const width = Math.max(sourcePng.width, reactPng.width);
    const height = Math.max(sourcePng.height, reactPng.height);
    const a = pad(sourcePng, width, height);
    const b = pad(reactPng, width, height);
    const diff = new PNG({ width, height });

    const differing = pixelmatch(a.data, b.data, diff.data, width, height, { threshold: 0.15 });
    const mismatch = (differing / (width * height)) * 100;
    writeFileSync(join(diffDir, `${name}.png`), PNG.sync.write(diff));
    results.push({ name, mismatch, passed: mismatch < THRESHOLD });
  }
}

const width = Math.max(...results.map(result => result.name.length));
for (const result of results) {
  console.log(`${result.passed ? 'PASS' : 'FAIL'}  ${result.name.padEnd(width)}  ${result.mismatch.toFixed(3)}%`);
}

const failures = results.filter(result => !result.passed);
const worst = results.reduce((max, result) => Math.max(max, result.mismatch), 0);
console.log(
  `\n${results.length - failures.length}/${results.length} pairs under ${THRESHOLD}% (worst ${worst.toFixed(3)}%)`,
);

if (failures.length > 0) process.exit(1);
