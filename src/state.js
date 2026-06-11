// Trạng thái toàn cục dùng chung giữa các module
export const G = {
  // three
  scene: null, camera: null, renderer: null, composer: null,
  clock: null, envMap: null,
  // thế giới
  colliders: [],        // {minX,maxX,minZ,maxZ,minY,maxY}
  patches: [],          // mặt đứng được: {minX,maxX,minZ,maxZ, y | (ax,az,y0,y1): dốc}
  interactables: [],    // {pos:Vector3, r, label, onUse, enabled?:fn, mesh?}
  animated: [],         // {update(t,dt), pos?:Vector3, range?}
  screens: [],          // màn hình canvas động {pos, update(t), tex, always?}
  // người chơi
  player: { x: 4, y: 0, z: 4.2, yaw: Math.PI / 2, pitch: 0, vy: 0, run: false },
  input: { f: 0, s: 0, lookX: 0, lookY: 0, interact: false },
  // game
  state: 'intro',       // intro | play | dialog | win
  startT: 0, elapsed: 0, timerOn: false,
  keys: { bronze: false, silver: false, gold: false },
  flags: { boxMoved: false, doorOpen: false, won: false, coffee: 0 },
  hintsUnlocked: 0, hintsRead: 0,
  tier: 0,                // 0 cao · 1 vừa · 2 thấp
  qualityMode: 'auto',    // auto | manual
  quality: 'auto',        // (giữ tương thích)
  muted: false,
  isTouch: ('ontouchstart' in window) && (navigator.maxTouchPoints > 0),
  reduced: false,       // chế độ đồ hoạ thấp thực tế
};

const SK = 'kaopizHunt_v1';
export function save() {
  try {
    localStorage.setItem(SK, JSON.stringify({
      keys: G.keys, flags: { boxMoved: G.flags.boxMoved, doorOpen: G.flags.doorOpen, won: G.flags.won, coffee: G.flags.coffee },
      elapsed: G.elapsed, muted: G.muted, tier: G.tier, qualityMode: G.qualityMode,
      snakeBest: G.snakeBest | 0, hoopBest: G.hoopBest | 0,
    }));
  } catch (e) { /* private mode */ }
}
export function load() {
  try {
    const d = JSON.parse(localStorage.getItem(SK) || 'null');
    if (!d) return false;
    Object.assign(G.keys, d.keys || {});
    Object.assign(G.flags, d.flags || {});
    G.elapsed = d.elapsed || 0;
    G.muted = !!d.muted;
    G.qualityMode = d.qualityMode || 'auto';
    if (G.qualityMode === 'manual') G.tier = Math.min(2, Math.max(0, d.tier | 0));
    G.snakeBest = d.snakeBest | 0;
    G.hoopBest = d.hoopBest | 0;
    return (G.keys.bronze || G.keys.silver || G.keys.gold || G.flags.boxMoved);
  } catch (e) { return false; }
}
export function wipe() { try { localStorage.removeItem(SK); } catch (e) {} }

export const $ = (id) => document.getElementById(id);
export const keyCount = () => (G.keys.bronze ? 1 : 0) + (G.keys.silver ? 1 : 0) + (G.keys.gold ? 1 : 0);
