// Gera um MP4 por slide: carrega src/carrossel.html + anim.css/anim.js,
// pausa todas as animações e avança o relógio quadro a quadro.
// Uso: node render-video.mjs [segundos=7] [fps=30] [slides=1,2,...]
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const DUR = Number(process.argv[2] || 7);
const FPS = Number(process.argv[3] || 30);
const only = process.argv[4] ? process.argv[4].split(',').map(Number) : [1, 2, 3, 4, 5, 6, 7, 8, 9];
const frames = Math.round(DUR * FPS);
const outDir = path.join(dir, 'videos');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();

async function renderSlide(n) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1500 } });
  await page.goto('file://' + path.join(dir, 'src/carrossel.html'), { waitUntil: 'networkidle' });
  await page.addStyleTag({ path: path.join(dir, 'src/anim.css') });
  await page.addScriptTag({ path: path.join(dir, 'src/anim.js') });
  await page.evaluate(() => document.fonts.ready);
  // deixa só o slide atual visível, pra não gastar tempo pintando os outros
  await page.evaluate((id) => {
    document.querySelectorAll('section.slide').forEach((s) => { if (s.id !== id) s.style.display = 'none'; });
    document.body.style.padding = '0';
    document.getAnimations().forEach((a) => a.pause());
  }, 's' + n);
  const el = await page.$('#s' + n);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `slide${n}-`));
  for (let f = 0; f < frames; f++) {
    await page.evaluate((ms) => {
      document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms; });
    }, (f * 1000) / FPS);
    await el.screenshot({ path: path.join(tmp, `${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 95 });
  }
  await page.close();
  const out = path.join(outDir, `${String(n).padStart(2, '0')}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, '%04d.jpg'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-movflags', '+faststart', out]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(out);
}

const queue = [...only];
await Promise.all(Array.from({ length: 3 }, async () => {
  while (queue.length) await renderSlide(queue.shift());
}));
await browser.close();
