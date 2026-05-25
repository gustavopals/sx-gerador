#!/usr/bin/env node
/* global axe, document, localStorage */
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const axeCore = require('axe-core');
const puppeteer = require('puppeteer');
const pages = require('../lighthouse/pages.cjs');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const WEB_DIST = path.join(ROOT, 'apps/web/dist/web/browser');
const REPORTS_DIR = path.join(__dirname, 'reports');
const PORT = Number(process.env.A11Y_PORT ?? 4290);
const API_URL = process.env.A11Y_API_URL ?? 'http://localhost:3000/api/v1';
const HEALTH_URL = process.env.A11Y_HEALTH_URL ?? 'http://localhost:3000/health';
const skipBuild = process.argv.includes('--skip-build');
const guestOnly = process.argv.includes('--guest-only');
const pagesToAudit = guestOnly ? pages.filter((p) => !p.auth) : pages;

function run(cmd, args, cwd = ROOT, stdio = 'inherit') {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio, shell: false });
    child.on('exit', (code) =>
      code === 0 ? resolve(child) : reject(new Error(`${cmd} exit ${code}`)),
    );
  });
}

async function waitForApi(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const res = await fetch(HEALTH_URL);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`API não respondeu em ${API_URL}.`);
}

async function fetchSeedIdsAndTokens() {
  const email = process.env.A11Y_EMAIL ?? 'dev@sxgerador.local';
  const password = process.env.A11Y_PASSWORD ?? 'dev123456';
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!loginRes.ok) throw new Error('Login de auditoria falhou.');
  const tokens = await loginRes.json();

  const projectsRes = await fetch(`${API_URL}/projects`, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  if (!projectsRes.ok) throw new Error('Falha ao listar projetos para auditoria.');
  const project = (await projectsRes.json()).projects?.[0];

  const tablesRes = await fetch(`${API_URL}/projects/${project.id}/tables`, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  if (!tablesRes.ok) throw new Error('Falha ao listar tabelas para auditoria.');
  const table = (await tablesRes.json()).tables?.[0];

  return { tokens, ids: { projectId: project.id, tableId: table.id } };
}

function resolvePath(pageDef, ids) {
  let pagePath = pageDef.path;
  pagePath = pagePath.replaceAll('__PROJECT_ID__', ids.projectId);
  pagePath = pagePath.replaceAll('__TABLE_ID__', ids.tableId);
  return pagePath;
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = spawn(
      process.execPath,
      [
        path.join(ROOT, 'tools/lighthouse/static-server.mjs'),
        '--port',
        String(PORT),
        '--root',
        WEB_DIST,
      ],
      { stdio: ['ignore', 'pipe', 'inherit'], cwd: ROOT },
    );
    server.stdout?.on('data', (chunk) => {
      if (chunk.toString().includes('LISTENING')) resolve(server);
    });
    server.on('error', reject);
    setTimeout(() => reject(new Error('Timeout ao subir servidor estático.')), 15_000);
  });
}

async function seedAuth(page, baseUrl, tokens) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate((pair) => {
    localStorage.setItem('sxg_access_token', pair.accessToken);
    localStorage.setItem('sxg_refresh_token', pair.refreshToken);
  }, tokens);
}

async function main() {
  if (!skipBuild) await run('pnpm', ['lighthouse:build']);
  await fs.mkdir(REPORTS_DIR, { recursive: true });

  let ids = { projectId: 'guest', tableId: 'guest' };
  let tokens = null;
  if (!guestOnly) {
    await waitForApi();
    const seed = await fetchSeedIdsAndTokens();
    ids = seed.ids;
    tokens = seed.tokens;
  }

  const server = await startStaticServer();
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const results = [];

  try {
    for (const pageDef of pagesToAudit) {
      const page = await browser.newPage();
      if (pageDef.auth && tokens) await seedAuth(page, baseUrl, tokens);
      const pagePath = resolvePath(pageDef, ids);
      await page.goto(`${baseUrl}${pagePath}`, { waitUntil: 'networkidle0' });
      await page.addScriptTag({ content: axeCore.source });
      const violations = await page.evaluate(async () => {
        const result = await axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
        });
        return result.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          nodes: violation.nodes.map((node) => node.target),
        }));
      });
      await page.close();
      results.push({ id: pageDef.id, label: pageDef.label, path: pagePath, violations });
      console.log(`${pageDef.label}: ${violations.length} violação(ões)`);
    }
  } finally {
    await browser.close();
    server.kill('SIGTERM');
  }

  const passed = results.every((result) => result.violations.length === 0);
  await fs.writeFile(
    path.join(REPORTS_DIR, 'axe-summary.json'),
    JSON.stringify({ auditedAt: new Date().toISOString(), passed, results }, null, 2),
  );

  if (!passed) throw new Error('axe-core encontrou violações de acessibilidade.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
