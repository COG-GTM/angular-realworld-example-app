import { join } from 'node:path';
import { capture, REACT_URL, SCREENSHOT_ROOT } from './harness';

const files = await capture({ baseUrl: REACT_URL, outDir: join(SCREENSHOT_ROOT, 'react') });
console.log(`Captured ${files.length} React screenshots from ${REACT_URL}`);
