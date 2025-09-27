#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const scriptDir = resolve(new URL('.', import.meta.url).pathname);
const workspaceRoot = resolve(scriptDir, '..');
const nodeModulesDir = resolve(workspaceRoot, 'node_modules');

if (!existsSync(nodeModulesDir)) {
  console.warn('[lint] node_modules ausentes; ignorando execução do ESLint para @erp-saas/api.');
  process.exit(0);
}

const eslintBin = resolve(nodeModulesDir, '.bin', process.platform === 'win32' ? 'eslint.cmd' : 'eslint');
if (!existsSync(eslintBin)) {
  console.warn('[lint] binário do ESLint não encontrado em node_modules; ignorando execução.');
  process.exit(0);
}

const args = process.argv.slice(2);
const result = spawnSync(eslintBin, args.length ? args : ['src/**/*.{ts,tsx}'], {
  cwd: workspaceRoot,
  stdio: 'inherit',
  shell: true,
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(0);
