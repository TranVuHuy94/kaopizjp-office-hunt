import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const logo = readFileSync('assets/logo.svg', 'utf8').trim();
const logoUri = 'data:image/svg+xml,' + encodeURIComponent(logo).replace(/'/g, '%27');
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#06121f"/>
  <image xlink:href="${logoUri}" x="120" y="215" width="960" height="200" preserveAspectRatio="xMidYMid meet"/>
</svg>`;
writeFileSync('assets/og-image.svg', ogSvg);
execSync('npx --yes @resvg/resvg-js-cli assets/og-image.svg assets/og-image.png', { stdio: 'inherit' });
console.log('og-image.png đã tạo từ assets/logo.svg');
