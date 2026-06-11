// Khởi tạo renderer, môi trường PBR, hậu kỳ bloom + hệ thống 3 mức đồ hoạ
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { G, $, save } from './state.js';

export const TIER_LABEL = ['CAO ✨ (bloom + bóng đổ nét)', 'VỪA ⚡ (tắt bloom, bóng đổ gọn)', 'THẤP 🚀 (tối ưu cho máy yếu)'];

export function initEngine() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  $('app').appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xbcd4e8, 30, 95);
  const camera = new THREE.PerspectiveCamera(72, 1, 0.08, 160);
  camera.rotation.order = 'YXZ';

  G.renderer = renderer; G.scene = scene; G.camera = camera;
  G.clock = new THREE.Clock();

  // môi trường phản chiếu PBR
  const pmrem = new THREE.PMREMGenerator(renderer);
  G.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = G.envMap;
  if ('environmentIntensity' in scene) scene.environmentIntensity = 0.35;

  // mặc định mở lên ở mức THẤP cho máy nào cũng chạy mượt — người chơi tự tăng bằng nút 🎨
  if (G.qualityMode !== 'manual') G.tier = 2;
  G.reduced = G.tier > 0;
  applyTier();

  window.addEventListener('resize', resize);
  resize();
}

export function applyTier() {
  const t = G.tier, r = G.renderer;
  G.reduced = t > 0;
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, t === 0 ? 2 : t === 1 ? 1.5 : 1));
  // bloom composer chỉ ở mức CAO
  if (t === 0 && !G.composer) {
    const rt = new THREE.WebGLRenderTarget(innerWidth, innerHeight, {
      type: THREE.HalfFloatType,
      samples: r.capabilities.isWebGL2 ? 4 : 0,
    });
    const composer = new EffectComposer(r, rt);
    composer.addPass(new RenderPass(G.scene, G.camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.22, 0.4, 1.3));
    composer.addPass(new OutputPass());
    G.composer = composer;
  }
  if (t > 0 && G.composer) {
    G.composer.dispose && G.composer.dispose();
    G.composer = null;
  }
  // bóng đổ: CAO 2048 · VỪA 1024 · THẤP tắt hẳn
  const shadowOn = t < 2;
  if (r.shadowMap.enabled !== shadowOn) {
    r.shadowMap.enabled = shadowOn;
    G.scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
  }
  if (G.sun) {
    G.sun.castShadow = shadowOn;
    const sz = t === 0 ? 2048 : 1024;
    if (G.sun.shadow.mapSize.x !== sz) {
      G.sun.shadow.mapSize.set(sz, sz);
      if (G.sun.shadow.map) { G.sun.shadow.map.dispose(); G.sun.shadow.map = null; }
    }
  }
  // đèn phòng: CAO bật hết, VỪA/THẤP chỉ giữ đèn chính
  if (G.roomLights) G.roomLights.forEach((p) => { p.visible = t === 0 || p.userData.keep; });
  if (G.trophyLights) G.trophyLights.spotCup.castShadow = t === 0;
  resize();
}
export function cycleTier() {
  G.tier = (G.tier + 1) % 3;
  G.qualityMode = 'manual';
  applyTier();
  save();
  return G.tier;
}

// tự hạ mức khi FPS thấp (chỉ khi người chơi chưa tự chọn tay)
let perfT = 0, perfN = 0;
export function autoPerf(dt) {
  if (G.qualityMode === 'manual' || G.state !== 'play' || G.tier >= 2) return;
  perfT += dt; perfN++;
  if (perfT >= 2.5) {
    const fps = perfN / perfT;
    perfT = 0; perfN = 0;
    if (fps < 38) {
      G.tier++;
      applyTier();
      save();
      G.updateQualityBtn && G.updateQualityBtn();
      G.toast && G.toast(`⚡ Máy đang đuối ${Math.round(fps)} FPS — tự giảm đồ hoạ xuống mức <b>${TIER_LABEL[G.tier].split(' ')[0]}</b> cho mượt. (Chỉnh tay bằng nút 🎨)`, 6000);
    }
  }
}

function resize() {
  const w = innerWidth, h = innerHeight;
  G.camera.aspect = w / h;
  G.camera.updateProjectionMatrix();
  G.renderer.setSize(w, h);
  if (G.composer) G.composer.setSize(w, h);
}
export function renderFrame() {
  if (G.composer && G.tier === 0) G.composer.render();
  else G.renderer.render(G.scene, G.camera);
}
