/**
 * 生成 GitHub Social preview 图：1280x640（符合推荐尺寸）
 * 使用 public/icons/icon.svg 作为图标，并加上项目标题与副标题。
 * 用法：
 *   node generate-social-preview.js        # 生成中文版 social-preview.png
 *   node generate-social-preview.js en     # 生成英文版 social-preview-en.png
 *   node generate-social-preview.js all    # 同时生成中英文版
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const W = 1280;
const H = 640;
const rootDir = path.join(__dirname, '..');
const iconSvgPath = path.join(rootDir, 'public', 'icons', 'icon.svg');

const COPY = {
  zh: { subtitle: 'Chrome 扩展 · 实时字幕翻译', out: 'social-preview.png' },
  en: { subtitle: 'Chrome extension · Real-time subtitle translation', out: 'social-preview-en.png' },
};

// 读取原始 icon.svg 的 <g>...</g>（含 transform 与 paths）
function getIconGroup() {
  const svg = fs.readFileSync(iconSvgPath, 'utf8');
  const match = svg.match(/<g[^>]*>[\s\S]*<\/g>/);
  return match ? match[0] : '';
}

async function generateOne(locale) {
  const { subtitle, out: outName } = COPY[locale];
  const outPath = path.join(rootDir, outName);

  const iconGroup = getIconGroup();
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
  <text x="480" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#b0b0b0">${subtitle}</text>
</svg>`;

  const buf = Buffer.from(svgContent);
  await sharp(buf)
    .resize(W, H)
    .png()
    .toFile(outPath);

  console.log(`Generated ${outName} (1280x640, ${locale})`);
}

async function generate() {
  const arg = (process.argv[2] || 'zh').toLowerCase();
  const locales = arg === 'all' ? ['zh', 'en'] : [arg === 'en' ? 'en' : 'zh'];

  for (const locale of locales) {
    await generateOne(locale);
  }
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
