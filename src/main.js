// Kaopiz Secret Office — điểm vào
import * as THREE from 'three';
import { G, $, load, wipe, save } from './state.js';
import { initEngine, renderFrame, autoPerf, applyTier } from './engine.js';
import { buildWorld, wireUI } from './world.js';
import { ensureLogoReady } from './textures.js';
import { buildTrophyRoom, runReveal, startConfetti } from './trophy.js';
import { initControls, updatePlayer, lockPointer } from './player.js';
import { initUI, toast, dialog, prompt, refreshKeys, tickHUD, setLoadProgress, showContinue, showWin, showYenFound } from './ui.js';
import { initPuzzles } from './puzzles.js';
import { initHoop, initSnake, updateGames, tryThrow, holdingBall } from './games.js';
import { sfx, audioInit } from './audio.js';

const raf = () => new Promise(r => requestAnimationFrame(r));

async function boot() {
  const hasSave = load();
  setLoadProgress(0.08); await raf();
  initEngine();
  setLoadProgress(0.2); await raf();
  wireUI({ toast, dialog, sfx });
  await ensureLogoReady();
  buildWorld();
  setLoadProgress(0.62); await raf();
  buildTrophyRoom();
  if (G.flags.won) { // đã thắng từ lần trước: phòng sáng sẵn
    revealStarted = true;
    const L = G.trophyLights;
    L.spotCup.intensity = 260; L.spotBoard.intensity = 160; L.roomGlow.intensity = 30;
    startConfetti();
  }
  setLoadProgress(0.74); await raf();
  initHoop();
  initSnake();
  initPuzzles();
  initControls();
  setLoadProgress(0.9); await raf();
  initUI({ onStart: start });
  G.toast = toast;
  G.showYenFound = showYenFound;
  applyTier(); // đồng bộ đèn/bóng đổ với mức đồ hoạ sau khi đã dựng xong world
  if (hasSave) showContinue();
  refreshKeys();
  // render 1 khung để "ấm máy"
  G.camera.position.set(1.6, 1.62, 4.2);
  renderFrame();
  setLoadProgress(1, true);
  if (hasSave) $('btnStart').textContent = '🔄 Chơi mới từ đầu';

  loop();
}

function start(cont) {
  if (!cont && (G.keys.bronze || G.keys.silver || G.keys.gold || G.flags.boxMoved)) {
    // chơi mới khi đang có save → xoá và nạp lại cho sạch
    wipe();
    location.reload();
    return;
  }
  $('intro').classList.add('hidden');
  $('hud').classList.remove('hidden');
  G.state = 'play';
  G.player.x = 1.8; G.player.y = 0; G.player.z = 4.2;
  G.player.yaw = -Math.PI / 2; G.player.pitch = 0;
  G.startT = performance.now() - G.elapsed * 1000;
  G.timerOn = !G.flags.doorOpen && !G.flags.won;
  refreshKeys();
  lockPointer();
  if (cont) toast(`👋 Chào mừng quay lại! Bạn đang có ${['bronze', 'silver', 'gold'].filter(k => G.keys[k]).length}/3 chìa khoá.`);
  else toast('🕵️ Hãy lùng sục cả 2 tầng — thử tương tác với mọi thứ khả nghi! (đi thang máy hoặc cầu thang để đổi tầng)', 7000);
}

// ---------- tương tác theo hướng nhìn ----------
const camDir = new THREE.Vector3();
const toIt = new THREE.Vector3();
function findTarget() {
  if (G.state !== 'play') return null;
  G.camera.getWorldDirection(camDir);
  let best = null, bestScore = 0.45;
  for (const it of G.interactables) {
    const dx = it.pos.x - G.player.x, dy = it.pos.y - (G.player.y + 1.5), dz = it.pos.z - G.player.z;
    const d = Math.hypot(dx, dy, dz);
    if (d > it.r + 0.9) continue;
    toIt.set(dx, dy, dz).normalize();
    const dot = toIt.dot(camDir);
    const score = dot + (1 - d / (it.r + 1)) * 0.25;
    if (dot > 0.5 && score > bestScore) { bestScore = score; best = it; }
  }
  return best;
}

// ---------- màn hình động ----------
let scrIdx = 0;
function updateScreens(t) {
  const P = G.player;
  let updated = 0;
  const n = G.screens.length;
  const maxUp = G.tier === 2 ? 1 : 3;             // máy yếu: vẽ ít màn hình hơn
  const minGap = G.tier === 2 ? 0.3 : 0.13;
  for (let k = 0; k < n && updated < maxUp; k++) {
    scrIdx = (scrIdx + 1) % n;
    const s = G.screens[scrIdx];
    if (!s.anim || !s.draw) continue;
    const dx = s.pos.x - P.x, dy = s.pos.y - (P.y + 1.5), dz = s.pos.z - P.z;
    if (dx * dx + dy * dy + dz * dz > 70) continue;
    if (t - s.last < minGap) continue;
    s.last = t;
    s.draw(s.g, t);
    s.tex.needsUpdate = true;
    updated++;
  }
}

// ---------- vòng lặp ----------
let saveAcc = 0, revealStarted = false;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, G.clock.getDelta());
  const t = G.clock.elapsedTime;

  updatePlayer(dt);
  updateGames(dt);
  updateScreens(t);

  // animations chung
  for (let i = G.animated.length - 1; i >= 0; i--) {
    const a = G.animated[i];
    a.update(t, dt);
    if (a.done) G.animated.splice(i, 1);
  }

  // prompt + interact
  const target = findTarget();
  if (G.state === 'play') {
    if (holdingBall()) prompt('🏀 <b>E / 👆 / chuột</b> — NÉM!');
    else if (target) prompt(`${target.label} ${G.isTouch ? '· nút 👆' : '· <b>E</b>'}`);
    else prompt(null);
    if (G.input.interact) {
      if (holdingBall()) tryThrow();
      else if (target) target.onUse();
    }
  } else prompt(null);
  G.input.interact = false;

  // bước vào phòng bí mật → reveal
  if (G.flags.doorOpen && !revealStarted && !G.flags.won &&
      G.player.y > 5 && G.player.z < -0.7 && G.player.x > 21 && G.player.x < 28) {
    revealStarted = true;
    runReveal(() => {
      G.flags.won = true;
      save();
      refreshKeys();
      showWin();
      G.state = 'dialog';
      // đóng hộp thoại thắng → state play (nút Ở lại)
    });
  }

  tickHUD();
  autoPerf(dt);
  saveAcc += dt;
  if (saveAcc > 5) { saveAcc = 0; if (G.state !== 'intro') save(); }

  renderFrame();
}

boot();
