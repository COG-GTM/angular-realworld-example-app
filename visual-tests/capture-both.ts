import { join } from 'node:path';
import { capture, REACT_URL, SCREENSHOT_ROOT, SOURCE_URL } from './harness';

const source = await capture({ baseUrl: SOURCE_URL, outDir: join(SCREENSHOT_ROOT, 'source') });
console.log(`Captured ${source.length} source screenshots from ${SOURCE_URL}`);

const react = await capture({ baseUrl: REACT_URL, outDir: join(SCREENSHOT_ROOT, 'react') });
console.log(`Captured ${react.length} React screenshots from ${REACT_URL}`);
