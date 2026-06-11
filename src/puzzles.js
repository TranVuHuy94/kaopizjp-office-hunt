// 3 câu đố → 3 chìa khoá; đẩy thùng; cửa thép; thang máy
import { G, $, save, keyCount } from './state.js';
import { sfx } from './audio.js';
import { openDialog, closeDialog, toast, refreshKeys, fade } from './ui.js';
import { drawMatrixCell, MATRIX, F1Y, F3Y } from './world.js';

function award(which, label) {
  G.keys[which] = true;
  save();
  refreshKeys();
  sfx.key();
  const left = 3 - keyCount();
  toast(`🗝️ <b>BẠN NHẬN ĐƯỢC ${label}!</b>${left > 0 ? ` Còn ${left} chìa nữa…` : ' ĐỦ BỘ RỒI! Mau đến cánh cửa thép trong kho tầng 3!'}`, 6000);
}

// ============ ĐỒNG: dãy look-and-say ============
function openBronze() {
  if (G.keys.bronze) { toast('💻 PC đã được mở khoá rồi — Kao-GPT đang xem mèo trên mạng. Chìa Đồng bạn cầm rồi mà 🥉'); return; }
  openDialog(`
    <h2>💻 PC của thực tập sinh AI "Kao-GPT"</h2>
    <p>Màn hình khoá hiện một dãy số. Dòng chú thích ghi: <i>"Mật khẩu là số tiếp theo của dãy — tôi đặt xong thì quên luôn quy luật 🤦"</i></p>
    <div class="seqShow">1 → 11 → 21 → 1211 → 111221 → <b>?</b></div>
    <div class="numIn"><input id="pzIn" inputmode="numeric" autocomplete="off" placeholder="nhập số tiếp theo"></div>
    <div class="dlgErr" id="pzErr"></div>
    <div class="dlgRow">
      <button class="btn primary" id="pzOk">Mở khoá</button>
      <button class="btn ghost" id="pzCancel">Để sau</button>
    </div>`);
  let tries = 0;
  const input = $('pzIn');
  setTimeout(() => input.focus(), 80);
  const check = () => {
    const v = input.value.replace(/[^0-9]/g, '');
    if (v === '312211') {
      sfx.unlock();
      closeDialog();
      toast('💻 <b>KÉT!</b> Màn hình bừng sáng — Kao-GPT: "Cảm ơn người tốt bụng! Tặng bạn thứ tôi nhặt được trong ổ cứng 🥉"', 5200);
      setTimeout(() => award('bronze', 'CHÌA KHOÁ ĐỒNG 🥉'), 1100);
    } else {
      tries++;
      sfx.deny();
      $('pzErr').textContent = tries >= 4
        ? 'Sai rồi! Gợi ý to: hãy ĐỌC dòng trước thành lời — "một con 1" → 11, "hai con 1" → 21, "một con 2, một con 1" → 1211…'
        : ['Sai rồi. Đừng cộng trừ nhân chia — quy luật "nghe" được đấy!', 'Vẫn sai. Thử đọc to từng dòng lên xem?', 'Chưa đúng. Dòng sau đang MÔ TẢ dòng trước…'][Math.min(tries - 1, 2)];
      input.select();
    }
  };
  $('pzOk').onclick = check;
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); e.stopPropagation(); });
  $('pzCancel').onclick = () => closeDialog();
}

// ============ BẠC: ma trận hình ============
function openSilver() {
  if (G.keys.silver) { toast('🖼 Bức tranh đã trả lời bạn rồi — Chìa Bạc đang trong túi 🥈'); return; }
  openDialog(`
    <h2>🖼 Bức tranh trừu tượng kỳ lạ</h2>
    <p>Lật ra sau khung tranh, bạn thấy một bảng điện tử: <i>"Tìm mảnh còn thiếu. Trả lời đúng — phần thưởng nằm trong hộc khung tranh."</i></p>
    <div class="matrixGrid" id="pzMx"></div>
    <p style="text-align:center;opacity:.8;margin-top:2px">Chọn mảnh đúng:</p>
    <div class="optGrid" id="pzOpt"></div>
    <div class="dlgErr" id="pzErr"></div>
    <div class="dlgRow">
      <button class="btn primary" id="pzOk" disabled>Xác nhận</button>
      <button class="btn ghost" id="pzCancel">Để sau</button>
    </div>`);
  const mx = $('pzMx');
  for (let r = 0; r < 3; r++) for (let ci = 0; ci < 3; ci++) {
    const cv = document.createElement('canvas');
    cv.width = 100; cv.height = 100;
    const g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 100, 100);
    if (r === 2 && ci === 2) {
      g.fillStyle = '#2a313a'; g.fillRect(0, 0, 100, 100);
      g.fillStyle = '#ffd34d'; g.font = '800 50px "Segoe UI"'; g.textAlign = 'center';
      g.fillText('?', 50, 68);
    } else drawMatrixCell(g, r, ci, 0, 0, 100);
    mx.appendChild(cv);
  }
  // đáp án đúng + nhiễu
  const opts = [
    { shape: 'sq', fill: 'solid', dots: 3 }, // ĐÚNG (hình vuông · tô đặc · 3 chấm)
    { shape: 'sq', fill: 'hollow', dots: 3 },
    { shape: 'cir', fill: 'solid', dots: 3 },
    { shape: 'sq', fill: 'solid', dots: 2 },
    { shape: 'tri', fill: 'stripe', dots: 3 },
    { shape: 'cir', fill: 'hollow', dots: 1 },
  ];
  // xáo trộn
  const order = opts.map((o, i) => i).sort(() => Math.random() - 0.5);
  let sel = -1;
  const optBox = $('pzOpt');
  order.forEach((oi, slot) => {
    const cv = document.createElement('canvas');
    cv.width = 100; cv.height = 100;
    const g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 100, 100);
    drawMatrixCell(g, 0, 0, 0, 0, 100, opts[oi]);
    g.fillStyle = '#8a93a3'; g.font = '700 13px "Segoe UI"';
    g.fillText('ABCDEF'[slot], 6, 16);
    cv.addEventListener('click', () => {
      sel = oi;
      [...optBox.children].forEach(ch => ch.classList.remove('sel'));
      cv.classList.add('sel');
      $('pzOk').disabled = false;
      sfx.click();
    });
    optBox.appendChild(cv);
  });
  let tries = 0;
  $('pzOk').onclick = () => {
    const a = opts[sel], ok = MATRIX.answer;
    if (a && a.shape === ok.shape && a.fill === ok.fill && a.dots === ok.dots) {
      sfx.unlock();
      closeDialog();
      toast('🖼 <b>CẠCH!</b> Hộc bí mật dưới khung tranh bật mở — bên trong là một chiếc chìa sáng lấp lánh 🥈', 5200);
      setTimeout(() => award('silver', 'CHÌA KHOÁ BẠC 🥈'), 1100);
    } else {
      tries++;
      sfx.deny();
      $('pzErr').textContent = tries >= 3
        ? 'Sai! Soi kỹ: mỗi hàng & cột có đủ 3 HÌNH khác nhau, đủ 3 KIỂU TÔ khác nhau, còn số CHẤM = vị trí cột (1,2,3).'
        : ['Chưa đúng. Có tới 3 quy luật chạy song song đó!', 'Vẫn sai. Hàng 3 đang thiếu hình gì? Cột 3 đang thiếu kiểu tô gì?'][Math.min(tries - 1, 1)];
    }
  };
  $('pzCancel').onclick = () => closeDialog();
}

// ============ VÀNG: phá mã 3 số ============
function openGold() {
  if (G.keys.gold) { toast('🧰 Hộp đã mở — Chìa Vàng xịn nhất bạn lấy rồi còn gì 🥇'); return; }
  openDialog(`
    <h2>🧰 Hộp khoá số trong phòng server</h2>
    <p>Chiếc hộp vàng lạnh toát, khắc 5 dòng manh mối. Nhập đúng mã 3 chữ số để mở.</p>
    <div class="clueList" style="background:rgba(0,0,0,.25);border-radius:10px;padding:10px 14px">
      <b>682</b> — một số đúng và <u>đúng</u> vị trí<br>
      <b>614</b> — một số đúng nhưng <u>sai</u> vị trí<br>
      <b>206</b> — hai số đúng nhưng đều <u>sai</u> vị trí<br>
      <b>738</b> — không có số nào đúng<br>
      <b>380</b> — một số đúng nhưng <u>sai</u> vị trí
    </div>
    <div class="dials">
      ${[0, 1, 2].map(i => `
        <div class="dial">
          <button data-d="${i}" data-v="1">▲</button>
          <div class="dv" id="dv${i}">0</div>
          <button data-d="${i}" data-v="-1">▼</button>
        </div>`).join('')}
    </div>
    <div class="dlgErr" id="pzErr"></div>
    <div class="dlgRow">
      <button class="btn primary" id="pzOk">Mở hộp</button>
      <button class="btn ghost" id="pzCancel">Để sau</button>
    </div>`);
  const vals = [0, 0, 0];
  $('dlgPanel').querySelectorAll('.dial button').forEach(b => {
    b.addEventListener('click', () => {
      const d = +b.dataset.d, v = +b.dataset.v;
      vals[d] = (vals[d] + v + 10) % 10;
      $('dv' + d).textContent = vals[d];
      sfx.blip();
    });
  });
  let tries = 0;
  $('pzOk').onclick = () => {
    if (vals[0] === 0 && vals[1] === 4 && vals[2] === 2) {
      sfx.unlock();
      closeDialog();
      toast('🧰 <b>TÁCH!</b> Hộp vàng bật nắp. Trong lớp nhung đỏ là chiếc chìa khoá VÀNG nặng trịch 🥇', 5200);
      if (G.goldBox) G.goldBox.rotation.x = -0.18;
      setTimeout(() => award('gold', 'CHÌA KHOÁ VÀNG 🥇'), 1100);
    } else {
      tries++;
      sfx.deny();
      $('pzErr').textContent = tries >= 4
        ? 'Sai! Mẹo: 738 loại ngay 7, 3, 8. Vậy trong 380 chỉ còn "0" là ứng viên — và nó đang đứng SAI chỗ ở vị trí cuối…'
        : ['Hộp rung lên: SAI MÃ. Suy luận lại nào!', 'Vẫn sai. Hãy bắt đầu từ dòng "không có số nào đúng".', 'Chưa đúng. Dòng "hai số đúng, đều sai chỗ" là chìa khoá suy luận đấy.'][Math.min(tries - 1, 2)];
    }
  };
  $('pzCancel').onclick = () => closeDialog();
}

// ============ thùng + cửa thép ============
function pushBoxes() {
  if (G.flags.boxMoved) { toast('📦 Thùng đã được đẩy gọn sang bên rồi. Cánh cửa thép kia kìa!'); return; }
  sfx.slide();
  const grp = G.secretBoxes;
  const x0 = grp.position.x, t0 = performance.now();
  const anim = { update: () => {
    const k = Math.min(1, (performance.now() - t0) / 900);
    const e = 1 - Math.pow(1 - k, 3);
    grp.position.x = x0 + e * 2.1;
    grp.rotation.y = e * 0.12;
    if (k >= 1) anim.done = true;
  } };
  G.animated.push(anim);
  G.flags.boxMoved = true;
  if (G.secretBoxCol) G.secretBoxCol.off = false; // vẫn chặn ở vị trí mới? → cập nhật vùng
  if (G.secretBoxCol) { G.secretBoxCol.minX += 2.1; G.secretBoxCol.maxX += 2.1; }
  save();
  refreshKeys();
  toast('📦 <b>RẦM…</b> Đống thùng trượt sang. Sau lớp bụi 10 năm là — <b>MỘT CÁNH CỬA THÉP VỚI 3 Ổ KHOÁ</b>?! 😱', 6000);
}
function trySteelDoor() {
  if (G.flags.doorOpen) { toast('🚪 Cửa đã mở. Mời vào… nếu bạn dám 👀'); return; }
  const n = keyCount();
  if (n < 3) {
    sfx.deny();
    const need = [];
    if (!G.keys.gold) need.push('VÀNG 🥇');
    if (!G.keys.silver) need.push('BẠC 🥈');
    if (!G.keys.bronze) need.push('ĐỒNG 🥉');
    toast(`🚪 Cửa thép lạnh băng, có 3 ổ khoá: <b>VÀNG · BẠC · ĐỒNG</b>. Bạn mới có ${n}/3 chìa. Còn thiếu: <b>${need.join(' · ')}</b>. Bên trong chắc chắn là thứ RẤT quý giá…`, 6000);
    return;
  }
  // đủ 3 chìa: mở từng ổ rồi trượt cửa
  G.state = 'dialog'; // khoá thao tác trong lúc mở
  const locks = G.steelDoor.lockMeshes;
  locks.forEach((lk, i) => {
    setTimeout(() => {
      lk.keyIn.visible = true;
      const r0 = lk.ring.rotation.z, t0 = performance.now();
      G.animated.push({ update: () => { lk.ring.rotation.z = r0 + Math.min(1, (performance.now() - t0) / 400) * Math.PI / 2; } });
      sfx.unlock();
      toast(`🗝️ Ổ khoá ${['VÀNG 🥇', 'BẠC 🥈', 'ĐỒNG 🥉'][i]} — <b>MỞ!</b>`, 2200);
    }, 600 + i * 1000);
  });
  setTimeout(() => {
    sfx.doorOpen();
    const grp = G.steelDoor.grp;
    const y0 = grp.position.y, t0 = performance.now();
    G.animated.push({ update: (t, dt, self) => {
      const k = Math.min(1, (performance.now() - t0) / 1700);
      const e = 1 - Math.pow(1 - k, 2);
      grp.position.y = y0 - e * 2.35; // hạ cửa chìm xuống sàn
    } });
    if (G.steelDoorCol) G.steelDoorCol.off = true;
    G.flags.doorOpen = true;
    G.timerOn = false; // chốt thời gian khi mở cửa
    save();
    refreshKeys();
    setTimeout(() => {
      G.state = 'play';
      toast('🚪 <b>KRRRRR…</b> Cánh cửa thép trượt mở. Bên trong tối om — chỉ thấy vài đốm LED xanh dẫn lối. <b>Bước vào đi!</b>', 6500);
    }, 1700);
  }, 600 + 3 * 1000 + 400);
}

// ============ thang máy ============
function openElevator() {
  const cur = G.player.y > 4 ? 3 : 1;
  openDialog(`
    <h2>🛗 Thang máy Kaopiz</h2>
    <p>Bạn đang ở <b>tầng ${cur}</b>. Chọn tầng muốn đến:</p>
    <div class="dlgRow" style="margin-top:16px">
      <button class="btn ${cur === 1 ? 'ghost' : 'primary'}" id="lift1" style="font-size:20px;padding:14px 26px">1</button>
      <button class="btn ghost" id="lift2" style="font-size:20px;padding:14px 26px">2</button>
      <button class="btn ${cur === 3 ? 'ghost' : 'primary'}" id="lift3" style="font-size:20px;padding:14px 26px">3</button>
    </div>
    <div class="dlgRow"><button class="btn ghost" id="liftX">Thôi, đi cầu thang cho khoẻ</button></div>`);
  const ride = (target) => {
    closeDialog();
    fade(() => {
      G.player.y += (target === 3 ? 1 : -1) * (F3Y - F1Y);
      G.player.x = 32.9; G.player.z = 9.7;
      sfx.ding();
      toast(target === 3 ? '🛗 <b>Ding!</b> Tầng 3 — khu BOD. Đi nhẹ, nói khẽ, cười duyên nhé.' : '🛗 <b>Ding!</b> Tầng 1 — sảnh chính & khu dev.');
    }, 500, 600);
  };
  $('lift1').onclick = () => { if (cur === 1) { toast('🛗 Bạn đang ở tầng 1 rồi mà 😅'); closeDialog(); } else ride(1); };
  $('lift3').onclick = () => { if (cur === 3) { toast('🛗 Bạn đang ở tầng 3 rồi mà 😅'); closeDialog(); } else ride(3); };
  $('lift2').onclick = () => {
    sfx.deny();
    $('dlgPanel').querySelector('p').innerHTML = '🔒 <b>Tầng 2 là của công ty hàng xóm!</b> Kaopiz thuê tầng 1 & 3 thôi. Nút này bấm cũng không đi đâu 😅';
  };
  $('liftX').onclick = () => closeDialog();
}

export function initPuzzles() {
  G.openBronze = openBronze;
  G.openSilver = openSilver;
  G.openGold = openGold;
  G.pushBoxes = pushBoxes;
  G.trySteelDoor = trySteelDoor;
  G.openElevator = openElevator;
  // khôi phục trạng thái đã lưu
  if (G.flags.boxMoved && G.secretBoxes) {
    G.secretBoxes.position.x += 2.1;
    G.secretBoxes.rotation.y = 0.12;
    if (G.secretBoxCol) { G.secretBoxCol.minX += 2.1; G.secretBoxCol.maxX += 2.1; }
  }
  if (G.flags.doorOpen && G.steelDoor) {
    G.steelDoor.grp.position.y -= 2.35;
    G.steelDoor.lockMeshes.forEach(lk => { lk.keyIn.visible = true; lk.ring.rotation.z = Math.PI / 2; });
    if (G.steelDoorCol) G.steelDoorCol.off = true;
  }
}
