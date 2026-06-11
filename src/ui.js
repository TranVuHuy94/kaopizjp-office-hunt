// HUD + hộp thoại + gợi ý + intro/pause/win
import { G, $, save, wipe, keyCount } from './state.js';
import { audioInit, setMuted, sfx } from './audio.js';
import { lockPointer } from './player.js';
import { cycleTier, TIER_LABEL } from './engine.js';
import { logoCanvas, yenNote } from './textures.js';
import { PHOTOS } from './photodata.js';

const HINTS = [
  [120, 'Văn phòng có <b>3 thử thách</b>: một <b>màn hình PC bị khoá</b> nơi anh em dev ngồi (T1), một <b>bức tranh kỳ lạ</b> gần chỗ các sếp thư giãn (T3), và một <b>chiếc hộp vàng</b> trong căn phòng vừa lạnh vừa ồn (T3).'],
  [270, 'Trong <b>kho tầng 3</b>, đống thùng carton "Kaopiz 10 năm" được xếp… hơi cố tình. Thử <b>đẩy</b> nó xem sao?'],
  [420, '🥉 Dãy số của Kao-GPT: đừng tính toán gì cả — hãy <b>ĐỌC TO</b> từng dòng lên thành lời. Dòng sau "mô tả" dòng trước.'],
  [560, '🥈 Bức tranh: mỗi <b>hàng</b> và <b>cột</b> không lặp lại <b>hình</b> lẫn <b>kiểu tô</b>; số <b>chấm</b> tăng dần theo cột. Ô "?" cần bù đúng những gì hàng 3 / cột 3 còn thiếu.'],
  [700, '🥇 Hộp khoá số: bắt đầu từ dòng "<b>không có số nào đúng</b>" để loại trừ. Sau đó soi dòng "<b>hai số đúng nhưng sai chỗ</b>" — vị trí cấm của chúng tiết lộ tất cả.'],
];

let toastBox, promptEl;
export function toast(html, dur = 4600) {
  toastBox = toastBox || $('toast');
  if (!toastBox) return;
  const d = document.createElement('div');
  d.className = 'toastMsg';
  d.innerHTML = html;
  toastBox.appendChild(d);
  while (toastBox.children.length > 2) toastBox.firstChild.remove();
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 420); }, dur);
}
export function prompt(html) {
  promptEl = promptEl || $('prompt');
  if (!promptEl) return;
  if (!html) { promptEl.classList.add('hidden'); return; }
  promptEl.innerHTML = html;
  promptEl.classList.remove('hidden');
}

// ---------- hộp thoại chung ----------
export function openDialog(html, { onClose = null } = {}) {
  G.state = 'dialog';
  $('dlgPanel').innerHTML = html;
  $('dialog').classList.remove('hidden');
  document.exitPointerLock && document.exitPointerLock();
  G._dlgClose = onClose;
}
export function closeDialog(toPlay = true) {
  $('dialog').classList.add('hidden');
  if (G._dlgClose) { const f = G._dlgClose; G._dlgClose = null; f(); }
  if (toPlay && !G.flags.won) { G.state = 'play'; lockPointer(); }
  if (toPlay && G.flags.won) G.state = 'play';
}
export const dialog = {
  paper(title, lines) {
    openDialog(`<h2>📜 ${title}</h2><div class="paper">${lines.map(l => l === '' ? '<br>' : esc(l)).join('<br>')}</div>
      <div class="dlgRow"><button class="btn primary" id="dlgOk">Đã đọc</button></div>`);
    $('dlgOk').onclick = () => { sfx.click(); closeDialog(); };
  },
};
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

// ---------- HUD ----------
export function refreshKeys() {
  $('kV').classList.toggle('got', G.keys.gold);
  $('kB').classList.toggle('got', G.keys.silver);
  $('kD').classList.toggle('got', G.keys.bronze);
  const n = keyCount();
  const ob = $('objective');
  if (G.flags.won) ob.innerHTML = '🏆 Bạn đã tìm thấy <b style="color:#ffd34d">CÚP VÔ ĐỊCH KAOPIZ OPEN CUP 2026</b>! Ở lại ngắm, chơi mini game, hoặc khoe ngay với đồng nghiệp.';
  else if (n === 3) ob.innerHTML = '🗝️ Đủ <b>3 chìa khoá</b> rồi! Đến <b>cánh cửa thép</b> (sau đống thùng trong kho tầng 3) và mở nó ra…';
  else if (G.flags.boxMoved) ob.innerHTML = `Cánh cửa thép có <b>3 ổ khoá</b> đã lộ diện trong kho tầng 3. Đã có ${n}/3 chìa. Tiếp tục giải các thử thách IQ!`;
  else ob.innerHTML = `Tin đồn: một <b style="color:#ffd34d">báu vật vô cùng quý giá</b> giấu trong văn phòng. Thu thập <b>3 chìa khoá (${n}/3)</b> bằng cách giải 3 thử thách IQ ở 2 tầng…`;
}
function fmt(sec) {
  sec = Math.max(0, sec | 0);
  return String((sec / 60) | 0).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
}
export function tickHUD() {
  if (G.timerOn) {
    G.elapsed = (performance.now() - G.startT) / 1000;
    $('timerVal').textContent = fmt(G.elapsed);
  }
  // mở khoá gợi ý theo thời gian
  while (G.hintsUnlocked < HINTS.length && G.elapsed >= HINTS[G.hintsUnlocked][0] && !G.flags.won) {
    G.hintsUnlocked++;
    $('hintBadge').style.display = 'block';
    sfx.hint();
    toast('💡 Có gợi ý mới! (bấm nút 💡 góc phải)');
  }
}

function toggleSound() {
  audioInit();
  setMuted(!G.muted);
  $('btnSound').textContent = G.muted ? '🔇' : '🔊';
  toast(G.muted ? '🔇 Đã tắt âm thanh' : '🔊 Đã bật âm thanh', 1800);
  save();
}
function openHints() {
  audioInit();
  $('hintBadge').style.display = 'none';
  const list = HINTS.slice(0, G.hintsUnlocked);
  const lockedNext = G.hintsUnlocked < HINTS.length ? HINTS[G.hintsUnlocked][0] : null;
  openDialog(`<h2>💡 Gợi ý truy tìm</h2>
    ${list.length === 0 ? '<p>Chưa có gợi ý nào. Gợi ý đầu tiên mở sau <b>2 phút</b> khám phá. Cứ đi lục lọi đi đã 😄</p>' : ''}
    <ol style="margin:10px 0 0 18px;display:flex;flex-direction:column;gap:10px;font-size:14px;line-height:1.6">
      ${list.map(h => `<li>${h[1]}</li>`).join('')}
    </ol>
    ${lockedNext !== null ? `<p style="margin-top:12px;opacity:.65">🔒 Gợi ý tiếp theo mở ở phút ${Math.ceil(lockedNext / 60)}.</p>` : ''}
    <p style="margin-top:14px;font-size:13px;line-height:1.7;background:rgba(255,211,77,.07);border:1px dashed rgba(255,211,77,.45);border-radius:10px;padding:10px 13px">
      💴 <b>Tin đồn 10.000¥</b> <span style="opacity:.6">(không có gợi ý thêm — dành cho IQ thượng thừa)</span>:<br>
      <i>«Giữa một rừng xác cây phủ đầy chữ, kẻ duy nhất chưa từng được thở đang gối đầu lên kho báu.
      Lớp da trong suốt của nó là chiếc két sắt bền nhất văn phòng — bởi ở xứ này,
      sự sạch sẽ là một loại giàu có.»</i></p>
    <div class="dlgRow"><button class="btn primary" id="dlgOk">Tiếp tục tìm</button></div>`);
  $('dlgOk').onclick = () => closeDialog();
}

// ---------- giải thưởng 10.000¥ giấu trong «Clean Code» ----------
export function showYenFound() {
  G.flags.yen = true;
  save();
  sfx.fanfare ? sfx.fanfare() : sfx.click();
  openDialog(`<h2>💴 BÓC TRÚNG 10.000¥!</h2>
    <p>Bạn xé lớp màng bọc cuốn <b>«Clean Code»</b> chưa ai từng mở… và một tờ
    <b>10.000 yên</b> rơi ra! Hoá ra <i>"sự sạch sẽ là một loại giàu có"</i> — theo nghĩa đen.</p>
    <img src="${yenNote().toDataURL()}" alt="10.000 yên" style="width:100%;border-radius:10px;margin-top:8px;border:1px solid rgba(124,195,242,.4)">
    <p style="opacity:.75;font-size:12.5px;margin-top:8px">Giải mã được tin đồn này, IQ của bạn miễn bàn 🧠 — nhận thưởng thật tại BTC sự kiện nhé!</p>
    <div class="dlgRow"><button class="btn primary" id="dlgOk">Cất ví 💴</button></div>`);
  $('dlgOk').onclick = () => { sfx.click(); closeDialog(); };
}

// ---------- bảng hướng dẫn điều khiển (nút ⌨ trên HUD) ----------
function showControlsHelp() {
  if (G.state !== 'play') return;
  sfx.click && sfx.click();
  const desk = `<p style="line-height:2.2">
    <span class="kbd">W</span><span class="kbd">A</span><span class="kbd">S</span><span class="kbd">D</span> di chuyển ·
    <b>chuột</b> nhìn quanh · <span class="kbd">Shift</span> chạy nhanh<br>
    <span class="kbd">E</span> / <b>chuột trái</b> tương tác với vật có nhãn sáng<br>
    <span class="kbd">H</span> gợi ý · <span class="kbd">M</span> âm thanh ·
    <span class="kbd">F1</span> bảng này · <span class="kbd">Esc</span> hiện con trỏ để bấm nút góc phải</p>`;
  const touch = `<p style="line-height:2">🕹 <b>Joystick trái</b>: di chuyển · <b>vuốt nửa phải màn hình</b>: nhìn quanh<br>
    👆 nút tương tác · 🏃 chạy nhanh</p>`;
  openDialog(`<h2>⌨ Điều khiển</h2>${G.isTouch ? touch : desk}
    <p style="opacity:.75;font-size:13px;margin-top:6px">Mục tiêu: tìm và giải <b>3 thử thách IQ</b> để lấy chìa 🥇🥈🥉 → mở cánh cửa thép trong <b>kho tầng 3</b>.</p>
    <div class="dlgRow"><button class="btn primary" id="dlgOk">Đã hiểu</button></div>`);
  $('dlgOk').onclick = () => { sfx.click(); closeDialog(); };
}

// ---------- khởi tạo ----------
export function initUI({ onStart, onReset }) {
  toastBox = $('toast'); promptEl = $('prompt');
  // logo intro: build đã nhúng thẳng SVG; nếu trống (build thiếu logo) thì vẽ canvas thay thế
  if (!$('introLogo').querySelector('svg')) $('introLogo').appendChild(logoCanvas(420, 130));
  if (G.isTouch) { $('ctlDesk').classList.add('hidden'); $('ctlTouch').classList.remove('hidden'); }

  $('btnStart').addEventListener('click', () => { audioInit(); onStart(false); });
  $('btnContinue').addEventListener('click', () => { audioInit(); onStart(true); });

  $('btnSound').addEventListener('click', toggleSound);
  $('btnSound').textContent = G.muted ? '🔇' : '🔊';
  const TIER_SHORT = ['Cao', 'Vừa', 'Thấp'];
  const updateQualityBtn = () => { $('btnQuality').innerHTML = `🎨 ${TIER_SHORT[G.tier]}`; };
  G.updateQualityBtn = updateQualityBtn;
  updateQualityBtn();
  $('btnQuality').addEventListener('click', () => {
    const t = cycleTier();
    updateQualityBtn();
    toast(`🎨 Đồ hoạ: <b>${TIER_LABEL[t]}</b>`);
  });
  $('btnMenu').addEventListener('click', () => G.pauseRequest());
  $('btnHint').addEventListener('click', openHints);
  $('btnHelp').addEventListener('click', showControlsHelp);

  // phím tắt khi đang chơi (dùng được cả lúc chuột bị khoá)
  addEventListener('keydown', (e) => {
    if (G.state !== 'play') return;
    if (e.code === 'KeyH') openHints();
    if (e.code === 'KeyM') toggleSound();
    if (e.code === 'F1' || e.code === 'Slash') { e.preventDefault(); showControlsHelp(); }
  });
  // thoát pointer lock (Esc) → không pause, chỉ nhắc cách dùng
  let unlockNotes = 0;
  G.onUnlock = () => {
    if (unlockNotes++ < 3) toast('🖱 Con trỏ đã mở — giờ bấm được các nút góc phải (💡🔊✨☰). Bấm vào giữa màn hình để chơi tiếp.', 5200);
  };

  // pause
  G.pauseRequest = () => {
    if (G.state !== 'play' || $('winOv') && !$('winOv').classList.contains('hidden')) return;
    G.state = 'dialog';
    $('pauseOv').classList.remove('hidden');
    document.exitPointerLock && document.exitPointerLock();
  };
  $('btnResume').addEventListener('click', () => {
    $('pauseOv').classList.add('hidden');
    G.state = 'play';
    lockPointer();
  });
  $('btnReset').addEventListener('click', () => {
    if (!confirm('Chơi lại từ đầu? Chìa khoá đã thu thập sẽ mất.')) return;
    wipe(); location.reload();
  });
  addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && G.state === 'dialog' && !$('dialog').classList.contains('hidden')) closeDialog();
  });

  // win
  $('btnStay').addEventListener('click', () => {
    $('winOv').classList.add('hidden');
    G.state = 'play';
    lockPointer();
  });
  $('btnReplay').addEventListener('click', () => { wipe(); location.reload(); });
}
export function setLoadProgress(p, ready) {
  $('loadFill').style.width = (p * 100).toFixed(0) + '%';
  if (ready) {
    $('btnStart').disabled = false;
    $('btnStart').textContent = '🔦 Bắt đầu truy tìm';
    $('loadBar').style.display = 'none';
  }
}
export function showContinue() {
  $('btnContinue').classList.remove('hidden');
}
export function fade(cb, t1 = 420, t2 = 420) {
  const f = $('fade');
  f.style.transitionDuration = t1 + 'ms';
  f.style.opacity = 1;
  setTimeout(() => {
    cb && cb();
    f.style.transitionDuration = t2 + 'ms';
    f.style.opacity = 0;
  }, t1 + 40);
}
export function showWin() {
  $('winTime').textContent = '⏱ Thời gian truy tìm: ' + fmt(G.elapsed)
    + (G.flags.coffee ? ` · ☕ x${G.flags.coffee}` : '') + (G.flags.yen ? ' · 💴 10.000¥' : '');
  // ảnh thật khu giải thưởng (nhúng lúc build) — phần thưởng tinh thần sau khi thắng
  if (PHOTOS.length && !$('winPhotosRow').children.length) {
    $('winPhotosRow').innerHTML = PHOTOS.map(p =>
      `<figure><img src="${p.src}" alt="${p.cap}"><figcaption>${p.cap}</figcaption></figure>`).join('');
    $('winPhotos').classList.remove('hidden');
  }
  $('winOv').classList.remove('hidden');
  document.exitPointerLock && document.exitPointerLock();
}
