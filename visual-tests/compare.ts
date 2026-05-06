import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const SOURCE_DIR = path.join(__dirname, 'screenshots', 'source');
const REACT_DIR = path.join(__dirname, 'screenshots', 'react');
const DIFF_DIR = path.join(__dirname, 'screenshots', 'diff');
const THRESHOLD = 0.02; // 2% mismatch threshold

interface CompareResult {
  name: string;
  mismatchPercentage: number;
  pass: boolean;
  reason?: string;
}

function comparePair(sourceFile: string, reactFile: string, diffFile: string): CompareResult {
  const name = path.basename(sourceFile);

  if (!fs.existsSync(sourceFile)) {
    return { name, mismatchPercentage: 100, pass: false, reason: 'Source screenshot missing' };
  }
  if (!fs.existsSync(reactFile)) {
    return { name, mismatchPercentage: 100, pass: false, reason: 'React screenshot missing' };
  }

  const sourceImg = PNG.sync.read(fs.readFileSync(sourceFile));
  const reactImg = PNG.sync.read(fs.readFileSync(reactFile));

  // If dimensions differ, we need to resize to the larger size
  const width = Math.max(sourceImg.width, reactImg.width);
  const height = Math.max(sourceImg.height, reactImg.height);

  // Create canvases of uniform size
  const sourceCanvas = new PNG({ width, height });
  const reactCanvas = new PNG({ width, height });

  // Fill with white background
  for (let i = 0; i < width * height * 4; i += 4) {
    sourceCanvas.data[i] = 255;
    sourceCanvas.data[i + 1] = 255;
    sourceCanvas.data[i + 2] = 255;
    sourceCanvas.data[i + 3] = 255;
    reactCanvas.data[i] = 255;
    reactCanvas.data[i + 1] = 255;
    reactCanvas.data[i + 2] = 255;
    reactCanvas.data[i + 3] = 255;
  }

  // Copy source image onto canvas
  for (let y = 0; y < sourceImg.height; y++) {
    for (let x = 0; x < sourceImg.width; x++) {
      const idx = (y * sourceImg.width + x) * 4;
      const canvasIdx = (y * width + x) * 4;
      sourceCanvas.data[canvasIdx] = sourceImg.data[idx];
      sourceCanvas.data[canvasIdx + 1] = sourceImg.data[idx + 1];
      sourceCanvas.data[canvasIdx + 2] = sourceImg.data[idx + 2];
      sourceCanvas.data[canvasIdx + 3] = sourceImg.data[idx + 3];
    }
  }

  // Copy react image onto canvas
  for (let y = 0; y < reactImg.height; y++) {
    for (let x = 0; x < reactImg.width; x++) {
      const idx = (y * reactImg.width + x) * 4;
      const canvasIdx = (y * width + x) * 4;
      reactCanvas.data[canvasIdx] = reactImg.data[idx];
      reactCanvas.data[canvasIdx + 1] = reactImg.data[idx + 1];
      reactCanvas.data[canvasIdx + 2] = reactImg.data[idx + 2];
      reactCanvas.data[canvasIdx + 3] = reactImg.data[idx + 3];
    }
  }

  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    sourceCanvas.data as unknown as Uint8Array,
    reactCanvas.data as unknown as Uint8Array,
    diff.data as unknown as Uint8Array,
    width,
    height,
    { threshold: 0.1 },
  );

  const totalPixels = width * height;
  const mismatchPercentage = (numDiffPixels / totalPixels) * 100;

  // Save diff image
  fs.writeFileSync(diffFile, PNG.sync.write(diff));

  return {
    name,
    mismatchPercentage: Math.round(mismatchPercentage * 100) / 100,
    pass: mismatchPercentage < THRESHOLD * 100,
  };
}

function main() {
  if (!fs.existsSync(DIFF_DIR)) {
    fs.mkdirSync(DIFF_DIR, { recursive: true });
  }

  const sourceFiles = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.png'));
  const results: CompareResult[] = [];

  console.log('Visual Regression Comparison');
  console.log('============================\n');
  console.log(`Source dir: ${SOURCE_DIR}`);
  console.log(`React dir:  ${REACT_DIR}`);
  console.log(`Diff dir:   ${DIFF_DIR}`);
  console.log(`Threshold:  ${THRESHOLD * 100}%\n`);

  for (const file of sourceFiles) {
    const sourceFile = path.join(SOURCE_DIR, file);
    const reactFile = path.join(REACT_DIR, file);
    const diffFile = path.join(DIFF_DIR, file);

    const result = comparePair(sourceFile, reactFile, diffFile);
    results.push(result);

    const status = result.pass ? 'PASS' : 'FAIL';
    const reason = result.reason ? ` (${result.reason})` : '';
    console.log(`[${status}] ${result.name}: ${result.mismatchPercentage}%${reason}`);
  }

  console.log('\n============================');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`Results: ${passed} passed, ${failed} failed out of ${results.length} total`);

  if (failed > 0) {
    console.log('\nFailing tests:');
    results
      .filter(r => !r.pass)
      .forEach(r => {
        console.log(`  - ${r.name}: ${r.mismatchPercentage}%${r.reason ? ` (${r.reason})` : ''}`);
      });
    process.exit(1);
  } else {
    console.log('\nAll visual regression tests PASSED!');
  }
}

main();
