/**
 * Generate PNG icons from SVG using sharp
 * 
 * Install: npm install --save-dev sharp
 * Run: node scripts/generate-icons-sharp.js
 */

const fs = require('fs');
const path = require('path');

try {
  // Try to require sharp
  const sharp = require('sharp');
  const svgPath = path.join(__dirname, '../app/icon.svg');
  const publicDir = path.join(__dirname, '../public');

  if (!fs.existsSync(svgPath)) {
    console.error('SVG icon not found at:', svgPath);
    process.exit(1);
  }

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sizes = [192, 512];

  console.log('Generating PNG icons from SVG...');

  Promise.all(
    sizes.map(size => {
      const outputPath = path.join(publicDir, `icon-${size}.png`);
      return sharp(svgPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath)
        .then(() => {
          console.log(`✓ Generated icon-${size}.png`);
        })
        .catch(err => {
          console.error(`✗ Failed to generate icon-${size}.png:`, err.message);
        });
    })
  ).then(() => {
    console.log('\n✓ All icons generated successfully!');
  }).catch(err => {
    console.error('Error generating icons:', err);
    process.exit(1);
  });

} catch (error) {
  console.error('Sharp is not installed. Install it with: npm install --save-dev sharp');
  console.error('Or use the online converter method described in generate-icons.js');
  process.exit(1);
}

