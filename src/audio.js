// Âm thanh tổng hợp bằng WebAudio — không cần file ngoài
import { G } from './state.js';

let ctx = null, master = null, ambient = null;

export function audioInit() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = G.muted ? 0 : 0.55;
    master.connect(ctx.destination);
    startAmbient();
  } catch (e) { ctx = null; }
}
export function setMuted(m) { G.muted = m; if (master) master.gain.linearRampToValueAtTime(m ? 0 : 0.55, ctx.currentTime + 0.15); }

function env(g, t0, a, d, peak = 1) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
}
function tone(freq, t0, a, d, type = 'sine', peak = 0.5, detune = 0) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq; o.detune.value = detune;
  env(g, t0, a, d, peak);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + a + d + 0.05);
}
function noise(t0, dur, peak = 0.3, freq = 800, q = 1) {
  if (!ctx) return;
  const len = Math.max(1, (dur * ctx.sampleRate) | 0);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource(); s.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); env(g, t0, 0.005, dur, peak);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t0);
}

function startAmbient() {
  // tiếng nền văn phòng: ù điều hoà rất nhẹ
  const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  o.type = 'sawtooth'; o.frequency.value = 46;
  f.type = 'lowpass'; f.frequency.value = 120;
  g.gain.value = 0.022;
  o.connect(f); f.connect(g); g.connect(master);
  o.start();
  const lfo = ctx.createOscillator(), lg = ctx.createGain();
  lfo.frequency.value = 0.13; lg.gain.value = 6;
  lfo.connect(lg); lg.connect(o.frequency); lfo.start();
  ambient = o;
}

let stepFlip = false, lastStep = 0;
export const sfx = {
  step(run) {
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - lastStep < (run ? 0.26 : 0.4)) return;
    lastStep = now; stepFlip = !stepFlip;
    noise(now, 0.07, 0.10, stepFlip ? 300 : 240, 0.8);
  },
  click() { if (ctx) tone(1200, ctx.currentTime, 0.004, 0.05, 'square', 0.12); },
  paper() { if (ctx) { noise(ctx.currentTime, 0.16, 0.12, 2600, 0.5); noise(ctx.currentTime + 0.08, 0.12, 0.09, 3300, 0.5); } },
  deny() { if (!ctx) return; const t = ctx.currentTime; tone(220, t, 0.01, 0.12, 'square', 0.2); tone(180, t + 0.13, 0.01, 0.16, 'square', 0.2); },
  ding() { if (!ctx) return; const t = ctx.currentTime; tone(988, t, 0.01, 0.6, 'sine', 0.3); tone(1319, t + 0.18, 0.01, 0.8, 'sine', 0.28); },
  doors() { if (!ctx) return; noise(ctx.currentTime, 0.7, 0.08, 500, 2); },
  slide() { if (!ctx) return; noise(ctx.currentTime, 0.5, 0.16, 180, 1.2); },
  coffee() { if (!ctx) return; const t = ctx.currentTime; noise(t, 0.5, 0.1, 900, 0.6); noise(t + 0.5, 0.45, 0.13, 500, 0.6); tone(880, t + 1.0, 0.01, 0.25, 'sine', 0.2); },
  key() { // lấp lánh khi nhận chìa
    if (!ctx) return; const t = ctx.currentTime;
    [880, 1175, 1568, 2093].forEach((f, i) => tone(f, t + i * 0.09, 0.008, 0.5, 'triangle', 0.22));
  },
  unlock() { if (!ctx) return; const t = ctx.currentTime; tone(140, t, 0.005, 0.1, 'square', 0.25); noise(t + 0.1, 0.1, 0.2, 700, 2); tone(520, t + 0.22, 0.01, 0.3, 'triangle', 0.2); },
  doorOpen() { if (!ctx) return; const t = ctx.currentTime; noise(t, 1.6, 0.13, 90, 1.5); noise(t + 0.2, 1.2, 0.07, 1400, 0.4); },
  spot() { if (!ctx) return; tone(300, ctx.currentTime, 0.004, 0.18, 'square', 0.18); },
  bounce() { if (!ctx) return; tone(170, ctx.currentTime, 0.005, 0.1, 'sine', 0.25); },
  swish() { if (!ctx) return; noise(ctx.currentTime, 0.3, 0.2, 2000, 0.7); },
  score() { if (!ctx) return; const t = ctx.currentTime; tone(660, t, 0.01, 0.12, 'square', 0.2); tone(880, t + 0.1, 0.01, 0.2, 'square', 0.2); },
  blip() { if (ctx) tone(620, ctx.currentTime, 0.004, 0.07, 'square', 0.15); },
  eat() { if (ctx) tone(980, ctx.currentTime, 0.004, 0.09, 'square', 0.18); },
  over() { if (!ctx) return; const t = ctx.currentTime; [440, 349, 262, 196].forEach((f, i) => tone(f, t + i * 0.14, 0.01, 0.16, 'sawtooth', 0.16)); },
  hint() { if (!ctx) return; const t = ctx.currentTime; tone(740, t, 0.01, 0.2, 'sine', 0.2); tone(988, t + 0.12, 0.01, 0.3, 'sine', 0.2); },
  fanfare() {
    if (!ctx) return; const t = ctx.currentTime;
    const seq = [[523, 0], [523, .14], [523, .28], [659, .42], [784, .7], [659, .94], [784, 1.12], [1047, 1.4]];
    seq.forEach(([f, dt]) => { tone(f, t + dt, 0.012, 0.32, 'square', 0.18); tone(f / 2, t + dt, 0.012, 0.4, 'triangle', 0.15); });
    [[523, 1047], [659, 1319], [784, 1568]].forEach((fs, i) =>
      fs.forEach(f => tone(f, t + 1.75 + i * 0.0, 0.02, 1.6, 'sawtooth', 0.07)));
    noise(t + 1.75, 1.2, 0.1, 5000, 0.3); // pháo giấy xì xào
  },
};
