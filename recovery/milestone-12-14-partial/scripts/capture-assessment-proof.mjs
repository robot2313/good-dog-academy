import { mkdirSync } from 'fs';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';
import puppeteer from 'puppeteer';

const BASE = 'http://localhost:8788';
const ROOT = join(process.cwd(), 'dist');
const OUT = 'docs/milestone-14-visual-proof';
mkdirSync(OUT, { recursive: true });

const CT = { '.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ttf':'font/ttf','.css':'text/css' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/') p = '/index.html';
  try {
    const data = await readFile(join(ROOT, p));
    res.writeHead(200, { 'Content-Type': CT[extname(p)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(await readFile(join(ROOT, 'index.html')));
  }
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function clickText(page, text) {
  const ok = await page.evaluate((t) => {
    const els = [...document.querySelectorAll('[role="button"],button,[role="radio"],div,span')]
      .filter((e) => (e.textContent?.trim() === t || e.getAttribute?.('aria-label') === t));
    const el = els.sort((a,b)=>a.textContent.length-b.textContent.length)[0];
    if (!el) return false; el.click(); return true;
  }, text);
  await sleep(450);
  return ok;
}

async function main() {
  await new Promise((r) => server.listen(8788, r));
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  // Seed owner+dog only, so the app lands on the assessment.
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const seed = JSON.parse((await import('fs')).readFileSync('/tmp/assessment-seed.json','utf8'));
  await page.evaluate((data) => {
    window.localStorage.clear();
    for (const [k, v] of Object.entries(data)) window.localStorage.setItem(k, v);
  }, seed);
  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await sleep(3000);
  await page.screenshot({ path: `${OUT}/01-welcome.png` });
  console.log('captured welcome');

  // Walk onboarding if present, else straight to assessment.

  await sleep(1200);
  await page.screenshot({ path: `${OUT}/02-after-start.png` });

  if (await clickText(page, 'Start Assessment')) {
    await sleep(1200);
    await page.screenshot({ path: `${OUT}/03-question-1.png` });
    console.log('captured question 1');
    await clickText(page, 'Sometimes');
    await sleep(500);
    await page.screenshot({ path: `${OUT}/04-question-1-answered.png` });
    await clickText(page, 'Next question');
    await sleep(700);
    await page.screenshot({ path: `${OUT}/05-question-2.png` });
    await clickText(page, 'Often');
    await clickText(page, 'Next question');
    await sleep(700);
    await page.screenshot({ path: `${OUT}/06-question-3.png` });
  }

  await browser.close();
  server.close();
  console.log('DONE');
}
main().catch((e) => { console.error('failed:', e.message); server.close(); process.exit(1); });
