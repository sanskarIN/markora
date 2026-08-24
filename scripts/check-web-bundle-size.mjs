import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const MAX_DIST_BYTES = 3 * 1024 * 1024;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

async function directorySize(directory) {
  let total = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) total += await directorySize(target);
    else if (entry.isFile()) total += (await stat(target)).size;
  }
  return total;
}

try {
  const bytes = await directorySize(dist);
  const mib = bytes / (1024 * 1024);
  const maxMib = MAX_DIST_BYTES / (1024 * 1024);
  console.log(`Web bundle size: ${mib.toFixed(2)} MiB (budget ${maxMib.toFixed(2)} MiB).`);
  if (bytes > MAX_DIST_BYTES) {
    console.error('Web bundle exceeds the release regression budget. Review dependency or asset growth before release.');
    process.exitCode = 1;
  }
} catch (error) {
  console.error('Could not inspect dist/. Run the production build before the bundle-size check.');
  if (error instanceof Error) console.error(error.message);
  process.exitCode = 1;
}
