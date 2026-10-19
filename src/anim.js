// Coreografia dos vídeos. Monta animações CSS com atrasos calculados;
// render-video.mjs pausa tudo e avança o tempo quadro a quadro.
(() => {
  const EASE = 'cubic-bezier(.16,1,.3,1)';
  const BOUNCE = 'cubic-bezier(.34,1.56,.64,1)';

  const add = (el, name, dur, delay = 0, opts = {}) => {
    if (!el) return;
    const { ease = EASE, iter = 1, fill = 'both', dir = 'normal' } = opts;
    el.__a = el.__a || [];
    el.__a.push(`${name} ${dur}s ${ease} ${delay}s ${iter} ${dir} ${fill}`);
    el.style.animation = el.__a.join(', ');
  };
  const seq = (els, start, step, name, dur, opts) =>
    [...els].forEach((e, i) => add(e, name, dur, start + i * step, opts));
  const $ = (root, s) => root.querySelector(s);
  const $$ = (root, s) => [...root.querySelectorAll(s)];

  // quebra o texto em <span class="ch">, palavra por palavra
  const splitChars = (el) => {
    const chars = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.replace(/­/g, '').split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            [...part].forEach((c) => {
              const s = document.createElement('span'); s.className = 'ch'; s.textContent = c;
              w.appendChild(s); chars.push(s);
            });
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    return chars;
  };

  const title = (h, start, step = 0.035) => {
    if (!h) return start;
    const chars = splitChars(h);
    seq(chars, start, step, 'charIn', 0.8);
    $$(h, '.hl').forEach((hl) => add(hl, 'clipIn', 0.6, start + chars.length * step * 0.6));
    return start + chars.length * step + 0.3;
  };

  const logo = (s, delay) => {
    const t = $(s, '.logo-tile'); if (!t) return;
    const sh = document.createElement('div'); sh.className = 'shine'; t.appendChild(sh);
    add(t, 'popSpin', 1.0, delay, { ease: 'cubic-bezier(.3,1.4,.5,1)' });
    add(t, 'float', 3, delay + 1.0, { ease: 'ease-in-out', iter: 'infinite' });
    add(sh, 'shineSweep', 2.6, delay + 0.9, { ease: 'ease-in-out', iter: 'infinite' });
  };

  const chrome = (s) => {
    add($(s, '.top'), 'downIn', 0.7, 0);
    add($(s, '.count'), 'pop', 0.6, 0.25, { ease: BOUNCE });
    const big = $(s, '.bignum');
    add(big, 'bigIn', 1.4, 0.1); add(big, 'bigDrift', 6, 1.5, { ease: 'ease-in-out', iter: 'infinite' });
    const b = $(s, '.bottom'); add(b, 'upIn', 0.6, 0.3);
    const on = $$(s, '.progress i.on'); add(on[on.length - 1], 'segFill', 0.9, 0.9);
    const sw = $(s, '.swipe svg') || $(s, '.swipe');
    add(sw, 'nudge', 0.9, 1.2, { ease: 'ease-in-out', iter: 'infinite' });
  };

  const tag = (s, d) => {
    const t = $(s, '.tag'); if (!t) return;
    add(t, 'typing', 0.6, d, { ease: 'steps(14)' });
  };

  const link = (s, d) => {
    const l = $(s, '.link'); if (!l) return;
    add(l, 'upIn', 0.7, d);
    add($(l, '.gh'), 'popSpin', 0.8, d + 0.2, { ease: 'cubic-bezier(.3,1.4,.5,1)' });
    add($(l, '.u'), 'typing', 1.0, d + 0.35, { ease: 'steps(28)' });
    const cp = $(l, '.cp');
    add(cp, 'stamp', 0.5, d + 1.2);
    add(cp, 'pulse', 1.1, d + 1.8, { ease: 'ease-in-out', iter: 'infinite' });
  };

  const sub = (s, d) => add($(s, '.sub'), 'upIn', 0.7, d);

  // ---------- slides ----------
  const S = (id) => document.getElementById(id);

  // 01 capa
  (() => {
    const s = S('s1'); chrome(s);
    const flash = document.createElement('div'); flash.className = 'flash'; s.appendChild(flash);
    const seven = $(s, '.seven');
    add(seven, 'slam', 0.8, 0.15, { ease: 'cubic-bezier(.2,.9,.3,1.2)' });
    add(seven, 'breathe', 2.4, 1.2, { ease: 'ease-in-out', iter: 'infinite' });
    add(flash, 'flash', 0.9, 0.55, { ease: 'ease-out', fill: 'none' });
    $$(s, '.top,.stack,h1,.sub,.seven').forEach(() => {});
    add($(s, '.stack'), 'shake', 0.5, 0.58, { ease: 'linear', fill: 'none' });
    add($(s, 'h1'), 'shake', 0.5, 0.58, { ease: 'linear', fill: 'none' });
    seq($$(s, '.stack .chip'), 0.9, 0.12, 'rightIn', 0.6);
    const end = title($(s, 'h1'), 0.75, 0.028);
    add($(s, 'h1 .o'), 'wiggle', 1.2, end + 0.4, { ease: 'ease-in-out', iter: 'infinite' });
    sub(s, end);
  })();

  // genérico dos slides de repo
  const repo = (id, fn) => {
    const s = S(id); chrome(s); tag(s, 0.3);
    const end = title($(s, 'h2'), 0.45);
    logo(s, 0.6);
    sub(s, end - 0.1);
    fn(s, end + 0.15);
  };

  // 02 hyperframes
  repo('s2', (s, d) => {
    const flow = $(s, '.flow');
    add(flow, 'upIn', 0.8, d);
    seq($$(flow, '.step'), d + 0.2, 0.3, 'upIn', 0.7);
    seq($$(flow, '.arrow'), d + 0.5, 0.3, 'pop', 0.5, { ease: BOUNCE });
    $$(flow, '.arrow').forEach((a, i) => add(a, 'nudge', 0.8, d + 1.5 + i * 0.2, { ease: 'ease-in-out', iter: 'infinite' }));
    const vis = $$(flow, '.vis');
    seq(vis.slice(0, 2), d + 0.4, 0.3, 'typing', 1.2, { ease: 'steps(24)' });
    add(vis[2], 'pulse', 1.2, d + 1.6, { ease: 'ease-in-out', iter: 'infinite' });
    const tl = $(s, '.tl'); add(tl, 'upIn', 0.7, d + 0.7);
    seq($$(tl, '.track div'), d + 0.9, 0.06, 'pop', 0.4, { ease: BOUNCE });
    add($(tl, '.playhead'), 'playhead', 3.2, d + 1.0, { ease: 'linear', iter: 'infinite' });
    add($$(s, '.note')[0], 'leftIn', 0.7, d + 1.1);
    link(s, d + 1.3);
  });

  // 03 scrollcraft
  repo('s3', (s, d) => {
    const cols = $$(s, '.vs > div');
    add(cols[0], 'leftIn', 0.8, d);
    add(cols[1], 'rightIn', 0.8, d + 0.2);
    const v = $$(s, '.verdict');
    add(v[0], 'pop', 0.5, d + 0.8, { ease: BOUNCE });
    add(v[0], 'wiggle', 0.5, d + 1.3, { ease: 'ease-in-out', iter: 'infinite' });
    add(v[1], 'pop', 0.5, d + 1.0, { ease: BOUNCE });
    add(v[1], 'pulse', 1.2, d + 1.6, { ease: 'ease-in-out', iter: 'infinite' });
    add($(s, '.mountains'), 'parallax', 3.5, d + 0.8, { ease: 'ease-in-out', iter: 'infinite' });
    const sb = $(s, '.scrollbar'); if (sb) sb.classList.add('anim-sb');
    add($(s, '.site.bad .blob'), 'float', 2.4, d, { ease: 'ease-in-out', iter: 'infinite' });
    add($(s, '.note'), 'upIn', 0.7, d + 1.0);
    add($(s, '.note .ic'), 'orbit', 4, d + 1.4, { ease: 'linear', iter: 'infinite' });
    link(s, d + 1.2);
  });

  // 04 open seo
  repo('s4', (s, d) => {
    const win = $(s, '.win'); add(win, 'upIn', 0.8, d);
    seq($$(win, '.kw tr'), d + 0.3, 0.12, 'leftIn', 0.5);
    seq($$(win, '.score'), d + 0.6, 0.12, 'pop', 0.5, { ease: BOUNCE });
    add($(win, '.kw tr.sel'), 'rowScan', 1.8, d + 1.4, { ease: 'ease-in-out', iter: 'infinite' });
    const paths = $$(win, 'svg path');
    const line = paths[1]; const len = line.getTotalLength();
    line.style.strokeDasharray = len; line.style.setProperty('--len', len);
    add(line, 'drawLine', 1.4, d + 0.5, { ease: 'cubic-bezier(.6,0,.2,1)' });
    add(paths[0], 'areaIn', 0.8, d + 1.5);
    const c = $(win, 'svg circle'); c.style.transformOrigin = '205px 30px'; c.style.transformBox = 'view-box';
    add(c, 'pop', 0.5, d + 1.3, { ease: BOUNCE });
    add(c, 'pulse', 1.2, d + 1.9, { ease: 'ease-in-out', iter: 'infinite' });
    seq($$(s, '.pt'), d + 0.7, 0.14, 'leftIn', 0.6);
    seq($$(s, '.pt .k'), d + 0.8, 0.14, 'pop', 0.5, { ease: BOUNCE });
    link(s, d + 1.4);
  });

  // 05 google workspace cli
  repo('s5', (s, d) => {
    const cards = $$(s, '.vs > .card');
    add(cards[0], 'leftIn', 0.8, d);
    add(cards[1], 'rightIn', 0.8, d + 0.2);
    seq($$(cards[0], '.chip'), d + 0.6, 0.1, 'stamp', 0.45);
    $$(s, '.verdict').forEach((v, i) => add(v, 'pop', 0.5, d + 0.9 + i * 0.25, { ease: BOUNCE }));
    add(cards[1], 'cardGlow', 2, d + 1.6, { ease: 'ease-in-out', iter: 'infinite' });
    const term = cards[1].querySelector('div[style*="mono"]');
    add(term, 'typing', 1.1, d + 0.7, { ease: 'steps(20)' });
    const row = $$(s, '.row')[0];
    add(row.children[0], 'pop', 0.6, d + 1.2, { ease: BOUNCE });
    add(row.children[1], 'stamp', 0.6, d + 1.6);
    add(row.children[1], 'wiggle', 2.2, d + 2.3, { ease: 'ease-in-out', iter: 'infinite' });
    link(s, d + 1.3);
  });

  // 06 humanizer
  repo('s6', (s, d) => {
    const win = $(s, '.win'); add(win, 'upIn', 0.8, d);
    const dels = $$(win, 'del'), inss = $$(win, 'ins');
    dels.forEach((e, i) => { e.classList.add('anim-del'); add(e, 'strike', 0.5, d + 0.6 + i * 0.55, { ease: 'ease-in-out' }); });
    inss.forEach((e, i) => add(e, 'pop', 0.5, d + 0.9 + i * 0.55, { ease: BOUNCE }));
    const label = $$(s, 'section#s6 > div').find((e) => e.textContent.trim() === 'Ele corta:');
    add(label, 'leftIn', 0.6, d + 0.6);
    seq($$(s, '.pt'), d + 0.8, 0.16, 'leftIn', 0.6);
    seq($$(s, '.pt .k'), d + 0.9, 0.16, 'stamp', 0.45);
    add($(s, '.note'), 'upIn', 0.7, d + 1.3);
    link(s, d + 1.5);
  });

  // 07 agent skills
  repo('s7', (s, d) => {
    const cmds = $$(s, '.cmd');
    seq(cmds, d, 0.18, 'upIn', 0.7);
    cmds.forEach((c, i) => add(c, 'cardGlow', 2.4, d + 1.4 + i * 0.8, { ease: 'ease-in-out', iter: 'infinite' }));
    seq($$(s, '.cmd .s'), d + 0.15, 0.18, 'typing', 0.5, { ease: 'steps(6)' });
    const win = $(s, '.win'); add(win, 'upIn', 0.8, d + 0.4);
    seq($$(win, '.todo li'), d + 0.6, 0.12, 'leftIn', 0.5);
    seq($$(win, '.todo li.done .box'), d + 1.1, 0.3, 'pop', 0.5, { ease: BOUNCE });
    add($(win, '.todo li.now'), 'rowScan', 1.6, d + 1.8, { ease: 'ease-in-out', iter: 'infinite' });
    add($(s, '.note'), 'upIn', 0.7, d + 1.1);
    add($(s, '.note .ic'), 'orbit', 2.5, d + 1.5, { ease: 'linear', iter: 'infinite' });
    link(s, d + 1.3);
  });

  // 08 expo (layout em coluna, não usa repo())
  (() => {
    const s = S('s8'); chrome(s); tag(s, 0.3);
    const end = title($(s, 'h2'), 0.45);
    logo(s, 0.7);
    sub(s, end - 0.1);
    seq($$(s, '.pt'), end + 0.1, 0.16, 'leftIn', 0.6);
    seq($$(s, '.pt .k'), end + 0.2, 0.16, 'pop', 0.5, { ease: BOUNCE });
    const ph = $(s, '.phone');
    add(ph, 'rightIn', 1.0, 0.5);
    add(ph, 'float', 3.4, 1.6, { ease: 'ease-in-out', iter: 'infinite' });
    seq($$(ph, '.it'), 1.1, 0.15, 'upIn', 0.5);
    seq($$(ph, '.it .ico'), 1.2, 0.15, 'pop', 0.5, { ease: BOUNCE });
    add($(ph, '.cta'), 'stamp', 0.6, 1.8);
    add($(ph, '.cta'), 'pulse', 1.2, 2.4, { ease: 'ease-in-out', iter: 'infinite' });
    add($(s, '.note'), 'upIn', 0.7, end + 0.5);
    add($(s, '.note .ic'), 'orbit', 4, end + 1, { ease: 'linear', iter: 'infinite' });
    link(s, end + 0.7);
  })();

  // 09 cta
  (() => {
    const s = S('s9'); chrome(s);
    const cur = document.createElement('div'); cur.className = 'curtain'; s.appendChild(cur);
    add(cur, 'wipeOut', 0.7, 0.05, { ease: 'cubic-bezier(.7,0,.2,1)' });
    const end = title($(s, 'h2'), 0.5, 0.03);
    add($(s, 'h2 .ol'), 'wiggle', 1.4, end + 0.3, { ease: 'ease-in-out', iter: 'infinite' });
    const acts = $$(s, '.act');
    seq(acts, end - 0.2, 0.2, 'leftIn', 0.7);
    seq($$(s, '.act .n'), end, 0.2, 'popSpin', 0.8, { ease: 'cubic-bezier(.3,1.4,.5,1)' });
    const nums = $$(s, '.numbers span');
    seq(nums, end + 0.5, 0.07, 'pop', 0.45, { ease: BOUNCE });
    nums.forEach((n, i) => add(n, 'wave', 1.2, end + 1.4 + i * 0.1, { ease: 'ease-in-out', iter: 'infinite' }));
    add($(s, '.swipe'), 'pulse', 1.4, end + 1, { ease: 'ease-in-out', iter: 'infinite' });
  })();

  window.__animReady = true;
})();
