/**
 * Script to generate PWA icons from SVG
 * 
 * Requirements:
 * - Install sharp: npm install sharp --save-dev
 * 
 * Usage:
 * node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Error: sharp package not found.');
  console.log('📦 Please install sharp first:');
  console.log('   npm install sharp --save-dev');
  process.exit(1);
}

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'icon.svg');

// Check if SVG exists
if (!fs.existsSync(svgPath)) {
  console.error('❌ Error: icon.svg not found in public folder');
  process.exit(1);
}

console.log('🎨 Generating PWA icons from icon.svg...\n');

// Generate each icon size
Promise.all(
  iconSizes.map(size => {
    const outputPath = path.join(publicDir, `icon-${size}x${size}.png`);
    return sharp(svgPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 16, g: 185, b: 129, alpha: 1 } // #10b981
      })
      .png()
      .toFile(outputPath)
      .then(() => {
        console.log(`✅ Generated icon-${size}x${size}.png`);
      })
      .catch(err => {
        console.error(`❌ Error generating icon-${size}x${size}.png:`, err.message);
      });
  })
).then(() => {
  // Also generate apple-touch-icon
  const appleIconPath = path.join(publicDir, 'apple-touch-icon.png');
  return sharp(svgPath)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 16, g: 185, b: 129, alpha: 1 }
    })
    .png()
    .toFile(appleIconPath)
    .then(() => {
      console.log(`✅ Generated apple-touch-icon.png (180x180)`);
      console.log('\n✨ All icons generated successfully!');
      console.log('📱 Your PWA is ready to use.');
    });
}).catch(err => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});

