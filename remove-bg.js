/**
 * Remove purple/lavender background from OCH! SUSHI logo
 * Makes the background transparent (PNG alpha channel)
 */
const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, 'public', 'images', 'logo.png');
const outputPath = path.join(__dirname, 'public', 'images', 'logo.png');

async function removeBackground() {
  const image = sharp(inputPath);
  const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // Sample the corner pixel to get exact background color
  const bgR = data[0];
  const bgG = data[1];
  const bgB = data[2];
  console.log(`Background color detected: rgb(${bgR}, ${bgG}, ${bgB})`);

  // Tolerance for color matching (the bg has slight variations)
  const tolerance = 35;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const diffR = Math.abs(r - bgR);
    const diffG = Math.abs(g - bgG);
    const diffB = Math.abs(b - bgB);

    if (diffR <= tolerance && diffG <= tolerance && diffB <= tolerance) {
      // Make this pixel fully transparent
      data[i + 3] = 0;
    }
  }

  await sharp(data, { raw: { width, height, channels } })
    .png()
    .toFile(outputPath);

  console.log('✅ Tło usunięte! Logo zapisane jako:', outputPath);
}

removeBackground().catch(console.error);
