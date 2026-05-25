/**
 * Script Puppeteer executado pelo Lighthouse antes da auditoria em rotas autenticadas.
 * @param {import('puppeteer-core').Browser} browser
 * @param {{ url: string }} context
 */
export default async function setAuth(browser, context) {
  const baseUrl = new URL(context.url).origin;
  const apiUrl = process.env.LH_API_URL ?? 'http://localhost:3000/api/v1';
  const email = process.env.LH_EMAIL ?? 'dev@sxgerador.local';
  const password = process.env.LH_PASSWORD ?? 'dev123456';

  const loginRes = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login falhou (${loginRes.status}). Rode pnpm db:seed e inicie a API.`);
  }

  const { accessToken, refreshToken } = await loginRes.json();

  const page = await browser.newPage();
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    (tokens) => {
      globalThis.localStorage.setItem('sxg_access_token', tokens.accessToken);
      globalThis.localStorage.setItem('sxg_refresh_token', tokens.refreshToken);
    },
    { accessToken, refreshToken },
  );
  await page.close();
}
