import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THRESHOLD = 0.02; // 2% mismatch threshold

interface ComparisonResult {
  file: string;
  mismatchPercent: number;
  passed: boolean;
  totalPixels: number;
  diffPixels: number;
}

function comparePNGs(img1Path: string, img2Path: string, diffPath: string): ComparisonResult {
  const img1Data = fs.readFileSync(img1Path);
  const img2Data = fs.readFileSync(img2Path);

  const img1 = PNG.sync.read(img1Data);
  const img2 = PNG.sync.read(img2Data);

  // Resize to match the smaller dimensions if needed
  const width = Math.min(img1.width, img2.width);
  const height = Math.min(img1.height, img2.height);

  // Create cropped versions if dimensions differ
  const crop = (img: PNG, w: number, h: number): Buffer => {
    if (img.width === w && img.height === h) return img.data;
    const cropped = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const srcIdx = (y * img.width + x) * 4;
        const dstIdx = (y * w + x) * 4;
        cropped[dstIdx] = img.data[srcIdx];
        cropped[dstIdx + 1] = img.data[srcIdx + 1];
        cropped[dstIdx + 2] = img.data[srcIdx + 2];
        cropped[dstIdx + 3] = img.data[srcIdx + 3];
      }
    }
    return cropped;
  };

  const data1 = crop(img1, width, height);
  const data2 = crop(img2, width, height);

  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(data1, data2, diff.data, width, height, {
    threshold: 0.15,
    includeAA: false,
  });

  const totalPixels = width * height;
  const mismatchPercent = diffPixels / totalPixels;

  // Save diff image
  fs.mkdirSync(path.dirname(diffPath), { recursive: true });
  fs.writeFileSync(diffPath, PNG.sync.write(diff));

  return {
    file: path.basename(img1Path),
    mismatchPercent,
    passed: mismatchPercent <= THRESHOLD,
    totalPixels,
    diffPixels,
  };
}

function main() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  const sourceDir = path.join(screenshotsDir, 'source');
  const reactDir = path.join(screenshotsDir, 'react');
  const diffDir = path.join(screenshotsDir, 'diff');

  if (!fs.existsSync(sourceDir)) {
    console.error('❌ Source screenshots not found. Run capture first.');
    process.exit(1);
  }

  if (!fs.existsSync(reactDir)) {
    console.error('❌ React screenshots not found. Run capture first.');
    process.exit(1);
  }

  const sourceFiles = fs.readdirSync(sourceDir).filter(f => f.endsWith('.png'));
  const results: ComparisonResult[] = [];

  console.log('\n🔍 Comparing screenshots...\n');
  console.log('─'.repeat(70));
  console.log(`${'File'.padEnd(35)} ${'Mismatch'.padEnd(12)} ${'Pixels'.padEnd(15)} Result`);
  console.log('─'.repeat(70));

  for (const file of sourceFiles) {
    const sourcePath = path.join(sourceDir, file);
    const reactPath = path.join(reactDir, file);
    const diffPath = path.join(diffDir, file);

    if (!fs.existsSync(reactPath)) {
      console.log(`${file.padEnd(35)} ${'MISSING'.padEnd(12)} ${'N/A'.padEnd(15)} ❌ FAIL`);
      results.push({
        file,
        mismatchPercent: 1,
        passed: false,
        totalPixels: 0,
        diffPixels: 0,
      });
      continue;
    }

    const result = comparePNGs(sourcePath, reactPath, diffPath);
    results.push(result);

    const pct = (result.mismatchPercent * 100).toFixed(2) + '%';
    const pixels = `${result.diffPixels}/${result.totalPixels}`;
    const status = result.passed ? '✓ PASS' : '❌ FAIL';
    console.log(`${file.padEnd(35)} ${pct.padEnd(12)} ${pixels.padEnd(15)} ${status}`);
  }

  console.log('─'.repeat(70));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;

  console.log(`\n${allPassed ? '✅' : '❌'} Results: ${passed}/${total} passed (threshold: ${THRESHOLD * 100}%)\n`);

  if (!allPassed) {
    console.log('Failed comparisons:');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  - ${r.file}: ${(r.mismatchPercent * 100).toFixed(2)}% mismatch`);
      });
    console.log(`\nDiff images saved to: ${diffDir}`);
  }

  process.exit(allPassed ? 0 : 1);
}

main();
