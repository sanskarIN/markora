import { readFile } from 'node:fs/promises';
import process from 'node:process';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const version = packageJson.version;
const expectedTag = `v${version}`;
const actualTag = process.env.GITHUB_REF_NAME ?? process.argv[2] ?? '';

if (!actualTag) {
  console.error('Release tag is required. Pass it as GITHUB_REF_NAME or the first argument.');
  process.exitCode = 1;
} else if (actualTag !== expectedTag) {
  console.error(`Release tag mismatch: expected ${expectedTag}, received ${actualTag}.`);
  process.exitCode = 1;
} else {
  console.log(`Release tag ${actualTag} matches package version ${version}.`);
}
