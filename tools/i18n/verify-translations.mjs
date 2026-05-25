#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const APP_DIR = path.join(ROOT, 'apps/web/src/app');
const I18N_DIR = path.join(ROOT, 'apps/web/src/app/core/i18n/translations');
const LANGS = ['pt-BR', 'en-US', 'es-ES'];

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(full)));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function shouldIgnore(value) {
  return (
    !value ||
    value.length > 140 ||
    value.includes('{{') ||
    value.includes('}}') ||
    /^[A-Z0-9_]+$/.test(value)
  );
}

function extractPhrases(source) {
  const phrases = new Set();
  for (const match of source.matchAll(
    /\bp-(?:label|title|subtitle|placeholder|help|value)="([^"]*[A-Za-zÀ-ÿ][^"]*)"/g,
  )) {
    const value = match[1].trim();
    if (!shouldIgnore(value)) phrases.add(value);
  }
  for (const match of source.matchAll(/aria-label="([^"]*[A-Za-zÀ-ÿ][^"]*)"/g)) {
    const value = match[1].trim();
    if (!shouldIgnore(value)) phrases.add(value);
  }
  for (const match of source.matchAll(/>([^<>{}@[\]()]*[A-Za-zÀ-ÿ][^<>{}@]*)</g)) {
    const value = match[1].replace(/\s+/g, ' ').trim();
    if (!shouldIgnore(value)) phrases.add(value);
  }
  return phrases;
}

async function main() {
  const files = await listFiles(APP_DIR);
  const extracted = new Set();
  for (const file of files) {
    const phrases = extractPhrases(await fs.readFile(file, 'utf8'));
    for (const phrase of phrases) extracted.add(phrase);
  }

  const catalogs = {};
  for (const lang of LANGS) {
    catalogs[lang] = JSON.parse(await fs.readFile(path.join(I18N_DIR, `${lang}.json`), 'utf8'));
  }

  const expectedUiKeys = Object.keys(catalogs['pt-BR'].ui).sort();
  const expectedPhraseKeys = [...extracted].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const failures = [];

  for (const lang of LANGS) {
    const ui = catalogs[lang].ui ?? {};
    const phrases = catalogs[lang].phrases ?? {};
    for (const key of expectedUiKeys) {
      if (!(key in ui)) failures.push(`${lang}: ui.${key} ausente`);
    }
    for (const key of expectedPhraseKeys) {
      if (!(key in phrases)) failures.push(`${lang}: phrase "${key}" ausente`);
    }
  }

  const report = {
    checkedAt: new Date().toISOString(),
    templates: files.length,
    uiKeys: expectedUiKeys.length,
    phraseKeys: expectedPhraseKeys.length,
    passed: failures.length === 0,
    failures,
  };
  await fs.mkdir(path.join(__dirname, 'reports'), { recursive: true });
  await fs.writeFile(
    path.join(__dirname, 'reports', 'i18n-summary.json'),
    JSON.stringify(report, null, 2),
  );

  if (failures.length > 0) {
    console.error(failures.join('\n'));
    process.exit(1);
  }
  console.log(`i18n OK: ${expectedPhraseKeys.length} frases em ${LANGS.length} idiomas.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
