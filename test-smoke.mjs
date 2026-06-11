// Smoke test chạy bằng Node: giả lập canvas 2D, gọi mọi hàm vẽ + logic thuần
// node test-smoke.mjs
const calls = { unknown: new Set() };
const CTX_METHODS = new Set([
  'fillRect', 'strokeRect', 'clearRect', 'beginPath', 'closePath', 'moveTo', 'lineTo',
  'arc', 'arcTo', 'ellipse', 'rect', 'fill', 'stroke', 'clip', 'save', 'restore',
  'translate', 'rotate', 'scale', 'fillText', 'strokeText', 'setLineDash',
  'quadraticCurveTo', 'bezierCurveTo', 'drawImage', 'transform', 'setTransform',
]);
function fakeCtx() {
  const grad = { addColorStop() {} };
  return new Proxy({}, {
    get(t, p) {
      if (p === 'measureText') return () => ({ width: 42 });
      if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => grad;
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p === 'canvas') return { width: 480, height: 300 };
      if (typeof p === 'string' && CTX_METHODS.has(p)) return () => {};
      if (typeof p === 'string' && /^[a-z]/i.test(p)) {
        // thuộc tính style (fillStyle…) → cho phép đọc/ghi
        return t['_' + p];
      }
      return t[p];
    },
    set(t, p, v) { t['_' + p] = v; return true; },
  });
}
globalThis.document = {
  createElement(tag) {
    if (tag !== 'canvas') return {};
    return { width: 0, height: 0, getContext: () => fakeCtx() };
  },
  getElementById: () => null,
  addEventListener() {},
  exitPointerLock() {},
};
globalThis.window = globalThis;
Object.defineProperty(globalThis, 'navigator', { value: { maxTouchPoints: 0, userAgent: 'node-test' }, configurable: true });
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.innerWidth = 1280; globalThis.innerHeight = 720;
globalThis.addEventListener = () => {};
globalThis.requestAnimationFrame = () => 0;
globalThis.performance = globalThis.performance || { now: () => Date.now() };
globalThis.setInterval = () => 0;

let failed = 0;
async function t(name, fn) {
  try { await fn(); console.log('  ✓', name); }
  catch (e) { failed++; console.log('  ✗', name, '→', e.message); }
}

console.log('— textures.js —');
const TX = await import('./src/textures.js');
for (const fn of ['woodTex', 'ceilingSlats', 'carpetTex', 'terrazzoTex', 'concreteTex', 'wallTex',
  'posterOpenCup', 'poster10y', 'vodichBoard', 'shelfTex', 'rackTex', 'vendingTex',
  'whiteboardTex', 'rugTex', 'courtTex', 'arcadeTex',
  'mintTex', 'stoneTex', 'certBangKhen', 'posterKeizai', 'dustRing']) {
  await t(fn, () => TX[fn]());
}
await t('skylineTex day/night', () => { TX.skylineTex(false); TX.skylineTex(true); });
await t('certSmall 3 mẫu', () => { TX.certSmall(0); TX.certSmall(1); TX.certSmall(2); });
await t('logoCanvas', () => TX.logoCanvas(520, 180, '#fff', 'sub'));
await t('signTex', () => TX.signTex('XYZ', { sub: 'abc' }));
await t('noteTex', () => TX.noteTex(['a', 'b', 'c']));

console.log('— people.js —');
const PE = await import('./src/people.js');
const all = [...PE.STAFF_F3, ...PE.STAFF_F1];
console.log('  tổng nhân sự:', all.length, '(kỳ vọng 26)');
if (all.length !== 26) { failed++; console.log('  ✗ thiếu người!'); }
for (const p of all) {
  await t(`màn hình: ${p.plate} (${p.scr})`, () => {
    const g = fakeCtx();
    PE.drawScreen(p, g, 0);
    PE.drawScreen(p, g, 1.7);
    PE.drawScreen(p, g, 12.3);
  });
}
await t('nameplateCanvas', () => { PE.nameplateCanvas('Nguyễn Văn A'); PE.nameplateCanvas('Chủ tịch X', true); });

console.log('— world.js (logic thuần) —');
const W = await import('./src/world.js');
await t('MATRIX nhất quán', () => {
  const a = W.MATRIX.answer;
  if (W.MATRIX.shapeAt(2, 2) !== a.shape) throw new Error('shape lệch: ' + W.MATRIX.shapeAt(2, 2));
  if (W.MATRIX.fillAt(2, 2) !== a.fill) throw new Error('fill lệch: ' + W.MATRIX.fillAt(2, 2));
  if (W.MATRIX.dotsAt(2, 2) !== a.dots) throw new Error('dots lệch');
});
await t('drawMatrixCell mọi biến thể', () => {
  const g = fakeCtx();
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) W.drawMatrixCell(g, r, c, 0, 0, 100);
  for (const s of ['tri', 'sq', 'cir']) for (const f of ['solid', 'hollow', 'stripe'])
    W.drawMatrixCell(g, 0, 0, 0, 0, 100, { shape: s, fill: f, dots: 2 });
});

console.log('— player.js groundY —');
const { G } = await import('./src/state.js');
const PL = await import('./src/player.js');
await t('groundY phẳng + dốc', () => {
  G.patches.length = 0;
  G.patches.push({ minX: 0, maxX: 10, minZ: 0, maxZ: 10, yA: 0, yB: 0, grad: null });
  G.patches.push({ minX: 0, maxX: 10, minZ: 0, maxZ: 10, yA: 7.2, yB: 7.2, grad: null });
  G.patches.push({ minX: 0, maxX: 4, minZ: 20, maxZ: 21, yA: 0, yB: 1.8, grad: 'x' });
  if (PL.groundY(5, 5, 0.3) !== 0) throw new Error('phải đứng tầng 1');
  if (PL.groundY(5, 5, 7.5) !== 7.2) throw new Error('phải đứng tầng 3');
  if (PL.groundY(5, 5, 3) !== 0) throw new Error('giữa 2 tầng phải rơi về T1');
  const mid = PL.groundY(2, 20.5, 1.2);
  if (Math.abs(mid - 0.9) > 0.01) throw new Error('dốc sai: ' + mid);
});

console.log(failed ? `\n✗ FAIL: ${failed} lỗi` : '\n✓ Tất cả smoke test PASS');
process.exit(failed ? 1 : 0);
