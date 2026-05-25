#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(__dirname, 'reports');
const DIST_DIR = path.join(ROOT, 'apps/web/dist/web');
const INITIAL_BUNDLE_LIMIT_BYTES = Number(process.env.BUNDLE_INITIAL_LIMIT_BYTES ?? 3_000_000);

function run(cmd, args, cwd = ROOT) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: 'inherit', shell: false });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
  });
}

async function findFile(dir, fileName) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await findFile(full, fileName);
      if (nested) return nested;
    } else if (entry.name === fileName) {
      return full;
    }
  }
  return null;
}

async function listJsFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listJsFiles(full)));
    else if (entry.name.endsWith('.js')) files.push(full);
  }
  return files;
}

async function readStatsInitialOutputs(statsPath) {
  const stats = JSON.parse(await fs.readFile(statsPath, 'utf8'));
  if (!stats.outputs) return null;

  const outputs = stats.outputs;
  const initial = new Set();

  function collectStatic(outputPath) {
    const output = outputs[outputPath];
    if (!output || initial.has(outputPath)) return;

    initial.add(outputPath);
    for (const item of output.imports ?? []) {
      if (item.kind !== 'dynamic-import') collectStatic(item.path);
    }
  }

  for (const [outputPath, output] of Object.entries(outputs)) {
    if (output.entryPoint === 'src/main.ts' || output.entryPoint === 'src/polyfills.ts') {
      collectStatic(outputPath);
    }
    if (output.entryPoint === 'angular:styles/global:styles') {
      initial.add(outputPath);
    }
  }

  const initialFiles = [...initial].sort();
  const initialBytes = initialFiles.reduce((sum, file) => sum + (outputs[file]?.bytes ?? 0), 0);
  const monacoInitialFiles = initialFiles.filter((file) =>
    outputMentions(outputs[file], file, 'monaco'),
  );
  const monacoOutputFiles = Object.entries(outputs)
    .filter(([file, output]) => outputMentions(output, file, 'monaco'))
    .map(([file]) => file)
    .sort();

  return { initialFiles, initialBytes, monacoInitialFiles, monacoOutputFiles };
}

function outputMentions(output, file, needle) {
  const normalizedNeedle = needle.toLowerCase();
  if (file.toLowerCase().includes(normalizedNeedle)) return true;
  return Object.keys(output?.inputs ?? {}).some((input) =>
    input.toLowerCase().includes(normalizedNeedle),
  );
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  console.log('▶ Build web production com stats...');
  await run('pnpm', [
    '--filter',
    'web',
    'exec',
    'ng',
    'build',
    '--configuration=production',
    '--stats-json',
  ]);

  const statsPath = await findFile(DIST_DIR, 'stats.json');
  if (!statsPath) throw new Error('stats.json não encontrado após build --stats-json.');

  const reportPath = path.join(REPORT_DIR, 'web-bundle.html');
  await run('pnpm', [
    'exec',
    'webpack-bundle-analyzer',
    statsPath,
    '--mode',
    'static',
    '--no-open',
    '--report',
    reportPath,
  ]);

  const jsFiles = await listJsFiles(path.join(DIST_DIR, 'browser'));
  const statsInitial = await readStatsInitialOutputs(statsPath);
  const initialFiles =
    statsInitial?.initialFiles ??
    jsFiles.filter((file) => /(^|\/)(main|polyfills|styles)([-.].*)?\.js$/.test(file));
  const initialBytes =
    statsInitial?.initialBytes ??
    (await Promise.all(initialFiles.map(async (file) => (await fs.stat(file)).size))).reduce(
      (sum, size) => sum + size,
      0,
    );
  const monacoFiles =
    statsInitial?.monacoOutputFiles ??
    jsFiles.filter((file) => path.basename(file).toLowerCase().includes('monaco'));
  const monacoInitialFiles =
    statsInitial?.monacoInitialFiles ??
    initialFiles.filter((file) => path.basename(file).toLowerCase().includes('monaco'));

  const summary = {
    analyzedAt: new Date().toISOString(),
    statsPath: path.relative(ROOT, statsPath),
    reportPath: path.relative(ROOT, reportPath),
    initialFiles,
    initialBytes,
    initialLimitBytes: INITIAL_BUNDLE_LIMIT_BYTES,
    initialWithinLimit: initialBytes <= INITIAL_BUNDLE_LIMIT_BYTES,
    monacoOutputFiles: monacoFiles,
    monacoInitialFiles,
    monacoInInitialBundle: monacoInitialFiles.length > 0,
    treeShakingValidated:
      initialBytes <= INITIAL_BUNDLE_LIMIT_BYTES && monacoInitialFiles.length === 0,
  };

  await fs.writeFile(
    path.join(REPORT_DIR, 'web-bundle-summary.json'),
    JSON.stringify(summary, null, 2),
  );
  console.log(`▶ Relatório: ${summary.reportPath}`);
  console.log(`▶ Inicial: ${initialBytes} bytes`);

  if (!summary.treeShakingValidated) {
    throw new Error('Bundle inicial acima do limite ou Monaco presente no carregamento inicial.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
