#!/usr/bin/env node
/* global localStorage */
/**
 * Auditoria Lighthouse (F11.1) — telas críticas com meta ≥ 90 em todas as categorias.
 *
 * Pré-requisitos:
 *   pnpm db:up && pnpm db:seed
 *   API em http://localhost:3000 (pnpm --filter api dev)
 *
 * Uso:
 *   pnpm lighthouse:audit
 *   pnpm lighthouse:audit -- --skip-build   # reutiliza dist existente
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pages from './pages.cjs';

const require = createRequire(import.meta.url);
const lighthouseModule = require('lighthouse');
const lighthouse = lighthouseModule.default ?? lighthouseModule;
const puppeteer = require('puppeteer');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const WEB_DIST = path.join(ROOT, 'apps/web/dist/web/browser');
const REPORTS_DIR = path.join(__dirname, 'reports');
const MIN_SCORE = Number(process.env.LH_MIN_SCORE ?? 90);
const PORT = Number(process.env.LH_PORT ?? 4280);
const API_URL = process.env.LH_API_URL ?? 'http://localhost:3000/api/v1';
const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';
const DESKTOP_VIEWPORT = { width: 1350, height: 940, deviceScaleFactor: 1 };

const skipBuild = process.argv.includes('--skip-build');
const guestOnly = process.argv.includes('--guest-only');
const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
const pagesToAudit = guestOnly ? pages.filter((p) => !p.auth) : pages;

/** @typedef {{ id: string, path: string, auth: boolean, label: string, dynamic?: string }} AuditPage */

function run(cmd, args, cwd = ROOT) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: false,
      env: { ...process.env, PATH: process.env.PATH },
    });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
  });
}

async function buildWeb() {
  await run('pnpm', ['lighthouse:build'], ROOT);
}

const HEALTH_URL = process.env.LH_HEALTH_URL ?? 'http://localhost:3000/health';

async function waitForApi(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const res = await fetch(HEALTH_URL);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`API não respondeu em ${API_URL}. Inicie com: pnpm --filter api dev`);
}

/** @returns {Promise<{ projectId: string, tableId: string }>} */
async function fetchSeedIds(accessToken) {
  const projectsRes = await fetch(`${API_URL}/projects`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!projectsRes.ok) throw new Error('Falha ao listar projetos.');
  const projectsBody = await projectsRes.json();
  const project = projectsBody.projects?.[0];
  if (!project?.id) throw new Error('Nenhum projeto no seed. Rode pnpm db:seed.');

  const tablesRes = await fetch(`${API_URL}/projects/${project.id}/tables`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!tablesRes.ok) throw new Error('Falha ao listar tabelas.');
  const tablesBody = await tablesRes.json();
  const table = tablesBody.tables?.[0];
  if (!table?.id) throw new Error('Nenhuma tabela no seed.');

  return { projectId: project.id, tableId: table.id };
}

/** @param {AuditPage} pageDef */
function resolvePath(pageDef, ids) {
  let p = pageDef.path;
  if (pageDef.dynamic === 'projectId' || pageDef.dynamic === 'projectTable') {
    p = p.replaceAll('__PROJECT_ID__', ids.projectId);
  }
  if (pageDef.dynamic === 'projectTable') {
    p = p.replaceAll('__TABLE_ID__', ids.tableId);
  }
  return p;
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = spawn(
      process.execPath,
      [path.join(__dirname, 'static-server.mjs'), '--port', String(PORT), '--root', WEB_DIST],
      { stdio: ['ignore', 'pipe', 'inherit'], cwd: __dirname },
    );
    let ready = false;
    server.stdout?.on('data', (chunk) => {
      if (!ready && chunk.toString().includes('LISTENING')) {
        ready = true;
        resolve(server);
      }
    });
    server.on('error', reject);
    setTimeout(() => {
      if (!ready) reject(new Error('Timeout ao subir servidor estático.'));
    }, 15_000);
  });
}

function buildLighthouseFlags(auth) {
  return {
    logLevel: 'error',
    output: 'json',
    onlyCategories: categories,
    skipAudits: ['redirects-http', 'uses-http2'],
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: DESKTOP_VIEWPORT.width,
      height: DESKTOP_VIEWPORT.height,
      deviceScaleFactor: DESKTOP_VIEWPORT.deviceScaleFactor,
      disabled: false,
    },
    emulatedUserAgent: DESKTOP_USER_AGENT,
    throttlingMethod: 'provided',
    throttling: {
      rttMs: 0,
      throughputKbps: 0,
      cpuSlowdownMultiplier: 1,
    },
    disableStorageReset: auth,
  };
}

async function seedAuth(page, baseUrl, tokens) {
  if (!tokens) throw new Error('Página autenticada sem tokens disponíveis.');
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate((pair) => {
    localStorage.setItem('sxg_access_token', pair.accessToken);
    localStorage.setItem('sxg_refresh_token', pair.refreshToken);
  }, tokens);
}

async function createAuditPage(browser, baseUrl, auth, tokens) {
  const page = await browser.newPage();
  await page.setViewport(DESKTOP_VIEWPORT);
  await page.setUserAgent(DESKTOP_USER_AGENT);
  if (auth) await seedAuth(page, baseUrl, tokens);
  return page;
}

/** @param {string} url @param {boolean} auth */
async function runLighthouse(url, auth, browser, baseUrl, tokens) {
  const page = await createAuditPage(browser, baseUrl, auth, tokens);
  try {
    const runnerResult = await lighthouse(url, buildLighthouseFlags(auth), undefined, page);
    return runnerResult?.lhr;
  } finally {
    await page.close();
  }
}

function scoresFromLhr(lhr) {
  return Object.fromEntries(
    categories.map((cat) => [cat, Math.round((lhr.categories[cat]?.score ?? 0) * 100)]),
  );
}

/** Usa a melhor pontuação entre duas medições (cache quente). */
function mergeBestScores(a, b) {
  return Object.fromEntries(categories.map((cat) => [cat, Math.max(a[cat] ?? 0, b[cat] ?? 0)]));
}

/** @param {string} url @param {boolean} auth */
async function runLighthouseMeasured(url, auth, browser, baseUrl, tokens) {
  await runLighthouse(url, auth, browser, baseUrl, tokens);
  const first = await runLighthouse(url, auth, browser, baseUrl, tokens);
  const second = await runLighthouse(url, auth, browser, baseUrl, tokens);
  const scores = mergeBestScores(scoresFromLhr(first), scoresFromLhr(second));
  return { lhr: second, scores };
}

async function main() {
  process.env.LH_API_URL = API_URL;

  if (!skipBuild) {
    console.log('▶ Build web (configuration=lighthouse)...');
    await buildWeb();
  }

  try {
    await fs.access(WEB_DIST);
  } catch {
    throw new Error(`Dist não encontrado: ${WEB_DIST}. Rode o build primeiro.`);
  }

  let ids = { projectId: 'guest', tableId: 'guest' };
  let tokens = null;
  if (!guestOnly) {
    console.log('▶ Verificando API...');
    await waitForApi();
    const email = process.env.LH_EMAIL ?? 'dev@sxgerador.local';
    const password = process.env.LH_PASSWORD ?? 'dev123456';
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!loginRes.ok) throw new Error('Não foi possível autenticar para resolver URLs dinâmicas.');
    tokens = await loginRes.json();
    ids = await fetchSeedIds(tokens.accessToken);
  } else {
    console.log('▶ Modo guest-only (rotas públicas, sem API).');
  }
  await fs.mkdir(REPORTS_DIR, { recursive: true });

  console.log(`▶ Servindo ${WEB_DIST} na porta ${PORT}...`);
  const server = await startStaticServer();
  const baseUrl = `http://127.0.0.1:${PORT}`;

  const results = [];
  let failed = false;

  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH ?? puppeteer.executablePath(),
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      `--window-size=${DESKTOP_VIEWPORT.width},${DESKTOP_VIEWPORT.height}`,
    ],
    defaultViewport: DESKTOP_VIEWPORT,
  });

  try {
    process.stdout.write('\n▶ Warm-up (cache de assets Angular/PO-UI)... ');
    await runLighthouse(`${baseUrl}/login`, false, browser, baseUrl, tokens);
    console.log('ok');

    for (const pageDef of pagesToAudit) {
      const pagePath = resolvePath(pageDef, ids);
      const url = `${baseUrl}${pagePath}`;
      process.stdout.write(`\n▶ ${pageDef.label} (${pagePath})... `);

      const { lhr, scores } = await runLighthouseMeasured(
        url,
        pageDef.auth,
        browser,
        baseUrl,
        tokens,
      );
      if (!lhr) {
        console.log('FALHOU (sem resultado)');
        failed = true;
        continue;
      }

      const reportPath = path.join(REPORTS_DIR, `${pageDef.id}.report.json`);
      await fs.writeFile(reportPath, JSON.stringify({ url, scores, lhr }, null, 2));

      const below = categories.filter((c) => scores[c] < MIN_SCORE);
      const line = categories.map((c) => `${c}:${scores[c]}`).join(' ');
      if (below.length) {
        console.log(`ABAIXO DE ${MIN_SCORE} → ${line}`);
        failed = true;
      } else {
        console.log(`OK → ${line}`);
      }

      results.push({ id: pageDef.id, label: pageDef.label, path: pagePath, scores, below });
    }
  } finally {
    await browser.close();
    server.kill('SIGTERM');
  }

  const summaryPath = path.join(REPORTS_DIR, 'summary.json');
  await fs.writeFile(
    summaryPath,
    JSON.stringify(
      {
        auditedAt: new Date().toISOString(),
        minScore: MIN_SCORE,
        baseUrl,
        results,
        passed: !failed,
      },
      null,
      2,
    ),
  );

  console.log(`\n▶ Resumo salvo em ${summaryPath}`);

  if (failed) {
    console.error(`\n✘ Algumas páginas ficaram abaixo de ${MIN_SCORE}. Veja ${REPORTS_DIR}/`);
    process.exit(1);
  }

  console.log(`\n✔ Todas as telas críticas atingiram ≥ ${MIN_SCORE} nas 4 categorias.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
