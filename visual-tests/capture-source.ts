import { join } from 'node:path';
import { capture, SCREENSHOT_ROOT, SOURCE_URL } from './harness';

const files = await capture({ baseUrl: SOURCE_URL, outDir: join(SCREENSHOT_ROOT, 'source') });
console.log(`Captured ${files.length} source screenshots from ${SOURCE_URL}`);
