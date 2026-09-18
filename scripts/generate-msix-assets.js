const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');

async function createSizedIcon(sourceImage, targetWidth, targetHeight, outputPath, padding = 0) {
  // Create transparent canvas with background color or transparent
  const canvas = new Jimp({ width: targetWidth, height: targetHeight, color: 0x00000000 });
  
  const iconW = Math.max(1, targetWidth - padding * 2);
  const iconH = Math.max(1, targetHeight - padding * 2);
  
  const resized = sourceImage.clone();
  resized.resize({ w: iconW, h: iconH });
  
  const x = Math.floor((targetWidth - iconW) / 2);
  const y = Math.floor((targetHeight - iconH) / 2);
  
  canvas.composite(resized, x, y);
  await canvas.write(outputPath);
}

async function generateMsixAssets() {
  console.log('🎨 Generating Microsoft Store / MSIX Visual Assets from icon.png...');
  
  const iconPath = path.join(__dirname, '../build-assets/icon.png');
  const appxAssetsDir = path.join(__dirname, '../build-assets/appx');
  const buildAppxDir = path.join(__dirname, '../build/appx');

  if (!fs.existsSync(iconPath)) {
    throw new Error(`Master icon not found at ${iconPath}`);
  }

  if (!fs.existsSync(appxAssetsDir)) {
    fs.mkdirSync(appxAssetsDir, { recursive: true });
  }
  if (!fs.existsSync(buildAppxDir)) {
    fs.mkdirSync(buildAppxDir, { recursive: true });
  }

  const masterImage = await Jimp.read(iconPath);

  // Asset configurations according to Windows UWP / MSIX specifications
  const assets = [
    // Square 44x44 App list & Taskbar icons
    { name: 'Square44x44Logo.png', w: 44, h: 44, pad: 0 },
    { name: 'Square44x44Logo.scale-100.png', w: 44, h: 44, pad: 0 },
    { name: 'Square44x44Logo.scale-125.png', w: 55, h: 55, pad: 0 },
    { name: 'Square44x44Logo.scale-150.png', w: 66, h: 66, pad: 0 },
    { name: 'Square44x44Logo.scale-200.png', w: 88, h: 88, pad: 0 },
    { name: 'Square44x44Logo.scale-400.png', w: 176, h: 176, pad: 0 },
    { name: 'Square44x44Logo.targetsize-16.png', w: 16, h: 16, pad: 0 },
    { name: 'Square44x44Logo.targetsize-24.png', w: 24, h: 24, pad: 0 },
    { name: 'Square44x44Logo.targetsize-32.png', w: 32, h: 32, pad: 0 },
    { name: 'Square44x44Logo.targetsize-48.png', w: 48, h: 48, pad: 0 },
    { name: 'Square44x44Logo.targetsize-256.png', w: 256, h: 256, pad: 0 },
    { name: 'Square44x44Logo.targetsize-16_altform-unplated.png', w: 16, h: 16, pad: 0 },
    { name: 'Square44x44Logo.targetsize-24_altform-unplated.png', w: 24, h: 24, pad: 0 },
    { name: 'Square44x44Logo.targetsize-32_altform-unplated.png', w: 32, h: 32, pad: 0 },
    { name: 'Square44x44Logo.targetsize-48_altform-unplated.png', w: 48, h: 48, pad: 0 },
    { name: 'Square44x44Logo.targetsize-256_altform-unplated.png', w: 256, h: 256, pad: 0 },

    // Square 71x71 Small Tile
    { name: 'SmallTile.png', w: 71, h: 71, pad: 4 },
    { name: 'SmallTile.scale-100.png', w: 71, h: 71, pad: 4 },
    { name: 'SmallTile.scale-125.png', w: 89, h: 89, pad: 5 },
    { name: 'SmallTile.scale-150.png', w: 107, h: 107, pad: 6 },
    { name: 'SmallTile.scale-200.png', w: 142, h: 142, pad: 8 },

    // Square 150x150 Medium Tile
    { name: 'Square150x150Logo.png', w: 150, h: 150, pad: 10 },
    { name: 'Square150x150Logo.scale-100.png', w: 150, h: 150, pad: 10 },
    { name: 'Square150x150Logo.scale-125.png', w: 188, h: 188, pad: 12 },
    { name: 'Square150x150Logo.scale-150.png', w: 225, h: 225, pad: 15 },
    { name: 'Square150x150Logo.scale-200.png', w: 300, h: 300, pad: 20 },
    { name: 'Square150x150Logo.scale-400.png', w: 600, h: 600, pad: 40 },

    // Wide 310x150 Tile
    { name: 'Wide310x150Logo.png', w: 310, h: 150, pad: 10 },
    { name: 'Wide310x150Logo.scale-100.png', w: 310, h: 150, pad: 10 },
    { name: 'Wide310x150Logo.scale-125.png', w: 388, h: 188, pad: 12 },
    { name: 'Wide310x150Logo.scale-150.png', w: 465, h: 225, pad: 15 },
    { name: 'Wide310x150Logo.scale-200.png', w: 620, h: 300, pad: 20 },

    // Square 310x310 Large Tile
    { name: 'Square310x310Logo.png', w: 310, h: 310, pad: 20 },
    { name: 'Square310x310Logo.scale-100.png', w: 310, h: 310, pad: 20 },
    { name: 'Square310x310Logo.scale-125.png', w: 388, h: 388, pad: 25 },
    { name: 'Square310x310Logo.scale-150.png', w: 465, h: 465, pad: 30 },
    { name: 'Square310x310Logo.scale-200.png', w: 620, h: 620, pad: 40 },

    // Store Logo
    { name: 'StoreLogo.png', w: 50, h: 50, pad: 0 },
    { name: 'StoreLogo.scale-100.png', w: 50, h: 50, pad: 0 },
    { name: 'StoreLogo.scale-125.png', w: 63, h: 63, pad: 0 },
    { name: 'StoreLogo.scale-150.png', w: 75, h: 75, pad: 0 },
    { name: 'StoreLogo.scale-200.png', w: 100, h: 100, pad: 0 },
    { name: 'StoreLogo.scale-400.png', w: 200, h: 200, pad: 0 },

    // Badge Logo (monochrome / lockscreen)
    { name: 'BadgeLogo.png', w: 24, h: 24, pad: 0 },
    { name: 'BadgeLogo.scale-100.png', w: 24, h: 24, pad: 0 },
    { name: 'BadgeLogo.scale-125.png', w: 30, h: 30, pad: 0 },
    { name: 'BadgeLogo.scale-150.png', w: 36, h: 36, pad: 0 },
    { name: 'BadgeLogo.scale-200.png', w: 48, h: 48, pad: 0 },

    // SplashScreen
    { name: 'SplashScreen.png', w: 620, h: 300, pad: 30 },
    { name: 'SplashScreen.scale-100.png', w: 620, h: 300, pad: 30 },
    { name: 'SplashScreen.scale-125.png', w: 775, h: 375, pad: 35 },
    { name: 'SplashScreen.scale-150.png', w: 930, h: 450, pad: 40 },
    { name: 'SplashScreen.scale-200.png', w: 1240, h: 600, pad: 50 }
  ];

  for (const asset of assets) {
    const dest = path.join(appxAssetsDir, asset.name);
    await createSizedIcon(masterImage, asset.w, asset.h, dest, asset.pad);
    fs.copyFileSync(dest, path.join(buildAppxDir, asset.name));
  }

  console.log(`✅ Successfully generated ${assets.length} MSIX / Store visual assets in ${appxAssetsDir}`);
}

if (require.main === module) {
  generateMsixAssets().catch((err) => {
    console.error('❌ Failed to generate MSIX assets:', err);
    process.exit(1);
  });
}

module.exports = { generateMsixAssets };
