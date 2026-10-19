// Renderiza cada <section class="slide"> de src/carrossel.html em PNG 1080x1350.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
await page.goto('file://' + path.join(dir, 'src/carrossel.html'), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const slides = await page.$$('section.slide');
for (const [i, el] of slides.entries()) {
  const out = path.join(dir, 'slides', `${String(i + 1).padStart(2, '0')}.png`);
  await el.screenshot({ path: out });
  console.log(out);
}
await browser.close();
