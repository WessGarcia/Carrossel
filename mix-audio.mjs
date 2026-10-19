// Põe trilha + efeitos sonoros nos vídeos de videos/NN.mp4 -> videos/com-som/NN.mp4.
// Os momentos de cada efeito saem direto das animações (src/anim.js), então
// o som fica sincronizado com o que aparece na tela.
// A trilha (audio/musica.mp3) é cortada em trechos seguidos: o slide 1 usa 0–7s,
// o 2 usa 7–14s etc., então ao arrastar o carrossel a música continua.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const A = (f) => path.join(dir, 'audio', f);
const DUR = 7;
const MUSIC_DB = -9;   // trilha por baixo dos efeitos

// animação -> [efeito, volume]
const MAP = {
  slam: ['impacto.mp3', 1.0],
  popSpin: ['whoosh.mp3', 0.8],
  pop: ['pop.mp3', 0.55],
  stamp: ['carimbo.mp3', 0.8],
  typing: ['digitando.mp3', 0.45],
  strike: ['risco.mp3', 0.7],
  segFill: ['ding.mp3', 0.35],
  wipeOut: ['whoosh.mp3', 1.0],
  rightIn: ['whoosh.mp3', 0.35],
};
const GAP = { 'pop.mp3': 0.12, 'whoosh.mp3': 0.35, 'digitando.mp3': 0.6, 'carimbo.mp3': 0.15, 'risco.mp3': 0.3 };

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + path.join(dir, 'src/carrossel.html'), { waitUntil: 'networkidle' });
await page.addStyleTag({ path: path.join(dir, 'src/anim.css') });
await page.addScriptTag({ path: path.join(dir, 'src/anim.js') });
const anims = await page.evaluate(() => document.getAnimations()
  .filter((a) => a.animationName && a.effect.getTiming().iterations !== Infinity)
  .map((a) => ({ name: a.animationName, delay: a.effect.getTiming().delay / 1000,
    slide: a.effect.target.closest('section.slide')?.id, isChar: a.effect.target.classList.contains('ch') })));
await browser.close();

fs.mkdirSync(path.join(dir, 'videos/com-som'), { recursive: true });
for (let n = 1; n <= 9; n++) {
  const list = anims.filter((a) => a.slide === 's' + n);
  const cues = [];
  // whoosh na entrada do título (primeira letra)
  const firstChar = list.filter((a) => a.isChar).sort((a, b) => a.delay - b.delay)[0];
  if (firstChar) cues.push({ t: firstChar.delay, f: 'whoosh.mp3', v: 0.9 });
  for (const a of list) if (MAP[a.name] && a.delay < DUR - 0.3) cues.push({ t: a.delay, f: MAP[a.name][0], v: MAP[a.name][1] });
  cues.sort((a, b) => a.t - b.t);
  const last = {};
  const kept = cues.filter((c) => {
    if (last[c.f] !== undefined && c.t - last[c.f] < (GAP[c.f] ?? 0.2)) return false;
    last[c.f] = c.t; return true;
  });

  const args = ['-y', '-loglevel', 'error', '-i', path.join(dir, `videos/${String(n).padStart(2, '0')}.mp4`), '-i', A('musica.mp3')];
  kept.forEach((c) => args.push('-i', A(c.f)));
  const st = (n - 1) * DUR;
  const parts = [`[1:a]atrim=${st}:${st + DUR},asetpts=PTS-STARTPTS,volume=${MUSIC_DB}dB,afade=t=in:d=0.04,afade=t=out:st=${DUR - 0.08}:d=0.08[m]`];
  kept.forEach((c, i) => parts.push(`[${i + 2}:a]volume=${c.v},adelay=${Math.round(c.t * 1000)}:all=1[s${i}]`));
  parts.push(`[m]${kept.map((_, i) => `[s${i}]`).join('')}amix=inputs=${kept.length + 1}:normalize=0:duration=first,alimiter=limit=0.9[a]`);
  args.push('-filter_complex', parts.join(';'), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-ar', '48000', '-t', String(DUR), '-movflags', '+faststart', path.join(dir, `videos/com-som/${String(n).padStart(2, '0')}.mp4`));
  execFileSync('ffmpeg', args);
  console.log(`slide ${n}: ${kept.length} efeitos ->`, kept.map((c) => `${c.f.replace('.mp3', '')}@${c.t.toFixed(2)}`).join(' '));
}
