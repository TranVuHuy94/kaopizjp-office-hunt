import { build } from 'esbuild';
import { readFileSync, writeFileSync, statSync, existsSync, readdirSync } from 'fs';

// ---- Logo: ưu tiên SVG vector (assets/logo.svg) — nhúng thẳng, sắc nét mọi kích cỡ.
// Chưa có SVG thì rơi về PNG/WebP nhúng base64.
let logoLine = 'export const LOGO_B64 = null;\n';
let logoSvgInline = '';
if (existsSync('assets/logo.svg')) {
  const svg = readFileSync('assets/logo.svg', 'utf8').trim();
  logoSvgInline = svg;
  const uri = 'data:image/svg+xml,' + encodeURIComponent(svg).replace(/'/g, '%27');
  logoLine = `export const LOGO_B64 = ${JSON.stringify(uri)};\n`;
  console.log('logo gốc: assets/logo.svg (vector,', (svg.length / 1024).toFixed(1) + 'KB)');
} else {
  for (const [f, mime] of [['assets/logo.png', 'image/png'], ['assets/logo.webp', 'image/webp']]) {
    if (!existsSync(f)) continue;
    const b64 = readFileSync(f).toString('base64');
    logoLine = `export const LOGO_B64 = 'data:${mime};base64,${b64}';\n`;
    console.log('logo gốc:', f, `(${(b64.length * 3 / 4 / 1024).toFixed(0)}KB)`);
    break;
  }
}
writeFileSync('src/logodata.js', '// File tự sinh bởi build.mjs — đừng sửa tay\n' + logoLine);

// ---- Ảnh thật văn phòng (assets/photos/*) → hiện ở màn hình thắng cuộc
const CAPS = {
  'giai-thuong-1.jpg': 'Khu lễ tân & bằng khen — tầng 3 văn phòng Kaopiz',
  'giai-thuong-2.jpg': 'Cúp VÔ ĐỊCH Open Cup trên tủ giải thưởng — nguyên mẫu của báu vật',
};
const photos = [];
if (existsSync('assets/photos')) {
  for (const f of readdirSync('assets/photos').sort()) {
    const ext = f.slice(f.lastIndexOf('.')).toLowerCase();
    const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[ext];
    if (!mime) continue;
    const b64 = readFileSync(`assets/photos/${f}`).toString('base64');
    photos.push({ src: `data:${mime};base64,${b64}`, cap: CAPS[f] || '' });
  }
  console.log('ảnh thật:', photos.length, 'tấm (nhúng vào màn thắng cuộc)');
}
writeFileSync('src/photodata.js', '// File tự sinh bởi build.mjs — đừng sửa tay\nexport const PHOTOS = ' + JSON.stringify(photos) + ';\n');

await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  outfile: 'dist/bundle.js',
  logLevel: 'info',
});

const bundle = readFileSync('dist/bundle.js', 'utf8');
const tpl = readFileSync('template.html', 'utf8');
for (const marker of ['/*__BUNDLE__*/', '<!--__FAVICON__-->', '<!--__LOGO_SVG__-->']) {
  if (!tpl.includes(marker)) throw new Error('template thiếu marker ' + marker);
}
// tránh </script> phá vỡ inline script
const safe = bundle.replace(/<\/script>/gi, '<\\/script>');
let out = tpl.replace('/*__BUNDLE__*/', () => safe);
// favicon SVG nhúng thẳng vào <head>
let fav = '';
if (existsSync('assets/favicon.svg')) {
  const fsvg = readFileSync('assets/favicon.svg', 'utf8').trim();
  fav = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(fsvg).replace(/'/g, '%27')}">`;
}
out = out.replace('<!--__FAVICON__-->', () => fav);
// logo SVG nhúng thẳng vào màn intro (ui.js sẽ vẽ canvas thay thế nếu trống)
out = out.replace('<!--__LOGO_SVG__-->', () => logoSvgInline);
writeFileSync('index.html', out);
console.log('index.html:', (statSync('index.html').size / 1024 / 1024).toFixed(2), 'MB');
