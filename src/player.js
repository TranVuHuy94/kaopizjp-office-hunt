// Điều khiển người chơi: chuột/bàn phím + joystick cảm ứng, va chạm, cầu thang
import { G, $ } from './state.js';
import { sfx } from './audio.js';

const EYE = 1.62, R = 0.32;
const keys = {};
let bobT = 0;

export function initControls() {
  const cv = G.renderer.domElement;

  // ----- bàn phím -----
  addEventListener('keydown', (e) => {
    if (G.state === 'dialog' || G.state === 'intro') return;
    keys[e.code] = true;
    if (e.code === 'KeyE' || e.code === 'KeyF') G.input.interact = true;
  });
  addEventListener('keyup', (e) => { keys[e.code] = false; });

  // ----- chuột (pointer lock) -----
  cv.addEventListener('click', () => {
    if (G.isTouch) return;
    if (G.state === 'play' && document.pointerLockElement !== cv) cv.requestPointerLock();
    else if (G.state === 'play' && document.pointerLockElement === cv) G.input.interact = true;
  });
  let lockGraceT = 0; // vừa khoá chuột xong: bỏ qua vài event đầu (trình duyệt hay bắn delta ảo)
  addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== cv || G.state !== 'play') return;
    if (performance.now() - lockGraceT < 90) return;
    let mx = e.movementX, my = e.movementY;
    // lọc spike ảo của pointer lock (Chrome/Windows thi thoảng báo nhảy hàng trăm px)
    if (Math.abs(mx) > 200 || Math.abs(my) > 200) return;
    mx = Math.max(-120, Math.min(120, mx));
    my = Math.max(-120, Math.min(120, my));
    G.player.yaw -= mx * 0.0021;
    G.player.pitch -= my * 0.0021;
    G.player.pitch = Math.max(-1.45, Math.min(1.45, G.player.pitch));
  });
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === cv) {
      lockGraceT = performance.now();
    } else if (G.state === 'play' && !G.isTouch) {
      G.onUnlock && G.onUnlock(); // con trỏ tự do → bấm được nút HUD
    }
  });

  // ----- cảm ứng -----
  if (G.isTouch) {
    document.body.classList.add('touch');
    setupTouch();
  }
}
export function lockPointer() {
  if (!G.isTouch) {
    const cv = G.renderer.domElement;
    cv.requestPointerLock && cv.requestPointerLock();
  }
}

function setupTouch() {
  const joyL = $('joyL'), knob = $('joyKnob'), base = $('joyKnobBase'), look = $('lookPad');
  let jid = null, jx0 = 0, jy0 = 0;
  const setKnob = (dx, dy) => {
    knob.style.left = (jx0 + dx - 24) + 'px'; knob.style.top = (jy0 + dy - 24) + 'px';
  };
  joyL.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    jid = t.identifier; jx0 = t.clientX; jy0 = t.clientY;
    base.style.display = 'block'; knob.style.display = 'block';
    base.style.left = (jx0 - 52) + 'px'; base.style.top = (jy0 - 52) + 'px';
    setKnob(0, 0);
    e.preventDefault();
  }, { passive: false });
  joyL.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier !== jid) continue;
      let dx = t.clientX - jx0, dy = t.clientY - jy0;
      const len = Math.hypot(dx, dy), max = 52;
      if (len > max) { dx *= max / len; dy *= max / len; }
      setKnob(dx, dy);
      G.input.f = -dy / max; // tiến khi đẩy lên
      G.input.s = dx / max;
      G.player.run = len > max * 0.86;
    }
    e.preventDefault();
  }, { passive: false });
  const endJoy = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier !== jid) continue;
      jid = null; G.input.f = 0; G.input.s = 0; G.player.run = false;
      base.style.display = 'none'; knob.style.display = 'none';
    }
  };
  joyL.addEventListener('touchend', endJoy); joyL.addEventListener('touchcancel', endJoy);

  let lid = null, lx = 0, ly = 0;
  look.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    lid = t.identifier; lx = t.clientX; ly = t.clientY;
    e.preventDefault();
  }, { passive: false });
  look.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier !== lid) continue;
      G.player.yaw -= (t.clientX - lx) * 0.0042;
      G.player.pitch -= (t.clientY - ly) * 0.0042;
      G.player.pitch = Math.max(-1.45, Math.min(1.45, G.player.pitch));
      lx = t.clientX; ly = t.clientY;
    }
    e.preventDefault();
  }, { passive: false });
  const endLook = (e) => { for (const t of e.changedTouches) if (t.identifier === lid) lid = null; };
  look.addEventListener('touchend', endLook); look.addEventListener('touchcancel', endLook);

  $('btnUse').addEventListener('touchstart', (e) => { G.input.interact = true; e.preventDefault(); }, { passive: false });
  let runOn = false;
  $('btnRun').addEventListener('touchstart', (e) => {
    runOn = !runOn; G.runToggle = runOn;
    $('btnRun').style.background = runOn ? 'rgba(77,159,219,.55)' : '';
    e.preventDefault();
  }, { passive: false });
}

// chiều cao nền tại (x,z) — chọn mặt cao nhất không vượt quá curY + bước chân
export function groundY(x, z, curY) {
  let best = -1e9;
  for (const p of G.patches) {
    if (x < p.minX || x > p.maxX || z < p.minZ || z > p.maxZ) continue;
    let py;
    if (p.grad === 'x') py = p.yA + (p.yB - p.yA) * ((x - p.minX) / (p.maxX - p.minX));
    else py = p.yA;
    if (py <= curY + 0.55 && py > best) best = py;
  }
  return best === -1e9 ? curY : best;
}
function collide(x, z, y) {
  for (const c of G.colliders) {
    if (c.off) continue;
    if (c.maxY <= y + 0.28 || c.minY >= y + 1.55) continue;
    if (x > c.minX - R && x < c.maxX + R && z > c.minZ - R && z < c.maxZ + R) return true;
  }
  return false;
}

export function updatePlayer(dt) {
  const P = G.player;
  if (G.state !== 'play') { syncCamera(0); return; }

  let f = 0, s = 0;
  if (keys.KeyW || keys.ArrowUp) f += 1;
  if (keys.KeyS || keys.ArrowDown) f -= 1;
  if (keys.KeyA || keys.ArrowLeft) s -= 1;
  if (keys.KeyD || keys.ArrowRight) s += 1;
  f += G.input.f; s += G.input.s;
  const len = Math.hypot(f, s);
  if (len > 1) { f /= len; s /= len; }
  const run = keys.ShiftLeft || keys.ShiftRight || P.run || G.runToggle;
  const speed = run ? 5.4 : 3.1;

  const sinY = Math.sin(P.yaw), cosY = Math.cos(P.yaw);
  // forward = (-sin, -cos), right = (-cos? ) → right = (cos(yaw)?) chuẩn: R = F × U
  const fx = -sinY, fz = -cosY;
  const rx = cosY, rz = -sinY;
  const dx = (fx * f + rx * s) * speed * dt;
  const dz = (fz * f + rz * s) * speed * dt;

  if (dx && !collide(P.x + dx, P.z, P.y)) P.x += dx;
  if (dz && !collide(P.x, P.z + dz, P.y)) P.z += dz;

  // nền + trọng lực nhẹ (nếu không tìm thấy mặt sàn nào → giữ nguyên cao độ)
  let gy = groundY(P.x, P.z, P.y + 0.3);
  if (gy === P.y + 0.3) gy = P.y;
  if (P.y > gy + 0.02) {
    P.vy -= 22 * dt;
    P.y += P.vy * dt;
    if (P.y < gy) { P.y = gy; P.vy = 0; }
  } else {
    P.y += (gy - P.y) * Math.min(1, 14 * dt);
    P.vy = 0;
  }

  // bước chân + lắc đầu
  const moving = (len > 0.12) && Math.abs(P.y - gy) < 0.2;
  if (moving) {
    bobT += dt * (run ? 11 : 7.5);
    sfx.step(run);
  } else bobT *= 0.9;
  syncCamera(moving ? Math.sin(bobT) * (run ? 0.05 : 0.03) : 0);

  // cập nhật tên tầng
  const fl = P.y > 5.4 ? 'Tầng 3' : (P.y > 2 ? 'Cầu thang' : 'Tầng 1');
  if (G._floorLabel !== fl) {
    G._floorLabel = fl;
    const el = $('floorName'); if (el) el.textContent = fl;
  }
}
function syncCamera(bob) {
  const P = G.player;
  G.camera.position.set(P.x, P.y + EYE + bob, P.z);
  G.camera.rotation.set(P.pitch, P.yaw, 0);
}
