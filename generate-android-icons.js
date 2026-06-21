/**
 * generate-android-icons.js
 * Generates Android mipmap launcher icons from logo.png
 * Run: node generate-android-icons.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE_LOGO = path.join(__dirname, 'frontend/public/logo.png');
const ANDROID_RES = path.join(__dirname, 'frontend/android/app/src/main/res');

// Android mipmap sizes
const ICON_SIZES = [
  { dir: 'mipmap-mdpi',    size: 48  },
  { dir: 'mipmap-hdpi',    size: 72  },
  { dir: 'mipmap-xhdpi',   size: 96  },
  { dir: 'mipmap-xxhdpi',  size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

const SPLASH_SIZES = [
  // Splash screen background - not needed for now
];

async function generateIcons() {
  console.log('Generating Android launcher icons from logo.png...');
  
  if (!fs.existsSync(SOURCE_LOGO)) {
    console.error('❌ logo.png not found at:', SOURCE_LOGO);
    process.exit(1);
  }

  for (const { dir, size } of ICON_SIZES) {
    const destDir = path.join(ANDROID_RES, dir);
    
    // Create directory if missing
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const destFile = path.join(destDir, 'ic_launcher.png');
    const destRound = path.join(destDir, 'ic_launcher_round.png');
    const destFg = path.join(destDir, 'ic_launcher_foreground.png');

    // Square icon - white background with logo
    await sharp(SOURCE_LOGO)
      .resize(size, size, { fit: 'contain', background: { r: 10, g: 10, b: 30, alpha: 1 } })
      .png()
      .toFile(destFile);

    // Round icon - same
    await sharp(SOURCE_LOGO)
      .resize(size, size, { fit: 'contain', background: { r: 79, g: 70, b: 229, alpha: 1 } })
      .png()
      .toFile(destRound);

    // Foreground icon (adaptive icons) - larger for the foreground layer
    const fgSize = Math.round(size * 1.5);
    await sharp(SOURCE_LOGO)
      .resize(fgSize, fgSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(destFg);

    console.log(`✅ ${dir}: ${size}x${size} - ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png`);
  }

  console.log('\n✅ All Android icons generated successfully!');
  console.log('Run: npx cap sync android - to apply changes');
}

generateIcons().catch(err => {
  console.error('❌ Error generating icons:', err.message);
  process.exit(1);
});
