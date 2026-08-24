import { readFile } from 'node:fs/promises';
import process from 'node:process';

const root = new URL('../', import.meta.url);
const [desktopRaw, mobileRaw, buildRaw, permissionsRaw] = await Promise.all([
  readFile(new URL('src-tauri/capabilities/default.json', root), 'utf8'),
  readFile(new URL('src-tauri/capabilities/mobile.json', root), 'utf8'),
  readFile(new URL('src-tauri/build.rs', root), 'utf8'),
  readFile(new URL('src-tauri/permissions/markora-commands.toml', root), 'utf8'),
]);

const desktop = JSON.parse(desktopRaw);
const mobile = JSON.parse(mobileRaw);
let failed = false;

function fail(message) {
  console.error(`Capability audit failed: ${message}`);
  failed = true;
}

function sameSet(actual, expected) {
  return actual.length === expected.length && actual.every((value) => expected.includes(value));
}

for (const [name, capability] of [
  ['desktop', desktop],
  ['mobile', mobile],
]) {
  if (capability.remote) fail(`${name} capability must not grant remote-origin IPC access.`);
  if (!Array.isArray(capability.windows) || !sameSet(capability.windows, ['main'])) {
    fail(`${name} capability must apply only to the main window.`);
  }
  if (!Array.isArray(capability.permissions)) fail(`${name} capability permissions are missing.`);
  if (capability.permissions?.includes('core:default')) {
    fail(`${name} capability must not use broad core:default permissions.`);
  }
}

if (!sameSet(desktop.platforms ?? [], ['linux', 'macOS', 'windows'])) {
  fail('desktop capability platform scope must be linux/macOS/windows only.');
}
if (!sameSet(mobile.platforms ?? [], ['android', 'iOS'])) {
  fail('mobile capability platform scope must be android/iOS only.');
}
if (!desktop.permissions.includes('core:event:default')) fail('desktop event permission is required for drag/drop events.');
if (!desktop.permissions.includes('desktop-workspace-commands')) fail('desktop command permission set is missing.');
if (!mobile.permissions.includes('core:event:default')) fail('mobile event permission is required for lifecycle/open-with events.');
if (!mobile.permissions.includes('mobile-lifecycle-commands')) fail('mobile lifecycle command permission set is missing.');

for (const required of [
  'dialog:allow-open',
  'dialog:allow-save',
  'fs:allow-stat',
  'fs:allow-read-text-file',
  'fs:allow-write-text-file',
  'opener:allow-default-urls',
]) {
  if (!mobile.permissions.includes(required)) fail(`mobile permission ${required} is required by the platform adapter.`);
}

const commandBlock = buildRaw.match(/const COMMANDS:\s*&\[&str\]\s*=\s*&\[([\s\S]*?)\];/)?.[1] ?? '';
const manifestCommands = [...commandBlock.matchAll(/"([a-z0-9_]+)"/g)].map((match) => match[1]);
if (!manifestCommands.length) fail('no explicit application commands were found in src-tauri/build.rs.');

const permissionCommands = [...permissionsRaw.matchAll(/commands\.allow\s*=\s*\[([\s\S]*?)\]/g)]
  .flatMap((match) => [...match[1].matchAll(/"([a-z0-9_]+)"/g)].map((entry) => entry[1]));

const manifestSet = new Set(manifestCommands);
const permissionSet = new Set(permissionCommands);
for (const command of manifestSet) {
  if (!permissionSet.has(command)) fail(`manifest command ${command} is not granted by an explicit app permission.`);
}
for (const command of permissionSet) {
  if (!manifestSet.has(command)) fail(`permission grants unknown application command ${command}.`);
}

if (manifestSet.size !== manifestCommands.length) fail('duplicate application command in build manifest.');

if (failed) process.exitCode = 1;
else console.log(`Tauri capability audit passed for ${manifestSet.size} explicit application commands.`);
