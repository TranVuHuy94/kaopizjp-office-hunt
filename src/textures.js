// Texture vẽ bằng canvas — hình ảnh tự sinh + logo/ảnh thật nhúng lúc build
import * as THREE from 'three';

export const KBLUE = '#3c9cd7'; // màu brand lấy trực tiếp từ logo gốc

export function C(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
export function tex(canvas, { srgb = true, repeat = null, aniso = 4 } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.anisotropy = aniso;
  return t;
}
export function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// ---- LOGO & ẢNH NHÚNG ----
// Ưu tiên ảnh GỐC nhúng lúc build (SVG/PNG/JPG); thiếu thì vẽ vector mô phỏng.
import { LOGO_B64, MARK_B64, LOGO10_B64 } from './logodata.js';
import { POSTER_B64 } from './posterdata.js';
import { SPRITE_B64 } from './spritedata.js';
let logoImg = null, markImg = null, logo10Img = null; // HTMLImageElement đã decode
const posterCv = new Map();   // tên poster → canvas
const spriteCv = new Map();   // tên sprite → canvas (giữ alpha)
const tintCaches = new Map(); // ảnh → Map(màu → canvas đã nhuộm)

const loadImg = (src) => new Promise((res) => {
  if (!src) return res(null);
  const im = new Image();
  im.onload = () => res(im);
  im.onerror = () => res(null); // hỏng thì rơi về vector
  im.src = src;
});
export async function ensureLogoReady() {
  [logoImg, markImg, logo10Img] = await Promise.all([
    loadImg(LOGO_B64), loadImg(MARK_B64), loadImg(LOGO10_B64),
  ]);
  const toCv = async (v) => {
    const im = await loadImg(v);
    if (!im) return null;
    const c = document.createElement('canvas');
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    c.getContext('2d').drawImage(im, 0, 0);
    return c;
  };
  await Promise.all([
    ...Object.entries(POSTER_B64).map(async ([k, v]) => { const c = await toCv(v); if (c) posterCv.set(k, c); }),
    ...Object.entries(SPRITE_B64).map(async ([k, v]) => { const c = await toCv(v); if (c) spriteCv.set(k, c); }),
  ]);
}
// canvas của poster/sprite ảnh thật (null nếu không có)
export function posterCanvas(name) { return posterCv.get(name) || null; }
export function spriteCanvas(name) { return spriteCv.get(name) || null; }
function tintImg(img, color) {
  // color === null → giữ nguyên màu gốc của ảnh
  let cache = tintCaches.get(img);
  if (!cache) tintCaches.set(img, cache = new Map());
  const key = color || '__orig';
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  if (color) {
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
  }
  cache.set(key, c);
  return c;
}
const tintedLogo = (color) => tintImg(logoImg, color);
export function drawLogo(g, cx, cy, size, color = KBLUE, sub = '') {
  if (logoImg) {
    // size ≈ chiều cao phần chữ k → ảnh gốc cao hơn chút (descender của p/z)
    const h = size * 1.35;
    const w = h * (logoImg.naturalWidth / logoImg.naturalHeight);
    // màu thương hiệu → dùng ảnh gốc nguyên vẹn; màu khác (vd trắng) → nhuộm theo alpha
    const src = (color === KBLUE) ? tintedLogo(null) : tintedLogo(color);
    g.drawImage(src, cx - w / 2, cy - h / 2, w, h);
    if (sub) {
      g.save();
      g.font = `500 ${size * 0.17}px 'Segoe UI', Arial`;
      g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillStyle = color;
      g.fillText(sub, cx, cy + h / 2 + size * 0.26);
      g.restore();
    }
    return;
  }
  drawLogoVector(g, cx, cy, size, color, sub);
}
function drawLogoVector(g, cx, cy, size, color = KBLUE, sub = '') {
  const R = size * 0.5; // bán kính vòng khuyên
  g.save();
  const F = 2.3 * R;
  const font = `400 ${F}px 'Segoe UI','Helvetica Neue',Arial,sans-serif`;
  g.font = font;
  const tw = g.measureText('aopiz').width;
  const startText = 1.22 * R;
  const totalW = R + startText + tw + 0.45 * R;
  const ccx = cx - totalW / 2 + R; // tâm vòng khuyên
  const ccy = cy;
  // vòng khuyên hở bên phải (vẽ offscreen rồi khoét lỗ lệch tâm)
  const S = Math.ceil(R * 2.6);
  const oc = document.createElement('canvas');
  oc.width = oc.height = S;
  const og = oc.getContext('2d');
  og.fillStyle = color;
  og.beginPath(); og.arc(S / 2, S / 2, R, 0, Math.PI * 2); og.fill();
  og.globalCompositeOperation = 'destination-out';
  og.beginPath(); og.arc(S / 2 + 0.20 * R, S / 2 - 0.08 * R, 0.93 * R, 0, Math.PI * 2); og.fill();
  g.drawImage(oc, ccx - S / 2, ccy - S / 2);
  // chữ k đậm (thân + 2 nhánh)
  g.fillStyle = color;
  const st = R * 0.30;
  g.fillRect(ccx + 0.10 * R, ccy - 0.98 * R, st, 1.78 * R);
  g.strokeStyle = color; g.lineWidth = st; g.lineCap = 'butt';
  g.beginPath(); g.moveTo(ccx + 0.28 * R, ccy + 0.06 * R); g.lineTo(ccx + 1.00 * R, ccy - 0.90 * R); g.stroke();
  g.beginPath(); g.moveTo(ccx + 0.28 * R, ccy - 0.06 * R); g.lineTo(ccx + 1.06 * R, ccy + 0.80 * R); g.stroke();
  // aopiz
  g.font = font; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillText('aopiz', ccx + startText, ccy + 0.80 * R);
  // ®
  g.font = `400 ${0.42 * R}px 'Segoe UI', Arial`;
  g.fillText('®', ccx + startText + tw + 0.08 * R, ccy - 0.70 * R);
  if (sub) {
    g.font = `500 ${0.34 * R}px 'Segoe UI', Arial`;
    g.textAlign = 'center';
    g.fillText(sub, cx, cy + 1.5 * R);
  }
  g.restore();
}
// logo kỷ niệm 10 năm: ưu tiên ảnh gốc (assets/logo/logo 10 nam.*) → ghép từ
// icon K + wordmark thật (đúng thiết kế "1 + icon = 10" chính thức) → vẽ tay
export function drawLogo10(g, cx, cy, size, color = KBLUE) {
  if (logo10Img) {
    const h = size * 1.5;
    const w = h * (logo10Img.naturalWidth / logo10Img.naturalHeight);
    g.drawImage((color === KBLUE) ? tintImg(logo10Img, null) : tintImg(logo10Img, color),
      cx - w / 2, cy - h / 2, w, h);
    return;
  }
  if (markImg && logoImg) {
    g.save();
    g.font = `800 ${size * 1.18}px 'Segoe UI', Arial, sans-serif`;
    const w1 = g.measureText('1').width;
    const ringD = size * 1.06;
    const wmH = size * 0.56;
    const wmW = wmH * (logoImg.naturalWidth / logoImg.naturalHeight);
    const gap1 = size * 0.02, gap2 = size * 0.17;
    let x = cx - (w1 + gap1 + ringD + gap2 + wmW) / 2;
    g.fillStyle = color;
    g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('1', x, cy + size * 0.02);
    x += w1 + gap1;
    g.drawImage((color === KBLUE) ? tintImg(markImg, null) : tintImg(markImg, color),
      x, cy - ringD / 2, ringD, ringD);
    x += ringD + gap2;
    g.drawImage((color === KBLUE) ? tintImg(logoImg, null) : tintImg(logoImg, color),
      x, cy - wmH / 2, wmW, wmH);
    g.restore();
    return;
  }
  g.save();
  g.translate(cx, cy);
  g.font = `800 ${size}px 'Segoe UI', Arial, sans-serif`;
  g.textAlign = 'right'; g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText('1', -size * 0.12, 0);
  g.strokeStyle = color; g.lineWidth = size * 0.09;
  g.beginPath(); g.arc(size * 0.22, 0, size * 0.34, 0.7, Math.PI * 2 + 0.5); g.stroke();
  g.font = `600 ${size * 0.34}px 'Segoe UI', Arial`;
  g.textAlign = 'left';
  g.fillText('kaopiz', size * 0.66, size * 0.06);
  g.restore();
}
export function logoCanvas(w = 520, h = 180, bg = null, sub = '', color = KBLUE) {
  const [c, g] = C(w, h);
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  drawLogo(g, w / 2, h * (sub ? 0.44 : 0.5), h * (sub ? 0.40 : 0.46), color, sub);
  return c;
}

// ---- vật liệu nền ----
export function woodTex(light = true) {
  const [c, g] = C(512, 512);
  const base = light ? '#caa472' : '#8a6543';
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let p = 0; p < 8; p++) {
    const y = p * 64;
    g.fillStyle = `rgba(${light ? '120,84,45' : '60,40,22'},${0.12 + Math.random() * 0.1})`;
    g.fillRect(0, y, 512, 2);
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = `rgba(${light ? '139,101,58' : '70,48,28'},${0.08 + Math.random() * 0.14})`;
      g.lineWidth = 1 + Math.random() * 2;
      g.beginPath();
      const yy = y + 6 + Math.random() * 54;
      g.moveTo(0, yy);
      for (let x = 0; x <= 512; x += 64) g.lineTo(x, yy + Math.sin(x * 0.02 + i) * 3 + (Math.random() - 0.5) * 4);
      g.stroke();
    }
  }
  return c;
}
export function ceilingSlats() {
  const [c, g] = C(512, 512);
  g.fillStyle = '#9d7a52'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16; i++) {
    const x = i * 32;
    const grd = g.createLinearGradient(x, 0, x + 32, 0);
    grd.addColorStop(0, '#7a5c3a'); grd.addColorStop(0.5, '#a8845c'); grd.addColorStop(1, '#6e5234');
    g.fillStyle = grd; g.fillRect(x, 0, 30, 512);
    g.fillStyle = 'rgba(30,18,8,.55)'; g.fillRect(x + 30, 0, 2, 512);
  }
  return c;
}
export function carpetTex(c1 = '#33415a', c2 = '#27344a') {
  const [c, g] = C(256, 256);
  g.fillStyle = c1; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = Math.random() < 0.5 ? c2 : `rgba(255,255,255,${Math.random() * 0.05})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 1.6, 1.6);
  }
  return c;
}
export function terrazzoTex() {
  const [c, g] = C(512, 512);
  g.fillStyle = '#e7e4dd'; g.fillRect(0, 0, 512, 512);
  const cols = ['#cfc9bd', '#b9b2a4', '#9aa3ab', '#d8d3c8', '#aeb8c2', '#c4beb1'];
  for (let i = 0; i < 700; i++) {
    g.fillStyle = cols[(Math.random() * cols.length) | 0];
    g.globalAlpha = 0.5 + Math.random() * 0.5;
    g.beginPath();
    g.ellipse(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 4, 1 + Math.random() * 3, Math.random() * 3, 0, 7);
    g.fill();
  }
  g.globalAlpha = 1;
  // mạch ron lớn
  g.strokeStyle = 'rgba(120,115,105,.5)'; g.lineWidth = 2;
  g.strokeRect(0, 0, 512, 512);
  return c;
}
export function concreteTex() {
  const [c, g] = C(256, 256);
  g.fillStyle = '#b9bcc0'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4000; i++) {
    g.fillStyle = `rgba(${90 + Math.random() * 60},${90 + Math.random() * 60},${95 + Math.random() * 60},.12)`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  for (let i = 0; i < 8; i++) {
    g.strokeStyle = 'rgba(110,112,118,.25)'; g.lineWidth = .8;
    g.beginPath(); g.moveTo(Math.random() * 256, Math.random() * 256);
    g.lineTo(Math.random() * 256, Math.random() * 256); g.stroke();
  }
  return c;
}
export function wallTex(base = '#f2efe9') {
  const [c, g] = C(128, 128);
  g.fillStyle = base; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(0,0,0,${Math.random() * 0.025})`;
    g.fillRect(Math.random() * 128, Math.random() * 128, 1, 1);
  }
  return c;
}

// ---- cảnh ngoài cửa sổ ----
export function skylineTex(night = false) {
  const [c, g] = C(1024, 512);
  const sky = g.createLinearGradient(0, 0, 0, 512);
  if (night) { sky.addColorStop(0, '#0a1730'); sky.addColorStop(1, '#1d3a5f'); }
  else { sky.addColorStop(0, '#9fd0f5'); sky.addColorStop(0.6, '#cfe8fa'); sky.addColorStop(1, '#f3e9d2'); }
  g.fillStyle = sky; g.fillRect(0, 0, 1024, 512);
  // mặt trời/quầng sáng
  g.fillStyle = night ? 'rgba(255,244,200,.9)' : 'rgba(255,255,230,.95)';
  g.beginPath(); g.arc(780, 110, night ? 26 : 38, 0, 7); g.fill();
  // dãy nhà xa
  g.fillStyle = night ? '#13243d' : '#a8bdd1';
  for (let x = 0; x < 1024;) {
    const w = 40 + Math.random() * 80, h = 90 + Math.random() * 140;
    g.fillRect(x, 512 - h - 60, w, h + 60); x += w + 8;
  }
  // tháp kiểu Tokyo
  g.fillStyle = night ? '#1b3050' : '#8fa6bd';
  g.beginPath(); g.moveTo(180, 452); g.lineTo(215, 160); g.lineTo(222, 160); g.lineTo(257, 452); g.closePath(); g.fill();
  g.fillRect(196, 300, 46, 12); g.fillRect(206, 220, 26, 10);
  // dãy nhà gần + cửa sổ
  for (let x = 0; x < 1024;) {
    const w = 60 + Math.random() * 100, h = 160 + Math.random() * 200, y = 512 - h;
    g.fillStyle = night ? '#0e1d33' : '#7e95ac';
    g.fillRect(x, y, w, h);
    g.fillStyle = night ? 'rgba(255,230,150,.8)' : 'rgba(255,255,255,.5)';
    for (let wy = y + 10; wy < 500; wy += 18)
      for (let wx = x + 6; wx < x + w - 8; wx += 14)
        if (Math.random() < (night ? 0.45 : 0.3)) g.fillRect(wx, wy, 7, 9);
    x += w + 14;
  }
  // cây xanh tiền cảnh
  g.fillStyle = night ? '#0c1c22' : '#5d8b66';
  for (let x = 0; x < 1024; x += 36) {
    g.beginPath(); g.arc(x + 18, 506, 26 + Math.random() * 14, Math.PI, 0); g.fill();
  }
  return c;
}

// ---- poster & bảng hiệu ----
export function posterOpenCup() {
  const [c, g] = C(512, 720);
  const bg = g.createLinearGradient(0, 0, 0, 720);
  bg.addColorStop(0, '#0b1c3f'); bg.addColorStop(0.55, '#123a75'); bg.addColorStop(1, '#0a1430');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 720);
  // ánh đèn sân vận động
  for (const [x, y] of [[80, 200], [430, 180], [256, 120]]) {
    const r = g.createRadialGradient(x, y, 4, x, y, 180);
    r.addColorStop(0, 'rgba(160,210,255,.5)'); r.addColorStop(1, 'transparent');
    g.fillStyle = r; g.fillRect(0, 0, 512, 720);
  }
  drawLogo10(g, 256, 60, 44, '#cfe6ff');
  // chữ KAOPIZ kim loại
  g.textAlign = 'center';
  const met = g.createLinearGradient(0, 130, 0, 230);
  met.addColorStop(0, '#ffffff'); met.addColorStop(0.45, '#bcd9f5'); met.addColorStop(0.55, '#5b87b8'); met.addColorStop(1, '#dfeefc');
  g.font = "900 92px 'Arial Black', 'Segoe UI', sans-serif";
  g.lineWidth = 10; g.strokeStyle = '#0a1f3c';
  g.strokeText('KAOPIZ', 256, 205);
  g.fillStyle = met; g.fillText('KAOPIZ', 256, 205);
  // băng rôn OPEN CUP 2026
  g.fillStyle = '#142e63';
  rr(g, 96, 232, 320, 56, 14); g.fill();
  g.strokeStyle = '#5b87b8'; g.lineWidth = 3; rr(g, 96, 232, 320, 56, 14); g.stroke();
  g.fillStyle = '#fff'; g.font = "800 34px 'Segoe UI', sans-serif";
  g.fillText('OPEN CUP 2026', 256, 272);
  // sân + cúp silhouette
  g.fillStyle = 'rgba(90,160,90,.5)';
  g.beginPath(); g.ellipse(256, 560, 230, 90, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3;
  g.beginPath(); g.ellipse(256, 560, 150, 56, 0, 0, 7); g.stroke();
  g.fillStyle = '#ffd34d';
  g.beginPath();
  g.moveTo(226, 470); g.bezierCurveTo(226, 530, 286, 530, 286, 470);
  g.lineTo(280, 430); g.lineTo(232, 430); g.closePath(); g.fill();
  g.fillRect(248, 524, 16, 26); g.fillRect(236, 550, 40, 10);
  g.font = "700 30px 'Segoe UI'"; g.fillStyle = '#fff';
  g.fillText('GIẢI BÓNG ĐÁ KỶ NIỆM 10 NĂM', 256, 640);
  g.font = "600 22px 'Segoe UI'"; g.fillStyle = '#9fc6e8';
  g.fillText('Toàn thể Kaopizer — Sân Mỹ Đình 2', 256, 676);
  return c;
}
export function poster10y() {
  const [c, g] = C(512, 720);
  const bg = g.createLinearGradient(0, 0, 512, 720);
  bg.addColorStop(0, '#eaf4fc'); bg.addColorStop(1, '#c9e2f5');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 720);
  for (let i = 0; i < 40; i++) { // hoa giấy
    g.fillStyle = ['#4d9fdb', '#ffd34d', '#ff7b7b', '#7cc3f2'][i % 4];
    g.save(); g.translate(Math.random() * 512, Math.random() * 300); g.rotate(Math.random() * 3);
    g.fillRect(0, 0, 10, 5); g.restore();
  }
  drawLogo10(g, 256, 200, 110, KBLUE);
  g.textAlign = 'center';
  g.fillStyle = '#143a5c'; g.font = "800 44px 'Segoe UI'";
  g.fillText('10 NĂM KAOPIZ', 256, 330);
  g.font = "600 26px 'Segoe UI'"; g.fillStyle = '#2c6ea6';
  g.fillText('Tiên phong cùng kỷ nguyên AI', 256, 375);
  g.font = "500 20px 'Segoe UI'"; g.fillStyle = '#4a7396';
  g.fillText('2016 — 2026 · Hà Nội × Tokyo', 256, 412);
  g.font = "600 24px 'Segoe UI'"; g.fillStyle = '#143a5c';
  g.fillText('Cảm ơn vì đã đồng hành 💙', 256, 600);
  return c;
}
// bảng VÔ ĐỊCH (mô phỏng tấm bảng thật)
export function vodichBoard() {
  const [c, g] = C(880, 620);
  const bg = g.createLinearGradient(0, 0, 0, 620);
  bg.addColorStop(0, '#0d2150'); bg.addColorStop(0.5, '#17407e'); bg.addColorStop(1, '#0a1638');
  g.fillStyle = bg; g.fillRect(0, 0, 880, 620);
  for (const [x, y] of [[160, 240], [720, 220], [440, 140]]) {
    const r = g.createRadialGradient(x, y, 6, x, y, 240);
    r.addColorStop(0, 'rgba(170,215,255,.5)'); r.addColorStop(1, 'transparent');
    g.fillStyle = r; g.fillRect(0, 0, 880, 620);
  }
  // khán đài mờ
  g.fillStyle = 'rgba(255,255,255,.07)';
  for (let i = 0; i < 60; i++) g.fillRect(20 + Math.random() * 840, 300 + Math.random() * 120, 14, 8);
  drawLogo10(g, 440, 64, 46, '#dceeff');
  g.textAlign = 'center';
  const met = g.createLinearGradient(0, 110, 0, 240);
  met.addColorStop(0, '#ffffff'); met.addColorStop(0.4, '#cfe2f7'); met.addColorStop(0.55, '#6d9cd0'); met.addColorStop(0.75, '#eaf4ff'); met.addColorStop(1, '#a9c8e8');
  g.font = "900 132px 'Arial Black','Segoe UI',sans-serif";
  g.lineWidth = 14; g.strokeStyle = '#091c3a'; g.strokeText('KAOPIZ', 440, 230);
  g.fillStyle = met; g.fillText('KAOPIZ', 440, 230);
  g.fillStyle = '#15306b';
  rr(g, 220, 258, 440, 64, 16); g.fill();
  g.strokeStyle = '#7da9dd'; g.lineWidth = 4; rr(g, 220, 258, 440, 64, 16); g.stroke();
  g.fillStyle = '#fff'; g.font = "800 40px 'Segoe UI'";
  g.fillText('OPEN CUP 2026', 440, 303);
  // sân bóng dưới
  g.fillStyle = 'rgba(70,140,80,.45)';
  g.beginPath(); g.ellipse(440, 600, 420, 110, 0, Math.PI, 0); g.fill();
  g.font = "900 120px 'Segoe UI','Arial',sans-serif";
  g.lineWidth = 10; g.strokeStyle = 'rgba(9,28,58,.8)';
  g.strokeText('VÔ ĐỊCH', 440, 500);
  g.fillStyle = '#ffffff'; g.fillText('VÔ ĐỊCH', 440, 500);
  return c;
}
// biển bảng nhỏ
export function signTex(text, { w = 256, h = 128, bg = '#10304f', fg = '#eaf4ff', size = 30, sub = '' } = {}) {
  const [c, g] = C(w, h);
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(124,195,242,.5)'; g.lineWidth = 4; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 ${size}px 'Segoe UI', sans-serif`;
  g.fillText(text, w / 2, sub ? h / 2 - size * 0.4 : h / 2);
  if (sub) { g.font = `500 ${size * 0.55}px 'Segoe UI'`; g.fillStyle = '#9fc6e8'; g.fillText(sub, w / 2, h / 2 + size * 0.6); }
  return c;
}
// giấy note
export function noteTex(lines, color = '#fff3a8') {
  const [c, g] = C(256, 256);
  g.fillStyle = color; g.fillRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(0, 0, 256, 26);
  g.fillStyle = '#3c3322';
  g.font = "500 24px 'Segoe Print','Comic Sans MS','Segoe UI',cursive";
  g.textAlign = 'center';
  lines.forEach((l, i) => g.fillText(l, 128, 70 + i * 36));
  return c;
}
// bìa sách / gáy truyện
export function shelfTex() {
  const [c, g] = C(512, 512);
  g.fillStyle = '#241a12'; g.fillRect(0, 0, 512, 512);
  const cols = ['#b33939', '#218c74', '#cc8e35', '#3867d6', '#8854d0', '#d1ccc0', '#227093', '#e58e26'];
  for (let row = 0; row < 4; row++) {
    const y = row * 128;
    g.fillStyle = '#1a120c'; g.fillRect(0, y + 118, 512, 10);
    let x = 8;
    while (x < 490) {
      const w = 16 + Math.random() * 22, h = 96 + Math.random() * 18;
      g.fillStyle = cols[(Math.random() * cols.length) | 0];
      g.fillRect(x, y + 118 - h, w, h);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + w - 3, y + 118 - h, 3, h);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 3, y + 128 - h, 2, h - 20);
      x += w + 3;
    }
  }
  return c;
}
// mặt tủ server
export function rackTex() {
  const [c, g] = C(256, 512);
  g.fillStyle = '#14181d'; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 12; i++) {
    const y = 8 + i * 41;
    g.fillStyle = '#1f262e'; rr(g, 10, y, 236, 34, 4); g.fill();
    g.fillStyle = '#0c0f13'; g.fillRect(18, y + 6, 130, 22);
    for (let s = 0; s < 8; s++) { g.fillStyle = '#06080a'; g.fillRect(20 + s * 16, y + 8, 12, 18); }
    for (let l = 0; l < 4; l++) {
      g.fillStyle = ['#27e07d', '#27e07d', '#ffc83d', '#2db8ff'][(Math.random() * 4) | 0];
      g.beginPath(); g.arc(170 + l * 18, y + 17, 3.4, 0, 7); g.fill();
    }
  }
  return c;
}
// mặt máy bán nước
export function vendingTex() {
  const [c, g] = C(256, 512);
  g.fillStyle = '#c8102e'; g.fillRect(0, 0, 256, 512);
  g.fillStyle = '#9b0c23'; g.fillRect(0, 0, 256, 60);
  g.fillStyle = '#fff'; g.font = "800 30px 'Segoe UI'"; g.textAlign = 'center';
  g.fillText('DRINK · 24h', 128, 40);
  g.fillStyle = '#101418'; rr(g, 18, 76, 220, 300, 8); g.fill();
  const cols = ['#ffd34d', '#7cc3f2', '#7bdc8a', '#ff8a8a', '#fff', '#e58e26'];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 5; i++) {
    g.fillStyle = cols[(r * 5 + i) % 6];
    rr(g, 30 + i * 42, 90 + r * 72, 26, 52, 6); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(33 + i * 42, 94 + r * 72, 5, 44);
  }
  g.fillStyle = '#22282f'; rr(g, 18, 396, 220, 90, 8); g.fill();
  g.fillStyle = '#0a0d10'; rr(g, 60, 414, 136, 54, 6); g.fill();
  g.fillStyle = '#5a646e'; g.font = "600 16px 'Segoe UI'";
  g.fillText('PUSH', 128, 446);
  return c;
}
// bảng trắng phòng seminar
export function whiteboardTex() {
  const [c, g] = C(1024, 512);
  g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, 1024, 512);
  g.strokeStyle = '#d7d7d2'; g.lineWidth = 6; g.strokeRect(3, 3, 1018, 506);
  g.fillStyle = '#1d4ed8'; g.font = "600 44px 'Segoe Print','Comic Sans MS',cursive";
  g.fillText('Đào tạo: AI Agent cho BrSE 🤖', 60, 86);
  g.strokeStyle = '#1d4ed8'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(60, 104); g.lineTo(700, 104); g.stroke();
  g.fillStyle = '#374151'; g.font = "500 34px 'Segoe Print','Comic Sans MS',cursive";
  g.fillText('1. Rules → 2. Skills → 3. MCP → 4. ...', 60, 170);
  g.fillText('Deadline demo: thứ 6 (đừng quên!!)', 60, 232);
  g.fillStyle = '#dc2626';
  g.fillText('Ai xoá bảng người đó rửa cốc cả tuần 😤', 60, 320);
  g.fillStyle = '#16a34a'; g.font = "500 30px 'Segoe Print',cursive";
  g.fillText('PS: nghe đồn trong VP có kho báu, sếp giấu kỹ lắm…', 60, 420);
  // nam châm
  for (const [x, y, cl] of [[940, 60, '#ef4444'], [940, 120, '#3b82f6'], [940, 180, '#f59e0b']]) {
    g.fillStyle = cl; g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill();
  }
  return c;
}
// thảm tròn
export function rugTex() {
  const [c, g] = C(256, 256);
  g.clearRect(0, 0, 256, 256);
  const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, '#9aa7b8'); grd.addColorStop(0.8, '#7e8da0'); grd.addColorStop(1, '#6b7a8d');
  g.fillStyle = grd; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
  for (let i = 0; i < 2200; i++) {
    const a = Math.random() * 7, r = Math.random() * 124;
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.07})`;
    g.fillRect(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 1.5, 1.5);
  }
  return c;
}
// decal sân bóng rổ mini
export function courtTex() {
  const [c, g] = C(512, 512);
  g.fillStyle = '#c9885a'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14; i++) {
    g.fillStyle = `rgba(120,70,35,${0.08 + (i % 3) * 0.03})`;
    g.fillRect(0, i * 38, 512, 3);
  }
  g.strokeStyle = '#f5f1ea'; g.lineWidth = 8;
  g.beginPath(); g.arc(256, 480, 200, Math.PI, 0); g.stroke();
  g.beginPath(); g.arc(256, 480, 70, Math.PI, 0); g.stroke();
  g.fillStyle = 'rgba(245,241,234,.9)'; g.font = "800 40px 'Segoe UI'"; g.textAlign = 'center';
  g.fillText('KAO·HOOP', 256, 270);
  return c;
}
// mặt máy arcade
export function arcadeTex() {
  const [c, g] = C(256, 512);
  const bg = g.createLinearGradient(0, 0, 0, 512);
  bg.addColorStop(0, '#1a1140'); bg.addColorStop(1, '#0b1f33');
  g.fillStyle = bg; g.fillRect(0, 0, 256, 512);
  g.font = "900 44px 'Arial Black','Segoe UI'"; g.textAlign = 'center';
  g.fillStyle = '#27e07d'; g.shadowColor = '#27e07d'; g.shadowBlur = 18;
  g.fillText('KAO', 128, 64);
  g.fillStyle = '#ffd34d'; g.shadowColor = '#ffd34d';
  g.fillText('ARCADE', 128, 112);
  g.shadowBlur = 0;
  // hình rắn pixel
  g.fillStyle = '#27e07d';
  const px = [[3, 7], [4, 7], [5, 7], [5, 6], [5, 5], [6, 5], [7, 5], [7, 6]];
  px.forEach(([x, y]) => g.fillRect(40 + x * 18, 200 + y * 18, 16, 16));
  g.fillStyle = '#ff5e5e'; g.fillRect(40 + 9 * 18, 200 + 6 * 18, 16, 16);
  g.fillStyle = '#9fc6e8'; g.font = "600 20px 'Segoe UI'";
  g.fillText('1 LƯỢT = 0 ĐỒNG', 128, 420);
  g.fillStyle = '#ffd34d'; g.font = "700 24px 'Segoe UI'";
  g.fillText('▼ BẤM ĐỂ CHƠI ▼', 128, 470);
  return c;
}

// ===== khu lễ tân & góc giải thưởng T3 (mô phỏng theo ảnh thật văn phòng) =====
// ốp tường xanh mint có vân + đường ron chéo
export function mintTex() {
  const [c, g] = C(256, 256);
  g.fillStyle = '#b7d4c5'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '70,110,90'},${0.02 + Math.random() * 0.04})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 1.6, 1.6);
  }
  g.strokeStyle = 'rgba(80,115,98,.35)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, 240); g.lineTo(256, 60); g.stroke();
  g.beginPath(); g.moveTo(0, 110); g.lineTo(170, 0); g.stroke();
  return c;
}
// đá ốp xám (băng đá gắn logo + thân quầy lễ tân)
export function stoneTex() {
  const [c, g] = C(256, 256);
  g.fillStyle = '#62686f'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3200; i++) {
    const v = 80 + Math.random() * 60;
    g.fillStyle = `rgba(${v},${v + 4},${v + 9},${0.05 + Math.random() * 0.07})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  for (let i = 0; i < 5; i++) {
    g.strokeStyle = 'rgba(40,44,50,.3)'; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(Math.random() * 256, Math.random() * 256);
    g.lineTo(Math.random() * 256, Math.random() * 256); g.stroke();
  }
  return c;
}
function star(g, cx, cy, R, color) {
  g.fillStyle = color;
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? R : R * 0.42;
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  g.closePath(); g.fill();
}
// bằng khen khung vàng đặt ở quầy lễ tân (mô phỏng tấm thật)
export function certBangKhen() {
  const [c, g] = C(560, 380);
  g.fillStyle = '#f9f3e0'; g.fillRect(0, 0, 560, 380);
  // viền đỏ trang trí kép
  g.strokeStyle = '#b3322e'; g.lineWidth = 8; g.strokeRect(14, 14, 532, 352);
  g.lineWidth = 2; g.strokeRect(28, 28, 504, 324);
  g.fillStyle = '#b3322e';
  for (const [x, y] of [[14, 14], [546, 14], [14, 366], [546, 366]]) {
    g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill();
  }
  // quốc huy cách điệu
  g.fillStyle = '#c8332e'; g.beginPath(); g.arc(280, 84, 30, 0, 7); g.fill();
  g.strokeStyle = '#e3b13c'; g.lineWidth = 3.5;
  g.beginPath(); g.arc(280, 84, 30, 0, 7); g.stroke();
  star(g, 280, 84, 16, '#f5d266');
  g.textAlign = 'center';
  g.fillStyle = '#222a33'; g.font = "700 19px Georgia,serif";
  g.fillText('CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM', 280, 142);
  g.font = "italic 600 15px Georgia,serif"; g.fillStyle = '#444c55';
  g.fillText('Độc lập – Tự do – Hạnh phúc', 280, 166);
  g.strokeStyle = '#444c55'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(190, 174); g.lineTo(370, 174); g.stroke();
  g.fillStyle = '#b3322e'; g.font = "900 52px Georgia,serif";
  g.fillText('BẰNG KHEN', 280, 232);
  g.fillStyle = '#1d3a5c'; g.font = "800 23px 'Segoe UI'";
  g.fillText('CÔNG TY CỔ PHẦN KAOPIZ', 280, 268);
  g.fillStyle = '#555e68'; g.font = "500 14px 'Segoe UI'";
  g.fillText('Đã có thành tích xuất sắc trong hoạt động và đóng góp', 280, 296);
  g.fillText('cho ngành công nghệ thông tin Việt Nam', 280, 316);
  // mộc đỏ + chữ ký
  g.strokeStyle = '#27415f'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(432, 318); g.bezierCurveTo(452, 302, 480, 318, 500, 304); g.stroke();
  g.globalAlpha = 0.85;
  g.fillStyle = '#cf3c34'; g.beginPath(); g.arc(468, 330, 25, 0, 7); g.fill();
  star(g, 468, 330, 11, '#f3cf60');
  g.globalAlpha = 1;
  g.textAlign = 'left';
  return c;
}
// các chứng nhận nhỏ trên tủ giải thưởng (ISO / P-Mark / đối tác)
export function certSmall(n = 0) {
  const [c, g] = C(220, 300);
  g.fillStyle = '#fdfdfb'; g.fillRect(0, 0, 220, 300);
  g.strokeStyle = '#c9c9c2'; g.lineWidth = 4; g.strokeRect(8, 8, 204, 284);
  g.textAlign = 'center';
  if (n === 0) { // P-Mark
    g.fillStyle = '#1565c0'; g.beginPath(); g.arc(110, 92, 44, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.font = "900 56px 'Segoe UI'"; g.fillText('P', 110, 112);
    g.fillStyle = '#22303c'; g.font = "700 20px 'Segoe UI'"; g.fillText('PRIVACY', 110, 172);
  } else if (n === 1) { // ISO
    g.strokeStyle = '#b89230'; g.lineWidth = 5;
    g.beginPath(); g.arc(110, 92, 42, 0, 7); g.stroke();
    g.fillStyle = '#b89230'; g.font = "800 26px 'Segoe UI'"; g.fillText('ISO', 110, 86);
    g.font = "700 18px 'Segoe UI'"; g.fillText('27001', 110, 112);
    g.fillStyle = '#22303c'; g.font = "700 18px 'Segoe UI'"; g.fillText('CERTIFIED', 110, 172);
  } else { // đối tác / giải thưởng khác
    g.fillStyle = '#0e7a5f'; g.fillRect(66, 50, 88, 84);
    g.fillStyle = '#fff'; g.font = "900 44px 'Segoe UI'"; g.fillText('DS', 110, 108);
    g.fillStyle = '#22303c'; g.font = "700 17px 'Segoe UI'"; g.fillText('PARTNER', 110, 172);
  }
  g.fillStyle = '#9aa0a8';
  for (let i = 0; i < 3; i++) g.fillRect(40, 200 + i * 24, 140, 7);
  g.fillRect(64, 268, 92, 7);
  g.textAlign = 'left';
  return c;
}
// poster tạp chí kinh tế Nhật「注目企業 2026」(mô phỏng poster thật treo ở góc giải thưởng)
export function posterKeizai() {
  const [c, g] = C(840, 420);
  const bg = g.createLinearGradient(0, 0, 0, 420);
  bg.addColorStop(0, '#0c1430'); bg.addColorStop(1, '#1b2a55');
  g.fillStyle = bg; g.fillRect(0, 0, 840, 420);
  // tiêu đề vàng
  g.textAlign = 'left';
  g.fillStyle = '#e8c45a'; g.font = "900 64px 'Yu Gothic','Hiragino Sans','Segoe UI',sans-serif";
  g.fillText('注目企業', 36, 86);
  g.font = "900 58px 'Segoe UI'";
  g.fillText('2026', 318, 84);
  g.fillStyle = '#cfe0f5'; g.font = "600 21px 'Yu Gothic','Segoe UI'";
  g.fillText('海外で稼ぐ — 経営戦略特集 · KAOPIZ 掲載', 38, 122);
  // lưới chân dung doanh nhân (vest + sơ mi trắng)
  const suits = ['#1d2533', '#262f40', '#332a26', '#1f2b3a', '#2c2c34'];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) {
    const x = 34 + i * 112, y = 150 + r * 112;
    g.fillStyle = '#e9eef5'; g.fillRect(x, y, 96, 96);
    g.fillStyle = suits[(r * 7 + i) % 5];
    g.beginPath(); g.moveTo(x + 14, y + 96); g.quadraticCurveTo(x + 48, y + 44, x + 82, y + 96); g.closePath(); g.fill();
    g.fillStyle = '#fff';
    g.beginPath(); g.moveTo(x + 38, y + 96); g.lineTo(x + 48, y + 62); g.lineTo(x + 58, y + 96); g.closePath(); g.fill();
    g.fillStyle = '#caa183'; g.beginPath(); g.arc(x + 48, y + 40, 17, 0, 7); g.fill();
    g.strokeStyle = '#e8c45a'; g.lineWidth = 2; g.strokeRect(x, y, 96, 96);
  }
  // hộp đỏ tên tạp chí + dòng phát hành
  g.fillStyle = '#c8102e'; g.fillRect(632, 28, 176, 64);
  g.fillStyle = '#fff'; g.textAlign = 'center';
  g.font = "800 34px 'Yu Gothic','Segoe UI'"; g.fillText('経済界', 720, 72);
  g.fillStyle = '#eef3fa'; g.fillRect(0, 384, 840, 36);
  g.fillStyle = '#c8102e'; g.font = "700 21px 'Yu Gothic','Segoe UI'";
  g.fillText('雑誌「経済界」総力特集全31頁 · 3月23日(月)発売 — KEIZAIKAI', 420, 410);
  g.textAlign = 'left';
  return c;
}
// tờ 10.000¥ "Ngân hàng Kaopiz" — giải thưởng giấu kín cho người IQ cao
export function yenNote() {
  const [c, g] = C(580, 270);
  const bg = g.createLinearGradient(0, 0, 580, 270);
  bg.addColorStop(0, '#eef3e9'); bg.addColorStop(0.5, '#e7eef4'); bg.addColorStop(1, '#ece9df');
  g.fillStyle = bg; g.fillRect(0, 0, 580, 270);
  // hoa văn guilloche
  g.strokeStyle = 'rgba(70,199,160,.25)';
  for (let i = 0; i < 14; i++) {
    g.lineWidth = 1;
    g.beginPath(); g.ellipse(290, 135, 250 - i * 14, 95 - i * 5, i * 0.25, 0, 7); g.stroke();
  }
  g.strokeStyle = 'rgba(60,156,215,.2)';
  for (let i = 0; i < 8; i++) {
    g.beginPath(); g.arc(60 + i * 70, 135, 90, 0, 7); g.stroke();
  }
  g.strokeStyle = '#3c6e5a'; g.lineWidth = 5; g.strokeRect(8, 8, 564, 254);
  g.lineWidth = 1.5; g.strokeRect(16, 16, 548, 238);
  // chân dung Kari (kiến xanh) trong khung oval
  g.fillStyle = '#f5f2e8'; g.beginPath(); g.ellipse(452, 132, 74, 92, 0, 0, 7); g.fill();
  g.strokeStyle = '#3c6e5a'; g.lineWidth = 2; g.beginPath(); g.ellipse(452, 132, 74, 92, 0, 0, 7); g.stroke();
  g.strokeStyle = '#2d77b5'; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(436, 84); g.quadraticCurveTo(424, 60, 410, 52); g.stroke(); // râu trái
  g.beginPath(); g.moveTo(468, 84); g.quadraticCurveTo(480, 60, 494, 52); g.stroke(); // râu phải
  g.fillStyle = '#2d77b5'; g.beginPath(); g.arc(410, 50, 6, 0, 7); g.fill(); g.beginPath(); g.arc(494, 50, 6, 0, 7); g.fill();
  g.fillStyle = '#3a8ed0'; g.beginPath(); g.ellipse(452, 120, 40, 36, 0, 0, 7); g.fill(); // đầu
  g.fillStyle = '#fff';
  g.beginPath(); g.ellipse(438, 116, 12, 15, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(466, 116, 12, 15, 0, 0, 7); g.fill();
  g.fillStyle = '#123a5e';
  g.beginPath(); g.arc(440, 119, 6, 0, 7); g.fill(); g.beginPath(); g.arc(464, 119, 6, 0, 7); g.fill();
  g.strokeStyle = '#123a5e'; g.lineWidth = 3;
  g.beginPath(); g.arc(452, 134, 12, 0.25, Math.PI - 0.25); g.stroke(); // cười
  g.fillStyle = '#2d77b5'; g.beginPath(); g.ellipse(452, 180, 26, 28, 0, 0, 7); g.fill(); // thân
  // chữ
  g.textAlign = 'left';
  g.fillStyle = '#21424f'; g.font = '700 19px Georgia,serif';
  g.fillText('NGÂN HÀNG KAOPIZ', 36, 52);
  g.font = '600 12px "Segoe UI"'; g.fillStyle = '#48626e';
  g.fillText('KAOPIZ GINKO · GIẢI THƯỞNG TRÍ TUỆ 10 NĂM', 36, 72);
  g.font = '900 86px Georgia,serif'; g.fillStyle = '#1d4e41';
  g.fillText('10000', 36, 172);
  g.font = '700 40px serif'; g.fillStyle = '#21424f';
  g.fillText('壱万円', 40, 222);
  g.font = '600 13px "Segoe UI"'; g.fillStyle = '#5a6e62';
  g.fillText('YEN · CHỈ DÀNH CHO NGƯỜI GIẢI ĐƯỢC TIN ĐỒN', 36, 246);
  g.font = '700 13px Consolas'; g.fillStyle = '#9a3b3b';
  g.fillText('KP-2026-IQ-0001', 452 - 56, 246);
  g.font = '800 22px "Segoe UI"'; g.fillStyle = '#1d4e41';
  g.fillText('¥', 540, 44);
  return c;
}
// vệt bụi hình tròn nơi cúp từng đặt (manh mối vui ở tủ giải thưởng)
export function dustRing() {
  const [c, g] = C(128, 128);
  g.clearRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(112,104,88,.55)'; g.lineWidth = 7;
  g.beginPath(); g.arc(64, 64, 40, 0, 7); g.stroke();
  g.strokeStyle = 'rgba(140,132,112,.28)'; g.lineWidth = 16;
  g.beginPath(); g.arc(64, 64, 40, 0, 7); g.stroke();
  for (let i = 0; i < 70; i++) {
    const a = Math.random() * 7, r = 44 + Math.random() * 16;
    g.fillStyle = `rgba(120,112,95,${0.1 + Math.random() * 0.2})`;
    g.fillRect(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 2, 2);
  }
  return c;
}
