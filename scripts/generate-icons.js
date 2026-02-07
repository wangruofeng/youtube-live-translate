const sharp = require('sharp');
const path = require('path');

const dir = path.join(__dirname, '..', 'public', 'icons');
const svgPath = path.join(dir, 'icon.svg');

const sizes = [16, 32, 48, 128, 512];

async function generate() {
  for (const size of sizes) {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(path.join(dir, `icon${size}.png`));
    console.log(`Generated icon${size}.png`);
  }
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
