// Mini game: bóng rổ (T1) + KAO·SNAKE (T3)
import * as THREE from 'three';
import { G, $, save } from './state.js';
import { sfx } from './audio.js';
import { toast, openDialog, closeDialog } from './ui.js';
import { groundY, lockPointer } from './player.js';

// ================= BÓNG RỔ =================
const balls = [];
let held = null;
let hoopMsg = 0;

export function initHoop() {
  const geo = new THREE.SphereGeometry(0.12, 18, 14);
  const [c, g] = [document.createElement('canvas'), null];
  c.width = 64; c.height = 64;
  const gg = c.getContext('2d');
  gg.fillStyle = '#e2702e'; gg.fillRect(0, 0, 64, 64);
  gg.strokeStyle = '#7a3514'; gg.lineWidth = 3;
  gg.beginPath(); gg.moveTo(32, 0); gg.lineTo(32, 64); gg.stroke();
  gg.beginPath(); gg.moveTo(0, 32); gg.lineTo(64, 32); gg.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
  for (let i = 0; i < 3; i++) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    const home = new THREE.Vector3(G.ballRackPos.x - 0.25 + i * 0.25, G.ballRackPos.y + 0.12, G.ballRackPos.z);
    mesh.position.copy(home);
    G.scene.add(mesh);
    balls.push({ mesh, home, v: new THREE.Vector3(), state: 'idle', rest: 0, scored: false });
  }
  G.interactables.push({
    pos: G.ballRackPos.clone(), r: 1.6,
    label: '🏀 Cầm một quả bóng',
    onUse: () => {
      if (held) return;
      const b = balls.find(bb => bb.state === 'idle');
      if (!b) { toast('🏀 Hết bóng trên giá — chờ bóng tự lăn về nhé!'); return; }
      held = b; b.state = 'held';
      sfx.click();
      toast('🏀 Đang cầm bóng. Ngắm vào rổ và <b>bấm E / chuột</b> để ném!');
    },
  });
}
export function tryThrow() {
  // gọi từ main khi interact mà đang cầm bóng → ném
  if (!held) return false;
  const b = held; held = null;
  b.state = 'fly'; b.scored = false;
  const dir = new THREE.Vector3();
  G.camera.getWorldDirection(dir);
  const power = 4.8 + Math.max(0, G.camera.rotation.x) * 3.5;
  b.v.copy(dir).multiplyScalar(power);
  b.v.y += 3.2;
  const rel = new THREE.Vector3().copy(G.camera.position).addScaledVector(dir, 0.5);
  rel.y -= 0.18;
  b.mesh.position.copy(rel);
  // trợ ngắm: nếu nhìn gần đúng hướng rổ → pha quỹ đạo lý tưởng
  const tgt = new THREE.Vector3(G.hoopPos.x, G.hoopPos.y + 0.06, G.hoopPos.z);
  const toT = tgt.clone().sub(rel);
  const distXZ = Math.hypot(toT.x, toT.z);
  const lookDot = toT.clone().normalize().dot(dir);
  if (distXZ < 7.5 && lookDot > 0.78) {
    const T = Math.min(1.25, Math.max(0.7, 0.5 + distXZ * 0.17));
    const ideal = new THREE.Vector3(toT.x / T, (toT.y + 0.5 * 11.5 * T * T) / T, toT.z / T);
    const k = 0.45 + Math.max(0, lookDot - 0.78) * 1.6; // nhìn càng chuẩn càng được trợ
    b.v.lerp(ideal, Math.min(0.82, k));
  }
  sfx.swish();
  return true;
}
export function holdingBall() { return !!held; }
function updateHoop(dt) {
  const hp = G.hoopPos;
  for (const b of balls) {
    if (b.state === 'held') {
      const dir = new THREE.Vector3();
      G.camera.getWorldDirection(dir);
      b.mesh.position.copy(G.camera.position).addScaledVector(dir, 0.55);
      b.mesh.position.y -= 0.22;
      continue;
    }
    if (b.state !== 'fly') continue;
    b.v.y -= 11.5 * dt;
    const p = b.mesh.position;
    const prevY = p.y;
    p.addScaledVector(b.v, dt);
    b.mesh.rotation.x += b.v.length() * dt * 2;
    // chạm sàn
    const gy = groundY(p.x, p.z, p.y + 0.4) + 0.12;
    if (p.y < gy) {
      p.y = gy;
      b.v.y = Math.abs(b.v.y) * 0.55;
      b.v.x *= 0.82; b.v.z *= 0.82;
      if (b.v.length() > 0.8) sfx.bounce();
    }
    // chạm bảng rổ / tường đơn giản
    for (const col of G.colliders) {
      if (col.off) continue;
      if (p.y < col.minY || p.y > col.maxY) continue;
      if (p.x > col.minX - 0.12 && p.x < col.maxX + 0.12 && p.z > col.minZ - 0.12 && p.z < col.maxZ + 0.12) {
        const dxl = Math.abs(p.x - (col.minX - 0.12)), dxr = Math.abs(col.maxX + 0.12 - p.x);
        const dzl = Math.abs(p.z - (col.minZ - 0.12)), dzr = Math.abs(col.maxZ + 0.12 - p.z);
        const min = Math.min(dxl, dxr, dzl, dzr);
        if (min === dxl) { p.x = col.minX - 0.12; b.v.x = -Math.abs(b.v.x) * 0.6; }
        else if (min === dxr) { p.x = col.maxX + 0.12; b.v.x = Math.abs(b.v.x) * 0.6; }
        else if (min === dzl) { p.z = col.minZ - 0.12; b.v.z = -Math.abs(b.v.z) * 0.6; }
        else { p.z = col.maxZ + 0.12; b.v.z = Math.abs(b.v.z) * 0.6; }
        if (b.v.length() > 1) sfx.bounce();
        break;
      }
    }
    // ghi điểm: rơi xuyên mặt vành
    if (!b.scored && prevY > hp.y && p.y <= hp.y && b.v.y < 0) {
      const d = Math.hypot(p.x - hp.x, p.z - hp.z);
      if (d < 0.24) {
        b.scored = true;
        G.hoopScore = (G.hoopScore || 0) + 1;
        G.hoopBest = Math.max(G.hoopBest | 0, G.hoopScore);
        save();
        sfx.score();
        const msgs = ['🏀 <b>VÀO!</b> Đẹp như Curry!', '🏀 <b>BUZZER BEATER!</b>', '🏀 Vào rồi! NBA gọi tên bạn!', '🏀 Chuẩn không cần chỉnh!'];
        toast(`${msgs[hoopMsg++ % msgs.length]} Tổng: <b>${G.hoopScore}</b> · Kỷ lục: ${G.hoopBest}`);
      }
    }
    // nghỉ → về giá
    if (b.v.length() < 0.35 && p.y <= gy + 0.01) {
      b.rest += dt;
      if (b.rest > 4) {
        b.rest = 0; b.state = 'idle';
        b.mesh.position.copy(b.home);
        b.mesh.rotation.set(0, 0, 0);
      }
    } else b.rest = 0;
    // rơi khỏi khu → về giá
    if (p.y < -2 || p.x < -1 || p.x > 35 || p.z < -8 || p.z > 21) {
      b.state = 'idle'; b.mesh.position.copy(b.home);
    }
  }
}

// ================= KAO·SNAKE =================
const CW = 420, CH = 300, CS = 20, GW = CW / CS, GH = CH / CS;
let sk = null;

function snakeDraw(ctx) {
  ctx.fillStyle = '#03101c'; ctx.fillRect(0, 0, CW, CH);
  ctx.strokeStyle = 'rgba(77,159,219,.08)';
  for (let x = 0; x <= GW; x++) { ctx.beginPath(); ctx.moveTo(x * CS, 0); ctx.lineTo(x * CS, CH); ctx.stroke(); }
  for (let y = 0; y <= GH; y++) { ctx.beginPath(); ctx.moveTo(0, y * CS); ctx.lineTo(CW, y * CS); ctx.stroke(); }
  // mồi = logo k
  const [fx, fy] = sk.food;
  ctx.fillStyle = '#4d9fdb';
  ctx.beginPath(); ctx.arc(fx * CS + 10, fy * CS + 10, 8, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '700 12px "Segoe UI"'; ctx.textAlign = 'center';
  ctx.fillText('k', fx * CS + 10, fy * CS + 14);
  // rắn
  sk.body.forEach(([x, y], i) => {
    ctx.fillStyle = i === 0 ? '#7bdc8a' : '#27e07d';
    ctx.fillRect(x * CS + 1.5, y * CS + 1.5, CS - 3, CS - 3);
    if (i === 0) {
      ctx.fillStyle = '#06301a';
      ctx.fillRect(x * CS + 5, y * CS + 6, 3, 3);
      ctx.fillRect(x * CS + 12, y * CS + 6, 3, 3);
    }
  });
  if (sk.over) {
    ctx.fillStyle = 'rgba(3,16,28,.75)'; ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = '#ff6b6b'; ctx.font = '800 30px "Segoe UI"'; ctx.textAlign = 'center';
    ctx.fillText('GAME OVER 🐍', CW / 2, CH / 2 - 8);
    ctx.fillStyle = '#9fc6e8'; ctx.font = '14px "Segoe UI"';
    ctx.fillText('Bấm "Chơi" để thử lại', CW / 2, CH / 2 + 22);
  }
}
function snakeStep() {
  if (sk.over || sk.paused) return;
  const head = sk.body[0];
  const nx = head[0] + sk.dir[0], ny = head[1] + sk.dir[1];
  if (nx < 0 || ny < 0 || nx >= GW || ny >= GH || sk.body.some(([x, y]) => x === nx && y === ny)) {
    sk.over = true;
    sfx.over();
    G.snakeBest = Math.max(G.snakeBest | 0, sk.score);
    save();
    updScore();
    return;
  }
  sk.body.unshift([nx, ny]);
  if (nx === sk.food[0] && ny === sk.food[1]) {
    sk.score++;
    sfx.eat();
    sk.speed = Math.max(70, 150 - sk.score * 4);
    placeFood();
    updScore();
  } else sk.body.pop();
}
function placeFood() {
  do {
    sk.food = [(Math.random() * GW) | 0, (Math.random() * GH) | 0];
  } while (sk.body.some(([x, y]) => x === sk.food[0] && y === sk.food[1]));
}
function updScore() {
  $('snakeScore').innerHTML = `Điểm: <b>${sk ? sk.score : 0}</b> · Kỷ lục: <b>${G.snakeBest | 0}</b>`;
}
function snakeStart() {
  sk = { body: [[5, 7], [4, 7], [3, 7]], dir: [1, 0], pend: [1, 0], food: [12, 7], score: 0, speed: 150, over: false, paused: false, acc: 0 };
  placeFood();
  updScore();
}
export function openSnake() {
  G.state = 'dialog';
  document.exitPointerLock && document.exitPointerLock();
  $('snakeOv').classList.remove('hidden');
  if (!sk) snakeStart();
  updScore();
}
function closeSnake() {
  $('snakeOv').classList.add('hidden');
  G.state = 'play';
  lockPointer();
}
export function initSnake() {
  G.openSnake = openSnake;
  const cv = $('snakeCv');
  const ctx = cv.getContext('2d');
  $('snakeStart').addEventListener('click', () => { snakeStart(); sfx.click(); });
  $('snakeExit').addEventListener('click', closeSnake);
  addEventListener('keydown', (e) => {
    if ($('snakeOv').classList.contains('hidden')) return;
    const map = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0] };
    if (map[e.code]) {
      const [dx, dy] = map[e.code];
      if (sk && !(dx === -sk.dir[0] && dy === -sk.dir[1])) sk.pend = [dx, dy];
      e.preventDefault();
    }
    if (e.code === 'Escape') closeSnake();
  });
  // vuốt trên canvas
  let tx = 0, ty = 0;
  cv.addEventListener('touchstart', (e) => { const t = e.touches[0]; tx = t.clientX; ty = t.clientY; e.preventDefault(); }, { passive: false });
  cv.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - tx, dy = t.clientY - ty;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 18 && sk) {
      const d = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
      if (!(d[0] === -sk.dir[0] && d[1] === -sk.dir[1])) sk.pend = d;
    }
    e.preventDefault();
  }, { passive: false });
  // vòng vẽ riêng cho snake
  setInterval(() => {
    if ($('snakeOv').classList.contains('hidden') || !sk) return;
    sk.acc += 50;
    if (sk.acc >= sk.speed) {
      sk.acc = 0;
      sk.dir = sk.pend;
      snakeStep();
    }
    snakeDraw(ctx);
  }, 50);
}

export function updateGames(dt) {
  updateHoop(dt);
}
