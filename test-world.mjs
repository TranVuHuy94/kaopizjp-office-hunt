// Test dựng thế giới + mô phỏng di chuyển bằng Node (three.js chạy headless cho hình học)
// node test-world.mjs
const CTX_METHODS = ['fillRect', 'strokeRect', 'clearRect', 'beginPath', 'closePath', 'moveTo', 'lineTo',
  'arc', 'arcTo', 'ellipse', 'rect', 'fill', 'stroke', 'clip', 'save', 'restore', 'translate', 'rotate',
  'scale', 'fillText', 'strokeText', 'setLineDash', 'quadraticCurveTo', 'bezierCurveTo', 'drawImage'];
function fakeCtx() {
  const grad = { addColorStop() {} };
  const base = {
    measureText: () => ({ width: 42 }),
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
    createPattern: () => grad,
  };
  for (const mname of CTX_METHODS) base[mname] = () => {};
  return new Proxy(base, { get(t, p) { return t[p] !== undefined ? t[p] : undefined; }, set(t, p, v) { t[p] = v; return true; } });
}
const fakeEl = () => ({
  addEventListener() {}, appendChild() {}, remove() {},
  children: { length: 0 }, firstChild: null,
  classList: { add() {}, remove() {}, toggle() {}, contains: () => true },
  style: {}, textContent: '', innerHTML: '', querySelectorAll: () => [], querySelector: () => fakeEl(),
});
globalThis.document = {
  createElement(tag) {
    if (tag === 'canvas') return { width: 0, height: 0, getContext: () => fakeCtx() };
    return fakeEl();
  },
  getElementById: () => fakeEl(),
  addEventListener() {},
  exitPointerLock() {},
  body: { classList: { add() {} } },
  pointerLockElement: null,
};
globalThis.window = globalThis;
Object.defineProperty(globalThis, 'navigator', { value: { maxTouchPoints: 0, userAgent: 'node' }, configurable: true });
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.innerWidth = 1280; globalThis.innerHeight = 720;
globalThis.addEventListener = () => {};
globalThis.requestAnimationFrame = () => 0;
globalThis.setInterval = () => 0;

const THREE = await import('three');
const { G } = await import('./src/state.js');
const W = await import('./src/world.js');
const PL = await import('./src/player.js');

let failed = 0;
const ok = (cond, msg) => { if (cond) console.log('  ✓', msg); else { failed++; console.log('  ✗', msg); } };

G.scene = new THREE.Scene();
G.camera = new THREE.PerspectiveCamera(72, 16 / 9, 0.08, 160);
G.camera.rotation.order = 'YXZ';
G.reduced = false;

console.log('— dựng thế giới —');
W.wireUI({ toast: () => {}, dialog: { paper: () => {} }, sfx: {} });
try {
  W.buildWorld();
  console.log('  ✓ buildWorld không lỗi');
} catch (e) { failed++; console.log('  ✗ buildWorld:', e.stack.split('\n').slice(0, 3).join(' | ')); }

const TR = await import('./src/trophy.js');
try { TR.buildTrophyRoom(); console.log('  ✓ buildTrophyRoom không lỗi'); }
catch (e) { failed++; console.log('  ✗ buildTrophyRoom:', e.stack.split('\n').slice(0, 3).join(' | ')); }

const PZ = await import('./src/puzzles.js');
try { PZ.initPuzzles(); console.log('  ✓ initPuzzles không lỗi'); }
catch (e) { failed++; console.log('  ✗ initPuzzles:', e.message); }

const GA = await import('./src/games.js');
try { GA.initHoop(); console.log('  ✓ initHoop không lỗi'); }
catch (e) { failed++; console.log('  ✗ initHoop:', e.message); }

console.log('  meshes trong scene:', G.scene.children.length);
console.log('  colliders:', G.colliders.length, '| patches:', G.patches.length, '| interactables:', G.interactables.length, '| màn hình:', G.screens.length);
ok(G.screens.length >= 27, `đủ màn hình cá nhân (${G.screens.length} ≥ 27)`);
ok(G.interactables.length >= 35, `đủ điểm tương tác (${G.interactables.length})`);
const draws = G.scene.children.length;
ok(draws < 400, `draw calls hợp lý (${draws} < 400)`);

console.log('— groundY tại các vị trí then chốt —');
ok(PL.groundY(5, 5, 0.3) === 0, 'sàn T1 (5,5) = 0');
ok(PL.groundY(5, 5, 7.5) === 7.2, 'sàn T3 (5,5) = 7.2');
ok(PL.groundY(24.3, -3, 7.5) === 7.2, 'phòng bí mật (24.3,-3) = 7.2');
const s1 = PL.groundY(30, 12.8, 0.6);
ok(Math.abs(s1 - 0.45) < 0.05, `vế thang 1 tại x=30 ≈ 0.45 (đo: ${s1.toFixed(2)})`);
ok(Math.abs(PL.groundY(33.5, 14, 2) - 1.8) < 0.01, 'chiếu nghỉ giữa = 1.8');
const s2 = PL.groundY(30, 15.2, 3.3);
ok(Math.abs(s2 - 3.15) < 0.05, `vế thang 2 tại x=30 ≈ 3.15 (đo: ${s2.toFixed(2)})`);
ok(Math.abs(PL.groundY(28.6, 14, 3.7) - 3.6) < 0.01, 'chiếu nghỉ T2 = 3.6');
ok(Math.abs(PL.groundY(28.6, 14, 7.3) - 7.2) < 0.01, 'sàn ra thang T3 = 7.2');
ok(PL.groundY(32.9, 9.7, 0.3) === 0, 'trong cabin thang máy T1 = 0');
ok(PL.groundY(32.9, 9.7, 7.4) === 7.2, 'trong cabin thang máy T3 = 7.2');

console.log('— mô phỏng đi bộ (va chạm) —');
function walk(x0, z0, yaw, steps, y0 = 0) {
  G.state = 'play';
  G.player.x = x0; G.player.z = z0; G.player.y = y0; G.player.vy = 0;
  G.player.yaw = yaw; G.player.pitch = 0; G.player.run = false;
  G.input.f = 1; G.input.s = 0;
  for (let i = 0; i < steps; i++) PL.updatePlayer(1 / 60);
  G.input.f = 0;
  return G.player;
}
// đi từ sảnh về phía đông: phải bị chặn bởi tường seminar x=11 (z=4.2)
let p = walk(1.8, 4.2, -Math.PI / 2, 400);
ok(p.x > 9.0 && p.x < 11.0, `đi +x bị tường seminar chặn tại x≈${p.x.toFixed(2)}`);
// đi dọc hành lang z=8.25 (giữa planter z<8.6... dùng z=8.3): từ x=2 → phải vượt qua được ít nhất tới khu dev
p = walk(2, 8.28, -Math.PI / 2, 700);
ok(p.x > 9, `hành lang giữa thông thoáng (x đạt ${p.x.toFixed(2)})`);
// leo cầu thang đủ 4 vế, có RẼ ở chiếu nghỉ (chỗ từng bị kẹt)
p = walk(28.4, 12.8, -Math.PI / 2, 320);
ok(p.x > 33.0 && Math.abs(p.y - 1.8) < 0.06, `vế 1 lên chiếu nghỉ giữa (x=${p.x.toFixed(2)}, y=${p.y.toFixed(2)})`);
p = walk(33.55, 12.7, Math.PI, 200, 1.8); // rẽ qua đầu lan can (+z)
ok(p.z > 15.0, `RẼ được ở chiếu nghỉ giữa dưới (z=${p.z.toFixed(2)})`);
p = walk(33.55, 15.2, Math.PI / 2, 320, 1.8); // vế 2 (-x) lên T2
ok(p.x < 29.3 && Math.abs(p.y - 3.6) < 0.06, `vế 2 lên chiếu nghỉ T2 (x=${p.x.toFixed(2)}, y=${p.y.toFixed(2)})`);
p = walk(28.55, 15.2, 0, 200, 3.6); // rẽ về lane 1 (-z)
ok(p.z < 13.2, `RẼ được ở chiếu nghỉ T2 (z=${p.z.toFixed(2)})`);
p = walk(28.55, 12.8, -Math.PI / 2, 320, 3.6); // vế 3 (+x)
ok(p.x > 33.0 && Math.abs(p.y - 5.4) < 0.06, `vế 3 lên chiếu nghỉ giữa trên (x=${p.x.toFixed(2)}, y=${p.y.toFixed(2)})`);
p = walk(33.55, 12.7, Math.PI, 200, 5.4);
ok(p.z > 15.0, `RẼ được ở chiếu nghỉ giữa trên (z=${p.z.toFixed(2)})`);
p = walk(33.55, 15.2, Math.PI / 2, 340, 5.4); // vế 4 (-x) lên T3
ok(Math.abs(p.y - 7.2) < 0.06, `vế 4 lên TẦNG 3 (y=${p.y.toFixed(2)}) 🎉`);
p = walk(28.55, 14.0, Math.PI / 2, 160, 7.2); // ra khỏi buồng thang vào T3
ok(p.x < 27.8 && Math.abs(p.y - 7.2) < 0.06, `ra khỏi buồng thang vào sàn T3 (x=${p.x.toFixed(2)})`);
// trong cabin thang máy không bị kẹt: bước vào từ sảnh thang
p = walk(30.5, 9.7, -Math.PI / 2, 260);
ok(p.x > 32.2, `vào được cabin thang máy (x=${p.x.toFixed(2)})`);
// tường chắn: không xuyên ra ngoài trời
p = walk(2, 2, Math.PI, 300); // đi về -z? yaw π → forward (0,+1)?? kiểm tra hướng: yaw=π → f=(-sinπ,-cosπ)=(0,1) +z
ok(p.z < 20.1, 'không xuyên tường nam');
p = walk(2, 18, 0, 300); // yaw 0 → forward (0,-1) về bắc
ok(p.z > -0.1, 'không xuyên tường bắc');
// cửa bí mật đang đóng: từ kho đi về z- phải bị chặn (thùng + cửa)
p = walk(24.3, 3.5, 0, 300, 7.2);
ok(p.z > 0.2, `cửa thép + thùng chặn lối (z=${p.z.toFixed(2)})`);
// mở cửa + đẩy thùng → đi vào được phòng bí mật
G.flags.boxMoved = true; G.secretBoxCol.off = true;
G.flags.doorOpen = true; G.steelDoorCol.off = true;
p = walk(24.3, 3.5, 0, 420, 7.2);
ok(p.z < -1 && Math.abs(p.y - 7.2) < 0.05, `vào được phòng bí mật (z=${p.z.toFixed(2)}, y=${p.y.toFixed(2)})`);
// reset cờ
G.flags.boxMoved = false; G.flags.doorOpen = false;
// đi xuyên cửa phòng seminar (gap x[12,13.4] tại z=8)
p = walk(12.7, 9.2, 0, 200);
ok(p.z < 7, `qua được cửa seminar (z=${p.z.toFixed(2)})`);
// đi vào phòng server qua cửa đông (gap z[10.6,11.8] tại x=20)
p = walk(20.8, 11.2, Math.PI / 2, 200, 7.2); // yaw π/2 → forward (-1,0) đi về -x
ok(p.x < 19.5, `vào được phòng server (x=${p.x.toFixed(2)})`);
// đi vào kho qua cửa nam (gap x[25.4,26.6] tại z=8)
p = walk(26.0, 9.2, 0, 220, 7.2);
ok(p.z < 7.0, `vào được kho (z=${p.z.toFixed(2)})`);

console.log('— ném bóng rổ (vật lý) —');
G.player.x = 4.5; G.player.z = 16.2; G.player.y = 0;
G.camera.position.set(4.5, 1.62, 16.2);
G.camera.rotation.set(0.45, Math.PI, 0); // nhìn về +z (rổ) hơi ngước
{
  const ballsMod = GA;
  // cầm bóng: gọi interactable của giá bóng
  const rack = G.interactables.find(i => i.label.includes('Cầm một quả bóng'));
  ok(!!rack, 'có điểm tương tác giá bóng');
  rack.onUse();
  ok(ballsMod.holdingBall(), 'đang cầm bóng');
  ballsMod.tryThrow();
  let scored = false;
  const sc0 = G.hoopScore || 0;
  for (let i = 0; i < 600; i++) {
    ballsMod.updateGames(1 / 120);
    if ((G.hoopScore || 0) > sc0) { scored = true; break; }
  }
  console.log('  (bóng có vào rổ trong mô phỏng:', scored ? 'CÓ 🏀' : 'không — chấp nhận, tuỳ lực ném', ')');
}

console.log(failed ? `\n✗ FAIL: ${failed}` : '\n✓ Test thế giới PASS toàn bộ');
process.exit(failed ? 1 : 0);
