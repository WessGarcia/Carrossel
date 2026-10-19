"""Gera a trilha e os efeitos sonoros por síntese (grátis, sem serviço externo).

Saída em audio/: musica.mp3 (66 s, 124 BPM) e whoosh, impacto, pop, digitando,
carimbo, ding, risco (.mp3). Uso: python3 audio/sintetizar.py
"""
import os
import subprocess
import tempfile

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
OUT = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(7)


def t_(dur):
    return np.arange(int(dur * SR)) / SR


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def saw(freq, dur, harm=24):
    t = t_(dur)
    out = np.zeros_like(t)
    for k in range(1, harm + 1):
        if freq * k > SR / 2.2:
            break
        out += np.sin(2 * np.pi * freq * k * t) / k
    return out * 0.6


def env(dur, a=0.005, d=0.2, s=0.0, r=0.05):
    n = int(dur * SR)
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-6), 1.0)
    dec = np.clip((t - a) / max(d, 1e-6), 0, 1)
    e = np.where(t >= a, 1 - (1 - s) * dec, e)
    nr = min(int(r * SR), n)
    if nr:
        e[n - nr:] *= np.linspace(1, 0, nr)
    return e


def place(buf, x, at, gain=1.0):
    i = int(at * SR)
    j = min(len(buf), i + len(x))
    if i < len(buf):
        buf[i:j] += x[: j - i] * gain


def note(n):  # MIDI -> Hz
    return 440 * 2 ** ((n - 69) / 12)


def save(name, x, stereo=None):
    data = np.stack([x, x], 1) if stereo is None else stereo
    data = data / (np.max(np.abs(data)) + 1e-9) * 0.95
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        wavfile.write(f.name, SR, (data * 32767).astype(np.int16))
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f.name, '-b:a', '256k',
                        os.path.join(OUT, name + '.mp3')], check=True)
    os.unlink(f.name)


# ---------------- instrumentos ----------------
def kick():
    t = t_(0.45)
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    click = hp(rng.standard_normal(len(t)), 2000) * np.exp(-t * 300) * 0.3
    return (np.sin(ph) * np.exp(-t * 7) + click)


def clap():
    t = t_(0.3)
    n = bp(rng.standard_normal(len(t)), 900, 4000)
    e = np.exp(-t * 22)
    for o in (0.0, 0.011, 0.022):  # três batidas rápidas = palma
        e += np.where(t >= o, np.exp(-(t - o) * 180), 0) * 0.6
    return n * e * 0.5


def hat(open_=False):
    t = t_(0.25 if open_ else 0.06)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * (14 if open_ else 70)) * 0.25


def bass(n, dur):
    x = saw(note(n), dur, 30) + 0.5 * np.sin(2 * np.pi * note(n - 12) * t_(dur))
    return lp(x, 900) * env(dur, 0.004, dur * 0.8, 0.6, 0.03)


def pluck(n, dur=0.22):
    x = saw(note(n), dur, 40) + saw(note(n) * 1.006, dur, 40)
    t = t_(dur)
    # filtro "abrindo e fechando" à mão: mistura do sinal com versão filtrada
    bright = x * np.exp(-t * 18)
    return (lp(bright, 5000) * 0.6 + lp(x, 1500) * 0.4) * env(dur, 0.002, dur, 0, 0.02)


# ---------------- trilha ----------------
def musica(total=66.0, bpm=124):
    beat = 60 / bpm
    L = np.zeros(int(total * SR))
    R = np.zeros_like(L)
    drums = np.zeros_like(L)
    side = np.ones_like(L)  # sidechain: abaixa baixo/synth em cada bumbo
    prog = [(57, [69, 72, 76]), (53, [65, 69, 72]), (48, [64, 67, 72]), (55, [67, 71, 74])]  # Am F C G
    arp = [0, 1, 2, 1, 2, 0, 2, 1]
    k, c, ho, hc = kick(), clap(), hat(True), hat(False)
    sc = 1 - 0.75 * np.exp(-t_(beat) * 9)
    nbeats = int(total / beat)
    for b in range(nbeats):
        at = b * beat
        bar = b // 4
        root, chord = prog[bar % 4]
        place(drums, k, at, 1.0)
        i = int(at * SR)
        side[i:i + len(sc)] = np.minimum(side[i:i + len(sc)], sc[: len(side) - i])
        if b % 4 in (1, 3):
            place(drums, c, at, 0.9)
        place(drums, ho, at + beat / 2, 0.8)
        for s in range(4):
            place(drums, hc, at + s * beat / 4, 0.5 if s % 2 else 0.3)
        # baixo no contratempo (estilo house)
        bn = bass(root - 12, beat / 2 * 0.95)
        place(L, bn, at + beat / 2, 0.55)
        place(R, bn, at + beat / 2, 0.55)
        # arpejo em semicolcheias, uma oitava acima a cada 8 compassos
        oct_ = 12 if (bar // 8) % 2 else 0
        for s in range(4):
            nn = chord[arp[(b * 4 + s) % 8] % 3] + oct_
            p = pluck(nn)
            place(L, p, at + s * beat / 4, 0.28)
            place(R, p, at + s * beat / 4 + 0.012, 0.22)  # leve atraso = estéreo
    # pad de acorde por baixo
    for bar in range(int(total / (beat * 4)) + 1):
        root, chord = prog[bar % 4]
        d = beat * 4
        pad = sum(lp(saw(note(n - 12), d, 12) + saw(note(n - 12) * 1.004, d, 12), 1200) for n in chord)
        pad *= env(d, 0.3, d, 1.0, 0.3)
        place(L, pad, bar * d, 0.06)
        place(R, pad, bar * d, 0.06)
    L *= side
    R *= side
    L += drums
    R += drums
    st = np.stack([L, R], 1)
    st = np.tanh(st * 1.3)  # saturação leve, dá "peso"
    fade = int(0.01 * SR)
    st[:fade] *= np.linspace(0, 1, fade)[:, None]
    return st


# ---------------- efeitos ----------------
def whoosh(dur=0.7):
    # mistura de faixas de ruído; o peso de cada faixa acompanha a varredura grave -> agudo -> grave
    t = t_(dur)
    n = rng.standard_normal(len(t))
    centers = [300, 600, 1200, 2400, 4800, 8000]
    bands = [bp(n, c * 0.7, min(c * 1.4, 20000)) for c in centers]
    sweep = 300 + 7000 * np.sin(np.pi * t / dur) ** 2
    out = np.zeros_like(t)
    for c, b in zip(centers, bands):
        out += b * np.exp(-np.log(sweep / c) ** 2 / 0.5)
    return out * np.sin(np.pi * t / dur) ** 2


def impacto():
    t = t_(1.6)
    f = 32 + 90 * np.exp(-t * 9)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    crack = lp(rng.standard_normal(len(t)), 3500) * np.exp(-t * 18)
    return sub + crack * 0.6


def pop():
    t = t_(0.12)
    f = 500 + 900 * (1 - np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35)


def digitando(dur=1.0):
    out = np.zeros(int(dur * SR))
    t0 = 0.0
    while t0 < dur - 0.05:
        t = t_(0.03)
        click = bp(rng.standard_normal(len(t)), 1800, 6500) * np.exp(-t * 220)
        click += np.sin(2 * np.pi * rng.uniform(180, 260) * t) * np.exp(-t * 120) * 0.4
        place(out, click, t0, rng.uniform(0.6, 1.0))
        t0 += rng.uniform(0.045, 0.09)
    return out


def carimbo():
    t = t_(0.35)
    thump = np.sin(2 * np.pi * (70 + 120 * np.exp(-t * 40)) * t) * np.exp(-t * 16)
    slap = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 60)
    return thump + slap * 0.7


def ding():
    t = t_(1.0)
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d)
            for f, a, d in ((1568, 1, 5), (3136, .35, 9), (4704, .15, 14), (2093, .4, 6)))
    return x * env(1.0, 0.002, 1.0, 1.0, 0.05)


def risco(dur=0.45):
    t = t_(dur)
    n = bp(rng.standard_normal(len(t)), 1500, 7000)
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 38 * t)  # "aspereza" da ponta da caneta
    return n * am * np.sin(np.pi * t / dur) ** 0.6


if __name__ == '__main__':
    save('musica', None, stereo=musica())
    for name, fn in [('whoosh', whoosh), ('impacto', impacto), ('pop', pop), ('digitando', digitando),
                     ('carimbo', carimbo), ('ding', ding), ('risco', risco)]:
        save(name, fn())
    print('ok')
