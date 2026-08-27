import puppeteer from 'puppeteer';

const B = 'http://localhost:8787';
const VP = { width: 390, height: 844, deviceScaleFactor: 2 };
const out = 'docs/fable-visual-proof';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VISIBLE_FILTER = `
  const visible = (e) => !e.closest('[aria-hidden="true"]');
`;

async function clickText(page, text, { timeout = 15000, partial = false } = {}) {
  await page.waitForFunction((t, partial) => {
    const visible = (e) => !e.closest('[aria-hidden="true"]');
    const els = [...document.querySelectorAll('[role="button"],button,[role="tab"],[tabindex],div,span')].filter(visible);
    const hit = (e) => {
      const label = e.getAttribute?.('aria-label') ?? '';
      return partial
        ? (e.textContent?.includes(t) || label.includes(t))
        : (e.textContent?.trim() === t || label === t);
    };
    return els.some(hit);
  }, { timeout }, text, partial);
  const clicked = await page.evaluate((t, partial) => {
    const visible = (e) => !e.closest('[aria-hidden="true"]');
    const match = (e) => {
      if (!visible(e)) return false;
      const label = e.getAttribute?.('aria-label') ?? '';
      return partial
        ? (e.textContent?.includes(t) || label.includes(t))
        : (e.textContent?.trim() === t || label === t);
    };
    const els = [...document.querySelectorAll('[role="button"],button,[role="tab"]')].filter(match);
    const el = els.sort((a, b) => (a.textContent.length || 999) - (b.textContent.length || 999))[0]
      ?? [...document.querySelectorAll('div,span')].filter(match).sort((a, b) => a.textContent.length - b.textContent.length)[0];
    if (!el) return false;
    el.click();
    return true;
  }, text, partial);
  if (!clicked) throw new Error(`could not click: ${text}`);
  await sleep(450);
}


async function clickChip(page, groupLabel, chipText) {
  const ok = await page.evaluate((g, c) => {
    // Find the group label anywhere in the document, then click the first
    // matching chip that appears after it in document order.
    const visible = (e) => !e.closest('[aria-hidden="true"]');
    const leafTexts = [...document.querySelectorAll('*')]
      .filter((e) => visible(e) && e.childElementCount === 0 && e.textContent?.trim() === g);
    const label = leafTexts[0];
    if (!label) return false;
    const chips = [...document.querySelectorAll('[role="button"],button,[tabindex]')]
      .filter((e) => visible(e) && e.textContent?.trim() === c);
    const after = chips.find((e) => label.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING);
    const target = after ?? chips[0];
    if (!target) return false;
    target.click();
    return true;
  }, groupLabel, chipText);
  if (!ok) throw new Error(`chip not found: ${groupLabel} / ${chipText}`);
  await sleep(300);
}

async function typeInto(page, placeholderOrLabel, value) {
  const handle = await page.evaluateHandle((p) => {
    const visible = (e) => !e.closest('[aria-hidden="true"]');
    const inputs = [...document.querySelectorAll('input,textarea')].filter(visible);
    return inputs.find((i) => i.placeholder === p || i.getAttribute('aria-label') === p) ?? null;
  }, placeholderOrLabel);
  const el = handle.asElement();
  if (!el) throw new Error(`no input: ${placeholderOrLabel}`);
  await el.click();
  await el.type(value, { delay: 10 });
  await sleep(150);
}

async function shot(page, file) {
  await sleep(500);
  await page.screenshot({ path: `${out}/${file}` });
  console.log('SHOT', file);
}

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage();
await page.setViewport(VP);
page.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 200)));
await page.goto(B, { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(2500);

// ---- Onboarding ----
await shot(page, 'secondary/onboarding-welcome.png');
await clickText(page, 'Get Started');
await typeInto(page, 'Your name', 'Ryan');
await clickText(page, 'Beginner');
await clickText(page, 'Family Companion');
await shot(page, 'secondary/onboarding-owner-setup.png');
await clickText(page, 'Continue');
await typeInto(page, 'Milo', 'Buddy');
await clickChip(page, 'Breed information', 'Unknown');
await clickChip(page, 'Age information', 'Estimated age');
await typeInto(page, '2', '3');
await typeInto(page, '24.5', '24');
await clickChip(page, 'Sex', 'Male');
await clickChip(page, 'Energy level', 'Medium');
await shot(page, 'secondary/onboarding-dog-setup.png');
await clickText(page, 'Complete Setup');
await sleep(1200);

// ---- Assessment ----
await shot(page, 'secondary/assessment-intro.png');
await clickText(page, 'Start Assessment');
for (const section of ['everyday', 'home', 'control']) {
  await sleep(600);
  // answer every question: click every "Not sure / Not observed" option
  const answered = await page.evaluate(() => {
    const visible = (e) => !e.closest('[aria-hidden="true"]');
    const opts = [...document.querySelectorAll('[role="radio"],[role="button"],[aria-checked]')]
      .filter((e) => visible(e) && e.textContent?.trim() === 'Not sure / Not observed');
    opts.forEach((o) => o.click());
    return opts.length;
  });
  console.log('answered', section, answered);
  await sleep(400);
  if (section === 'everyday') await shot(page, 'secondary/assessment-question.png');
  await clickText(page, 'Continue');
}
await sleep(800);
await shot(page, 'secondary/assessment-results.png');
await clickText(page, 'Complete Assessment');
await sleep(1500);

// ---- Six master screens ----
await shot(page, '01-home-implemented.png');
await clickText(page, 'Journey');
await shot(page, '05-your-journey-implemented.png');
await clickText(page, 'Categories');
await shot(page, '02-categories-implemented.png');
await clickText(page, 'House Training', { partial: true });
await shot(page, '03-lessons-in-category-implemented.png');
await clickText(page, 'Build a Toileting Routine', { partial: true });
await shot(page, '04-lesson-detail-implemented.png');
await clickText(page, 'Start Lesson');
await sleep(700);
await shot(page, 'lesson-flow/get-ready-before-you-begin.png');
await clickText(page, 'Start Lesson');
await sleep(700);
await shot(page, 'lesson-flow/active-practice.png');
await clickText(page, "This isn't working?", { partial: true });
await shot(page, 'lesson-flow/help-this-isnt-working.png');
await clickText(page, 'Try again');
await clickText(page, 'Complete Lesson');
await sleep(600);
await shot(page, 'lesson-flow/feedback.png');
await clickText(page, 'Went well', { partial: true });
await clickText(page, 'Save session');
await sleep(1200);
await shot(page, 'lesson-flow/completion.png');
await clickText(page, 'Continue');
await sleep(800);
await clickText(page, 'Dogs');
await shot(page, '06-life-stage-implemented.png');
await clickText(page, 'Progress');
await shot(page, 'secondary/progress-passport.png');

console.log('ALL DONE');
await browser.close();
