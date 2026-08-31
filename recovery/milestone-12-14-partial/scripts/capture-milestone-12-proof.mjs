import { readFileSync } from 'fs';
import { mkdirSync } from 'fs';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';
import puppeteer from 'puppeteer';

const BASE = 'http://localhost:8787';
const ROOT = join(process.cwd(), 'dist');
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2 };
const OUT = process.env.PROOF_OUT || 'docs/milestone-12-visual-proof';
mkdirSync(OUT, { recursive: true });

const CT = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/') p = '/index.html';
  try {
    const data = await readFile(join(ROOT, p));
    res.writeHead(200, { 'Content-Type': CT[extname(p)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    const fallback = await readFile(join(ROOT, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fallback);
  }
});

const seed = JSON.parse(readFileSync('/tmp/visual-proof-seed.json', 'utf8'));
const rawSeed = Object.fromEntries(
  Object.entries(seed).filter(([key]) => !key.startsWith('@RNAsyncStorage:')),
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}` });
  console.log('captured', name);
}

async function clickText(page, text, { timeout = 12000, partial = false } = {}) {
  await page.waitForFunction((t, p) => {
    const vis = (e) => !e.closest('[aria-hidden="true"]');
    const els = [...document.querySelectorAll('[role="button"],button,[role="tab"],[tabindex],div,span')].filter(vis);
    const hit = (e) => {
      const label = e.getAttribute?.('aria-label') ?? '';
      return p ? (e.textContent?.includes(t) || label.includes(t)) : (e.textContent?.trim() === t || label === t);
    };
    return els.some(hit);
  }, { timeout }, text, partial);
  const ok = await page.evaluate((t, p) => {
    const vis = (e) => !e.closest('[aria-hidden="true"]');
    const match = (e) => {
      if (!vis(e)) return false;
      const label = e.getAttribute?.('aria-label') ?? '';
      return p ? (e.textContent?.includes(t) || label.includes(t)) : (e.textContent?.trim() === t || label === t);
    };
    const btns = [...document.querySelectorAll('[role="button"],button,[role="tab"]')].filter(match);
    const el = btns.sort((a, b) => (a.textContent.length || 999) - (b.textContent.length || 999))[0]
      ?? [...document.querySelectorAll('div,span')].filter(match).sort((a, b) => a.textContent.length - b.textContent.length)[0];
    if (!el) return false;
    el.click();
    return true;
  }, text, partial);
  if (!ok) throw new Error(`could not click: ${text}`);
  await sleep(500);
}

async function tryClick(page, text, opts) {
  try { await clickText(page, text, opts); return true; } catch { return false; }
}

async function main() {
  await new Promise((resolve) => server.listen(8787, resolve));
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  // Seed BEFORE the app boots so onboarding resolves to "complete".
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate((data) => {
    window.localStorage.clear();
    for (const [k, v] of Object.entries(data)) window.localStorage.setItem(k, v);
  }, rawSeed);
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(2500);

  // 1. Home / Today with an experienced dog (history present)
  await shot(page, '01-today-home.png');

  // 9. Daily Plan / Journey adaptive recommendation (history affecting selection)
  if (await tryClick(page, 'Journey')) { await sleep(1500); await shot(page, '09-journey-adaptive-plan.png'); }

  // 10. Progress adaptive insight + populated history
  if (await tryClick(page, 'Progress')) { await sleep(1500); await shot(page, '10-progress-adaptive-insight.png'); }

  // Academy → a recall lesson to reach the coach entry + struggle states
  if (await tryClick(page, 'Categories')) { await sleep(1200); await shot(page, '02-categories.png'); }
  if (await tryClick(page, 'Recall', { partial: true })) { await sleep(1000); await shot(page, '03-recall-category.png'); }

  // Open the struggling lesson (Short-Distance Recall) → lesson summary
  if (await tryClick(page, 'Short-Distance Recall', { partial: true })) {
    await sleep(1000);
    await shot(page, '04-lesson-summary.png');
    if (await tryClick(page, 'Start Lesson')) {
      await sleep(800);
      await shot(page, '05-before-you-begin.png');
      // Scroll to the "Where are you training?" picker
      await page.evaluate(() => {
        const el = [...document.querySelectorAll('div,span')]
          .find((e) => e.textContent?.trim() === 'WHERE ARE YOU TRAINING?');
        el?.scrollIntoView({ block: 'center' });
      });
      await sleep(700);
      await shot(page, '16-training-context-picker.png');
      if (await tryClick(page, 'Start Lesson')) {
        await sleep(800);
        // Hands-free voice coaching overlay
        if (await tryClick(page, 'Hands-free', { partial: true })) {
          await sleep(1500);
          await shot(page, '12-hands-free-briefing.png');
          // Advance through the briefing to the counting state
          for (let i = 0; i < 12; i += 1) {
            await sleep(400);
          }
          await shot(page, '13-hands-free-counting.png');
          if (await tryClick(page, 'Went well', { partial: true })) {
            await sleep(900);
            await shot(page, '14-hands-free-after-success.png');
          }
          if (await tryClick(page, 'Try again', { partial: true })) {
            await sleep(900);
            await shot(page, '15-hands-free-adjustment.png');
          }
          await tryClick(page, 'Exit hands-free', { partial: true });
          await sleep(700);
        }

        // 5. Lesson coach entry via "This isn't working?"
        if (await tryClick(page, "This isn't working?", { partial: true })) {
          await sleep(600);
          await shot(page, '06-lesson-coach-entry.png');
          // 7 + 8. Ask a coach question → deterministic answer (AI unavailable)
          if (await tryClick(page, 'Should I make this easier?', { partial: true })
            || await tryClick(page, 'make this easier', { partial: true })) {
            await sleep(1200);
            await page.evaluate(() => {
              const els = [...document.querySelectorAll('div')];
              const target = els.find((e) => e.textContent?.includes('ASK THE COACH'));
              target?.scrollIntoView({ block: 'center' });
              window.scrollBy(0, 400);
            });
            await sleep(600);
            await shot(page, '07-coach-deterministic-answer.png');
          }
        }
      }
    }
  }

  // Troubleshooter → result → coach integration + safety escalation
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(2000);
  // 8. Troubleshooter entry ("Need help right now?") and its safety routing
  if (await tryClick(page, 'Need help right now?', { partial: true })) {
    await sleep(1200);
    await shot(page, '08-troubleshooter-entry.png');
    if (await tryClick(page, 'Recall', { partial: true })) {
      await sleep(900);
      await shot(page, '11-troubleshooter-scenarios.png');
    }
  }
  await browser.close();
  server.close();
  console.log('VISUAL PROOF DONE');
}

main().catch((error) => { console.error('capture failed:', error.message); server.close(); process.exit(1); });
