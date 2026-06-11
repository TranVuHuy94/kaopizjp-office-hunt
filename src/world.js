// Dựng văn phòng 2 tầng: kiến trúc, nội thất, va chạm, điểm tương tác
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { G } from './state.js';
import * as TX from './textures.js';
import { STAFF_F1, STAFF_F3, drawScreen, nameplateCanvas } from './people.js';

export const F1Y = 0, F3Y = 7.2, F2Y = 3.6, WH = 3.3;

const DESK_LINES = {
  pikachu: 'đang "nghiên cứu thuật toán nối hình" — Level 97, xin đừng làm phiền Chủ tịch. ⚡',
  cotuong: 'đang đánh cờ tướng với "một người bạn" (nghi vấn là máy). ♟',
  shopping: 'giỏ hàng 99 món — lương thì chưa về. 🛍',
  chart: 'không phải lười đâu, là đang "quản lý tài sản". 📈',
  karaoke: 'luyện giọng cho Year End Party — 98 điểm! 🎤',
  sudoku: 'rèn IQ bằng Sudoku chế độ SIÊU DỄ (sai lần thứ 12). 🧩',
  food: 'đang chốt menu trưa cho cả phòng (tự phong). 🧋',
  babycam: 'đang làm nhiệm vụ cao cả nhất công ty: trông Hana ngủ. 🍼',
  farm: 'thu hoạch cà rốt ảo — năng suất hơn cả sprint. 🥕',
  lofi: 'đang "tập trung cao độ" cùng lofi (2 tiếng 47 phút rồi). 🎧',
  chess: 'Elo 3000 — nhờ "trợ lý đặc biệt" đánh hộ. 🤖',
  tetris: 'xếp gạch giỏi hơn xếp task. 🎮',
  comic: 'nghiên cứu "tài liệu kỹ thuật" mang tên Doraemon. 📚',
  livestream: '1..2..3 CHỐT ĐƠNNN!!! (xin đừng báo sếp) 🛒',
  garden: 'tưới cây ảo cho xanh… KPI. 🌿',
  billiards: 'luyện cơ tay cho giải bi-a công ty. 🎱',
  doc: 'soạn "Nghị quyết tăng lương cho bản thân" v12 — vẫn chưa dám gửi. 📄',
  flights: 'săn vé 0đ cho chuyến du lịch tự thưởng. ✈',
  video: 'đang xem một thứ "rất phục vụ công việc". 🎬',
};

// ============== hạ tầng nhỏ ==============
const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 14),
  sph: new THREE.SphereGeometry(0.5, 14, 10),
  cone: new THREE.ConeGeometry(0.5, 1, 10),
};
export let MATS = {};
class Merger {
  constructor() { this.lists = new Map(); }
  put(matKey, geo, x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0) {
    const g = geo.clone();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz)));
    if (!this.lists.has(matKey)) this.lists.set(matKey, []);
    this.lists.get(matKey).push(g);
  }
  box(k, cx, cy, cz, sx, sy, sz, ry = 0) { this.put(k, GEO.box, cx, cy, cz, sx, sy, sz, ry); }
  cyl(k, cx, cy, cz, r, h, ry = 0, rx = 0, rz = 0) { this.put(k, GEO.cyl, cx, cy, cz, r * 2, h, r * 2, ry, rx, rz); }
  finish(scene) {
    for (const [k, list] of this.lists) {
      const merged = mergeGeometries(list, false);
      const mesh = new THREE.Mesh(merged, MATS[k]);
      mesh.castShadow = !(k === 'stripLight' || k === 'neonCyan');
      mesh.receiveShadow = true;
      scene.add(mesh);
    }
    this.lists.clear();
  }
}
export function addCol(x1, z1, x2, z2, y0, y1, opts = {}) {
  const c = { minX: Math.min(x1, x2), maxX: Math.max(x1, x2), minZ: Math.min(z1, z2), maxZ: Math.max(z1, z2), minY: y0, maxY: y1, off: false, ...opts };
  G.colliders.push(c);
  return c;
}
function addPatch(x1, x2, z1, z2, yA, yB = null, grad = null) {
  G.patches.push({ minX: Math.min(x1, x2), maxX: Math.max(x1, x2), minZ: z1, maxZ: z2, yA, yB: yB === null ? yA : yB, grad });
}
function inter(x, y, z, r, label, onUse, opts = {}) {
  G.interactables.push({ pos: new THREE.Vector3(x, y, z), r, label, onUse, ...opts });
}
function cutSegs(a1, a2, gaps) {
  let segs = [[Math.min(a1, a2), Math.max(a1, a2)]];
  for (const [g1, g2] of gaps) {
    const out = [];
    for (const [s1, s2] of segs) {
      if (g2 <= s1 || g1 >= s2) { out.push([s1, s2]); continue; }
      if (g1 > s1) out.push([s1, g1]);
      if (g2 < s2) out.push([g2, s2]);
    }
    segs = out;
  }
  return segs.filter(([a, b]) => b - a > 0.01);
}
function wallX(m, k, x1, x2, z, y0, h, gaps = [], t = 0.16) {
  for (const [a, b] of cutSegs(x1, x2, gaps)) {
    m.box(k, (a + b) / 2, y0 + h / 2, z, b - a, h, t);
    addCol(a, z - t / 2, b, z + t / 2, y0, y0 + h);
  }
  for (const [a, b] of gaps) if (b > Math.min(x1, x2) && a < Math.max(x1, x2)) {
    m.box(k, (a + b) / 2, y0 + h - 0.35, z, b - a, 0.7, t);
    addCol(a, z - t / 2, b, z + t / 2, y0 + h - 0.7, y0 + h);
  }
}
function wallZ(m, k, z1, z2, x, y0, h, gaps = [], t = 0.16) {
  for (const [a, b] of cutSegs(z1, z2, gaps)) {
    m.box(k, x, y0 + h / 2, (a + b) / 2, t, h, b - a);
    addCol(x - t / 2, a, x + t / 2, b, y0, y0 + h);
  }
  for (const [a, b] of gaps) if (b > Math.min(z1, z2) && a < Math.max(z1, z2)) {
    m.box(k, x, y0 + h - 0.35, (a + b) / 2, t, 0.7, b - a);
    addCol(x - t / 2, a, x + t / 2, b, y0 + h - 0.7, y0 + h);
  }
}
function exWallX(m, x1, x2, z, y0) {
  wallX(m, 'wall', x1, x2, z, y0, 0.95, [], 0.2);
  m.box('wall', (x1 + x2) / 2, y0 + 2.92, z, x2 - x1, 0.78, 0.2);
  addCol(x1, z - 0.1, x2, z + 0.1, y0, y0 + WH);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, 1.58), MATS.glass);
  glass.position.set((x1 + x2) / 2, y0 + 1.74, z);
  G.scene.add(glass);
  for (let x = x1; x <= x2 + 0.01; x += 1.7) m.box('alum', x, y0 + 1.74, z, 0.06, 1.58, 0.1);
  m.box('alum', (x1 + x2) / 2, y0 + 0.95, z, x2 - x1, 0.07, 0.12);
  m.box('alum', (x1 + x2) / 2, y0 + 2.53, z, x2 - x1, 0.07, 0.12);
}
function exWallZ(m, z1, z2, x, y0) {
  wallZ(m, 'wall', z1, z2, x, y0, 0.95, [], 0.2);
  m.box('wall', x, y0 + 2.92, (z1 + z2) / 2, 0.2, 0.78, z2 - z1);
  addCol(x - 0.1, z1, x + 0.1, z2, y0, y0 + WH);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(z2 - z1, 1.58), MATS.glass);
  glass.position.set(x, y0 + 1.74, (z1 + z2) / 2); glass.rotation.y = Math.PI / 2;
  G.scene.add(glass);
  for (let z = z1; z <= z2 + 0.01; z += 1.7) m.box('alum', x, y0 + 1.74, z, 0.1, 1.58, 0.06);
  m.box('alum', x, y0 + 0.95, (z1 + z2) / 2, 0.12, 0.07, z2 - z1);
  m.box('alum', x, y0 + 2.53, (z1 + z2) / 2, 0.12, 0.07, z2 - z1);
}
function glassWallX(m, x1, x2, z, y0, gaps = []) {
  for (const [a, b] of cutSegs(x1, x2, gaps)) {
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(b - a, WH - 0.3), MATS.glass);
    gl.position.set((a + b) / 2, y0 + (WH - 0.3) / 2 + 0.05, z);
    G.scene.add(gl);
    addCol(a, z - 0.05, b, z + 0.05, y0, y0 + WH);
    m.box('black', (a + b) / 2, y0 + 0.05, z, b - a, 0.1, 0.08);
    m.box('black', (a + b) / 2, y0 + WH - 0.16, z, b - a, 0.12, 0.08);
    const n = Math.max(1, Math.round((b - a) / 1.4));
    for (let i = 0; i <= n; i++) m.box('black', a + (b - a) * i / n, y0 + WH / 2, z, 0.05, WH - 0.3, 0.06);
  }
  for (const [a, b] of gaps) if (b > x1 && a < x2) m.box('black', (a + b) / 2, y0 + WH - 0.16, z, b - a, 0.12, 0.08);
}
function glassWallZ(m, z1, z2, x, y0, gaps = []) {
  for (const [a, b] of cutSegs(z1, z2, gaps)) {
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(b - a, WH - 0.3), MATS.glass);
    gl.position.set(x, y0 + (WH - 0.3) / 2 + 0.05, (a + b) / 2); gl.rotation.y = Math.PI / 2;
    G.scene.add(gl);
    addCol(x - 0.05, a, x + 0.05, b, y0, y0 + WH);
    m.box('black', x, y0 + 0.05, (a + b) / 2, 0.08, 0.1, b - a);
    m.box('black', x, y0 + WH - 0.16, (a + b) / 2, 0.08, 0.12, b - a);
    const n = Math.max(1, Math.round((b - a) / 1.4));
    for (let i = 0; i <= n; i++) m.box('black', x, y0 + WH / 2, a + (b - a) * i / n, 0.06, WH - 0.3, 0.05);
  }
  for (const [a, b] of gaps) if (b > z1 && a < z2) m.box('black', x, y0 + WH - 0.16, (a + b) / 2, 0.08, 0.12, b - a);
}
export function plane(w, h, mat, x, y, z, ry = 0, rx = 0) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  p.position.set(x, y, z); p.rotation.set(rx, ry, 0);
  G.scene.add(p);
  return p;
}
export function basicMat(canvas) {
  return new THREE.MeshBasicMaterial({ map: TX.tex(canvas) });
}

// ============== vật liệu ==============
function makeMats() {
  MATS = {
    wall: new THREE.MeshStandardMaterial({ map: TX.tex(TX.wallTex(), { repeat: [6, 3] }), roughness: 0.93 }),
    wallNavy: new THREE.MeshStandardMaterial({ color: 0x16283c, roughness: 0.9 }),
    ceilWood: new THREE.MeshStandardMaterial({ map: TX.tex(TX.ceilingSlats(), { repeat: [7, 7] }), roughness: 0.85 }),
    floorTerr: new THREE.MeshStandardMaterial({ map: TX.tex(TX.terrazzoTex(), { repeat: [13, 8] }), roughness: 0.5, metalness: 0.04 }),
    floorCarp: new THREE.MeshStandardMaterial({ map: TX.tex(TX.carpetTex(), { repeat: [9, 9] }), roughness: 1 }),
    floorCarpB: new THREE.MeshStandardMaterial({ map: TX.tex(TX.carpetTex('#2c4a6e', '#223c5c'), { repeat: [12, 8] }), roughness: 1 }),
    floorWood: new THREE.MeshStandardMaterial({ map: TX.tex(TX.woodTex(true), { repeat: [4, 4] }), roughness: 0.6 }),
    conc: new THREE.MeshStandardMaterial({ map: TX.tex(TX.concreteTex(), { repeat: [3, 3] }), roughness: 0.95 }),
    wood: new THREE.MeshStandardMaterial({ map: TX.tex(TX.woodTex(true)), roughness: 0.62 }),
    woodDark: new THREE.MeshStandardMaterial({ color: 0x4e3a26, roughness: 0.7 }),
    black: new THREE.MeshStandardMaterial({ color: 0x20242a, roughness: 0.6, metalness: 0.3 }),
    alum: new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 0.35, metalness: 0.8 }),
    sofa: new THREE.MeshStandardMaterial({ color: 0x2b3950, roughness: 0.95 }),
    sofaD: new THREE.MeshStandardMaterial({ color: 0x232c39, roughness: 0.95 }),
    fabric: new THREE.MeshStandardMaterial({ color: 0x8d99a8, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x3f8f4f, roughness: 0.9 }),
    leafD: new THREE.MeshStandardMaterial({ color: 0x2e6e3c, roughness: 0.9 }),
    pot: new THREE.MeshStandardMaterial({ color: 0x7d848c, roughness: 0.8 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xcfe2ee, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.13, side: THREE.DoubleSide, envMapIntensity: 1.2, depthWrite: false }),
    white: new THREE.MeshStandardMaterial({ color: 0xf6f6f4, roughness: 0.5 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x6a737d, roughness: 0.35, metalness: 0.9 }),
    steelD: new THREE.MeshStandardMaterial({ color: 0x39404a, roughness: 0.45, metalness: 0.8 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd8a93c, roughness: 0.22, metalness: 1 }),
    silver: new THREE.MeshStandardMaterial({ color: 0xc9d2dc, roughness: 0.15, metalness: 1 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0xb0703a, roughness: 0.3, metalness: 1 }),
    red: new THREE.MeshStandardMaterial({ color: 0x8e2f2f, roughness: 0.85 }),
    carton: new THREE.MeshStandardMaterial({ color: 0xc09a62, roughness: 0.95 }),
    stripLight: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4dd, emissiveIntensity: 1.7 }),
    neonCyan: new THREE.MeshStandardMaterial({ color: 0x9ff3ff, emissive: 0x55e8ff, emissiveIntensity: 2.6 }),
    holo: new THREE.MeshStandardMaterial({ color: 0x9fe8ff, emissive: 0x4dd2ff, emissiveIntensity: 2.2, transparent: true, opacity: 0.85 }),
    screenOff: new THREE.MeshStandardMaterial({ color: 0x0a0e13, roughness: 0.25, metalness: 0.4 }),
    mint: new THREE.MeshStandardMaterial({ map: TX.tex(TX.mintTex(), { repeat: [2, 2] }), roughness: 0.92 }),
    stone: new THREE.MeshStandardMaterial({ map: TX.tex(TX.stoneTex(), { repeat: [2, 1] }), roughness: 0.75 }),
  };
}

// ============== nội thất (mọi hàm nhận yB = cao độ sàn) ==============
let toast = () => {}, dialog = { paper: () => {} }, sfx = {};
export function wireUI(fns) { toast = fns.toast; dialog = fns.dialog; sfx = fns.sfx; }

function mkChair(m, x, z, ry, yB, dark = false) {
  const k = dark ? 'sofaD' : 'black';
  const c = Math.cos(ry), s = Math.sin(ry);
  m.box(k, x, yB + 0.46, z, 0.5, 0.07, 0.48, ry);
  m.box(k, x - s * 0.245, yB + 0.78, z - c * 0.245, 0.48, 0.62, 0.06, ry);
  m.cyl('alum', x, yB + 0.28, z, 0.03, 0.36);
  m.box('alum', x, yB + 0.06, z, 0.5, 0.04, 0.07, ry + 0.7);
  m.box('alum', x, yB + 0.06, z, 0.5, 0.04, 0.07, ry - 0.7);
}
// person: {plate, scr, anim, vip, customDraw} | null
function mkDesk(m, x, z, ry, yB, person = null, opts = {}) {
  const w = opts.w || 1.5, d = opts.d || 0.75;
  const kTop = opts.vip || (person && person.vip) ? 'woodDark' : 'wood';
  const c = Math.cos(ry), s = Math.sin(ry);
  const off = (dx, dz) => [x + dx * c - dz * s, z + dx * s + dz * c];
  m.box(kTop, x, yB + 0.73, z, w, 0.045, d, ry);
  let p = off(-w / 2 + 0.03, 0);
  m.box('white', p[0], yB + 0.37, p[1], 0.05, 0.7, d - 0.06, ry);
  p = off(w / 2 - 0.03, 0);
  m.box('white', p[0], yB + 0.37, p[1], 0.05, 0.7, d - 0.06, ry);
  p = off(0, -d / 2 + 0.04);
  m.box('white', p[0], yB + 0.45, p[1], w - 0.1, 0.5, 0.04, ry);
  p = off(w / 2 - 0.24, d / 2 - 0.26);
  m.box('alum', p[0], yB + 0.3, p[1], 0.38, 0.55, 0.42, ry);
  // màn hình (đặt lùi về mép sau, quay về phía ghế)
  p = off(0, -d / 2 + 0.17);
  const mp = p;
  m.box('black', mp[0], yB + 0.775, mp[1], 0.22, 0.04, 0.16, ry);
  m.box('black', mp[0], yB + 0.87, mp[1], 0.05, 0.2, 0.04, ry);
  m.box('black', mp[0], yB + 1.115, mp[1], 0.62, 0.4, 0.035, ry);
  const scrPos = [mp[0] - s * 0.026, yB + 1.115, mp[1] + c * 0.026];
  if (person) {
    const cv = document.createElement('canvas'); cv.width = 480; cv.height = 300;
    const g2 = cv.getContext('2d');
    const draw = person.customDraw || ((gg, t) => drawScreen(person, gg, t));
    draw(g2, 0);
    const mat = basicMat(cv);
    plane(0.58, 0.36, mat, scrPos[0], scrPos[1], scrPos[2], ry);
    G.screens.push({ pos: new THREE.Vector3(...scrPos), canvas: cv, g: g2, tex: mat.map, anim: person.anim, draw, last: -99 });
  } else {
    plane(0.58, 0.36, MATS.screenOff, scrPos[0], scrPos[1], scrPos[2], ry);
  }
  // bàn phím + chuột + cốc + cây
  p = off(-0.06, d / 2 - 0.26);
  m.box('black', p[0], yB + 0.76, p[1], 0.42, 0.018, 0.14, ry);
  p = off(0.3, d / 2 - 0.24);
  m.box('black', p[0], yB + 0.762, p[1], 0.09, 0.02, 0.13, ry);
  p = off(-w / 2 + 0.16, -d / 2 + 0.16);
  m.cyl(person && person.vip ? 'gold' : 'white', p[0], yB + 0.79, p[1], 0.04, 0.1);
  p = off(w / 2 - 0.16, -d / 2 + 0.14);
  m.cyl('pot', p[0], yB + 0.78, p[1], 0.05, 0.08);
  m.put('leaf', GEO.sph, p[0], yB + 0.86, p[1], 0.13, 0.1, 0.13);
  // ghế
  p = off(0, d / 2 + 0.45);
  mkChair(m, p[0], p[1], ry + Math.PI, yB, opts.darkChair);
  // biển tên (quay cùng hướng màn hình — phía người đứng xem)
  if (person && person.plate) {
    p = off(0.0, -d / 2 - 0.04);
    const grp = new THREE.Group();
    grp.position.set(p[0], yB + 0.755, p[1]);
    grp.rotation.y = ry + Math.PI; // biển tên quay về phía lối đi (sau lưng màn hình)
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.125), basicMat(nameplateCanvas(person.plate, person.vip)));
    plate.position.set(0, 0.085, 0.012); plate.rotation.x = -0.22;
    grp.add(plate);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.13, 0.05), MATS.black);
    stand.position.set(0, 0.075, -0.018); stand.rotation.x = -0.22;
    grp.add(stand);
    G.scene.add(grp);
  }
  // collider bao ngoài (gồm cả ghế)
  const ex = Math.abs(c) * w / 2 + Math.abs(s) * (d / 2 + 0.7), ez = Math.abs(s) * w / 2 + Math.abs(c) * (d / 2 + 0.7);
  addCol(x - Math.max(ex, 0.5), z - Math.max(ez, 0.5), x + Math.max(ex, 0.5), z + Math.max(ez, 0.5), yB, yB + 1.12);
  // tương tác
  if (opts.onUse) inter(x, yB + 1.0, z, 1.7, opts.label || 'Bàn làm việc', opts.onUse, opts.interOpts || {});
  else if (person && person.plate) inter(x, yB + 1.0, z, 1.6, `Bàn của ${person.plate}`, () => { toast(`<b>${person.plate}</b> ${DESK_LINES[person.scr] || 'đang rất bận (nhìn là biết).'}`); sfx.click && sfx.click(); });
}
function mkRoundTable(m, x, z, yB, r = 0.45) {
  m.cyl('wood', x, yB + 0.72, z, r, 0.04);
  m.cyl('black', x, yB + 0.38, z, 0.03, 0.68);
  m.box('black', x, yB + 0.03, z, r * 1.2, 0.05, 0.08);
  m.box('black', x, yB + 0.03, z, r * 1.2, 0.05, 0.08, Math.PI / 2);
  addCol(x - r * 0.72, z - r * 0.72, x + r * 0.72, z + r * 0.72, yB, yB + 0.75);
}
function mkSofaSeg(m, x, z, ry, yB, w = 1.0, dark = false) {
  const k = dark ? 'sofaD' : 'sofa';
  const c = Math.cos(ry), s = Math.sin(ry);
  m.box(k, x, yB + 0.24, z, w, 0.42, 0.78, ry);
  m.box(k, x - s * 0.33, yB + 0.6, z - c * 0.33, w, 0.55, 0.16, ry);
  addCol(x - 0.55, z - 0.55, x + 0.55, z + 0.55, yB, yB + 0.7);
}
function mkSofaArc(m, cx, cz, yB, r, a0, a1, segs, dark = false) {
  for (let i = 0; i < segs; i++) {
    const a = a0 + (a1 - a0) * (i + 0.5) / segs;
    const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    const ry = -a - Math.PI / 2;
    const k = dark ? 'sofaD' : 'sofa';
    m.box(k, x, yB + 0.24, z, 0.95, 0.42, 0.72, ry);
    const bx = cx + Math.cos(a) * (r + 0.3), bz = cz + Math.sin(a) * (r + 0.3);
    m.box(k, bx, yB + 0.62, bz, 0.98, 0.52, 0.16, ry);
    addCol(x - 0.5, z - 0.5, x + 0.5, z + 0.5, yB, yB + 0.7);
  }
}
function mkPlanter(m, x1, z1, x2, z2, yB) {
  m.box('pot', (x1 + x2) / 2, yB + 0.25, (z1 + z2) / 2, x2 - x1, 0.5, z2 - z1);
  addCol(x1, z1, x2, z2, yB, yB + 0.95);
  const n = Math.max(3, (((x2 - x1) + (z2 - z1)) * 1.6) | 0);
  for (let i = 0; i < n; i++) {
    const x = x1 + 0.15 + Math.random() * Math.max(0.05, x2 - x1 - 0.3);
    const z = z1 + 0.15 + Math.random() * Math.max(0.05, z2 - z1 - 0.3);
    m.put(Math.random() < 0.5 ? 'leaf' : 'leafD', GEO.sph, x, yB + 0.62 + Math.random() * 0.18, z, 0.3, 0.32, 0.3);
    m.put('leafD', GEO.cone, x, yB + 0.78, z, 0.16, 0.42, 0.16);
  }
}
function mkPottedPlant(m, x, z, yB, big = false) {
  const h = big ? 1.5 : 1.0;
  m.cyl('pot', x, yB + 0.2, z, big ? 0.24 : 0.17, 0.4);
  m.cyl('woodDark', x, yB + 0.75, z, 0.025, h * 0.75);
  for (let i = 0; i < (big ? 7 : 5); i++) {
    const a = i * 2.4, rr = 0.1 + (i % 3) * 0.1;
    m.put('leaf', GEO.sph, x + Math.cos(a) * rr, yB + h * 0.6 + (i % 4) * 0.16, z + Math.sin(a) * rr, 0.34, 0.26, 0.34);
  }
  addCol(x - 0.22, z - 0.22, x + 0.22, z + 0.22, yB, yB + 0.8);
}
function noteSpot(x, y, z, label, lines, ry = 0) {
  const n = plane(0.22, 0.22, basicMat(TX.noteTex(lines.slice(0, 2).concat(['…']))), x, y, z);
  n.rotation.set(-Math.PI / 2, 0, ry);
  inter(x, y, z, 1.4, `📜 ${label}`, () => { sfx.paper && sfx.paper(); dialog.paper(label, lines); });
}
function noteWall(x, y, z, ry, label, lines) {
  plane(0.22, 0.22, basicMat(TX.noteTex(lines.slice(0, 2).concat(['…']))), x, y, z, ry);
  inter(x, y, z, 1.5, `📜 ${label}`, () => { sfx.paper && sfx.paper(); dialog.paper(label, lines); });
}

// ============== lõi: thang máy + cầu thang + WC ==============
function buildCore(m, yB, label) {
  // vách ngăn core ↔ văn phòng, 2 lối: sảnh thang máy + cầu thang
  wallZ(m, 'wall', 0, 20, 28, yB, WH, [[8.6, 11.0], [12.4, 15.8]]);
  // sảnh thang máy
  wallX(m, 'wall', 28, 34, 8, yB, WH);
  wallX(m, 'wall', 28, 34, 11.4, yB, WH);
  wallZ(m, 'steelD', 8, 11.4, 31.8, yB, WH, [[9.0, 10.4]]);
  m.box('steelD', 32.9, yB + 3.18, 9.7, 2.4, 0.25, 3.4);
  m.box('stripLight', 32.9, yB + 3.04, 9.7, 1.1, 0.04, 1.1);
  m.box('steel', 33.92, yB + WH / 2, 9.7, 0.12, WH, 3.4);
  addCol(33.8, 8, 34, 11.4, yB, yB + WH);
  m.box('steel', 32.9, yB + 1.0, 8.1, 2.0, 0.07, 0.08);
  m.box('steel', 32.9, yB + 1.0, 11.3, 2.0, 0.07, 0.08);
  plane(0.34, 0.56, basicMat(TX.signTex('1 · 3', { w: 140, h: 240, size: 36, sub: '▲ ▼' })), 33.84, yB + 1.45, 8.7, -Math.PI / 2);
  inter(33.5, yB + 1.4, 8.9, 1.5, '🛗 Bảng nút thang máy', () => G.openElevator && G.openElevator(), { id: 'lift' });
  plane(0.2, 0.3, basicMat(TX.signTex('●', { w: 80, h: 120, size: 26, bg: '#1b2c40', fg: '#ffd34d' })), 31.72, yB + 1.3, 10.9, -Math.PI / 2);
  inter(31.5, yB + 1.3, 10.9, 1.3, 'Nút gọi thang', () => { sfx.ding && sfx.ding(); toast('🛗 Thang máy luôn sẵn sàng — mời vào trong và chọn tầng!'); });
  // biển lớn chỉ lối thang máy + cầu thang (nhìn từ phía văn phòng)
  plane(2.6, 0.62, basicMat(TX.signTex('🛗 THANG MÁY', { w: 900, h: 220, size: 86, bg: '#0d2742', fg: '#ffd34d' })), 27.9, yB + 2.55, 9.8, -Math.PI / 2);
  plane(2.2, 0.5, basicMat(TX.signTex('🪜 CẦU THANG BỘ', { w: 800, h: 190, size: 64, bg: '#0d2742', fg: '#9ff3ff' })), 27.9, yB + 2.5, 14.1, -Math.PI / 2);
  plane(0.56, 0.3, basicMat(TX.signTex(label, { w: 240, h: 120, size: 50 })), 31.72, yB + 2.6, 9.7, -Math.PI / 2);
  m.box('alum', 31.78, yB + 2.85, 9.7, 0.18, 0.4, 1.8);
  // khu WC (cửa khoá vui)
  wallX(m, 'conc', 28, 34, 16.4, yB, WH);
  plane(1.05, 2.1, basicMat(TX.signTex('WC 🚻', { w: 300, h: 600, size: 60, sub: '🚧 đang bảo trì' })), 30.9, yB + 1.15, 16.31, Math.PI);
  inter(30.9, yB + 1.2, 16.6, 1.6, 'Cửa WC', () => toast('🚧 WC đang bảo trì. (Thật ra là đội dựng 3D chưa kịp làm bên trong 😅)'));
}
function buildStairs(m) {
  const stepN = 12;
  const flight = (xA, xB, z1, z2, yA, yBe) => {
    for (let i = 0; i < stepN; i++) {
      const t1 = (i + 1) / stepN;
      const x = xA + (xB - xA) * (i + 0.5) / stepN;
      m.box('conc', x, yA + (yBe - yA) * t1 - 0.09, (z1 + z2) / 2, Math.abs(xB - xA) / stepN + 0.03, 0.18, z2 - z1);
    }
    if (xA < xB) addPatch(xA, xB, z1, z2, yA, yBe, 'x');
    else addPatch(xB, xA, z1, z2, yBe, yA, 'x');
  };
  // 4 vế: T1→+1.8→T2(3.6)→+1.8→T3(7.2) (patch rộng hơn bậc một chút để khỏi hụt chân)
  flight(29, 33, 12.06, 13.44, F1Y, F1Y + 1.8);
  flight(33, 29, 14.56, 15.94, F1Y + 1.8, F2Y);
  flight(29, 33, 12.06, 13.44, F2Y, F2Y + 1.8);
  flight(33, 29, 14.56, 15.94, F2Y + 1.8, F3Y);
  // chiếu nghỉ + sàn ra vào ở 2 đầu
  m.box('conc', 33.5, F1Y + 1.71, 14, 1, 0.18, 3.6); addPatch(32.96, 34, 12.06, 15.94, F1Y + 1.8);
  m.box('conc', 28.6, F2Y - 0.09, 14, 1.2, 0.18, 3.6); addPatch(28, 29.04, 12.06, 15.94, F2Y);
  m.box('conc', 33.5, F2Y + 1.71, 14, 1, 0.18, 3.6); addPatch(32.96, 34, 12.06, 15.94, F2Y + 1.8);
  m.box('conc', 28.6, F3Y - 0.09, 14, 1.2, 0.18, 3.6); addPatch(28, 29.04, 12.06, 15.94, F3Y); // sàn ra tầng 3
  // lan can giữa 2 vế: thấp + hở 2 đầu để rẽ thoải mái
  const slope = Math.atan2(1.8, 4);
  for (const [yMid, rz] of [[F1Y + 0.9, slope], [F1Y + 2.7, -slope], [F2Y + 0.9, slope], [F2Y + 2.7, -slope]]) {
    m.box('steelD', 31, yMid + 0.55, 14, 4.5, 0.85, 0.07, 0, 0, rz);
  }
  for (const yTop of [F1Y, F2Y]) {
    m.cyl('alum', 29.5, yTop + 0.7, 14, 0.03, 1.2);
    m.cyl('alum', 32.5, yTop + 1.8 + 0.7, 14, 0.03, 1.2);
  }
  addCol(29.5, 13.72, 32.45, 14.28, F1Y, F3Y + 1.4);
  // vách quây giếng thang đoạn giữa tầng (trên đầu tường T1, dưới sàn T3)
  for (const [z] of [[12], [16.4]]) {
    m.box('conc', 31, (F1Y + WH + F3Y) / 2, z, 6, F3Y - (F1Y + WH), 0.16);
    addCol(28, z - 0.08, 34, z + 0.08, F1Y + WH, F3Y);
  }
  m.box('conc', 34, (F1Y + WH + F3Y) / 2, 14.2, 0.16, F3Y - (F1Y + WH), 4.4);
  addCol(33.9, 12, 34.1, 16.4, F1Y + WH, F3Y);
  m.box('conc', 28, (F1Y + WH + F3Y) / 2, 14.2, 0.16, F3Y - (F1Y + WH), 4.4);
  addCol(27.9, 12, 28.1, 16.4, F1Y + WH, F3Y);
  // đèn + cửa T2 khoá
  m.box('stripLight', 31, F2Y + 2.6, 14, 2.6, 0.05, 0.12);
  plane(1.15, 2.1, basicMat(TX.signTex('TẦNG 2', { w: 320, h: 580, size: 56, sub: '🔒 CÔNG TY KHÁC' })), 28.1, F2Y + 1.15, 14, Math.PI / 2);
  inter(28.5, F2Y + 1.2, 14, 1.7, '🚪 Cửa tầng 2 (hàng xóm)', () =>
    toast('🔒 Tầng 2 là của công ty hàng xóm — Kaopiz chỉ thuê tầng 1 & tầng 3. Đừng quậy 😅'));
}

// ============== TẦNG 1 ==============
function buildF1(m) {
  const y = F1Y;
  // sàn (chừa giếng thang x[28.6,34] z[12,16.4] — nhưng ở T1 sàn vẫn liền)
  const fl = new THREE.Mesh(new THREE.BoxGeometry(34, 0.2, 20), MATS.floorTerr);
  fl.position.set(17, y - 0.1, 10); fl.receiveShadow = true; G.scene.add(fl);
  addPatch(0, 34, 0, 20, y);
  // trần: chừa lỗ giếng thang
  ceilWithHole(y);
  // thảm dev + sàn gỗ lounge
  const cp = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.04, 11.4), MATS.floorCarp);
  cp.position.set(17.1, y + 0.02, 14.2); cp.receiveShadow = true; G.scene.add(cp);
  const wd = new THREE.Mesh(new THREE.BoxGeometry(8.9, 0.04, 6.9), MATS.floorWood);
  wd.position.set(4.45, y + 0.02, 11.5); wd.receiveShadow = true; G.scene.add(wd);
  // chu vi
  exWallX(m, 0, 34, 0, y);
  exWallX(m, 0, 34, 20, y);
  exWallZ(m, 0, 20, 34, y);
  wallZ(m, 'wall', 0, 20, 0, y, WH, [[3, 5]]);
  plane(2, 2.4, MATS.glass, 0.02, y + 1.2, 4, Math.PI / 2);
  m.box('black', 0.04, y + 2.5, 4, 0.1, 0.2, 2.2);
  addCol(-0.1, 3, 0.1, 5, y, y + WH);
  inter(0.35, y + 1.3, 4, 1.7, '🌏 Cửa ra thế giới thực', () => toast('🌏 Ngoài kia là thế giới thực (và deadline). Ở lại tìm báu vật đã!'));
  plane(1.5, 0.5, basicMat(TX.signTex('KAOPIZ INC.', { size: 32, sub: 'Tầng 1 · Tầng 3' })), 0.12, y + 2.8, 4, Math.PI / 2);

  // --- sảnh lễ tân ---
  m.box('wallNavy', 4.75, y + 1.62, 0.24, 5.5, 2.9, 0.12);
  plane(4.4, 1.5, basicMat(TX.logoCanvas(1024, 350, '#16283c', 'AI · Cloud · Digital Transformation', '#eef6ff')), 4.75, y + 1.85, 0.31);
  m.box('stripLight', 4.75, y + 3.0, 0.4, 5.2, 0.04, 0.1);
  m.box('white', 4.7, y + 0.55, 3.4, 2.6, 1.1, 0.6);
  m.box('white', 3.25, y + 0.55, 3.05, 0.6, 1.1, 1.3, 0.45);
  m.box('white', 6.15, y + 0.55, 3.05, 0.6, 1.1, 1.3, -0.45);
  m.box('wood', 4.7, y + 1.12, 3.4, 2.75, 0.05, 0.72);
  addCol(2.95, 2.55, 6.45, 3.85, y, y + 1.15);
  plane(1.7, 0.45, basicMat(TX.logoCanvas(512, 140, '#f4f4f2')), 4.7, y + 0.6, 4.06);
  inter(4.7, y + 1.2, 3.9, 1.7, '🔔 Chuông lễ tân', () => { sfx.ding && sfx.ding(); toast('🤖 Kao-Bot: "Kính chào quý khách! Sảnh hôm nay hơi vắng… vì ai cũng đang bận đi tìm MỘT THỨ GÌ ĐÓ 👀"'); });
  buildKaoBot(7.7, y, 2.4);
  const sd = plane(1.15, 1.95, basicMat(TX.poster10y()), 1.5, y + 1.02, 6.2, 0.85);
  addCol(1.1, 5.85, 1.9, 6.55, y, y + 1.9);
  inter(1.5, y + 1.2, 6.2, 1.5, 'Standee 10 năm Kaopiz', () => toast('🎉 10 năm Kaopiz — một thập kỷ, một gia đình. Và hôm nay: một kho báu 👀'));
  mkSofaSeg(m, 2.2, 1.1, Math.PI, y);
  mkPottedPlant(m, 0.6, 0.7, y, true);
  mkPottedPlant(m, 8.6, 0.7, y, true);

  // --- lounge ---
  m.box('black', 0.18, y + 1.7, 11.5, 0.1, 1.55, 2.65);
  const tvCv = document.createElement('canvas'); tvCv.width = 960; tvCv.height = 540;
  const tvMat = basicMat(tvCv);
  plane(2.45, 1.38, tvMat, 0.25, y + 1.7, 11.5, Math.PI / 2);
  buildTV(tvCv, tvMat.map);
  inter(0.6, y + 1.6, 11.5, 1.8, '📺 TV sảnh — đổi slide', () => { G.tvNext && G.tvNext(); sfx.click && sfx.click(); });
  const rugM = new THREE.Mesh(new THREE.CircleGeometry(2.6, 40), new THREE.MeshStandardMaterial({ map: TX.tex(TX.rugTex()), transparent: true, roughness: 1 }));
  rugM.rotation.x = -Math.PI / 2; rugM.position.set(4.4, y + 0.05, 11.5); rugM.receiveShadow = true; G.scene.add(rugM);
  mkSofaArc(m, 4.4, 11.5, y, 2.1, Math.PI * 0.6, Math.PI * 1.42, 6);
  mkSofaArc(m, 4.4, 11.5, y, 2.1, Math.PI * 1.62, Math.PI * 2.36, 5);
  mkRoundTable(m, 3.8, 11.0, y); mkRoundTable(m, 5.1, 12.0, y, 0.38); mkRoundTable(m, 5.2, 10.5, y, 0.32);
  mkPlanter(m, 8.35, 8.6, 8.95, 14.4, y);
  plane(1.5, 2.1, basicMat(TX.posterOpenCup()), 0.12, y + 1.75, 8.6, Math.PI / 2);
  inter(0.5, y + 1.6, 8.6, 1.6, '⚽ Poster Kaopiz Open Cup 2026', () => toast('⚽ Kaopiz Open Cup 2026 — giải đấu huyền thoại kỷ niệm 10 năm. Phần thưởng vô địch nghe nói "xịn" lắm… mà giờ nó ở đâu? 🤔'));
  plane(1.5, 2.1, basicMat(TX.poster10y()), 0.12, y + 1.75, 14.4, Math.PI / 2);
  const hk1 = TX.posterCanvas('ai-hackathon-2026');
  if (hk1) {
    plane(1.45, 1.9, basicMat(hk1), 0.12, y + 1.7, 17.2, Math.PI / 2);
    inter(0.5, y + 1.6, 17.2, 1.6, '🤖 Poster AI Hackathon 2026', () =>
      toast('🤖 AI HACKATHON 2026 — 27/06 · 6 teams · "Apply AI to solve a problem in software development". This year, YOUR CHALLENGE will shape the future! 😉'));
  }
  noteSpot(3.8, y + 0.765, 11.0, 'Mẩu giấy trên bàn trà', [
    'Gửi người tò mò:', '', '"Thứ quý giá nhất Kaopiz', 'không nằm trong két sắt."', '', '— Người Giấu Đồ 🕵️',
  ], 0.4);

  // --- góc bóng rổ ---
  const court = plane(5.4, 5.0, new THREE.MeshStandardMaterial({ map: TX.tex(TX.courtTex()), roughness: 0.8 }), 4.5, y + 0.055, 17.5, 0, -Math.PI / 2);
  court.receiveShadow = true;
  m.box('steelD', 4.5, y + 1.6, 19.75, 0.12, 3.2, 0.12);
  addCol(4.35, 19.6, 4.65, 19.9, y, y + 3.2);
  m.box('white', 4.5, y + 2.75, 19.6, 1.5, 0.95, 0.06);
  addCol(3.75, 19.56, 5.25, 19.64, y + 2.28, y + 3.23); // bảng rổ chặn bóng
  m.box('red', 4.5, y + 2.42, 19.56, 0.55, 0.4, 0.04);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.022, 8, 26), new THREE.MeshStandardMaterial({ color: 0xd84315, roughness: 0.4, metalness: 0.6 }));
  rim.rotation.x = Math.PI / 2; rim.position.set(4.5, y + 2.28, 19.26); G.scene.add(rim);
  const net = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.16, 0.36, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, side: THREE.DoubleSide, roughness: 1 }));
  net.position.set(4.5, y + 2.09, 19.26); G.scene.add(net);
  G.hoopPos = new THREE.Vector3(4.5, y + 2.28, 19.26);
  m.box('steelD', 1.2, y + 0.32, 18.7, 0.95, 0.64, 0.5);
  addCol(0.7, 18.4, 1.7, 19.0, y, y + 0.7);
  G.ballRackPos = new THREE.Vector3(1.2, y + 0.72, 18.7);
  plane(1.8, 0.5, basicMat(TX.signTex('GÓC GIẢI TRÍ 🏀', { size: 28, sub: 'cầm bóng lên và ném — kỷ lục được lưu' })), 2.4, y + 2.4, 19.88, Math.PI);
  buildKari(2.6, y, 15.3, 1.5, [
    '🐜 Kari: "Sút!!! ⚽ …là thủng lưới deadline ngay. Tập cùng tôi không?"',
    '🐜 Kari: "Tôi là Kari — linh vật Kaopiz. Nghe đồn văn phòng có báu vật, nhưng tôi mê bóng hơn 👀"',
    '🐜 Kari: "AI Hackathon 27/06, đăng ký chưa? Đội thắng nghe nói được chụp ảnh với TÔI 🤩"',
    '🐜 Kari: "Kiến chăm thì deadline chạy. Kiến lười thì… thôi nói nhỏ: là tôi đó 😴"',
  ]);

  // --- phòng seminar ---
  wallZ(m, 'wall', 0, 8, 11, y, WH);
  wallZ(m, 'wall', 0, 8, 21, y, WH);
  glassWallX(m, 11, 21, 8, y, [[12, 13.4]]);
  plane(1.35, 0.42, basicMat(TX.signTex('PHÒNG ĐÀO TẠO', { size: 26, sub: 'Seminar · Workshop' })), 14.6, y + 2.5, 8.12, 0);
  plane(3.6, 1.8, basicMat(TX.whiteboardTex()), 11.12, y + 1.7, 4, Math.PI / 2);
  inter(11.6, y + 1.6, 4, 2.0, '🧻 Bảng trắng', () => toast('📝 Góc bảng: "nghe đồn trong VP có kho báu, sếp giấu kỹ lắm…" — tin đồn có cơ sở đấy!'));
  for (let r = 0; r < 3; r++) for (let ci = 0; ci < 3; ci++) {
    const x = 13.8 + r * 2.3, z = 1.8 + ci * 2.1;
    m.box('wood', x, y + 0.72, z, 0.7, 0.04, 1.7);
    m.box('white', x + 0.3, y + 0.37, z, 0.05, 0.66, 1.6);
    addCol(x - 0.36, z - 0.86, x + 0.36, z + 0.86, y, y + 0.76);
    mkChair(m, x + 0.78, z - 0.45, -Math.PI / 2, y);
    mkChair(m, x + 0.78, z + 0.45, -Math.PI / 2, y);
  }
  mkDesk(m, 12.1, 5.0, -Math.PI / 2, y, null); // bàn giảng viên cạnh bảng, không chắn cửa
  m.box('alum', 16, y + 2.92, 4, 0.5, 0.16, 0.4);

  // --- khu dev (14 người + PC khoá + bàn trống) ---
  const podC = [[13.6, 11.2], [13.6, 16.2], [18.4, 11.2], [18.4, 16.2]];
  let idx = 0;
  for (const [px, pz] of podC) {
    for (const [dx, dz, ry] of [[-0.85, -0.78, Math.PI / 2], [-0.85, 0.78, Math.PI / 2], [0.85, -0.78, -Math.PI / 2], [0.85, 0.78, -Math.PI / 2]]) {
      const X = px + dx, Z = pz + dz;
      if (idx < 14) mkDesk(m, X, Z, ry, y, STAFF_F1[idx]);
      else if (idx === 14) buildLockedPC(m, X, Z, ry, y);
      else buildHiringDesk(m, X, Z, ry, y);
      idx++;
    }
    m.box('fabric', px, y + 1.05, pz, 0.06, 0.55, 2.2);
  }
  m.box('alum', 22.9, y + 0.9, 17.4, 0.5, 1.8, 2.4);
  addCol(22.6, 16.2, 23.16, 18.6, y, y + 1.9);
  noteWall(22.62, y + 1.5, 17.9, -Math.PI / 2, 'Giấy note trên locker', [
    'PC của "thực tập sinh AI"', 'bị khoá cả tuần nay…', '', 'Nghe nói mở được sẽ có', 'thứ gì đó LẤP LÁNH? 🥉', '(nó ngồi pod cuối góc kia)',
  ]);
  mkPottedPlant(m, 11.5, 19.2, y, true);
  mkPottedPlant(m, 22.6, 19.3, y);
  plane(1.9, 0.5, basicMat(TX.signTex('DEV ZONE ⌨', { size: 30, sub: 'im lặng = đang nghĩ · gõ phím dồn dập = sắp xong (chưa chắc)' })), 17, y + 2.62, 8.6);
  plane(2.4, 0.55, basicMat(TX.signTex('🛗 Thang máy · 🪜 Cầu thang →', { w: 860, h: 200, size: 52, bg: '#10304f', fg: '#eaf4ff' })), 24.5, y + 2.58, 13.0, -Math.PI / 2);

  // --- 2 phòng họp kính ---
  wallX(m, 'wall', 23.2, 28, 12, y, WH);
  glassWallZ(m, 0, 12, 23.2, y, [[2.4, 3.8], [8.4, 9.8]]);
  wallX(m, 'wall', 23.2, 28, 6, y, WH);
  for (const [z0, name, scr] of [[0, 'SAKURA 🌸', 'Họp khẩn: "Vì sao trà sữa hết nhanh?"'], [6, 'FUJI 🗻', 'Slide 47/120: OKR là gì (lại) ?']]) {
    m.box('wood', 25.7, y + 0.73, z0 + 3, 2.4, 0.05, 1.1);
    m.box('white', 25.7, y + 0.4, z0 + 3, 0.3, 0.64, 0.9);
    addCol(24.5, z0 + 2.4, 26.9, z0 + 3.6, y, y + 0.78);
    for (let i = 0; i < 3; i++) {
      mkChair(m, 24.9 + i * 0.9, z0 + 2.2, Math.PI, y);
      mkChair(m, 24.9 + i * 0.9, z0 + 3.8, 0, y);
    }
    plane(1.8, 1.05, basicMat(TX.signTex(scr, { w: 700, h: 410, size: 28, sub: '· đang trình chiếu ·' })), 27.9, y + 1.7, z0 + 3, -Math.PI / 2);
    plane(1.0, 0.34, basicMat(TX.signTex(name, { size: 32 })), 23.3, y + 2.42, z0 + 4.6, Math.PI / 2);
  }
  // --- pantry ---
  plane(1.5, 0.46, basicMat(TX.signTex('PANTRY ☕', { size: 30, sub: 'cà phê là xăng của dev' })), 25.6, y + 2.45, 12.1, 0);
  m.box('wood', 27.25, y + 0.5, 16.8, 1.3, 1.0, 5.4);
  m.box('alum', 27.25, y + 1.02, 16.8, 1.38, 0.05, 5.5);
  addCol(26.6, 14.1, 28, 19.5, y, y + 1.05);
  m.box('black', 27.3, y + 1.35, 15.3, 0.5, 0.62, 0.5);
  m.box('alum', 27.3, y + 1.16, 15.0, 0.3, 0.1, 0.22);
  inter(26.8, y + 1.3, 15.3, 1.5, '☕ Máy pha cà phê', () => {
    G.flags.coffee++;
    sfx.coffee && sfx.coffee();
    const msgs = ['☕ Một tách cà phê nóng hổi! Trí lực +10 IQ — câu đố nào cũng phải sợ.',
      `☕ Ly thứ ${G.flags.coffee}. Tay hơi run nhưng não chạy 120%.`,
      '☕ Máy: "Uống vừa thôi sếp ơi, tim đập trống hội làng rồi kìa 🫨"'];
    toast(msgs[Math.min(G.flags.coffee - 1, 2)]);
  });
  plane(0.92, 1.85, basicMat(TX.vendingTex()), 24.0, y + 0.94, 19.83, Math.PI);
  m.box('black', 24.0, y + 0.93, 19.91, 1.02, 1.88, 0.14);
  addCol(23.45, 19.68, 24.55, 20, y, y + 1.9);
  inter(24.0, y + 1.2, 19.6, 1.5, '🥤 Máy bán nước tự động', () => { sfx.bounce && sfx.bounce(); toast('🥤 Cạch… két! Một lon soda lạnh rơi xuống. (Miễn phí — vì là đồ hoạ.)'); });
  mkRoundTable(m, 24.6, 14.9, y, 0.4); mkRoundTable(m, 25.0, 17.7, y, 0.4);
  mkChair(m, 24.0, 14.9, Math.PI / 2, y); mkChair(m, 25.4, 14.4, -0.6, y); mkChair(m, 24.3, 17.7, Math.PI / 2, y);
  m.box('carton', 23.7, y + 0.3, 13.1, 0.62, 0.6, 0.62, 0.2);
  m.box('carton', 23.76, y + 0.86, 13.16, 0.5, 0.52, 0.5, -0.16);
  addCol(23.3, 12.7, 24.16, 13.5, y, y + 1.15);
  inter(23.7, y + 0.8, 13.1, 1.5, '📦 Đống thùng carton khả nghi', () => {
    sfx.paper && sfx.paper();
    dialog.paper('Tờ giấy trong thùng', ['Hô hô, tưởng dễ vậy?', '', 'KHÔNG PHẢI CHỖ NÀY ĐÂU 😏', '', 'Gợi ý nhỏ: hãy thử lên CAO hơn,', 'theo đúng nghĩa đen. 🛗', '', '— Người Giấu Đồ']);
  });
}
function ceilWithHole(yB) {
  // trần 3 mảnh chừa giếng thang x[28,34] z[12,16.4]
  const yC = yB + WH + 0.07;
  for (const [cx, cz, sx, sz] of [[14, 10, 28, 20], [31, 6, 6, 12], [31, 18.2, 6, 3.6]]) {
    const ce = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.15, sz), MATS.ceilWood);
    ce.position.set(cx, yC, cz); G.scene.add(ce);
  }
}
function buildLockedPC(m, x, z, ry, yB) {
  mkDesk(m, x, z, ry, yB, { plate: 'TTS AI · "Kao-GPT" 🤖', scr: '__lock', anim: true, customDraw: drawLockScreen }, {
    onUse: () => G.openBronze && G.openBronze(),
    label: '💻 PC bị khoá của thực tập sinh AI',
    interOpts: { id: 'bronze' },
  });
}
function drawLockScreen(g, t) {
  if (G.keys.bronze) { // đã mở khoá: Kao-GPT ăn mừng
    g.fillStyle = '#0a2616'; g.fillRect(0, 0, 480, 300);
    g.textAlign = 'center';
    g.font = '50px "Segoe UI Emoji"'; g.fillText('🤖', 240, 110);
    g.fillStyle = '#27e07d'; g.font = '800 24px "Segoe UI"';
    g.fillText('ĐÃ MỞ KHOÁ! CẢM ƠN NHÉ!', 240, 165);
    g.fillStyle = '#9fe8bf'; g.font = '14px "Segoe UI"';
    g.fillText('Kao-GPT đang xem video mèo bù 1 tuần bị khoá máy 🐱', 240, 205);
    if (Math.sin(t * 3) > 0) { g.font = '24px "Segoe UI Emoji"'; g.fillText('🎉', 240, 255); }
    g.textAlign = 'left';
    return;
  }
  g.fillStyle = '#0a1626'; g.fillRect(0, 0, 480, 300);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(77,159,219,${0.05 + (i % 5) * 0.02})`;
    g.fillRect((i * 53 + t * 12) % 480, (i * 91) % 300, 2, 2);
  }
  g.textAlign = 'center';
  g.font = '44px "Segoe UI Emoji"'; g.fillText('🔒', 240, 80);
  g.font = '700 19px "Segoe UI"'; g.fillStyle = '#eaf4ff';
  g.fillText('PC CỦA KAO-GPT ĐANG KHOÁ', 240, 120);
  g.font = '600 17px Consolas'; g.fillStyle = '#ffd34d';
  g.fillText('1 · 11 · 21 · 1211 · 111221 · ?', 240, 158);
  g.fillStyle = '#9fc6e8'; g.font = '13px "Segoe UI"';
  g.fillText('"Mật khẩu là số tiếp theo của dãy."', 240, 192);
  g.fillText('— Kao-GPT tự đặt rồi tự quên 🤦', 240, 212);
  if (Math.sin(t * 2.5) > 0) { g.fillStyle = '#27e07d'; g.fillText('▮ nhấn để thử mở khoá', 240, 258); }
  g.textAlign = 'left';
}
function buildHiringDesk(m, x, z, ry, yB) {
  mkDesk(m, x, z, ry, yB, { plate: 'Chỗ này đang trống 👀', scr: null, anim: false }, {
    onUse: () => toast('💼 Chỗ ngồi đang chờ chủ nhân mới — ứng tuyển tại <b>kaopiz.com</b> 😉'),
    label: 'Bàn trống (tuyển dụng)',
  });
}
function buildTV(cv, tx) {
  const g = cv.getContext('2d');
  const slides = [
    (gg) => { gg.fillStyle = '#0d2a4a'; gg.fillRect(0, 0, 960, 540); TX.drawLogo(gg, 480, 210, 120, '#ffffff'); gg.fillStyle = '#7cc3f2'; gg.font = '700 46px "Segoe UI"'; gg.textAlign = 'center'; gg.fillText('COME TO OUR NEW OFFICE!', 480, 390); gg.font = '28px "Segoe UI"'; gg.fillStyle = '#cfe6fa'; gg.fillText('Tokyo · Hanoi — Kaopiz 10th Anniversary', 480, 440); gg.textAlign = 'left'; },
    (gg) => { const bg = gg.createLinearGradient(0, 0, 0, 540); bg.addColorStop(0, '#091a30'); bg.addColorStop(1, '#10355c'); gg.fillStyle = bg; gg.fillRect(0, 0, 960, 540); gg.textAlign = 'center'; gg.fillStyle = '#55e8ff'; gg.font = '800 56px "Segoe UI"'; gg.fillText('KAOPIZ × AI 2030 🤖', 480, 190); gg.fillStyle = '#ffffff'; gg.font = '30px "Segoe UI"'; gg.fillText('"Mỗi Kaopizer một trợ lý AI"', 480, 270); gg.fillStyle = '#9fc6e8'; gg.font = '24px "Segoe UI"'; gg.fillText('(trợ lý AI không chỉ chỗ giấu kho báu đâu, tự tìm nhé)', 480, 340); gg.textAlign = 'left'; },
    (gg) => { gg.fillStyle = '#08251a'; gg.fillRect(0, 0, 960, 540); gg.textAlign = 'center'; gg.fillStyle = '#27e07d'; gg.font = '800 52px "Segoe UI"'; gg.fillText('⚽ KAOPIZ OPEN CUP 2026', 480, 180); gg.fillStyle = '#ffffff'; gg.font = '32px "Segoe UI"'; gg.fillText('Chúc mừng nhà VÔ ĐỊCH!', 480, 260); gg.fillStyle = '#ffd34d'; gg.font = '26px "Segoe UI"'; gg.fillText('Cúp đang được "bảo quản nghiêm ngặt" 🤫', 480, 330); gg.textAlign = 'left'; },
  ];
  const kariCv = TX.spriteCanvas('kari');
  if (kariCv) slides.push((gg) => {
    const grd = gg.createLinearGradient(0, 0, 960, 0);
    grd.addColorStop(0, '#062138'); grd.addColorStop(1, '#0d3b63');
    gg.fillStyle = grd; gg.fillRect(0, 0, 960, 540);
    const kw = 440 * (kariCv.width / kariCv.height);
    gg.drawImage(kariCv, 930 - kw, 70, kw, 440);
    gg.textAlign = 'left';
    gg.fillStyle = '#ffd34d'; gg.font = '800 50px "Segoe UI"';
    gg.fillText('LINH VẬT MỚI: KARI 🐜', 50, 150);
    gg.fillStyle = '#ffffff'; gg.font = '600 28px "Segoe UI"';
    gg.fillText('Chăm như kiến · nhanh như deploy chiều thứ 6', 50, 225);
    gg.fillStyle = '#9fc6e8'; gg.font = '24px "Segoe UI"';
    gg.fillText('Quy định mới: KHÔNG cho Kari uống cà phê ☕', 50, 285);
    gg.fillText('(lần trước nó refactor cả công ty trong một đêm)', 50, 325);
  });
  let cur = 0;
  const draw = () => { slides[cur](g); tx.needsUpdate = true; };
  draw();
  G.tvNext = () => { cur = (cur + 1) % slides.length; draw(); };
  setInterval(() => { if (G.state === 'play') { cur = (cur + 1) % slides.length; draw(); } }, 10000);
}
// linh vật Kari — standee ảnh thật, luôn xoay mặt về phía người chơi + nhún nhẹ
function buildKari(x, yB, z, h, lines) {
  const cv = TX.spriteCanvas('kari');
  if (!cv) return;
  const w = h * (cv.width / cv.height);
  const mat = new THREE.MeshBasicMaterial({ map: TX.tex(cv), transparent: true, alphaTest: 0.08, side: THREE.DoubleSide });
  const sp = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  sp.position.set(x, yB + h / 2 + 0.03, z);
  G.scene.add(sp);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.05, 22), MATS.steelD);
  base.position.set(x, yB + 0.025, z);
  base.receiveShadow = true;
  G.scene.add(base);
  addCol(x - 0.28, z - 0.28, x + 0.28, z + 0.28, yB, yB + 1.2);
  G.animated.push({
    update: (t) => {
      if (G.camera) sp.rotation.y = Math.atan2(G.camera.position.x - x, G.camera.position.z - z);
      sp.position.y = yB + h / 2 + 0.03 + Math.sin(t * 1.9) * 0.025;
    },
  });
  let li = 0;
  inter(x, yB + 1.1, z, 1.9, '🐜 Linh vật Kari', () => { sfx.blip && sfx.blip(); toast(lines[li++ % lines.length]); });
}
function buildKaoBot(x, yB, z) {
  const grp = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.12, 24), MATS.steelD);
  base.position.y = 0.06; grp.add(base);
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.03, 24), MATS.neonCyan);
  glow.position.y = 0.14; grp.add(glow);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 22, 16), MATS.holo);
  head.position.y = 1.35; grp.add(head);
  const eyeM = new THREE.MeshBasicMaterial({ color: 0x07304d });
  const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), eyeM);
  eye1.position.set(-0.09, 1.39, 0.22); grp.add(eye1);
  const eye2 = eye1.clone(); eye2.position.x = 0.09; grp.add(eye2);
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.018, 8, 36), MATS.neonCyan);
  ring1.position.y = 0.95; ring1.rotation.x = Math.PI / 2; grp.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.014, 8, 36), MATS.neonCyan);
  ring2.position.y = 0.66, ring2.rotation.x = Math.PI / 2; grp.add(ring2);
  grp.position.set(x, yB, z);
  G.scene.add(grp);
  addCol(x - 0.4, z - 0.4, x + 0.4, z + 0.4, yB, yB + 1.6);
  G.animated.push({ update: (t) => { head.position.y = 1.35 + Math.sin(t * 1.6) * 0.06; ring1.rotation.z = t * 0.8; ring2.rotation.z = -t * 1.1; grp.rotation.y = Math.sin(t * 0.4) * 0.5; } });
  const lines = [
    '🤖 Kao-Bot: "Báu vật á? Tôi bị cấm tiết lộ… nhưng tôi sẽ CHỚP MẮT 2 lần nếu nó ở TẦNG 3." *chớp mắt 2 lần*',
    '🤖 Kao-Bot: "Mẹo: thử thách hay trốn ở chỗ có chữ — màn hình, tranh, hộp số… Ối, tôi lỡ miệng rồi!"',
    '🤖 Kao-Bot: "Tôi chạy bằng 100% năng lượng tích cực và 0% thông tin mật (theo NDA)."',
    '🤖 Kao-Bot: "Cầu thang bộ tốt cho sức khoẻ. Thang máy tốt cho deadline. Chọn đi!"',
  ];
  let li = 0;
  inter(x, yB + 1.2, z, 1.9, '🤖 Nói chuyện với Kao-Bot', () => { sfx.blip && sfx.blip(); toast(lines[li++ % lines.length]); });
}

// ============== TẦNG 3 ==============
function buildF3(m) {
  const y = F3Y;
  // sàn 3 mảnh chừa giếng thang x[28,34] z[12,16.4]
  for (const [cx, cz, sx, sz] of [[14, 10, 28, 20], [31, 6, 6, 12], [31, 18.2, 6, 3.6]]) {
    const fl = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.2, sz), MATS.floorCarpB);
    fl.position.set(cx, y - 0.1, cz); fl.receiveShadow = true; G.scene.add(fl);
    addPatch(cx - sx / 2, cx + sx / 2, cz - sz / 2, cz + sz / 2, y);
  }
  ceilWithHole(y);
  // chu vi (bắc có hốc cửa bí mật)
  exWallX(m, 0, 34, 20, y);
  wallX(m, 'wall', 0, 34, 0, y, WH, [[23.6, 25.0]]);
  exWallZ(m, 0, 20, 34, y);
  exWallZ(m, 0, 20, 0, y);
  // sảnh thang máy
  plane(3.2, 0.6, basicMat(TX.signTex('✦ KAOPIZ — BOD FLOOR ✦', { w: 1200, h: 230, size: 60, bg: '#0a1626', fg: '#9ff3ff' })), 27.88, y + 2.4, 9.7, -Math.PI / 2);
  const neon = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 3.4), MATS.neonCyan);
  neon.position.set(27.9, y + 2.0, 9.7); G.scene.add(neon);
  mkPottedPlant(m, 27.5, 7.6, y);
  mkPottedPlant(m, 27.5, 11.8, y);

  // --- khu BOD ---
  const rugVip = new THREE.Mesh(new THREE.CircleGeometry(2.0, 36), new THREE.MeshStandardMaterial({ color: 0x6d1f1f, roughness: 1 }));
  rugVip.rotation.x = -Math.PI / 2; rugVip.position.set(2.9, y + 0.03, 3.1); rugVip.receiveShadow = true; G.scene.add(rugVip);
  mkDesk(m, 2.9, 3.0, -Math.PI * 0.75, y, STAFF_F3[0], { w: 1.9, d: 0.9 });
  m.box('woodDark', 0.55, y + 1.0, 1.1, 0.95, 2.0, 0.4, 0);
  addCol(0.06, 0.88, 1.05, 1.34, y, y + 2.05);
  inter(0.6, y + 1.4, 1.1, 1.6, '📚 Tủ sách của Chủ tịch', () => toast('📚 "Đắc Nhân Tâm", "Nghĩ Giàu Làm Giàu"… và một cuốn "Nghệ Thuật Giấu Đồ Đỉnh Cao"?! Đáng ngờ ghê 👀'));
  m.cyl('gold', 4.6, y + 1.05, 0.6, 0.022, 2.1);
  m.put('red', GEO.cone, 4.72, y + 1.92, 0.6, 0.34, 0.55, 0.07, 0, 0, -Math.PI / 2);
  for (let i = 0; i < 3; i++) mkDesk(m, 6.0 + i * 2.0, 3.2, 0, y, STAFF_F3[1 + i]);
  // Mẫu hậu + Thị Nhài
  mkDesk(m, 2.6, 10.2, Math.PI / 2, y, STAFF_F3[4], { w: 1.7 });
  const crown = new THREE.Group();
  const cr1 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.07, 12), MATS.gold);
  crown.add(cr1);
  for (let i = 0; i < 6; i++) {
    const sp = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.075, 6), MATS.gold);
    sp.position.set(Math.cos(i * 1.047) * 0.085, 0.065, Math.sin(i * 1.047) * 0.085);
    crown.add(sp);
  }
  crown.position.set(2.75, y + 0.79, 9.35); G.scene.add(crown);
  inter(2.75, y + 0.9, 9.35, 1.4, '👑 Vương miện của Mẫu hậu', () => toast('👑 "Kẻ nào chạm vào vương miện của Mẫu hậu Lii Hoàng sẽ bị phạt review 1000 dòng code." — bạn rút tay lại cực nhanh.'));
  mkDesk(m, 6.4, 10.2, Math.PI / 2, y, STAFF_F3[5]);
  mkPottedPlant(m, 6.4, 12.0, y);
  // Leo + Giàu đối mặt
  mkDesk(m, 10.6, 9.3, 0, y, STAFF_F3[6]);
  mkDesk(m, 10.6, 11.1, Math.PI, y, STAFF_F3[7]);
  // pod 4
  mkDesk(m, 4.2, 15.2, Math.PI / 2, y, STAFF_F3[8]);
  mkDesk(m, 4.2, 17.2, Math.PI / 2, y, STAFF_F3[9]);
  mkDesk(m, 6.1, 15.2, -Math.PI / 2, y, STAFF_F3[10]);
  mkDesk(m, 6.1, 17.2, -Math.PI / 2, y, STAFF_F3[11]);
  mkPlanter(m, 0.4, 12.9, 2.2, 13.5, y);
  mkPottedPlant(m, 0.7, 19.2, y, true);
  plane(2.2, 0.55, basicMat(TX.signTex('BOD ZONE ✦', { size: 30, sub: 'khu vực các sếp — đi nhẹ nói khẽ cười duyên', bg: '#0a1626', fg: '#ffd34d' })), 6, y + 2.62, 0.28);
  const hk3 = TX.posterCanvas('ai-hackathon-2026');
  if (hk3) {
    plane(1.45, 1.9, basicMat(hk3), 11.2, y + 1.78, 0.28);
    inter(11.2, y + 1.6, 0.7, 1.6, '🤖 Poster AI Hackathon 2026', () =>
      toast('🤖 Sếp nào cũng đã đăng ký AI Hackathon 2026 (27/06) — nghe nói đội thắng được thưởng "một thứ" hiện đang bị giấu đâu đó 👀'));
  }

  // --- lounge BOD + 3 bức tranh ---
  mkSofaSeg(m, 9.8, 18.7, Math.PI, y, 1.0, true);
  mkSofaSeg(m, 10.9, 18.7, Math.PI, y, 1.0, true);
  mkSofaSeg(m, 12.3, 17.4, Math.PI / 2, y, 1.0, true);
  mkRoundTable(m, 10.7, 17.3, y);
  plane(1.05, 1.35, basicMat(decoyArt(1)), 8.6, y + 1.85, 19.89, Math.PI);
  inter(8.6, y + 1.7, 19.6, 1.5, '🖼 Tranh "Bình minh số 7"', () => toast('🖼 Tranh đẹp đấy, nhưng sau lưng nó chỉ có… tường. Thử nhìn kỹ bức KHÁC xem? 😏'));
  const silverArt = plane(1.3, 1.55, basicMat(silverArtCanvas()), 10.6, y + 1.85, 19.89, Math.PI);
  inter(10.6, y + 1.7, 19.6, 1.7, '🖼 Bức tranh trừu tượng KỲ LẠ', () => G.openSilver && G.openSilver(), { id: 'silver' });
  plane(1.05, 1.35, basicMat(decoyArt(2)), 12.6, y + 1.85, 19.89, Math.PI);
  inter(12.6, y + 1.7, 19.6, 1.5, '🖼 Tranh "Mèo và Deadline"', () => { sfx.paper && sfx.paper(); dialog.paper('Sau khung tranh có mẩu giấy!', ['Gần lắm rồi đó…', '', 'Bức tranh KỲ LẠ ngay cạnh', 'không phải đồ trang trí đâu.', 'Nhìn cho ra QUY LUẬT của nó!', '', '— Người Giấu Đồ 🕵️']); });
  noteSpot(10.7, y + 0.765, 17.3, 'Biên bản họp BOD (nháp)', [
    'Họp BOD tuần này:', '1. Tăng OT? — KHÔNG', '2. Mua máy cafe xịn? — CÓ', '3. Chỗ giấu "thứ đó"?', '   → kho cũ, sau đống thùng', '   (NHỚ XOÁ DÒNG NÀY!!)',
  ], -0.3);

  // --- phòng họp BOD ---
  wallZ(m, 'wall', 0, 7, 14, y, WH);
  wallZ(m, 'wall', 0, 7, 21, y, WH);
  glassWallX(m, 14, 21, 7, y, [[15, 16.4]]);
  plane(1.6, 0.44, basicMat(TX.signTex('WAR ROOM ✦', { size: 30, sub: 'nơi ra đời các quyết định lịch sử' })), 17.6, y + 2.5, 7.12, 0);
  m.box('woodDark', 17.5, y + 0.74, 3.5, 3.6, 0.06, 1.4);
  m.box('black', 17.5, y + 0.38, 3.5, 0.5, 0.7, 1.0);
  addCol(15.7, 2.8, 19.3, 4.2, y, y + 0.8);
  for (let i = 0; i < 4; i++) {
    mkChair(m, 16.2 + i * 0.9, 2.5, Math.PI, y, true);
    mkChair(m, 16.2 + i * 0.9, 4.5, 0, y, true);
  }
  const holoG = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), new THREE.MeshStandardMaterial({ color: 0x66e0ff, emissive: 0x2ab9e8, emissiveIntensity: 2.2, wireframe: true }));
  holoG.position.set(17.5, y + 1.25, 3.5); G.scene.add(holoG);
  G.animated.push({ update: (t) => { holoG.rotation.y = t * 0.7; holoG.rotation.x = Math.sin(t * 0.5) * 0.3; holoG.position.y = y + 1.25 + Math.sin(t * 1.2) * 0.05; } });
  inter(17.5, y + 1.2, 3.5, 1.9, '🔮 Hologram "Chiến lược AI 2030"', () => toast('🔮 Hologram xoay xoay: "BƯỚC 1: AI. BƯỚC 2: ??? BƯỚC 3: THÀNH CÔNG." — chuẩn slide chiến lược.'));
  plane(2.8, 1.5, basicMat(TX.signTex('CHIẾN LƯỢC AI 2030 🤖', { w: 920, h: 500, size: 50, bg: '#081830', fg: '#55e8ff', sub: 'TUYỆT MẬT — chỉ nhìn 5 giây thôi nhé' })), 17.5, y + 1.85, 0.29);

  // --- phòng server ---
  wallZ(m, 'wall', 8.5, 14, 14, y, WH);
  wallZ(m, 'wall', 8.5, 14, 20, y, WH, [[10.6, 11.8]]);
  wallX(m, 'wall', 14, 20, 8.5, y, WH);
  wallX(m, 'wall', 14, 20, 14, y, WH);
  plane(1.5, 0.45, basicMat(TX.signTex('SERVER ROOM ❄', { size: 28, sub: 'lạnh · ồn · bí ẩn', bg: '#161a20', fg: '#7ce7ff' })), 20.1, y + 2.35, 11.2, Math.PI / 2);
  const rackMat = basicMat(TX.rackTex());
  for (let i = 0; i < 3; i++) {
    const x = 15.2 + i * 1.7;
    m.box('black', x, y + 1.1, 13.4, 1.15, 2.2, 0.85);
    addCol(x - 0.6, 12.95, x + 0.6, 13.85, y, y + 2.2);
    plane(1.05, 2.05, rackMat, x, y + 1.1, 12.95, Math.PI);
  }
  for (let i = 0; i < 2; i++) {
    const z = 9.6 + i * 1.9;
    m.box('black', 14.6, y + 1.1, z, 0.85, 2.2, 1.15);
    addCol(14.15, z - 0.6, 15.05, z + 0.6, y, y + 2.2);
    plane(1.05, 2.05, rackMat, 15.05, y + 1.1, z, Math.PI / 2);
  }
  inter(16.9, y + 1.2, 13.1, 1.9, '💾 Tủ server nhấp nháy', () => toast('💾 Đèn nhấp nháy nghĩa là AI đang suy nghĩ. Đừng rút điện — nó đang nghĩ hộ cả công ty!'));
  m.box('alum', 18.6, y + 0.45, 9.3, 1.4, 0.9, 0.7);
  addCol(17.9, 8.9, 19.3, 9.7, y, y + 0.95);
  const boxG = new THREE.Group();
  const bx = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.36), MATS.gold);
  bx.castShadow = true; boxG.add(bx);
  const dialPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.2), basicMat(TX.signTex('🔢 ? ? ?', { w: 260, h: 150, size: 44, bg: '#221a06', fg: '#ffd34d' })));
  dialPlate.position.set(0, 0, 0.185); boxG.add(dialPlate);
  boxG.position.set(18.6, y + 1.08, 9.3);
  G.scene.add(boxG);
  G.goldBox = boxG;
  inter(18.6, y + 1.1, 9.3, 1.8, '🧰 Hộp khoá số bí ẩn', () => G.openGold && G.openGold(), { id: 'gold' });
  noteWall(19.2, y + 0.93, 9.3, 0, 'Giấy dán cạnh hộp', [
    'Ai để cái HỘP VÀNG ở đây?!', 'Hỏi cả phòng không ai nhận.', '', 'IT: "đừng đụng, sợ lắm"', 'Sếp: "kệ nó đi" (ĐÁNG NGHI)',
  ]);

  // --- arcade + chill ---
  m.box('black', 15.0, y + 0.95, 19.3, 0.92, 1.9, 0.8);
  addCol(14.5, 18.9, 15.5, 19.75, y, y + 1.95);
  plane(0.88, 1.86, basicMat(TX.arcadeTex()), 15.0, y + 0.97, 18.88, Math.PI);
  inter(15.0, y + 1.2, 18.6, 1.7, '🕹 Máy KAO·ARCADE — Snake', () => G.openSnake && G.openSnake(), { id: 'snake' });
  plane(2.6, 1.7, basicMat(TX.shelfTex()), 18.6, y + 1.15, 19.86, Math.PI);
  m.box('woodDark', 18.6, y + 1.12, 19.93, 2.7, 1.8, 0.1);
  addCol(17.2, 19.78, 20.0, 20, y, y + 1.9);
  inter(18.6, y + 1.2, 19.6, 1.5, '📚 Kệ truyện & sách', () => toast('📚 Doraemon, One Piece, Conan… và một cuốn gì đó còn nguyên màng bọc 😅'));
  // «Clean Code» nguyên seal — két sắt 10.000¥ cho người giải được tin đồn
  m.box('white', 19.46, y + 1.46, 19.82, 0.07, 0.32, 0.1);
  plane(0.09, 0.3, basicMat(TX.signTex('CLEAN CODE', { w: 90, h: 320, size: 15, bg: '#f6f4ee', fg: '#b3322e' })), 19.46, y + 1.46, 19.765, Math.PI);
  m.box('glass', 19.46, y + 1.46, 19.8, 0.11, 0.36, 0.15);
  inter(19.46, y + 1.46, 19.7, 1.2, '📕 Cuốn sách nguyên màng bọc', () => {
    if (G.flags.yen) { toast('📕 «Clean Code» — đã bóc seal, 10.000¥ đã về túi bạn. Còn sách thì… vẫn chưa ai đọc 😅'); return; }
    G.showYenFound && G.showYenFound();
  });
  buildKari(20.9, y, 18.5, 1.45, [
    '🐜 Kari: "Suỵt… các sếp đang “họp”. Đừng soi màn hình của họ nha 🤫"',
    '🐜 Kari: "Người ta cứ hỏi tôi kho báu ở đâu. Tôi là kiến chứ có phải bản đồ đâu 😤"',
    '🐜 Kari: "Bean bag kia là chỗ ngủ trưa của tôi. Đừng giành 😴"',
    '🐜 Kari: "Tầng này nhiều bí mật lắm. Tôi đếm được ít nhất… à mà NDA, thôi 🤐"',
  ]);
  m.put('sofa', GEO.sph, 16.9, y + 0.3, 17.6, 0.95, 0.55, 0.95);
  addCol(16.45, 17.15, 17.35, 18.05, y, y + 0.55);
  m.put('red', GEO.sph, 18.3, y + 0.3, 17.0, 0.9, 0.52, 0.9);
  addCol(17.85, 16.55, 18.75, 17.45, y, y + 0.5);
  m.box('white', 20.5, y + 0.6, 15.6, 0.42, 1.2, 0.42);
  addCol(20.3, 15.4, 20.7, 15.8, y, y + 1.25);
  inter(20.5, y + 0.9, 15.6, 1.4, '💧 Cây nước nóng lạnh', () => toast('💧 Tu một cốc nước mát. Não đủ nước mới giải nổi câu đố chứ!'));
  plane(1.7, 0.5, basicMat(TX.signTex('CHILL ZONE 🎮', { size: 30, sub: 'sếp cũng cần giải trí' })), 17.0, y + 2.5, 19.88, Math.PI);

  // --- kho + cửa bí mật ---
  wallZ(m, 'wall', 0, 8, 21.4, y, WH, [[5.2, 6.4]]);
  wallX(m, 'wall', 21.4, 28, 8, y, WH, [[25.4, 26.6]]);
  plane(1.25, 0.44, basicMat(TX.signTex('KHO LƯU TRỮ 📦', { size: 28, sub: 'đồ 10 năm dồn lại' })), 26.0, y + 2.45, 8.1);
  m.box('alum', 27.4, y + 1.0, 3.2, 0.5, 2.0, 4.2);
  addCol(27.1, 1.1, 27.7, 5.3, y, y + 2.05);
  for (let i = 0; i < 6; i++) m.box('carton', 27.38, y + 0.5 + (i % 3) * 0.63, 1.8 + ((i / 3) | 0) * 1.5, 0.46, 0.44, 0.56, (i * 0.37) % 0.5);
  m.box('carton', 22.4, y + 0.36, 7.0, 0.72, 0.72, 0.72, 0.3);
  m.box('carton', 22.46, y + 0.97, 7.06, 0.56, 0.5, 0.56, -0.2);
  addCol(22.0, 6.6, 22.85, 7.45, y, y + 1.25);
  inter(22.4, y + 0.8, 7.0, 1.5, '📦 Thùng "Kỷ yếu 2016–2026"', () => toast('📦 Toàn ảnh kỷ yếu cũ. Ơ kìa, team building 2019 ai cũng trẻ thế?!'));
  m.cyl('woodDark', 21.9, y + 0.7, 0.7, 0.022, 1.4, 0, 0, 0.18);
  m.box('alum', 26.7, y + 1.1, 0.8, 0.12, 2.2, 0.65, 0.25);
  m.box('stripLight', 24.6, y + 2.95, 4, 3, 0.04, 0.12, Math.PI / 2);
  buildSecretBoxes(y);
  buildSteelDoor(y);
  buildReceptionAwards(m, y);
}

// ============== lễ tân & góc giải thưởng T3 — dựng theo ảnh chụp văn phòng thật ==============
function buildReceptionAwards(m, y) {
  // --- mảng tường ốp xanh mint + băng đá gắn logo (bên trái lối cầu thang ra) ---
  m.box('mint', 27.86, y + 1.5, 17.1, 0.1, 3.0, 2.5);
  addCol(27.8, 15.85, 28, 18.35, y, y + WH);
  m.box('stone', 27.78, y + 1.95, 17.1, 0.1, 0.6, 2.1);
  plane(1.7, 0.42, basicMat(TX.logoCanvas(1024, 256, '#565c64', '', '#f4f8fb')), 27.72, y + 1.95, 17.1, -Math.PI / 2);
  // đèn treo quả cầu trắng (như ảnh)
  m.box('black', 27.74, y + 2.52, 18.0, 0.32, 0.04, 0.04);
  m.box('black', 27.6, y + 2.36, 18.0, 0.035, 0.3, 0.035);
  m.put('stripLight', GEO.sph, 27.6, y + 2.1, 18.0, 0.26, 0.26, 0.26);

  // --- quầy lễ tân thân đá, mặt trắng ---
  m.box('stone', 27.55, y + 0.49, 17.1, 0.75, 0.98, 1.9);
  m.box('white', 27.55, y + 1.0, 17.1, 0.85, 0.05, 2.0);
  addCol(27.1, 16.1, 28, 18.1, y, y + 1.05);
  m.box('black', 27.5, y + 1.04, 17.6, 0.07, 0.03, 0.18); // điện thoại bàn
  inter(27.45, y + 1.2, 17.3, 1.8, '💁 Quầy lễ tân tầng 3', () => {
    sfx.ding && sfx.ding();
    toast('💁 Sổ đón khách ghi: "14:00 — đoàn khách Nhật tham quan". Còn người trực thì… hình như cũng đang đi tìm báu vật rồi 🏃');
  });
  // bằng khen khung vàng đặt trên mặt quầy
  m.box('gold', 27.63, y + 1.27, 16.6, 0.035, 0.46, 0.66);
  plane(0.6, 0.4, basicMat(TX.certBangKhen()), 27.6, y + 1.27, 16.6, -Math.PI / 2);
  inter(27.55, y + 1.25, 16.6, 1.5, '🏵 Bằng khen của Kaopiz', () =>
    toast('🏵 Bằng khen: "CÔNG TY CỔ PHẦN KAOPIZ — thành tích xuất sắc, đóng góp cho ngành CNTT". Đặt ngay lễ tân cho khách nào ghé cũng thấy 😎'));

  // --- tủ gỗ trưng bày giải thưởng (như ảnh — nhưng cúp VÔ ĐỊCH đã "bốc hơi") ---
  m.box('black', 27.5, y + 0.025, 19.15, 0.78, 0.05, 1.48);
  m.box('wood', 27.5, y + 0.43, 19.15, 0.8, 0.78, 1.5);
  m.box('woodDark', 27.5, y + 0.845, 19.15, 0.86, 0.05, 1.56);
  m.box('woodDark', 27.09, y + 0.43, 19.15, 0.014, 0.66, 0.022);
  m.box('alum', 27.08, y + 0.47, 19.05, 0.018, 0.07, 0.018);
  m.box('alum', 27.08, y + 0.47, 19.25, 0.018, 0.07, 0.018);
  addCol(27.05, 18.35, 28, 19.95, y, y + 0.9);
  const top = y + 0.87;
  // tượng vàng "chiến mã"
  m.box('black', 27.5, top + 0.025, 18.62, 0.14, 0.05, 0.14);
  m.put('gold', GEO.cone, 27.5, top + 0.16, 18.62, 0.1, 0.22, 0.1);
  m.put('gold', GEO.sph, 27.52, top + 0.29, 18.62, 0.09, 0.08, 0.07);
  m.put('gold', GEO.cone, 27.52, top + 0.35, 18.59, 0.025, 0.06, 0.02);
  m.put('gold', GEO.cone, 27.52, top + 0.35, 18.65, 0.025, 0.06, 0.02);
  inter(27.5, top + 0.2, 18.62, 1.4, '🐴 Tượng vàng "Chiến mã Kaopiz"', () =>
    toast('🐴 Giải nội bộ "Tăng trưởng phi mã". Nghe đồn xoa đầu ngựa thì chạy deadline nhanh hơn 20% (chưa kiểm chứng).'));
  // giải thưởng mica trong suốt
  m.box('black', 27.5, top + 0.015, 18.84, 0.07, 0.03, 0.18);
  m.box('glass', 27.5, top + 0.13, 18.84, 0.03, 0.2, 0.14);
  // dàn chứng nhận đóng khung dựng trên tủ
  [19.0, 19.22, 19.44].forEach((z, i) => {
    m.box('black', 27.56, top + 0.13, z, 0.025, 0.3, 0.2);
    plane(0.16, 0.24, basicMat(TX.certSmall(i)), 27.53, top + 0.13, z, -Math.PI / 2);
  });
  inter(27.5, top + 0.13, 19.22, 1.4, '🖼 Dàn chứng nhận ISO · P-Mark', () =>
    toast('🖼 ISO 27001, P-Mark, chứng nhận đối tác… bức tường uy tín 10 năm của Kaopiz. Sờ nhẹ thôi — lau bụi mệt lắm 🧽'));
  // chỗ trưng cúp: chỉ còn vệt bụi tròn + tấm biển
  plane(0.28, 0.28, new THREE.MeshBasicMaterial({ map: TX.tex(TX.dustRing()), transparent: true }), 27.5, top + 0.004, 19.68, 0, -Math.PI / 2);
  m.box('black', 27.78, top + 0.1, 19.68, 0.03, 0.2, 0.42);
  plane(0.4, 0.17, basicMat(TX.signTex('CÚP VÔ ĐỊCH', { w: 460, h: 200, size: 52, sub: 'KAOPIZ OPEN CUP 2026', bg: '#101724', fg: '#ffd34d' })), 27.76, top + 0.11, 19.68, -Math.PI / 2);
  inter(27.5, top + 0.15, 19.6, 1.9, '🏆 Hộc trưng bày cúp VÔ ĐỊCH', () => {
    sfx.blip && sfx.blip();
    toast(G.flags.won
      ? '🏆 Cúp đã được tìm thấy! Tạm thời nó vẫn ở phòng bí mật cho cả công ty chiêm ngưỡng thành quả của bạn 😄'
      : '🏆 Biển đề "CÚP VÔ ĐỊCH — KAOPIZ OPEN CUP 2026"… nhưng trên tủ chỉ còn VỆT BỤI HÌNH TRÒN! Ai đó đã đem cúp đi giấu — tìm ra thì nó (tạm) là của bạn 👀');
  });

  // --- 2 poster trên tường, phía trên tủ (như ảnh) ---
  plane(0.72, 1.04, basicMat(TX.posterOpenCup()), 27.9, y + 2.2, 18.7, -Math.PI / 2);
  plane(0.84, 0.42, basicMat(TX.posterKeizai()), 27.9, y + 2.38, 19.52, -Math.PI / 2);
  inter(27.85, y + 2.2, 19.5, 1.7, '📰 Poster tạp chí 経済界', () =>
    toast('📰 Tạp chí kinh tế Keizaikai (Nhật) đưa Kaopiz vào đặc san "Doanh nghiệp đáng chú ý 2026" — dán poster khoe ngay góc giải thưởng 😎'));
}
function decoyArt(n) {
  const [c, g] = TX.C(360, 460);
  g.fillStyle = '#f4efe6'; g.fillRect(0, 0, 360, 460);
  g.strokeStyle = '#9a8d76'; g.lineWidth = 14; g.strokeRect(7, 7, 346, 446);
  if (n === 1) {
    const grd = g.createLinearGradient(0, 60, 0, 400);
    grd.addColorStop(0, '#f6b26b'); grd.addColorStop(0.5, '#e88c5a'); grd.addColorStop(1, '#7d5ba6');
    g.fillStyle = grd; g.fillRect(30, 30, 300, 400);
    g.fillStyle = '#fff3c2'; g.beginPath(); g.arc(180, 180, 50, 0, 7); g.fill();
    g.fillStyle = 'rgba(60,40,90,.8)';
    for (let i = 0; i < 7; i++) g.fillRect(30, 300 + i * 14, 300, 5);
  } else {
    g.fillStyle = '#dfe8f2'; g.fillRect(30, 30, 300, 400);
    g.fillStyle = '#3a3f47';
    g.beginPath(); g.arc(180, 220, 60, 0, 7); g.fill();
    g.beginPath(); g.moveTo(135, 180); g.lineTo(150, 140); g.lineTo(168, 175); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(225, 180); g.lineTo(210, 140); g.lineTo(192, 175); g.closePath(); g.fill();
    g.fillStyle = '#ffd34d';
    g.beginPath(); g.arc(160, 215, 7, 0, 7); g.fill();
    g.beginPath(); g.arc(200, 215, 7, 0, 7); g.fill();
    g.fillStyle = '#c0392b'; g.font = '700 28px "Segoe UI"'; g.textAlign = 'center';
    g.fillText('DEADLINE', 180, 330); g.fillText('= MEOW?', 180, 365);
    g.textAlign = 'left';
  }
  return c;
}
// ma trận Raven: hình (△□○) & kiểu tô (đặc/viền/sọc) theo Latin square, số chấm = cột
export const MATRIX = {
  shapeAt: (r, ci) => ['tri', 'sq', 'cir'][(r + ci) % 3],
  fillAt: (r, ci) => ['solid', 'hollow', 'stripe'][(r * 2 + ci) % 3],
  dotsAt: (r, ci) => ci + 1,
  answer: { shape: 'sq', fill: 'solid', dots: 3 },
};
export function drawMatrixCell(g, r, ci, x, y, s, override = null) {
  const shape = override ? override.shape : MATRIX.shapeAt(r, ci);
  const fill = override ? override.fill : MATRIX.fillAt(r, ci);
  const dots = override ? override.dots : MATRIX.dotsAt(r, ci);
  const cx = x + s / 2, cy = y + s / 2 - 7, R = s * 0.3;
  g.save();
  g.strokeStyle = '#22282f'; g.fillStyle = '#22282f';
  const path = () => {
    g.beginPath();
    if (shape === 'tri') { g.moveTo(cx, cy - R); g.lineTo(cx + R * 0.95, cy + R * 0.75); g.lineTo(cx - R * 0.95, cy + R * 0.75); g.closePath(); }
    else if (shape === 'sq') g.rect(cx - R * 0.82, cy - R * 0.82, R * 1.64, R * 1.64);
    else g.arc(cx, cy, R * 0.92, 0, 7);
  };
  if (fill === 'solid') { path(); g.fill(); }
  else if (fill === 'hollow') { g.lineWidth = 4; path(); g.stroke(); }
  else {
    g.lineWidth = 4; path(); g.stroke();
    g.save(); path(); g.clip();
    g.lineWidth = 2.5;
    for (let i = -s; i < s * 1.2; i += 9) {
      g.beginPath(); g.moveTo(cx - R * 1.2 + i, cy - R * 1.3); g.lineTo(cx - R * 1.2 + i - R, cy + R * 1.3); g.stroke();
    }
    g.restore();
  }
  g.fillStyle = '#22282f';
  for (let d2 = 0; d2 < dots; d2++) {
    g.beginPath(); g.arc(cx - (dots - 1) * 9 + d2 * 18, y + s - 13, 4.5, 0, 7); g.fill();
  }
  g.restore();
}
function silverArtCanvas() {
  const [c, g] = TX.C(420, 500);
  g.fillStyle = '#101418'; g.fillRect(0, 0, 420, 500);
  g.strokeStyle = '#c9d2dc'; g.lineWidth = 12; g.strokeRect(6, 6, 408, 488);
  g.fillStyle = '#f5f2ea'; g.fillRect(30, 30, 360, 360);
  for (let r = 0; r < 3; r++) for (let ci = 0; ci < 3; ci++) {
    if (r === 2 && ci === 2) continue;
    drawMatrixCell(g, r, ci, 30 + ci * 120, 30 + r * 120, 120);
  }
  g.fillStyle = '#2a313a'; g.fillRect(272, 272, 116, 116);
  g.fillStyle = '#ffd34d'; g.font = '800 64px "Segoe UI"'; g.textAlign = 'center';
  g.fillText('?', 330, 354);
  g.strokeStyle = '#3a424d'; g.lineWidth = 2;
  for (let i = 1; i < 3; i++) {
    g.beginPath(); g.moveTo(30 + i * 120, 30); g.lineTo(30 + i * 120, 390); g.stroke();
    g.beginPath(); g.moveTo(30, 30 + i * 120); g.lineTo(390, 30 + i * 120); g.stroke();
  }
  g.fillStyle = '#c9d2dc'; g.font = 'italic 600 22px Georgia';
  g.fillText('« Vô đề №3 » — hoạ sĩ K.', 210, 432);
  g.font = '14px "Segoe UI"'; g.fillStyle = '#8a93a3';
  g.fillText('(dành tặng người tinh mắt)', 210, 458);
  g.textAlign = 'left';
  return c;
}
function buildSecretBoxes(y) {
  const grp = new THREE.Group();
  const mk = (dx, dy, dz, s, ry) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), MATS.carton);
    b.position.set(dx, dy + s / 2, dz); b.rotation.y = ry; b.castShadow = true; b.receiveShadow = true;
    grp.add(b);
    const lb = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.82, s * 0.4), basicMat(TX.signTex('KAOPIZ · 10 NĂM', { w: 400, h: 170, size: 44, bg: '#c09a62', fg: '#6b4e22' })));
    lb.position.set(dx, dy + s / 2, dz + s / 2 + 0.006); lb.rotation.y = ry * 0.15;
    grp.add(lb);
  };
  mk(-0.45, 0, 0.3, 0.85, 0.08);
  mk(0.5, 0, 0.34, 0.9, -0.1);
  mk(0.05, 0.9, 0.32, 0.8, 0.22);
  mk(-0.6, 0.85, 0.34, 0.6, -0.3);
  grp.position.set(24.3, y, 0.8);
  G.scene.add(grp);
  G.secretBoxes = grp;
  G.secretBoxCol = addCol(23.4, 0.25, 25.2, 1.6, y, y + 1.8);
  inter(24.3, y + 1.0, 1.1, 1.9, '📦 Đống thùng xếp… hơi cố tình?', () => G.pushBoxes && G.pushBoxes(), { id: 'boxes' });
}
function buildSteelDoor(y) {
  const grp = new THREE.Group();
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.36, 2.5, 0.12), MATS.steel);
  door.castShadow = true;
  grp.add(door);
  const lockMeshes = [];
  const order = ['gold', 'silver', 'bronze'];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.024, 10, 22), MATS[order[i]]);
    ring.position.set(-0.35, 0.45 - i * 0.45, 0.08);
    grp.add(ring);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.05), MATS.steelD);
    slot.position.set(-0.35, 0.45 - i * 0.45, 0.09);
    grp.add(slot);
    const keyIn = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.13, 0.05), MATS[order[i]]);
    keyIn.position.set(-0.35, 0.45 - i * 0.45, 0.13);
    keyIn.visible = false;
    grp.add(keyIn);
    lockMeshes.push({ ring, keyIn, name: order[i] });
  }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.3), basicMat(TX.signTex('KHU VỰC ĐẶC BIỆT — MIỄN VÀO', { w: 800, h: 210, size: 44, bg: '#3a2c14', fg: '#ffd34d' })));
  sign.position.set(0, 1.0, 0.075);
  grp.add(sign);
  const handleHint = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.18), basicMat(TX.signTex('3 ổ khoá: VÀNG · BẠC · ĐỒNG', { w: 600, h: 130, size: 34, bg: '#221a06', fg: '#cfd8e3' })));
  handleHint.position.set(0, -0.85, 0.075);
  grp.add(handleHint);
  grp.position.set(24.3, y + 1.27, 0.1);
  G.scene.add(grp);
  G.steelDoor = { grp, lockMeshes, baseY: y };
  G.steelDoorCol = addCol(23.55, -0.12, 25.05, 0.3, y, y + WH);
  inter(24.3, y + 1.3, 0.5, 2.0, '🚪 Cánh cửa thép 3 ổ khoá', () => G.trySteelDoor && G.trySteelDoor(), { id: 'door' });
}

// ============== ánh sáng & bầu trời ==============
function buildLights() {
  const hemi = new THREE.HemisphereLight(0xcfe2f5, 0x57493b, 0.5);
  G.scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0da, 2.1);
  sun.position.set(30, 26, 42);
  sun.target.position.set(14, 0, 4);
  sun.castShadow = true;
  const sz = G.reduced ? 1024 : 2048;
  sun.shadow.mapSize.set(sz, sz);
  sun.shadow.camera.left = -30; sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 34; sun.shadow.camera.bottom = -20;
  sun.shadow.camera.far = 110;
  sun.shadow.bias = -0.0004;
  G.scene.add(sun); G.scene.add(sun.target);
  G.sun = sun;
  // ít đèn point (forward renderer tính mọi đèn cho mọi vật liệu) — chọn lọc + tầm rộng
  const pts = [
    [4.6, F1Y + 2.9, 7, 0xffeedd, 18, 13, 1],  // sảnh + lounge
    [16, F1Y + 2.9, 4.5, 0xfff4e8, 14, 11, 0],  // seminar
    [16.5, F1Y + 2.9, 14.5, 0xffffff, 18, 13, 1], // dev
    [25.8, F1Y + 2.9, 13, 0xffeedd, 14, 13, 0], // pantry + họp
    [4.8, F3Y + 2.9, 5, 0xffeedd, 18, 13, 1],   // BOD bắc
    [6, F3Y + 2.9, 15.5, 0xffeedd, 15, 12, 0],  // BOD nam
    [17.5, F3Y + 2.9, 4, 0xffffff, 14, 11, 1],  // war room
    [18, F3Y + 2.9, 17.5, 0xffeedd, 14, 11, 0], // chill
    [24.7, F3Y + 2.9, 4.5, 0xffd9b0, 8, 9, 1],
    [30.5, F1Y + 2.9, 9.7, 0xfff4e8, 10, 8, 1],   // sảnh thang máy T1
    [30.5, F3Y + 2.9, 9.7, 0xfff4e8, 10, 8, 1],   // sảnh thang máy T3 // kho (mờ hơn)
    [27.0, F3Y + 2.55, 18.2, 0xffe8cc, 9, 7, 0],  // lễ tân + tủ giải thưởng T3
  ];
  G.roomLights = [];
  for (const [x, yy, z, cl, it, dist, keep] of pts) {
    const p = new THREE.PointLight(cl, it, dist, 2);
    p.position.set(x, yy, z);
    p.userData.keep = !!keep;
    G.scene.add(p);
    G.roomLights.push(p);
  }
  if (G.reduced) G.roomLights.forEach(p => { if (!p.userData.keep) p.visible = false; });
  const red = new THREE.PointLight(0xff4040, 6, 8, 2); red.position.set(17, F3Y + 2.5, 11.2); G.scene.add(red);
  const cyn = new THREE.PointLight(0x55e8ff, 5, 7, 2); cyn.position.set(18.6, F3Y + 1.7, 10); G.scene.add(cyn);
  G.animated.push({ update: (t) => { red.intensity = 5 + Math.sin(t * 2.3) * 1.8; cyn.intensity = 4 + Math.sin(t * 5.1) * 1.3; } });
  G.serverLights = [red, cyn];
  // dải đèn trần emissive
  const m = new Merger();
  for (const yb of [F1Y, F3Y]) {
    for (const [x, z, len, ry] of [[4.5, 6, 6, Math.PI / 2], [16.5, 12.4, 10, 0], [16.5, 16, 10, 0], [25.6, 16.5, 5, Math.PI / 2], [16, 4, 8, 0], [4.8, 11, 7, Math.PI / 2], [25.6, 3, 5, Math.PI / 2], [10.5, 9, 5, Math.PI / 2]]) {
      m.box('stripLight', x, yb + 2.99, z, len, 0.035, 0.13, ry);
    }
  }
  m.finish(G.scene);
}
function buildSky() {
  const [c, g] = TX.C(16, 256);
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#6ea9d9'); grd.addColorStop(0.55, '#a9c9e2'); grd.addColorStop(1, '#cfc8b8');
  g.fillStyle = grd; g.fillRect(0, 0, 16, 256);
  const t = TX.tex(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  G.scene.background = t;
  const skyTex = TX.tex(TX.skylineTex(false));
  for (const [x, z, ry, w] of [
    [17, -9.5, 0, 64], [17, 27, Math.PI, 64],
    [41, 10, -Math.PI / 2, 48], [-7, 10, Math.PI / 2, 48],
  ]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, 24), new THREE.MeshBasicMaterial({ map: skyTex, color: 0xb4c4d2 }));
    p.position.set(x, 8, z); p.rotation.y = ry;
    G.scene.add(p);
  }
}

// ============== API ==============
export function buildWorld() {
  makeMats();
  buildSky();
  const m = new Merger();
  buildF1(m);
  buildF3(m);
  buildCore(m, F1Y, 'TẦNG 1');
  buildCore(m, F3Y, 'TẦNG 3');
  buildStairs(m);
  buildLights();
  m.finish(G.scene);
}
