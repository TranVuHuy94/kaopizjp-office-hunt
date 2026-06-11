// Phòng bí mật + cúp vô địch 3D + bảng VÔ ĐỊCH + màn reveal
import * as THREE from 'three';
import { G } from './state.js';
import * as TX from './textures.js';
import { F3Y, WH, MATS, addCol, plane, basicMat } from './world.js';
import { sfx } from './audio.js';

function addPatchLocal(x1, x2, z1, z2, y) {
  G.patches.push({ minX: x1, maxX: x2, minZ: z1, maxZ: z2, yA: y, yB: y, grad: null });
}

export function buildTrophyRoom() {
  const y = F3Y;
  const grpStatic = new THREE.Group();
  G.scene.add(grpStatic);
  const add = (mesh) => { grpStatic.add(mesh); return mesh; };

  // ---- vỏ phòng x[21,28] z[-7,0] ----
  const mWall = new THREE.MeshStandardMaterial({ color: 0x101b2c, roughness: 0.9 });
  const mFloor = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.85 });
  const mk = (sx, sy, sz, x, yy, z, mat) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    b.position.set(x, yy, z); b.receiveShadow = true; b.castShadow = false;
    return add(b);
  };
  mk(7, 0.2, 7, 24.5, y - 0.1, -3.5, mFloor);
  addPatchLocal(21, 28, -7, 0, y);
  mk(7, 0.15, 7, 24.5, y + WH + 0.07, -3.5, mWall);
  mk(7, WH, 0.16, 24.5, y + WH / 2, -7 + 0.08, mWall); addCol(21, -7.1, 28, -6.9, y, y + WH);
  mk(0.16, WH, 7, 21.08, y + WH / 2, -3.5, mWall); addCol(21, -7, 21.16, 0, y, y + WH);
  mk(0.16, WH, 7, 27.92, y + WH / 2, -3.5, mWall); addCol(27.84, -7, 28, 0, y, y + WH);
  // mặt trong tường nam (hai bên cửa)
  mk(2.6, WH, 0.16, 22.3, y + WH / 2, -0.08, mWall);
  mk(2.9, WH, 0.16, 26.5, y + WH / 2, -0.08, mWall);
  // thảm đỏ từ cửa vào bục
  const carpet = mk(1.3, 0.025, 4.6, 24.3, y + 0.012, -2.4, new THREE.MeshStandardMaterial({ color: 0x7e1f1f, roughness: 1 }));
  // đèn LED dẫn lối (thấy được trong bóng tối)
  for (let i = 0; i < 5; i++) {
    mk(0.07, 0.02, 0.07, 23.55, y + 0.02, -0.6 - i * 0.95, MATS.neonCyan);
    mk(0.07, 0.02, 0.07, 25.05, y + 0.02, -0.6 - i * 0.95, MATS.neonCyan);
  }

  // ---- bục trưng bày ----
  const ped = new THREE.Group();
  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.18, 36), MATS.steelD);
  p1.position.y = 0.09; ped.add(p1);
  const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.5, 36), new THREE.MeshStandardMaterial({ color: 0x0e1622, roughness: 0.3, metalness: 0.4 }));
  p2.position.y = 0.43; ped.add(p2);
  const p3 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 36), MATS.gold);
  p3.position.y = 0.71; ped.add(p3);
  const ringNeon = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.018, 8, 48), MATS.neonCyan);
  ringNeon.rotation.x = Math.PI / 2; ringNeon.position.y = 0.7;
  ped.add(ringNeon);
  ped.position.set(24.3, y, -4.3);
  ped.traverse(o => { o.castShadow = true; o.receiveShadow = true; });
  add(ped);
  addCol(23.55, -5.05, 25.05, -3.55, y, y + 0.78);

  // ---- CÚP ----
  const cup = buildCup();
  cup.position.set(24.3, y + 0.74, -4.3);
  add(cup);
  G.cup = cup;

  // ---- bảng VÔ ĐỊCH trên giá vẽ ----
  const easel = new THREE.Group();
  const legM = MATS.woodDark;
  for (const [dx, rz] of [[-0.42, 0.22], [0.42, -0.22]]) {
    const lg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.9, 0.06), legM);
    lg.position.set(dx, 0.95, 0); lg.rotation.z = rz;
    easel.add(lg);
  }
  const lg3 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.85, 0.06), legM);
  lg3.position.set(0, 0.92, -0.34); lg3.rotation.x = -0.36;
  easel.add(lg3);
  const tray = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.1), legM);
  tray.position.set(0, 0.78, 0.1);
  easel.add(tray);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 1.0), basicMat(TX.vodichBoard()));
  board.position.set(0, 1.32, 0.07); board.rotation.x = -0.06;
  easel.add(board);
  easel.position.set(26.3, y, -4.6);
  easel.rotation.y = -0.5;
  easel.traverse(o => { o.castShadow = true; });
  add(easel);
  addCol(25.7, -5.2, 26.9, -4.0, y, y + 1.6);
  G.vodichBoardMesh = board;

  // ---- backdrop "10 NĂM KAOPIZ" ----
  plane(4.6, 1.1, basicMat(TX.signTex('🏆 KAOPIZ OPEN CUP 2026 🏆', { w: 1500, h: 360, size: 100, bg: '#0a1430', fg: '#ffd34d' })), 24.5, y + 2.45, -6.9, 0).castShadow = false;
  const neonStrip = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.05, 0.05), MATS.neonCyan);
  neonStrip.position.set(24.5, y + 1.8, -6.88);
  add(neonStrip);
  // cột nhung đỏ
  for (const [px, pz] of [[23.2, -3.3], [25.4, -3.3], [23.2, -5.3], [25.4, -5.3]]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.95, 12), MATS.gold);
    post.position.set(px, y + 0.48, pz); post.castShadow = true;
    add(post);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), MATS.gold);
    ball.position.set(px, y + 0.98, pz);
    add(ball);
  }
  for (const [x1, z1, x2, z2] of [[23.2, -3.3, 25.4, -3.3], [23.2, -3.3, 23.2, -5.3], [25.4, -3.3, 25.4, -5.3]]) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, len, 8), new THREE.MeshStandardMaterial({ color: 0xa02020, roughness: 0.8 }));
    rope.position.set((x1 + x2) / 2, y + 0.88, (z1 + z2) / 2);
    rope.rotation.z = Math.PI / 2;
    rope.rotation.y = Math.atan2(z2 - z1, x2 - x1);
    add(rope);
  }

  // ---- đèn (tắt chờ reveal) ----
  const spotCup = new THREE.SpotLight(0xfff2d0, 0, 12, 0.42, 0.45, 1.1);
  spotCup.position.set(24.3, y + 3.1, -2.6);
  spotCup.target.position.set(24.3, y + 1.2, -4.3);
  spotCup.castShadow = !G.reduced;
  G.scene.add(spotCup); G.scene.add(spotCup.target);
  const spotBoard = new THREE.SpotLight(0xd0e8ff, 0, 12, 0.5, 0.5, 1.1);
  spotBoard.position.set(26.0, y + 3.0, -2.8);
  spotBoard.target.position.set(26.3, y + 1.3, -4.6);
  G.scene.add(spotBoard); G.scene.add(spotBoard.target);
  const roomGlow = new THREE.PointLight(0xffe2b8, 0, 10, 2);
  roomGlow.position.set(24.5, y + 2.6, -4.2);
  G.scene.add(roomGlow);
  G.trophyLights = { spotCup, spotBoard, roomGlow };

  // cúp xoay nhẹ lấp lánh
  G.animated.push({ update: (t) => { if (G.flags.won) cup.rotation.y = t * 0.35; ringNeon.material.emissiveIntensity = 2.4 + Math.sin(t * 2.2) * 0.8; } });
}

function buildCup() {
  const grp = new THREE.Group();
  const silver = new THREE.MeshStandardMaterial({ color: 0xeef1f5, roughness: 0.07, metalness: 1, envMapIntensity: 1.4 });
  const goldM = new THREE.MeshStandardMaterial({ color: 0xe2b54b, roughness: 0.16, metalness: 1, envMapIntensity: 1.2 });
  // đế đen 2 tầng + nẹp vàng
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.46), new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.25, metalness: 0.3 }));
  b1.position.y = 0.08; grp.add(b1);
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.36), new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.3, metalness: 0.3 }));
  b2.position.y = 0.22; grp.add(b2);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.025, 0.39), goldM);
  trim.position.y = 0.155; grp.add(trim);
  // bảng tên trên đế
  const [pc, pg] = TX.C(300, 170);
  pg.fillStyle = '#0d1b3a'; pg.fillRect(0, 0, 300, 170);
  pg.strokeStyle = '#d8a93c'; pg.lineWidth = 5; pg.strokeRect(5, 5, 290, 160);
  pg.textAlign = 'center'; pg.fillStyle = '#ffd34d';
  pg.font = '800 34px "Segoe UI"'; pg.fillText('KAOPIZ', 150, 50);
  pg.font = '700 24px "Segoe UI"'; pg.fillStyle = '#cfe2f7'; pg.fillText('OPEN CUP 2026', 150, 86);
  pg.font = '900 40px "Segoe UI"'; pg.fillStyle = '#ffffff'; pg.fillText('VÔ ĐỊCH', 150, 138);
  const plaq = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.17), basicMat(pc));
  plaq.position.set(0, 0.1, 0.235); grp.add(plaq);
  // chân trụ
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.075, 0.22, 20), silver);
  stem.position.y = 0.39; grp.add(stem);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), silver);
  knot.position.y = 0.5; grp.add(knot);
  // thân cúp (lathe)
  const pts = [];
  const prof = [[0.07, 0], [0.16, 0.05], [0.21, 0.16], [0.225, 0.3], [0.2, 0.42], [0.165, 0.52], [0.15, 0.6], [0.155, 0.66], [0.17, 0.7]];
  for (const [r, h] of prof) pts.push(new THREE.Vector2(r, h));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 36), silver);
  body.position.y = 0.54; grp.add(body);
  // vành miệng
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 10, 36), silver);
  lip.rotation.x = Math.PI / 2; lip.position.y = 1.24; grp.add(lip);
  // vương miện trên nắp
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.17, 0.06, 24), silver);
  cap.position.y = 1.27; grp.add(cap);
  const crownRing = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.08, 16), goldM);
  crownRing.position.y = 1.33; grp.add(crownRing);
  for (let i = 0; i < 8; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.085, 6), silver);
    const a = i / 8 * Math.PI * 2;
    spike.position.set(Math.cos(a) * 0.115, 1.41, Math.sin(a) * 0.115);
    grp.add(spike);
  }
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), goldM);
  orb.position.y = 1.46; grp.add(orb);
  // 2 quai cong
  for (const sgn of [-1, 1]) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 10, 28, Math.PI * 1.25), silver);
    handle.position.set(sgn * 0.26, 0.95, 0);
    handle.rotation.z = sgn * -0.5;
    handle.scale.y = 1.35;
    grp.add(handle);
  }
  // 2 huy chương + dây ruy băng vắt qua quai
  for (const sgn of [-1, 1]) {
    const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.5), ribbonMat());
    ribbon.position.set(sgn * 0.3, 0.75, 0.06);
    ribbon.rotation.z = sgn * 0.22; ribbon.rotation.y = sgn * 0.3;
    grp.add(ribbon);
    const medal = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.012, 24), goldM);
    medal.position.set(sgn * 0.36, 0.48, 0.1);
    medal.rotation.x = Math.PI / 2;
    grp.add(medal);
  }
  grp.traverse(o => { o.castShadow = true; });
  grp.scale.setScalar(1.05);
  return grp;
}
let _ribbon;
function ribbonMat() {
  if (_ribbon) return _ribbon;
  const [c, g] = TX.C(64, 256);
  g.fillStyle = '#1b4f9c'; g.fillRect(0, 0, 64, 256);
  g.fillStyle = '#d8e6f5'; g.fillRect(0, 0, 12, 256); g.fillRect(52, 0, 12, 256);
  g.fillStyle = '#c0392b'; g.fillRect(14, 0, 8, 256); g.fillRect(42, 0, 8, 256);
  g.fillStyle = '#f5d77a'; g.fillRect(26, 0, 12, 256);
  _ribbon = new THREE.MeshStandardMaterial({ map: TX.tex(c), roughness: 0.85, side: THREE.DoubleSide });
  return _ribbon;
}

// ---- pháo giấy ----
let confetti = null;
export function startConfetti() {
  if (confetti) return;
  const N = G.reduced ? 180 : 340;
  const geo = new THREE.PlaneGeometry(0.045, 0.028);
  const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, vertexColors: false });
  const inst = new THREE.InstancedMesh(geo, mat, N);
  inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const cols = [0xffd34d, 0x4d9fdb, 0xff6b6b, 0x7bdc8a, 0xffffff, 0xb07cf2];
  const parts = [];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < N; i++) {
    inst.setColorAt(i, new THREE.Color(cols[i % cols.length]));
    parts.push(spawnPart(true));
  }
  inst.instanceColor.needsUpdate = true;
  G.scene.add(inst);
  confetti = { inst, parts, dummy, t: 0 };
  G.animated.push({
    update: (t, dt) => {
      if (!confetti) return;
      confetti.t += dt;
      const { inst: ins, parts: ps, dummy: d } = confetti;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.y -= p.vy * dt;
        p.x += Math.sin(t * p.sw + p.ph) * dt * 0.35;
        p.z += Math.cos(t * p.sw * 0.8 + p.ph) * dt * 0.3;
        p.rx += p.vr * dt; p.rz += p.vr * 0.7 * dt;
        if (p.y < F3Y + 0.05) Object.assign(p, spawnPart(false));
        d.position.set(p.x, p.y, p.z);
        d.rotation.set(p.rx, p.ph, p.rz);
        d.updateMatrix();
        ins.setMatrixAt(i, d.matrix);
      }
      ins.instanceMatrix.needsUpdate = true;
    },
  });
}
function spawnPart(init) {
  return {
    x: 21.6 + Math.random() * 5.6,
    y: F3Y + (init ? 1 + Math.random() * 2.2 : 2.6 + Math.random() * 0.6),
    z: -6.6 + Math.random() * 6.2,
    vy: 0.35 + Math.random() * 0.5,
    sw: 1 + Math.random() * 3,
    ph: Math.random() * 6.28,
    rx: Math.random() * 3, rz: Math.random() * 3,
    vr: 2 + Math.random() * 4,
  };
}

// ---- chuỗi reveal khi bước vào phòng ----
export function runReveal(onDone) {
  const L = G.trophyLights;
  const seq = [
    [400, () => { L.spotCup.intensity = 260; sfx.spot(); }],
    [1150, () => { L.spotBoard.intensity = 160; sfx.spot(); }],
    [1850, () => { L.roomGlow.intensity = 30; sfx.spot(); }],
    [2300, () => { sfx.fanfare(); startConfetti(); }],
    [3000, () => onDone && onDone()],
  ];
  for (const [t, f] of seq) setTimeout(f, t);
}
