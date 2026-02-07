/**
 * 生成 GitHub Social preview 图：1280x640（符合推荐尺寸）
 * 使用 public/icons/icon.svg 作为图标，并加上项目标题。
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const W = 1280;
const H = 640;
const rootDir = path.join(__dirname, '..');
const iconSvgPath = path.join(rootDir, 'public', 'icons', 'icon.svg');
const outPath = path.join(rootDir, 'social-preview.png');

// 读取原始 icon.svg 的 <g>...</g>（含 transform 与 paths）
function getIconGroup() {
  const svg = fs.readFileSync(iconSvgPath, 'utf8');
  const match = svg.match(/<g[^>]*>[\s\S]*<\/g>/);
  return match ? match[0] : '';
}

async function generate() {
  const iconGroup = getIconGroup();
  // 图标在画布左侧，约 320px，原 viewBox 1024 → scale 320/1024
  const scale = 320 / 1024;
  const iconX = 80;
  const iconY = (H - 320) / 2;

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2d2d2d"/>
      <stop offset="100%" style="stop-color:#1a1a1a"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <g transform="translate(${iconX}, ${iconY}) scale(${scale})">
    ${iconGroup}
  </g>
  <text x="480" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="700" fill="#ffffff">YouTube Live Translate</text>
  <text x="480" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#b0b0b0">Chrome 扩展 · 实时字幕翻译</text>
</svg>`;

  // sharp 渲染 SVG 时可能对 transform 嵌套支持有限，改用简单方式：先做背景+图标，再叠加文字
  // 实际上 librsvg 对嵌套 g 的 transform 支持可能有问题。改为：用 sharp 把 icon.svg 转成 320x320 png，再与 1280x640 背景合成，最后用 SVG 只画背景+文字，再与图标合成。或者一步用 SVG。
  // 先尝试一步 SVG 输出
  const buf = Buffer.from(svgContent);
  await sharp(buf)
    .resize(W, H)
    .png()
    .toFile(outPath);

  console.log('Generated social-preview.png (1280x640)');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
