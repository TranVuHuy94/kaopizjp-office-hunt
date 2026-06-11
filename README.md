# Kaopiz Office Hunt 🏆

**Kaopiz Secret Office — Truy Tìm Báu Vật**: game 3D góc nhìn thứ nhất tái hiện văn phòng
2 tầng của Kaopiz. Lùng sục khắp văn phòng, giải **3 thử thách IQ** để thu thập 3 chìa khóa
Vàng – Bạc – Đồng, mở cánh cửa thép bí mật và tìm ra báu vật: **cúp VÔ ĐỊCH Kaopiz Open Cup 2026**.

Toàn bộ game nằm trong **1 file `index.html`** (~1MB) — không cần server, không cần cài gì,
mở bằng trình duyệt là chơi (PC + điện thoại đều được).

## 🎮 Chơi ngay

Bật GitHub Pages cho repo này (Settings → Pages → *Deploy from a branch* → `main` / `/ (root)`),
sau ~1 phút game sống tại:

**https://tranvuhuy94.github.io/kaopizjp-office-hunt/**

Hoặc tải file `index.html` về mở trực tiếp — game chạy offline hoàn toàn.

## 🗺 Có gì trong văn phòng 3D

- **Tầng 1**: sảnh lễ tân + Kao-Bot, lounge, phòng đào tạo, khu dev 16 chỗ (mỗi màn hình một
  bí mật 👀), 2 phòng họp kính, pantry, góc bóng rổ chơi được thật.
- **Tầng 3 (BOD floor)**: khu các sếp, war room, phòng server, chill zone + máy Snake chơi được,
  kho lưu trữ… và **khu lễ tân + tủ giải thưởng dựng theo ảnh chụp văn phòng thật**
  (tường ốp xanh mint gắn logo, quầy đá, bằng khen, dàn chứng nhận ISO/P-Mark,
  poster Open Cup & tạp chí 経済界 — riêng hộc trưng cúp VÔ ĐỊCH thì… trống trơn 🤫).
- Thắng game sẽ thấy **ảnh thật** góc giải thưởng tầng 3 — nguyên mẫu của báu vật.

## 🛠 Build từ source

```bash
npm install
npm run build   # → index.html (tự nhúng logo SVG + ảnh thật vào 1 file)
npm test        # build + smoke test + test thế giới/va chạm (thuần Node, không cần trình duyệt)
```

Cấu trúc:

| Đường dẫn | Vai trò |
|---|---|
| `src/` | source game (three.js): world, puzzles, player, UI, textures vẽ canvas… |
| `template.html` | khung HTML/CSS — build chèn bundle + favicon + logo SVG vào các marker |
| `build.mjs` | esbuild → 1 file `index.html`; tự sinh `src/logodata.js`, `src/photodata.js` |
| `assets/logo.svg` | logo Kaopiz vector (trace từ logo gốc) — nhúng thẳng vào HTML & texture 3D |
| `assets/favicon.svg` | favicon chữ K vector |
| `assets/photos/` | ảnh thật văn phòng (đã nén) — nhúng vào màn thắng cuộc |
| `assets/logo/`, `assets/ảnh…/` | file gốc do Kaopiz cung cấp |

Logo ưu tiên `assets/logo.svg` (sắc nét mọi kích cỡ, tự nhuộm màu theo nền trong game);
nếu không có sẽ rơi về `assets/logo.png` (base64) rồi về logo vẽ vector thủ công.

---
Made with ❤ cho 10 năm Kaopiz · 2016–2026
