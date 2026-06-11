// Danh sách nhân sự + màn hình "đang bận việc rất quan trọng" của từng người
import { C, rr, drawLogo } from './textures.js';

// ===== khung painter dùng chung (canvas 480x300) =====
function page(g, headerColor, title, url) {
  g.fillStyle = '#f3f4f6'; g.fillRect(0, 0, 480, 300);
  g.fillStyle = '#1f2430'; g.fillRect(0, 0, 480, 30);
  for (let i = 0; i < 3; i++) { g.fillStyle = ['#ff5f57', '#febc2e', '#28c840'][i]; g.beginPath(); g.arc(16 + i * 18, 15, 5.5, 0, 7); g.fill(); }
  g.fillStyle = '#0c0f14'; rr(g, 70, 6, 340, 18, 9); g.fill();
  g.fillStyle = '#8a93a3'; g.font = '11px Segoe UI'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillText(url, 80, 19);
  if (headerColor) { g.fillStyle = headerColor; g.fillRect(0, 30, 480, 34); g.fillStyle = '#fff'; g.font = '700 16px Segoe UI'; g.fillText(title, 14, 53); }
}
function vidPlayer(g, t, { title, channel, views, scene, live = false }) {
  page(g, null, '', live ? 'live.kao.tv/stream' : 'kaotube.vn/watch?v=10namKaopiz');
  // vùng video
  g.fillStyle = '#000'; g.fillRect(0, 30, 480, 196);
  g.save(); g.beginPath(); g.rect(0, 30, 480, 196); g.clip();
  scene(g, t);
  g.restore();
  // progress
  g.fillStyle = '#3a3f47'; g.fillRect(0, 222, 480, 5);
  g.fillStyle = '#ff0033'; g.fillRect(0, 222, live ? 480 : (t * 14 % 480), 5);
  if (live) { g.fillStyle = '#ff0033'; rr(g, 396, 38, 70, 22, 4); g.fill(); g.fillStyle = '#fff'; g.font = '700 13px Segoe UI'; g.textAlign = 'center'; g.fillText('● LIVE', 431, 54); }
  g.textAlign = 'left'; g.fillStyle = '#111827'; g.font = '700 15px Segoe UI';
  g.fillText(title, 12, 250);
  g.fillStyle = '#6b7280'; g.font = '12px Segoe UI';
  g.fillText(`${channel} · ${views}`, 12, 270);
  g.fillStyle = '#374151'; g.font = '13px Segoe UI';
  g.fillText('👍 10K   👎   ➦ Chia sẻ   ⬇ Tải xuống', 12, 290);
}

// ===== các "cảnh video" nhỏ =====
const scFootball = (g, t) => {
  g.fillStyle = '#2e8b46'; g.fillRect(0, 30, 480, 196);
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2;
  g.strokeRect(30, 50, 420, 156); g.beginPath(); g.arc(240, 128, 36, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(240, 50); g.lineTo(240, 206); g.stroke();
  const bx = 240 + Math.sin(t * 2.1) * 150, by = 128 + Math.sin(t * 3.7) * 50;
  for (let i = 0; i < 6; i++) { // cầu thủ
    g.fillStyle = i % 2 ? '#ffffff' : '#1d4ed8';
    const px = 240 + Math.sin(t * 1.3 + i * 2.2) * 160, py = 128 + Math.cos(t * 1.1 + i * 1.7) * 55;
    g.beginPath(); g.arc(px, py, 7, 0, 7); g.fill();
  }
  g.fillStyle = '#fff'; g.beginPath(); g.arc(bx, by, 5, 0, 7); g.fill();
  g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(150, 36, 180, 24);
  g.fillStyle = '#ffd34d'; g.font = '700 14px Segoe UI'; g.textAlign = 'center';
  g.fillText('KAO FC  3 - 2  DEV UNITED', 240, 53); g.textAlign = 'left';
};
const scGym = (g, t) => {
  g.fillStyle = '#22262e'; g.fillRect(0, 30, 480, 196);
  const y = 150 + Math.abs(Math.sin(t * 2.4)) * -34;
  g.strokeStyle = '#f3c98b'; g.lineWidth = 6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(240, 200); g.lineTo(240, 150); g.stroke(); // thân
  g.beginPath(); g.arc(240, 136, 13, 0, 7); g.stroke(); // đầu
  g.beginPath(); g.moveTo(206, y); g.lineTo(240, 152); g.lineTo(274, y); g.stroke(); // tay
  g.strokeStyle = '#9aa3ad'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(196, y); g.lineTo(284, y); g.stroke(); // đòn tạ
  g.fillStyle = '#5b6470';
  g.beginPath(); g.arc(192, y, 16, 0, 7); g.fill(); g.beginPath(); g.arc(288, y, 16, 0, 7); g.fill();
  g.fillStyle = '#ffd34d'; g.font = '700 16px Segoe UI'; g.textAlign = 'center';
  g.fillText('NGÀY 1: NGHỈ NGƠI CHO CHẮC', 240, 215); g.textAlign = 'left';
};
const scClimb = (g, t) => {
  g.fillStyle = '#8fc7f2'; g.fillRect(0, 30, 480, 196);
  g.fillStyle = '#e8edf2';
  g.beginPath(); g.moveTo(60, 226); g.lineTo(240, 60); g.lineTo(420, 226); g.closePath(); g.fill();
  g.fillStyle = '#b9c6d2';
  g.beginPath(); g.moveTo(150, 226); g.lineTo(300, 90); g.lineTo(430, 226); g.closePath(); g.fill();
  const p = (t * 0.06) % 1, px = 150 + p * 88, py = 220 - p * 120;
  g.fillStyle = '#e74c3c'; g.beginPath(); g.arc(px, py, 7, 0, 7); g.fill();
  g.fillStyle = '#0b2239'; g.font = '700 15px Segoe UI'; g.textAlign = 'center';
  g.fillText('Everest solo — KHÔNG cần bình oxy?!', 240, 215); g.textAlign = 'left';
};
const scAnime = (g, t) => {
  g.fillStyle = '#ffd9e8'; g.fillRect(0, 30, 480, 196);
  g.fillStyle = '#fff'; g.beginPath(); g.arc(240, 110, 46, 0, 7); g.fill();
  g.fillStyle = '#5a4632';
  g.beginPath(); g.arc(240, 96, 46, Math.PI, 0); g.fill();
  const blink = Math.sin(t * 2.5) > 0.92 ? 1 : 8;
  g.fillStyle = '#222';
  g.beginPath(); g.ellipse(224, 116, 5, blink, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(256, 116, 5, blink, 0, 0, 7); g.fill();
  g.strokeStyle = '#d4708d'; g.lineWidth = 3;
  g.beginPath(); g.arc(240, 130, 10, 0.3, Math.PI - 0.3); g.stroke();
  g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(0, 188, 480, 38);
  g.fillStyle = '#fff'; g.font = '700 15px Segoe UI'; g.textAlign = 'center';
  g.fillText('「日本語が上手ですね！」', 240, 204);
  g.fillStyle = '#ffd34d'; g.fillText('— Tiếng Nhật của bạn giỏi quá! (tập 247)', 240, 222);
  g.textAlign = 'left';
};
const scPalace = (g, t) => {
  g.fillStyle = '#2a1230'; g.fillRect(0, 30, 480, 196);
  g.fillStyle = '#581845';
  g.fillRect(120, 120, 240, 100);
  g.beginPath(); g.moveTo(90, 124); g.lineTo(240, 64); g.lineTo(390, 124); g.closePath(); g.fill();
  g.fillStyle = '#ffd34d'; g.font = '34px serif'; g.textAlign = 'center';
  g.fillText('👑', 240, 110 + Math.sin(t * 2) * 4);
  g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 186, 480, 40);
  g.fillStyle = '#ffd9a0'; g.font = '700 15px Segoe UI';
  g.fillText('"Trong cung này, bổn cung mới là Mẫu hậu!"', 240, 211);
  g.textAlign = 'left';
};
const scKarma = (g, t) => {
  g.fillStyle = '#1c2a23'; g.fillRect(0, 30, 480, 196);
  g.fillStyle = '#caa05a';
  g.beginPath(); g.moveTo(190, 200); g.lineTo(240, 90); g.lineTo(290, 200); g.closePath(); g.fill();
  g.fillRect(225, 90, 30, 110);
  const gl = 0.5 + Math.sin(t * 1.6) * 0.3;
  g.fillStyle = `rgba(255,220,140,${gl})`;
  g.beginPath(); g.arc(240, 70, 22, 0, 7); g.fill();
  g.fillStyle = '#ffe9b8'; g.font = '700 17px Segoe UI'; g.textAlign = 'center';
  g.fillText('NHÂN QUẢ LÀ CÓ THẬT', 240, 215);
  g.font = '12px Segoe UI'; g.fillStyle = '#9fd0a8';
  g.fillText('(gieo bug nào, gặt bug nấy)', 240, 232 - 6);
  g.textAlign = 'left';
};
const scPyramid = (g, t) => {
  const grd = g.createLinearGradient(0, 30, 0, 226);
  grd.addColorStop(0, '#f7b733'); grd.addColorStop(1, '#e8956a');
  g.fillStyle = grd; g.fillRect(0, 30, 480, 196);
  g.fillStyle = '#b97e2e';
  g.beginPath(); g.moveTo(120, 210); g.lineTo(220, 90); g.lineTo(320, 210); g.closePath(); g.fill();
  g.fillStyle = '#9c6826';
  g.beginPath(); g.moveTo(280, 210); g.lineTo(360, 120); g.lineTo(440, 210); g.closePath(); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(80, 70, 20, 0, 7); g.fill();
  g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 186, 480, 40);
  g.fillStyle = '#ffe9b8'; g.font = '700 15px Segoe UI'; g.textAlign = 'center';
  g.fillText('Bí ẩn nền VĂN MINH Ai Cập — tập 7', 240, 211); g.textAlign = 'left';
};
const scSword = (g, t) => {
  g.fillStyle = '#1a2330'; g.fillRect(0, 30, 480, 196);
  g.fillStyle = '#2c3a4d';
  g.beginPath(); g.moveTo(0, 226); g.lineTo(120, 130); g.lineTo(260, 226); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(220, 226); g.lineTo(370, 110); g.lineTo(480, 226); g.closePath(); g.fill();
  const k = Math.sin(t * 3) * 16;
  g.strokeStyle = '#dfe7ef'; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(170, 160); g.lineTo(210 + k, 120 - k); g.stroke();
  g.beginPath(); g.moveTo(310, 160); g.lineTo(270 - k, 120 - k); g.stroke();
  for (const x of [170, 310]) {
    g.strokeStyle = '#f3c98b'; g.lineWidth = 5;
    g.beginPath(); g.arc(x, 150, 9, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(x, 160); g.lineTo(x, 190); g.stroke();
  }
  g.fillStyle = '#ffd34d'; g.font = '700 14px Segoe UI'; g.textAlign = 'center';
  g.fillText('ĐẠI HIỆP GIANG HỒ — tập 156/3000', 240, 215); g.textAlign = 'left';
};

// ===== painter đầy đủ theo kiểu =====
const painters = {
  video: (g, t, a) => vidPlayer(g, t, a),
  babycam: (g, t) => {
    g.fillStyle = '#0a1410'; g.fillRect(0, 0, 480, 300);
    g.fillStyle = '#11231a'; g.fillRect(20, 36, 440, 224);
    // cũi + bé (nhìn kiểu camera hồng ngoại)
    g.strokeStyle = '#2f5b43'; g.lineWidth = 4;
    for (let x = 60; x <= 420; x += 36) { g.beginPath(); g.moveTo(x, 60); g.lineTo(x, 130); g.stroke(); }
    g.fillStyle = '#3c7a58';
    g.beginPath(); g.ellipse(240, 190, 95, 42 + Math.sin(t * 1.4) * 2.5, 0, 0, 7); g.fill(); // chăn phập phồng
    g.fillStyle = '#bfe8cf'; g.beginPath(); g.arc(150, 172, 22, 0, 7); g.fill(); // đầu bé
    g.fillStyle = '#11231a';
    g.beginPath(); g.arc(143, 170, 2.5, 0, 7); g.fill(); g.beginPath(); g.arc(157, 170, 2.5, 0, 7); g.fill();
    g.beginPath(); g.arc(150, 179, 4, 0, Math.PI); g.stroke();
    g.fillStyle = '#9fe8bf'; g.font = '700 13px Consolas'; g.textAlign = 'left';
    g.fillText('HANA-CAM · PHÒNG NGỦ', 26, 54);
    if (Math.sin(t * 3) > 0) { g.fillStyle = '#ff5e5e'; g.beginPath(); g.arc(440, 50, 5, 0, 7); g.fill(); g.fillText('REC', 408, 54); }
    g.fillStyle = '#cdebd9'; g.font = '12px Consolas';
    g.fillText('💤 Bé đang ngủ ngon — nhịp thở ổn định', 26, 280);
    g.fillStyle = '#7fb795';
    g.fillText('Bố đã dán mắt: 4 giờ 27 phút liên tục', 250, 280);
  },
  shopping: (g, t, a) => {
    page(g, '#ee4d2d', a.shop, a.url);
    const s = Math.max(0, 599 - Math.floor(t) % 600);
    g.fillStyle = '#fff7ed'; g.fillRect(0, 64, 480, 236);
    g.fillStyle = '#ee4d2d'; g.font = '800 18px Segoe UI';
    g.fillText(`⚡ FLASH SALE -99% — còn 00:${String((s / 60) | 0).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`, 14, 92);
    a.items.forEach((it, i) => {
      const x = 16 + (i % 3) * 152, y = 104 + ((i / 3) | 0) * 92;
      g.fillStyle = '#fff'; rr(g, x, y, 140, 82, 8); g.fill();
      g.strokeStyle = '#f1d0c5'; g.strokeRect(x, y, 140, 82);
      g.font = '26px Segoe UI Emoji'; g.fillText(it[0], x + 10, y + 36);
      g.fillStyle = '#333'; g.font = '600 12px Segoe UI'; g.fillText(it[1], x + 48, y + 26);
      g.fillStyle = '#ee4d2d'; g.font = '700 13px Segoe UI'; g.fillText(it[2], x + 48, y + 46);
      g.fillStyle = '#9aa0a6'; g.font = '10px Segoe UI'; g.fillText('đã bán 9,9k', x + 48, y + 62);
    });
  },
  chart: (g, t) => {
    page(g, '#0b1f33', '📈 KAO-FINANCE · Vàng & Coin', 'kaofinance.vn/vang-btc');
    g.fillStyle = '#0d1726'; g.fillRect(0, 64, 480, 236);
    g.strokeStyle = '#1f3550'; g.lineWidth = 1;
    for (let y = 90; y < 290; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(480, y); g.stroke(); }
    g.strokeStyle = '#27e07d'; g.lineWidth = 3; g.beginPath();
    for (let x = 0; x <= 480; x += 8) {
      const y = 250 - x * 0.28 - Math.sin(x * 0.06 + t * 1.8) * 14 - Math.sin(x * 0.013) * 18;
      x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
    g.fillStyle = '#27e07d'; g.font = '800 24px Segoe UI';
    g.fillText('VÀNG SJC  ▲ ALL TIME HIGH', 20, 110);
    g.fillStyle = '#ffd34d'; g.font = '700 16px Segoe UI';
    g.fillText(`BTC  $${(180000 + Math.sin(t) * 2000).toFixed(0)}  ▲ +9.9%`, 20, 140);
    g.fillStyle = '#9fc6e8'; g.font = '12px Segoe UI';
    g.fillText('Khuyến nghị của Giàu: "ĐỪNG BÁN GÌ CẢ"', 20, 285);
  },
  farm: (g, t) => {
    page(g, '#3f9e3f', '🌾 Nông Trại Vui Vẻ', 'play.kao.vn/nongtrai');
    g.fillStyle = '#7ec850'; g.fillRect(0, 64, 480, 236);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) {
      const x = 24 + i * 74, y = 84 + r * 70;
      g.fillStyle = '#8a5a2b'; rr(g, x, y, 60, 52, 8); g.fill();
      g.font = '24px Segoe UI Emoji';
      const ready = Math.sin(t * 0.7 + i + r) > -0.2;
      g.fillText(ready ? '🥕' : '🌱', x + 16, y + 36);
    }
    g.fillStyle = '#fff'; rr(g, 150, 258, 180, 32, 16); g.fill();
    g.fillStyle = '#3f9e3f'; g.font = '800 16px Segoe UI'; g.textAlign = 'center';
    g.fillText('THU HOẠCH x999 🥕', 240, 280); g.textAlign = 'left';
  },
  sudoku: (g, t) => {
    page(g, '#5b6bd5', '🧩 Sudoku Online — Chế độ: SIÊU DỄ', 'sudoku.vn/sieude');
    g.fillStyle = '#fff'; g.fillRect(120, 70, 222, 222);
    for (let i = 0; i <= 9; i++) {
      g.strokeStyle = i % 3 ? '#cfd4dc' : '#3a3f47'; g.lineWidth = i % 3 ? 1 : 2.5;
      g.beginPath(); g.moveTo(120 + i * 24.6, 70); g.lineTo(120 + i * 24.6, 292); g.stroke();
      g.beginPath(); g.moveTo(120, 70 + i * 24.6); g.lineTo(342, 70 + i * 24.6); g.stroke();
    }
    g.font = '700 15px Segoe UI'; g.textAlign = 'center';
    const nums = [[0, 0, '5'], [2, 0, '3'], [4, 1, '7'], [1, 2, '9'], [6, 2, '1'], [3, 3, '6'], [7, 4, '8'], [2, 5, '4'], [5, 6, '2'], [8, 7, '5'], [4, 8, '9']];
    g.fillStyle = '#374151';
    nums.forEach(([cx, cy, n]) => g.fillText(n, 132.4 + cx * 24.6, 87 + cy * 24.6));
    g.fillStyle = '#dc2626'; g.fillText('7', 132.4 + 6 * 24.6, 87 + 6 * 24.6); // điền sai
    g.fillStyle = '#dc2626'; g.font = '11px Segoe UI';
    g.fillText('⚠ sai rồi sếp ơi (lần thứ 12)', 232, 297 - 230);
    g.textAlign = 'left';
  },
  food: (g, t) => {
    page(g, '#00b14f', '🛵 KaoFood — Giỏ hàng', 'kaofood.vn/cart');
    g.fillStyle = '#fff'; g.fillRect(0, 64, 480, 236);
    const items = [['🧋 Trà sữa trân châu (size L)', 'x5'], ['🍗 Gà rán giòn cay', 'x3'], ['🍜 Bún bò đặc biệt', 'x2'], ['☕ Cà phê muối', 'x4'], ['🍰 Bánh tiramisu', 'x2']];
    items.forEach((it, i) => {
      g.fillStyle = i % 2 ? '#f7f9f8' : '#ffffff'; g.fillRect(0, 64 + i * 36, 480, 36);
      g.fillStyle = '#222'; g.font = '14px Segoe UI'; g.fillText(it[0], 16, 88 + i * 36);
      g.fillStyle = '#00b14f'; g.font = '700 14px Segoe UI'; g.fillText(it[1], 420, 88 + i * 36);
    });
    g.fillStyle = '#00b14f'; g.fillRect(0, 254, 480, 46);
    g.fillStyle = '#fff'; g.font = '800 17px Segoe UI';
    g.fillText('TỔNG: 1.260.000đ — "share bill nhé ae" 😇', 16, 283);
  },
  karaoke: (g, t) => {
    g.fillStyle = '#120a2a'; g.fillRect(0, 0, 480, 300);
    for (let i = 0; i < 30; i++) {
      g.fillStyle = `hsla(${(t * 40 + i * 25) % 360},80%,60%,.5)`;
      g.beginPath(); g.arc((i * 53) % 480, (i * 97 + t * 30) % 300, 3, 0, 7); g.fill();
    }
    g.fillStyle = '#ffd34d'; g.font = '800 22px Segoe UI'; g.textAlign = 'center';
    g.fillText('🎤 KARAOKE PRO — 98 ĐIỂM!', 240, 60);
    g.fillStyle = '#fff'; g.font = '700 19px Segoe UI';
    const lyr = 'Đợi i i... có là mãi mãi... 🎶';
    g.fillText(lyr, 240, 160);
    const prog = (t * 0.35) % 1;
    g.fillStyle = '#27e07d'; g.font = '700 19px Segoe UI';
    g.save(); g.beginPath(); g.rect(240 - 160, 140, 320 * prog, 30); g.clip();
    g.fillText(lyr, 240, 160); g.restore();
    g.beginPath(); g.arc(240 - 160 + 320 * prog, 132, 7 - Math.abs(Math.sin(t * 6)) * 4, 0, 7); g.fill();
    for (let i = 0; i < 24; i++) {
      const h = 10 + Math.abs(Math.sin(t * 5 + i)) * 50;
      g.fillStyle = `hsl(${200 + i * 6},80%,60%)`;
      g.fillRect(60 + i * 15, 270 - h, 10, h);
    }
    g.textAlign = 'left';
  },
  doc: (g, t, a) => {
    page(g, '#2b579a', `📄 ${a.file} — Word`, 'kao365.com/word');
    g.fillStyle = '#e8eaed'; g.fillRect(0, 64, 480, 236);
    g.fillStyle = '#fff'; g.fillRect(60, 74, 360, 226);
    g.fillStyle = '#1a1a1a'; g.font = '700 15px Georgia'; g.textAlign = 'center';
    g.fillText(a.title, 240, 104);
    g.font = '11.5px Georgia'; g.textAlign = 'left'; g.fillStyle = '#333';
    a.lines.forEach((l, i) => g.fillText(l, 80, 132 + i * 22));
    if (Math.sin(t * 2.5) > 0) { g.fillStyle = '#1a1a1a'; g.fillRect(80 + 250, 132 + (a.lines.length - 1) * 22 - 11, 1.5, 14); }
  },
  tetris: (g, t) => {
    g.fillStyle = '#0b1020'; g.fillRect(0, 0, 480, 300);
    g.fillStyle = '#05070f'; g.fillRect(160, 10, 160, 280);
    const cols = ['#2db8ff', '#ffd34d', '#ff5e8a', '#27e07d', '#b07cf2'];
    const stack = [[0, 13], [1, 13], [2, 13], [4, 13], [5, 13], [6, 13], [7, 13], [0, 12], [1, 12], [4, 12], [6, 12], [2, 11], [3, 11], [4, 11]];
    stack.forEach(([x, y], i) => { g.fillStyle = cols[i % 5]; g.fillRect(162 + x * 20, 12 + y * 20, 18, 18); });
    const fy = (t * 2.2) % 10;
    g.fillStyle = '#2db8ff';
    [[3, 0], [4, 0], [3, 1], [4, 1]].forEach(([x, y]) => g.fillRect(162 + x * 20, 12 + ((y + fy) | 0) * 20, 18, 18));
    g.fillStyle = '#9fc6e8'; g.font = '700 14px Consolas';
    g.fillText('RANK: TOP 1', 340, 60); g.fillText('SERVER NHẬT 🇯🇵', 340, 82);
    g.fillText('SCORE 999999', 340, 120);
    g.fillStyle = '#ffd34d'; g.fillText('combo x' + (1 + (t | 0) % 9), 340, 150);
    g.fillStyle = '#5d6b80'; g.font = '11px Consolas';
    g.fillText('NEXT:', 40, 60); g.fillStyle = '#27e07d';
    [[0, 0], [1, 0], [1, 1], [2, 1]].forEach(([x, y]) => g.fillRect(40 + x * 16, 70 + y * 16, 14, 14));
  },
  comic: (g, t) => {
    page(g, '#1aa2dc', '📚 KaoTruyện — Doraemon chap 1024', 'kaotruyen.vn/doraemon');
    g.fillStyle = '#fff'; g.fillRect(0, 64, 480, 236);
    g.strokeStyle = '#222'; g.lineWidth = 2;
    g.strokeRect(20, 78, 210, 100); g.strokeRect(250, 78, 210, 100); g.strokeRect(20, 188, 440, 100);
    // mèo máy tối giản
    g.fillStyle = '#2db8ff'; g.beginPath(); g.arc(120, 128, 34, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(120, 136, 26, 0, 7); g.fill();
    g.fillStyle = '#222';
    g.beginPath(); g.arc(110, 116, 4, 0, 7); g.fill(); g.beginPath(); g.arc(130, 116, 4, 0, 7); g.fill();
    g.fillStyle = '#e74c3c'; g.beginPath(); g.arc(120, 128, 5, 0, 7); g.fill();
    g.font = '700 13px Segoe UI';
    g.fillStyle = '#222'; g.fillText('BẢO BỐI MỚI:', 270, 105);
    g.fillText('"Cánh cửa thần kỳ', 270, 128);
    g.fillText('xuyên mọi deadline"', 270, 148);
    g.font = '12px Segoe UI';
    g.fillText('— Cho tớ mượn đi Doraemon ơiii, sếp sắp đi qua rồi!!', 40, 240);
    g.fillText('(lật trang ' + (34 + (t | 0) % 12) + '/45...)', 40, 264);
  },
  livestream: (g, t) => vidPlayer(g, t, {
    live: true, title: '🔥 XẢ KHO 1K1 — 1 2 3 CHỐT ĐƠNNN!!!', channel: 'Sĩ Khang Officiall ✓', views: '12.847 đang xem',
    scene: (gg, tt) => {
      gg.fillStyle = '#43233a'; gg.fillRect(0, 30, 480, 196);
      gg.fillStyle = '#f3c98b'; gg.beginPath(); gg.arc(150, 120, 34, 0, 7); gg.fill();
      gg.fillStyle = '#222';
      gg.beginPath(); gg.arc(140, 112, 4, 0, 7); gg.fill(); gg.beginPath(); gg.arc(160, 112, 4, 0, 7); gg.fill();
      const mo = 4 + Math.abs(Math.sin(tt * 8)) * 9;
      gg.beginPath(); gg.ellipse(150, 134, 7, mo, 0, 0, 7); gg.fill();
      gg.fillStyle = '#e74c3c'; gg.fillRect(120, 154, 60, 50);
      gg.font = '26px Segoe UI Emoji'; gg.fillText('📦', 230, 160 + Math.sin(tt * 8) * 6);
      const cmt = ['❤ chốt 5 đơn', 'rẻ thế shop', 'mua cho sếp 1 cái', 'freeship k?', '🛒🛒🛒', 'chốt!!!'];
      gg.font = '12px Segoe UI';
      for (let i = 0; i < 5; i++) {
        const y = (200 - ((tt * 30 + i * 40) % 170));
        gg.fillStyle = 'rgba(0,0,0,.45)'; rr(gg, 296, y, 168, 20, 9); gg.fill();
        gg.fillStyle = '#fff'; gg.fillText(cmt[(i + ((tt / 5) | 0)) % 6], 306, y + 14);
      }
    },
  }),
  pikachu: (g, t) => { // game nối thú huyền thoại
    page(g, '#3aa3dc', '⚡ Pikachu Classic — Level 97', 'gamevui.vn/pikachu');
    const icons = ['🐱', '🐶', '🐰', '🦊', '🐸', '🐥', '🐙', '🦄'];
    for (let r = 0; r < 5; r++) for (let i = 0; i < 9; i++) {
      const x = 30 + i * 47, y = 76 + r * 44;
      g.fillStyle = '#fdf6e3'; rr(g, x, y, 42, 38, 6); g.fill();
      g.strokeStyle = '#c8b88a'; g.strokeRect(x, y, 42, 38);
      g.font = '22px Segoe UI Emoji'; g.fillText(icons[(r * 9 + i * 3) % 8], x + 9, y + 28);
    }
    const sel = ((t * 1.2) | 0) % 2;
    g.strokeStyle = '#ff3b3b'; g.lineWidth = 3;
    g.strokeRect(30 + 2 * 47, 76 + 44, 42, 38); g.strokeRect(30 + 6 * 47, 76 + 44, 42, 38);
    if (sel) { g.beginPath(); g.moveTo(30 + 2 * 47 + 42, 76 + 44 + 19); g.lineTo(30 + 6 * 47, 76 + 44 + 19); g.stroke(); }
  },
  cotuong: (g, t) => {
    page(g, '#8a5a2b', '♟ Cờ Tướng Online — Ván 3 (đang thua)', 'cotuong.vn/online');
    g.fillStyle = '#f0d9a7'; g.fillRect(90, 70, 300, 224);
    g.strokeStyle = '#7a5836'; g.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(106 + i * 33.5, 82); g.lineTo(106 + i * 33.5, 282); g.stroke(); }
    for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(106, 82 + i * 22.2); g.lineTo(374, 82 + i * 22.2); g.stroke(); }
    const pcs = [['將', '#222', 4, 0], ['士', '#222', 3, 0], ['車', '#222', 0, 1], ['馬', '#222', 6, 2], ['帥', '#c0392b', 4, 9], ['炮', '#c0392b', 2, 5], ['車', '#c0392b', 4, 6], ['兵', '#c0392b', 5, 4]];
    pcs.forEach(([ch, cl, x, y]) => {
      g.fillStyle = '#fdf2d0'; g.beginPath(); g.arc(106 + x * 33.5, 82 + y * 22.2, 13, 0, 7); g.fill();
      g.strokeStyle = cl; g.lineWidth = 1.6; g.stroke();
      g.fillStyle = cl; g.font = '700 14px serif'; g.textAlign = 'center'; g.fillText(ch, 106 + x * 33.5, 87 + y * 22.2);
    });
    g.textAlign = 'left';
    g.fillStyle = 'rgba(0,0,0,.7)'; rr(g, 12, 230, 70, 56, 8); g.fill();
    g.fillStyle = '#fff'; g.font = '11px Segoe UI';
    g.fillText('Đối thủ:', 20, 250); g.fillText('"xin hoà', 20, 264); g.fillText(' nhé bác"', 20, 278);
  },
  chess: (g, t) => {
    page(g, '#4e7837', '♞ KaoChess — Elo 3000 (máy đánh hộ)', 'kaochess.vn/blitz');
    for (let r = 0; r < 8; r++) for (let i = 0; i < 8; i++) {
      g.fillStyle = (r + i) % 2 ? '#769656' : '#eeeed2';
      g.fillRect(128 + i * 28, 70 + r * 28, 28, 28);
    }
    const pcs = [['♜', 0, 0], ['♞', 1, 0], ['♚', 4, 0], ['♟', 2, 1], ['♟', 5, 1], ['♕', 3, 4], ['♙', 4, 6], ['♔', 4, 7], ['♗', 2, 7]];
    g.textAlign = 'center';
    pcs.forEach(([ch, x, y]) => {
      g.fillStyle = y < 3 ? '#222' : '#fafafa';
      g.font = '22px Segoe UI Symbol';
      g.fillText(ch, 142 + x * 28, 92 + y * 28);
    });
    g.textAlign = 'left';
    g.fillStyle = '#27e07d'; g.font = '700 13px Segoe UI';
    g.fillText('Stockfish: "nước này hay đó sếp" 🤫', 130, 297 - 4);
  },
  billiards: (g, t) => {
    page(g, '#155e36', '🎱 Bi-a Online — Cơ thủ huyền thoại', 'kaobida.vn/8ball');
    g.fillStyle = '#0e7a43'; rr(g, 60, 80, 360, 200, 18); g.fill();
    g.strokeStyle = '#5a3a1e'; g.lineWidth = 10; rr(g, 60, 80, 360, 200, 18); g.stroke();
    for (const [x, y] of [[70, 90], [240, 84], [410, 90], [70, 270], [240, 276], [410, 270]]) {
      g.fillStyle = '#06140c'; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill();
    }
    const balls = [['#fff', 140, 180], ['#ffd34d', 280, 150], ['#e74c3c', 310, 190], ['#3867d6', 250, 210], ['#222', 330, 170]];
    balls.forEach(([cl, x, y]) => { g.fillStyle = cl; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); });
    const a = Math.sin(t) * 0.2;
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.setLineDash([6, 6]);
    g.beginPath(); g.moveTo(140, 180); g.lineTo(280 + Math.sin(a) * 60, 150 + Math.cos(a) * 30); g.stroke();
    g.setLineDash([]);
    g.strokeStyle = '#c89a64'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(140 - 80, 180 + 50); g.lineTo(136, 183); g.stroke();
  },
  lofi: (g, t) => {
    g.fillStyle = '#13202b'; g.fillRect(0, 0, 480, 300);
    g.fillStyle = '#0c1620'; rr(g, 30, 40, 220, 220, 12); g.fill();
    // đĩa vinyl quay
    g.save(); g.translate(140, 150); g.rotate(t * 1.5);
    g.fillStyle = '#0a0a0c'; g.beginPath(); g.arc(0, 0, 86, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.12)';
    for (let r = 20; r < 84; r += 9) { g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); }
    g.fillStyle = '#2e7d5b'; g.beginPath(); g.arc(0, 0, 17, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.fillRect(-2, -84, 4, 26);
    g.restore();
    g.fillStyle = '#9fd0b8'; g.font = '700 18px Segoe UI';
    g.fillText('🌲 Rừng Xuân — lofi 24/7', 276, 90);
    g.fillStyle = '#5f7d70'; g.font = '13px Segoe UI';
    g.fillText('beats để chill / để ngủ gật', 276, 114);
    for (let i = 0; i < 12; i++) {
      const h = 8 + Math.abs(Math.sin(t * 4 + i * 0.9)) * 46;
      g.fillStyle = '#2e7d5b'; g.fillRect(276 + i * 15, 220 - h, 10, h);
    }
    g.fillStyle = '#cfe6da'; g.font = '12px Segoe UI';
    g.fillText('▶ 02:47:13 · vẫn đang "tập trung cao độ"', 276, 250);
  },
  flights: (g, t) => {
    page(g, '#1c64d9', '✈ KaoTrip — Săn vé 0đ', 'kaotrip.vn/ve-re');
    g.fillStyle = '#f2f6fc'; g.fillRect(0, 64, 480, 236);
    const fl = [['HAN → TOKYO (NRT)', '0đ*', true], ['HAN → ĐÀ NẴNG', '99K', false], ['HAN → PHÚ QUỐC', '199K', false], ['HAN → SEOUL', '299K', false]];
    fl.forEach((f, i) => {
      g.fillStyle = '#fff'; rr(g, 14, 76 + i * 52, 452, 44, 8); g.fill();
      g.strokeStyle = '#dbe4f0'; g.strokeRect(14, 76 + i * 52, 452, 44);
      g.fillStyle = '#1a2b45'; g.font = '700 14px Segoe UI';
      g.fillText('✈ ' + f[0], 28, 103 + i * 52);
      g.fillStyle = f[2] ? '#e02020' : '#1c64d9'; g.font = '800 16px Segoe UI';
      g.fillText(f[1], 400, 104 + i * 52);
    });
    g.fillStyle = '#8a93a3'; g.font = '11px Segoe UI';
    g.fillText('*chưa gồm thuế phí 12.000.000đ — đọc kỹ trước khi mơ 🥲', 14, 292);
  },
  garden: (g, t) => {
    page(g, '#2e9e5b', '🌿 Khu Vườn Trên Mây — Lv.42', 'play.kao.vn/vuon');
    const sky = g.createLinearGradient(0, 64, 0, 300);
    sky.addColorStop(0, '#bfe7ff'); sky.addColorStop(1, '#d8f3d0');
    g.fillStyle = sky; g.fillRect(0, 64, 480, 236);
    for (let i = 0; i < 6; i++) {
      const x = 40 + i * 72, sway = Math.sin(t * 1.2 + i) * 4;
      g.strokeStyle = '#3c7a3c'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(x, 270); g.quadraticCurveTo(x + sway, 220, x + sway, 190); g.stroke();
      g.fillStyle = ['#58b558', '#67c06a', '#4ba34b'][i % 3];
      g.beginPath(); g.arc(x + sway, 180, 24, 0, 7); g.fill();
      if ((i + (t | 0)) % 3 === 0) { g.font = '16px Segoe UI Emoji'; g.fillText('💚', x + sway + 10, 160); }
    }
    g.fillStyle = '#2e9e5b'; g.font = '800 15px Segoe UI';
    g.fillText('Lá xanh +999 · cây cảnh ảo nhưng niềm vui là thật', 60, 290);
  },
};

export const SCREENS = painters;

// ===== danh sách nhân sự =====
// f: tầng, plate: tên trên biển, scr: painter, a: tham số, anim: màn hình động
export const STAFF_F3 = [
  { plate: 'Chủ tịch Trịnh Công Huân', scr: 'pikachu', anim: true, vip: true },
  { plate: 'PGĐ Nguyễn Văn Tú', scr: 'cotuong', anim: true },
  { plate: 'Giám đốc Trần Ngọc Hiếu', scr: 'video', anim: true, a: { title: 'TOP 10 BÀN THẮNG — KAOPIZ OPEN CUP 2026 🔥', channel: 'Kaopiz Sports', views: '102K lượt xem', scene: scFootball } },
  { plate: 'Thuỳ Erika', scr: 'video', anim: true, a: { title: 'Học tiếng Nhật qua anime — N1 trong 30 ngày??', channel: 'Erika-sensei', views: '88K lượt xem', scene: scAnime } },
  { plate: 'Mẫu hậu Lii Hoàng', scr: 'video', anim: true, vip: true, a: { title: 'Diên Hi Công Lược — tập 48 (bản full HD)', channel: 'Cung Đấu TV', views: '4,8Tr lượt xem', scene: scPalace } },
  { plate: 'Thị Nhài', scr: 'shopping', anim: true, a: { shop: '🛍 Shopei — Siêu Sale 6.6', url: 'shopei.vn/flash-sale', items: [['👗', 'Váy công sở', '1.000đ'], ['💄', 'Son kem lì', '5.000đ'], ['👜', 'Túi xách da', '9.000đ'], ['🧴', 'Serum 10in1', '2.000đ'], ['👠', 'Giày cao gót', '7.000đ'], ['🎀', 'Kẹp tóc cute', '500đ']] } },
  { plate: 'Văn Leo', scr: 'video', anim: true, a: { title: 'Leo Everest solo KHÔNG cần bình oxy?!', channel: 'Leo Là Phải Leo', views: '777K lượt xem', scene: scClimb } },
  { plate: 'Nguyễn Ngọc Giàu', scr: 'chart', anim: true },
  { plate: 'Yến', scr: 'karaoke', anim: true },
  { plate: 'PGĐ Kiều Bảo Duy', scr: 'sudoku', anim: false },
  { plate: 'PGĐ Bùi Quốc Việt', scr: 'food', anim: false },
  { plate: 'PGĐ Vũ Thế Mạnh', scr: 'video', anim: true, a: { title: '6 MÚI TRONG 7 NGÀY — khoa học đã chứng minh(?)', channel: 'GymKao', views: '1,2Tr lượt xem', scene: scGym } },
];
export const STAFF_F1 = [
  { plate: 'Huy Huế (bố Hana)', scr: 'babycam', anim: true },
  { plate: 'Nông Minh Hiếu', scr: 'farm', anim: true },
  { plate: 'Vũ Xuân Lâm', scr: 'lofi', anim: true },
  { plate: 'Nguyễn Sỹ Quân', scr: 'chess', anim: false },
  { plate: 'Đỗ Hồng Khôi', scr: 'tetris', anim: true },
  { plate: 'Nguyễn Quốc Đại Lâm', scr: 'video', anim: true, a: { title: 'ĐẠI HIỆP GIANG HỒ — tập 156 (cày tới sáng)', channel: 'Kiếm Hiệp 4K', views: '2,3Tr lượt xem', scene: scSword } },
  { plate: 'Hoàng Chí Bảo', scr: 'comic', anim: true },
  { plate: 'Nghiệp', scr: 'video', anim: true, a: { title: 'NHÂN QUẢ LÀ CÓ THẬT — đừng xem một mình', channel: 'An Yên Mỗi Ngày', views: '10Tr lượt xem', scene: scKarma } },
  { plate: 'Sĩ Khang', scr: 'livestream', anim: true },
  { plate: 'Ngọc Diệp', scr: 'garden', anim: true },
  { plate: 'Trọng Hoàn', scr: 'billiards', anim: true },
  { plate: 'Thiều Quốc Nghị', scr: 'doc', anim: true, a: { file: 'Nghị_quyết_tăng_lương_cho_bản_thân_final_v12.docx', title: 'NGHỊ QUYẾT SỐ 01/NQ-BẢN THÂN', lines: ['Điều 1: Tăng lương cho bản thân 300%, áp dụng hồi tố 5 năm.', 'Điều 2: Thứ 2 hàng tuần được WFH tại… Đà Lạt.', 'Điều 3: Bug do vũ trụ sinh ra, không phải do tôi.', 'Điều 4: Nghị quyết có hiệu lực khi sếp gật đầu (đang chờ).', '', '(soạn lần thứ 12, vẫn chưa dám gửi)'] } },
  { plate: 'Văn Minh', scr: 'video', anim: false, a: { title: 'Bí ẩn nền VĂN MINH Ai Cập cổ đại — tập 7', channel: 'Khám Phá+', views: '950K lượt xem', scene: scPyramid } },
  { plate: 'Loan', scr: 'flights', anim: false },
];

// vẽ màn hình của một người vào canvas
export function drawScreen(person, g, t) {
  const p = painters[person.scr] || screensaver;
  g.save();
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  p(g, t, person.a || {});
  g.restore();
}
function screensaver(g, t) {
  g.fillStyle = '#04101d'; g.fillRect(0, 0, 480, 300);
  const x = 110 + Math.abs(((t * 40) % 520) - 260), y = 80 + Math.abs(((t * 28) % 300) - 150);
  drawLogo(g, x, y, 38, '#3b99d5');
  g.font = '12px "Segoe UI"'; g.fillStyle = '#2c5b80'; g.textAlign = 'center';
  g.fillText('màn hình chờ — máy chưa có chủ', 240, 280);
  g.textAlign = 'left';
}

// biển tên để bàn
export function nameplateCanvas(name, vip = false) {
  const [c, g] = C(512, 128);
  const grd = g.createLinearGradient(0, 0, 0, 128);
  if (vip) { grd.addColorStop(0, '#f5d77a'); grd.addColorStop(0.5, '#c9a544'); grd.addColorStop(1, '#f1cf6b'); }
  else { grd.addColorStop(0, '#e7ecf2'); grd.addColorStop(0.5, '#aeb9c6'); grd.addColorStop(1, '#dfe6ee'); }
  g.fillStyle = grd; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = vip ? '#8a6d1f' : '#7d8a99'; g.lineWidth = 6; g.strokeRect(3, 3, 506, 122);
  g.fillStyle = vip ? '#4a3508' : '#16283c';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = 44;
  g.font = `700 ${size}px 'Segoe UI', sans-serif`;
  while (g.measureText(name).width > 470 && size > 22) { size -= 2; g.font = `700 ${size}px 'Segoe UI', sans-serif`; }
  g.fillText(name, 256, 60);
  g.font = '500 20px Segoe UI';
  g.fillStyle = vip ? 'rgba(74,53,8,.75)' : 'rgba(22,40,60,.65)';
  g.fillText(vip ? '★ Kaopiz Inc. ★' : 'Kaopiz Inc.', 256, 100);
  return c;
}
