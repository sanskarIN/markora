import { readFile } from 'node:fs/promises';
import process from 'node:process';

const files = {
  packageJson: new URL('../package.json', import.meta.url),
  tauriConfig: new URL('../src-tauri/tauri.conf.json', import.meta.url),
  cargoToml: new URL('../src-tauri/Cargo.toml', import.meta.url),
};

function parseCargoPackageVersion(source) {
  const packageSection = source.match(/^\[package\]\s*([\s\S]*?)(?=^\[|\Z)/m)?.[1] ?? '';
  const version = packageSection.match(/^version\s*=\s*"([^"]+)"\s*$/m)?.[1];
  if (!version) throw new Error('Could not read [package].version from src-tauri/Cargo.toml.');
  return version;
}

const [packageRaw, tauriRaw, cargoRaw] = await Promise.all([
  readFile(files.packageJson, 'utf8'),
  readFile(files.tauriConfig, 'utf8'),
  readFile(files.cargoToml, 'utf8'),
]);

const packageVersion = JSON.parse(packageRaw).version;
const tauriVersion = JSON.parse(tauriRaw).version;
const cargoVersion = parseCargoPackageVersion(cargoRaw);

const versions = {
  'package.json': packageVersion,
  'src-tauri/tauri.conf.json': tauriVersion,
  'src-tauri/Cargo.toml': cargoVersion,
};

for (const [file, version] of Object.entries(versions)) {
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
    console.error(`Invalid semantic version in ${file}: ${String(version)}`);
    process.exitCode = 1;
  }
}

const uniqueVersions = new Set(Object.values(versions));
if (uniqueVersions.size !== 1) {
  console.error('Markora version metadata is out of sync:');
  for (const [file, version] of Object.entries(versions)) console.error(`- ${file}: ${version}`);
  process.exitCode = 1;
} else if (!process.exitCode) {
  console.log(`Markora version metadata is synchronized at ${packageVersion}.`);
}
