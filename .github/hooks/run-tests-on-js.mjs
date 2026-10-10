import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

let payload = {};
try {
  payload = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const isEdit = /edit|replace|create|write|patch/i.test(payload.tool_name ?? '');
// Matches a quoted path ending in .js/.mjs/.cjs; escaped quotes in file content do not match.
const touchesJs = /\.(?:m|c)?js"/.test(JSON.stringify(payload.tool_input ?? {}));

if (!isEdit || !touchesJs) process.exit(0);

const result = spawnSync('npm test', { shell: true, stdio: 'inherit' });
process.exit(result.status ?? 1);
